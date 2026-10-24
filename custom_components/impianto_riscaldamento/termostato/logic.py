"""Logica pura del termostato: preferenze, modalità e regole. Nessuna dipendenza da Home Assistant, si prova con pytest.

Le modalità che la scheda mostra:
  programma         il programma settimanale è attivo e il termostato fa quello che prevede
  fuori_programma   il programma è attivo ma il termostato è stato cambiato a mano (vale fino al prossimo cambio)
  manuale           programma spento, il termostato mantiene la temperatura scelta
  timer             temperatura scelta per un tempo, poi si torna al programma o all'antigelo
  spento            nessun programma e il termostato è all'antigelo (o spento)
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field, fields, replace
from typing import Any

MODE_PROGRAM = "programma"
MODE_OFF_PROGRAM = "fuori_programma"
MODE_MANUAL = "manuale"
MODE_TIMER = "timer"
MODE_OFF = "spento"
MODES = [MODE_PROGRAM, MODE_OFF_PROGRAM, MODE_MANUAL, MODE_TIMER, MODE_OFF]

TEMP_MIN = 5.0      # limiti del termostato (climate.termostato: 5-35 °C a passi di 0,5)
TEMP_MAX = 35.0
TEMP_STEP = 0.5
HVAC_ACTIVE = ("heat", "auto", "heat_cool")


def valid_temp(value: Any) -> float | None:
    """Temperatura in °C, oppure None se il valore non è un numero utilizzabile."""
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, str) and value.strip().lower() in ("", "unknown", "unavailable", "none", "nan"):
        return None
    try:
        v = float(value)
    except (TypeError, ValueError):
        return None
    return None if math.isnan(v) or math.isinf(v) else v


def round_step(value: float, step: float = TEMP_STEP) -> float:
    return round(round(value / step) * step, 2)


@dataclass(frozen=True)
class Settings:
    """Preferenze configurabili (si salvano nelle opzioni della voce di configurazione)."""

    antigelo: float = 5.0
    min_target: float = 10.0
    max_target: float = 23.0
    default_target: float = 20.5
    timer_max_hours: int = 6
    frost_keep_heat: bool = True          # fuori programma: acceso all'antigelo; falso = termostato spento
    away_setback: bool = True
    away_minutes: int = 30
    notify_enabled: bool = True
    notify_service: str = ""              # per esempio notify.alexa_media; vuoto = nessun annuncio
    notify_targets: tuple[str, ...] = field(default_factory=tuple)

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
                elif isinstance(default, tuple):
                    items = raw if isinstance(raw, (list, tuple)) else str(raw).split(",")
                    values[f.name] = tuple(dict.fromkeys(str(i).strip() for i in items if str(i).strip()))
                elif isinstance(default, int):
                    values[f.name] = int(float(raw))
                elif isinstance(default, float):
                    values[f.name] = float(raw)
                else:
                    values[f.name] = str(raw).strip()
            except (TypeError, ValueError):
                continue
        return replace(base, **values).normalized()

    def normalized(self) -> "Settings":
        """Valori sensati: antigelo nei limiti del termostato, minimo sotto il massimo, obiettivo dentro l'intervallo."""
        anti = min(max(round_step(self.antigelo), TEMP_MIN), 15.0)
        lo = min(max(round_step(self.min_target), anti), TEMP_MAX)
        hi = min(max(round_step(self.max_target), lo + TEMP_STEP), TEMP_MAX)
        default = min(max(round_step(self.default_target), lo), hi)
        return replace(
            self,
            antigelo=anti,
            min_target=lo,
            max_target=hi,
            default_target=default,
            timer_max_hours=min(max(self.timer_max_hours, 1), 24),
            away_minutes=min(max(self.away_minutes, 0), 1440),
        )

    def to_dict(self) -> dict[str, Any]:
        d = {f.name: getattr(self, f.name) for f in fields(self)}
        d["notify_targets"] = list(self.notify_targets)
        return d


def clamp_target(value: float, s: Settings) -> float:
    """Obiettivo scelto dall'utente: sul passo di 0,5 e dentro i limiti delle preferenze."""
    return min(max(round_step(value), s.min_target), s.max_target)


def is_idle(hvac_mode: str | None, target: float | None, s: Settings) -> bool:
    """Il termostato è a riposo: spento, oppure acceso all'antigelo."""
    if hvac_mode == "off":
        return True
    return target is not None and target <= s.antigelo + 0.01


def decide_mode(
    schedule_enabled: bool,
    timer_active: bool,
    expected: float | None,
    hvac_mode: str | None,
    target: float | None,
    recent_action: bool,
    s: Settings,
) -> str:
    """La modalità da mostrare. `expected` è la temperatura che il programma prevede adesso (None = fuori fascia)."""
    if timer_active:
        return MODE_TIMER
    if not schedule_enabled:
        return MODE_OFF if is_idle(hvac_mode, target, s) else MODE_MANUAL
    if recent_action:                       # appena eseguito un comando: il termostato ha bisogno di tempo
        return MODE_PROGRAM
    if expected is None:
        return MODE_PROGRAM if is_idle(hvac_mode, target, s) else MODE_OFF_PROGRAM
    heating = hvac_mode in HVAC_ACTIVE
    if heating and target is not None and abs(target - expected) < 0.01:
        return MODE_PROGRAM
    return MODE_OFF_PROGRAM


def timer_target(current: float | None, hvac_mode: str | None, s: Settings) -> float:
    """Temperatura del timer: quella attuale se il termostato sta scaldando, altrimenti l'obiettivo predefinito."""
    if current is not None and hvac_mode in HVAC_ACTIVE and not is_idle(hvac_mode, current, s):
        return clamp_target(current, s)
    return s.default_target


def format_minutes(minutes: int) -> str:
    """"1 ora e 30 minuti", per gli annunci."""
    h, m = divmod(max(0, int(minutes)), 60)
    parts = []
    if h:
        parts.append(f"{h} {'ora' if h == 1 else 'ore'}")
    if m or not h:
        parts.append(f"{m} {'minuto' if m == 1 else 'minuti'}")
    return " e ".join(parts)


def format_temp(value: float) -> str:
    """"20,5" o "21", come si dice a voce."""
    return f"{value:.1f}".rstrip("0").rstrip(".").replace(".", ",")
