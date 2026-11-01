"""Logica pura della stufa a pellet: nessuna dipendenza da Home Assistant, si prova con pytest.

La stufa si osserva dalla potenza di una presa intelligente; si accende e si spegne con un interruttore a parte
(per esempio uno Shelly sul contatto AUX della scheda). Gli stati sono:
  spenta         potenza sotto la soglia "spenta"
  accensione     potenza oltre la soglia di accensione (resistenza dell'accenditore)
  accesa         potenza fra le due soglie (funzionamento normale)
  spegnimento    potenza nella fascia di spegnimento (ventola che raffredda)
  non_disponibile  il sensore non risponde
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field, fields, replace
from datetime import datetime, timedelta
from typing import Any

STATE_OFF = "spenta"
STATE_IGNITION = "accensione"
STATE_ON = "accesa"
STATE_SHUTDOWN = "spegnimento"
STATE_UNAVAILABLE = "non_disponibile"
STATES = [STATE_OFF, STATE_IGNITION, STATE_ON, STATE_SHUTDOWN, STATE_UNAVAILABLE]
# stati in cui la stufa e' in funzione (fiamma, ventola o accenditore attivi)
RUNNING_STATES = (STATE_IGNITION, STATE_ON, STATE_SHUTDOWN)

TILE_COLORS = ["rosso", "arancio", "avorio"]


@dataclass(frozen=True)
class Settings:
    """Preferenze configurabili (si salvano nelle opzioni della voce di configurazione)."""

    off_below: float = 5.0
    ignition_above: float = 250.0
    shutdown_min: float = 126.0
    shutdown_max: float = 129.0
    shutdown_needs_switch_off: bool = True
    confirm_seconds: int = 10
    grace_seconds: int = 15
    restore_delay_seconds: int = 30
    sync_switch_on: bool = True
    sync_switch_off: bool = True
    notify_events: bool = True
    notify_sensor_problem: bool = True
    notify_service: str = ""
    tile_color: str = "rosso"
    show_switch_button: bool = True
    # potenza assorbita (W) a ogni livello P col ventilatore al minimo e al massimo: servono a stimare P1-P3 e la percentuale del
    # ventilatore dalla sola presa (valori misurati su Edilkamin: 57/72 W a P1, 67/104 W a P2, 106/141 W a P3)
    p1_min: float = 57.0
    p1_max: float = 72.0
    p2_min: float = 67.0
    p2_max: float = 104.0
    p3_min: float = 106.0
    p3_max: float = 141.0

    @classmethod
    def from_dict(cls, data: dict[str, Any] | None) -> "Settings":
        """Legge le preferenze ignorando le chiavi sconosciute e correggendo i tipi."""
        base = cls()
        values: dict[str, Any] = {}
        for f in fields(cls):
            if not data or f.name not in data or data[f.name] is None:
                continue
            raw = data[f.name]
            default = getattr(base, f.name)
            try:
                if isinstance(default, bool):
                    values[f.name] = raw if isinstance(raw, bool) else str(raw).lower() in ("1", "true", "on", "si", "sì")
                elif isinstance(default, int):
                    values[f.name] = int(float(raw))
                elif isinstance(default, float):
                    values[f.name] = float(raw)
                else:
                    values[f.name] = str(raw).strip()
            except (TypeError, ValueError):
                continue
        s = replace(base, **values)
        return s.normalized()

    def normalized(self) -> "Settings":
        """Valori sensati: soglie ordinate, tempi non negativi, colore valido."""
        lo = min(self.shutdown_min, self.shutdown_max)
        hi = max(self.shutdown_min, self.shutdown_max)
        color = self.tile_color if self.tile_color in TILE_COLORS else "rosso"
        levels = {
            f"p{n}_{k}": v
            for n in (1, 2, 3)
            for k, v in zip(("min", "max"), sorted((max(0.0, getattr(self, f"p{n}_min")), max(0.0, getattr(self, f"p{n}_max")))))
        }
        return replace(
            self,
            **levels,
            shutdown_min=lo,
            shutdown_max=hi,
            off_below=max(0.0, self.off_below),
            ignition_above=max(self.ignition_above, hi + 1.0),
            confirm_seconds=max(0, self.confirm_seconds),
            grace_seconds=max(0, self.grace_seconds),
            restore_delay_seconds=max(0, self.restore_delay_seconds),
            tile_color=color,
        )

    def to_dict(self) -> dict[str, Any]:
        return {f.name: getattr(self, f.name) for f in fields(self)}


def valid_power(value: Any) -> float | None:
    """Potenza in watt, oppure None se il valore non e' un numero utilizzabile."""
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, str) and value.strip().lower() in ("", "unknown", "unavailable", "none", "nan"):
        return None
    try:
        v = float(value)
    except (TypeError, ValueError):
        return None
    return None if math.isnan(v) or math.isinf(v) else v


LEVEL_WINDOW_SECONDS = 180    # finestra della mediana: i picchi brevi (pulizia del crogiolo ogni 20 minuti) pesano poco
LEVEL_MIN_SECONDS = 90        # prima di tanto dall'inizio del funzionamento la stufa si sta ancora assestando: nessuna stima
LEVEL_TOLERANCE = 3.0         # W oltre i limiti di un livello entro cui si considera ancora possibile


@dataclass(frozen=True)
class LevelEstimate:
    """Livello di potenza (1-3) e percentuale del ventilatore stimati dalla potenza assorbita."""

    level: int
    fan: int
    uncertain: bool


class PowerWindow:
    """Letture di potenza degli ultimi minuti con la loro durata: la mediana pesata sul tempo ignora i picchi brevi."""

    def __init__(self, seconds: int = LEVEL_WINDOW_SECONDS) -> None:
        self.seconds = seconds
        self.samples: list[tuple[datetime, float]] = []

    def clear(self) -> None:
        self.samples.clear()

    def add(self, now: datetime, power: float) -> None:
        self.samples.append((now, power))
        start = now - timedelta(seconds=self.seconds)
        # si tiene l'ultima lettura precedente alla finestra: ne copre l'inizio
        while len(self.samples) > 1 and self.samples[1][0] <= start:
            self.samples.pop(0)

    def span(self, now: datetime) -> float:
        """Secondi dalla prima lettura (al massimo la finestra)."""
        if not self.samples:
            return 0.0
        return min(float(self.seconds), (now - self.samples[0][0]).total_seconds())

    def median(self, now: datetime) -> float | None:
        if not self.samples:
            return None
        start = now - timedelta(seconds=self.seconds)
        parts: list[tuple[float, float]] = []
        for i, (t, v) in enumerate(self.samples):
            end = self.samples[i + 1][0] if i + 1 < len(self.samples) else now
            weight = (end - max(t, start)).total_seconds()
            if weight > 0:
                parts.append((v, weight))
        if not parts:
            return self.samples[-1][1]
        parts.sort()
        half = sum(w for _, w in parts) / 2
        acc = 0.0
        for v, w in parts:
            acc += w
            if acc >= half:
                return v
        return parts[-1][0]


def estimate_level(power: float, s: Settings, previous: int | None = None) -> LevelEstimate:
    """Livello P1-P3 e percentuale del ventilatore dalla potenza (di solito la mediana degli ultimi minuti).

    Ogni livello ha un intervallo di potenza fra ventilatore al minimo e al massimo; la percentuale e' la posizione nell'intervallo.
    Dove due intervalli si sovrappongono (o quasi) la stima e' incerta: si tiene il livello di prima, se e' fra i possibili.
    """
    ranges = {n: (getattr(s, f"p{n}_min"), getattr(s, f"p{n}_max")) for n in (1, 2, 3)}
    cands = [n for n, (lo, hi) in ranges.items() if lo - LEVEL_TOLERANCE <= power <= hi + LEVEL_TOLERANCE]
    if not cands:
        cands = [min(ranges, key=lambda n: min(abs(power - ranges[n][0]), abs(power - ranges[n][1])))]

    if len(cands) == 1:
        level = cands[0]
    elif previous in cands:
        level = previous  # type: ignore[assignment]
    else:
        level = min(cands, key=lambda n: abs(power - (ranges[n][0] + ranges[n][1]) / 2))
    lo, hi = ranges[level]
    fan = 0.0 if hi <= lo else min(1.0, max(0.0, (power - lo) / (hi - lo)))
    return LevelEstimate(level=level, fan=round(fan * 100), uncertain=len(cands) > 1)


def classify(power: float | None, switch_on: bool | None, s: Settings) -> str:
    """Stato "grezzo" dalla sola lettura di potenza (e dall'interruttore, se la fascia di spegnimento lo chiede)."""
    if power is None:
        return STATE_UNAVAILABLE
    if power >= s.ignition_above:
        return STATE_IGNITION
    if s.shutdown_min <= power <= s.shutdown_max and (not s.shutdown_needs_switch_off or switch_on is not True):
        return STATE_SHUTDOWN
    if power < s.off_below:
        return STATE_OFF
    return STATE_ON


@dataclass
class StateTracker:
    """Stato confermato: un cambio vale solo se il nuovo valore resta stabile per `confirm_seconds`."""

    state: str | None = None
    since: datetime | None = None
    candidate: str | None = None
    candidate_since: datetime | None = None

    def update(self, now: datetime, raw: str, confirm_seconds: int) -> tuple[str, bool]:
        """Ritorna (stato confermato, cambiato?)."""
        if self.state is None:
            self.state, self.since = raw, now
            self.candidate = None
            return self.state, True
        immediate = raw == STATE_UNAVAILABLE or self.state == STATE_UNAVAILABLE or confirm_seconds <= 0
        if raw == self.state:
            self.candidate = None
            return self.state, False
        if immediate:
            self.state, self.since = raw, now
            self.candidate = None
            return self.state, True
        if raw != self.candidate:
            self.candidate, self.candidate_since = raw, now
        if self.candidate_since is not None and (now - self.candidate_since).total_seconds() >= confirm_seconds:
            self.state, self.since = raw, now
            self.candidate = None
            return self.state, True
        return self.state, False

    def pending(self, now: datetime, confirm_seconds: int) -> bool:
        """C'e' un cambio in attesa di conferma e il tempo e' scaduto (serve un nuovo controllo)?"""
        return (
            self.candidate is not None
            and self.candidate_since is not None
            and (now - self.candidate_since).total_seconds() >= confirm_seconds
        )


def decide_switch_action(
    power: float | None,
    state: str,
    switch_on: bool | None,
    seconds_since_switch_on: float | None,
    blocked: bool,
    s: Settings,
) -> str | None:
    """Azione sull'interruttore della stufa: "turn_on", "turn_off" oppure None.

    - Interruttore spento ma la stufa si sta accendendo (potenza oltre la soglia): lo accende, cosi' resta allineato.
    - Interruttore acceso ma la potenza e' sotto la soglia "spenta": lo spegne, solo dopo il periodo di grazia
      dall'ultima accensione dell'interruttore (la stufa non ha ancora cominciato ad assorbire).
    - Nessuna azione se le azioni sono bloccate (sensore non disponibile da poco) o la potenza non e' nota.
    """
    if blocked or power is None or switch_on is None:
        return None
    if s.sync_switch_on and switch_on is False and power >= s.ignition_above:
        return "turn_on"
    if (
        s.sync_switch_off
        and switch_on is True
        and power < s.off_below
        and (seconds_since_switch_on is None or seconds_since_switch_on > s.grace_seconds)
    ):
        return "turn_off"
    return None


@dataclass
class Blocker:
    """Blocca le azioni automatiche quando il sensore non e' disponibile e per un po' dopo il suo ritorno."""

    blocked: bool = False
    available_since: datetime | None = None

    def update(self, now: datetime, available: bool, restore_delay_seconds: int) -> bool:
        """Aggiorna e ritorna se le azioni sono bloccate."""
        if not available:
            self.blocked = True
            self.available_since = None
            return True
        if self.available_since is None:
            self.available_since = now
        if self.blocked and (now - self.available_since).total_seconds() >= restore_delay_seconds:
            self.blocked = False
        return self.blocked


@dataclass
class DailyStats:
    """Conteggi del giorno: accensioni, tempo in funzione, ultimo avvio e ultimo spegnimento."""

    day: str = ""
    ignitions: int = 0
    running_seconds: float = 0.0
    last_on: datetime | None = None
    last_off: datetime | None = None
    _mark: datetime | None = field(default=None, repr=False)
    _running: bool = field(default=False, repr=False)

    def _accumulate(self, now: datetime) -> None:
        if self._running and self._mark is not None and now > self._mark:
            self.running_seconds += (now - self._mark).total_seconds()
        self._mark = now

    def roll(self, now: datetime) -> None:
        """Azzera i conteggi a cambio di giorno (ultimo avvio e spegnimento restano)."""
        day = now.date().isoformat()
        if self.day and self.day != day:
            self._accumulate(now)
            self.ignitions = 0
            self.running_seconds = 0.0
        self.day = day

    def on_change(self, now: datetime, old: str | None, new: str) -> None:
        self.roll(now)
        self._accumulate(now)
        was_running = old in RUNNING_STATES
        is_running = new in RUNNING_STATES
        if new == STATE_IGNITION and old != STATE_IGNITION:
            self.ignitions += 1
            self.last_on = now
        if was_running and new == STATE_OFF:
            self.last_off = now
        self._running = is_running
        self._mark = now

    def tick(self, now: datetime) -> None:
        self.roll(now)
        self._accumulate(now)

    def sync(self, now: datetime, state: str) -> None:
        """Primo stato dopo un riavvio: allinea il conteggio del tempo senza contare una nuova accensione."""
        self.roll(now)
        self._accumulate(now)
        self._running = state in RUNNING_STATES
        self._mark = now

    @property
    def running_hours(self) -> float:
        return round(self.running_seconds / 3600, 2)

    def to_dict(self) -> dict[str, Any]:
        return {
            "day": self.day,
            "ignitions": self.ignitions,
            "running_seconds": round(self.running_seconds, 1),
            "last_on": self.last_on.isoformat() if self.last_on else None,
            "last_off": self.last_off.isoformat() if self.last_off else None,
            "running": self._running,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any] | None, now: datetime) -> "DailyStats":
        st = cls()
        if not data:
            return st
        try:
            st.day = str(data.get("day", ""))
            st.ignitions = int(data.get("ignitions", 0))
            st.running_seconds = float(data.get("running_seconds", 0.0))
            for key, attr in (("last_on", "last_on"), ("last_off", "last_off")):
                v = data.get(key)
                setattr(st, attr, datetime.fromisoformat(v) if v else None)
            st._running = bool(data.get("running", False))
            st._mark = now
        except (TypeError, ValueError):
            return cls()
        return st


def format_duration(td: timedelta) -> str:
    """"2 h 18 min", "35 min", "50 s"."""
    total = int(td.total_seconds())
    if total < 60:
        return f"{total} s"
    minutes = total // 60
    if minutes < 60:
        return f"{minutes} min"
    return f"{minutes // 60} h {minutes % 60:02d} min"


def suggest_thresholds(samples: list[tuple[float, float]]) -> dict[str, Any] | None:
    """Propone le soglie dalla storia della potenza: lista di (secondi, watt) in ordine di tempo.

    - spenta: il valore di riposo (sotto 20 W) piu' un margine;
    - accensione: l'accenditore si vede come un plateau alto (oltre 150 W) e si propone l'85 % del minimo osservato;
    - spegnimento: un plateau stretto fra 60 e l'accensione, di durata di almeno 3 minuti, con un margine di 1,5 W.
    Ritorna None se i dati non bastano a dire niente.
    """
    if len(samples) < 20:
        return None
    watts = [w for _, w in samples if w is not None and not math.isnan(w)]
    if len(watts) < 20:
        return None
    low = sorted(w for w in watts if w < 20)
    out: dict[str, Any] = {}
    if low:
        out["off_below"] = round(min(low[int(len(low) * 0.98)] + 2.0, 19.0), 1)
    high = [w for w in watts if w >= 150]
    if len(high) >= 3:
        out["ignition_above"] = round(min(high) * 0.85, 0) if min(high) * 0.85 > 150 else round(min(high) - 5, 0)
        ign = out["ignition_above"]
    else:
        ign = 250.0
    # plateau di spegnimento: tratti in cui la potenza resta quasi ferma (entro 1,5 W) per almeno 3 minuti, nella fascia 60..accensione;
    # il funzionamento normale oscilla di piu', la ventola che raffredda no
    runs: list[tuple[float, float]] = []   # (durata in secondi, valore medio)
    i = 0
    n = len(samples)
    while i < n:
        t0, w0 = samples[i]
        if w0 is None or not (60 <= w0 < ign):
            i += 1
            continue
        j, acc = i, [w0]
        while j + 1 < n and samples[j + 1][1] is not None and abs(samples[j + 1][1] - w0) <= 1.5:
            j += 1
            acc.append(samples[j][1])
        dur = samples[j][0] - t0
        if dur >= 180:
            runs.append((dur, sum(acc) / len(acc)))
        i = j + 1
    if runs:
        _, value = max(runs)
        out["shutdown_min"] = round(value - 1.5, 1)
        out["shutdown_max"] = round(value + 1.5, 1)
    return out or None
