"""Programmazione settimanale della stufa: fasce di accensione (più di una al giorno) e prossimi eventi.

Logica pura, senza Home Assistant, provata con pytest. Il tempo è quello locale (data e ora senza fuso scritte con un
`datetime` qualsiasi: si usano solo giorno della settimana, ore e minuti).
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

WEEK_MINUTES = 7 * 1440
MAX_SLOTS = 30
_HHMM = re.compile(r"^(\d{1,2}):(\d{2})$")


def parse_hhmm(value: Any, allow_24: bool = False) -> int | None:
    """"07:30" -> minuti dalla mezzanotte; None se non valido. "24:00" solo per la fine di una fascia."""
    if isinstance(value, int) and not isinstance(value, bool):
        minutes = value
    else:
        m = _HHMM.match(str(value).strip())
        if not m:
            return None
        minutes = int(m.group(1)) * 60 + int(m.group(2))
        if int(m.group(2)) > 59:
            return None
    top = 1440 if allow_24 else 1439
    return minutes if 0 <= minutes <= top else None


def fmt_hhmm(minutes: int) -> str:
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


@dataclass(frozen=True)
class Slot:
    """Una fascia: dalle `start` alle `end` (minuti) nei giorni indicati (0 = lunedì). Se end <= start finisce il giorno dopo."""

    days: tuple[int, ...]
    start: int
    end: int

    def to_dict(self) -> dict[str, Any]:
        return {"days": list(self.days), "start": fmt_hhmm(self.start), "end": fmt_hhmm(self.end)}

    @staticmethod
    def from_dict(raw: Any) -> "Slot | None":
        if not isinstance(raw, dict):
            return None
        days = raw.get("days")
        if not isinstance(days, (list, tuple)):
            return None
        clean = tuple(sorted({int(d) for d in days if isinstance(d, (int, float, str)) and str(d).lstrip("-").isdigit() and 0 <= int(d) <= 6}))
        start = parse_hhmm(raw.get("start"))
        end = parse_hhmm(raw.get("end"), allow_24=True)
        if not clean or start is None or end is None or start == end:
            return None
        return Slot(clean, start, end)


@dataclass(frozen=True)
class Schedule:
    enabled: bool = False
    slots: tuple[Slot, ...] = field(default_factory=tuple)

    @staticmethod
    def from_dict(raw: Any) -> "Schedule":
        if not isinstance(raw, dict):
            return Schedule()
        slots: list[Slot] = []
        for item in raw.get("slots", []) if isinstance(raw.get("slots"), list) else []:
            slot = Slot.from_dict(item)
            if slot is not None:
                slots.append(slot)
        return Schedule(enabled=raw.get("enabled") is True, slots=tuple(slots[:MAX_SLOTS]))

    def to_dict(self) -> dict[str, Any]:
        return {"enabled": self.enabled, "slots": [s.to_dict() for s in self.slots]}

    # ------------------------------------------------------------------ la settimana in minuti
    def mask(self) -> list[bool]:
        """Un valore per ogni minuto della settimana (lunedì 00:00 = 0): True se la stufa deve essere accesa."""
        m = [False] * WEEK_MINUTES
        for slot in self.slots:
            for day in slot.days:
                a = day * 1440 + slot.start
                length = slot.end - slot.start if slot.end > slot.start else 1440 - slot.start + slot.end
                for i in range(length):
                    m[(a + i) % WEEK_MINUTES] = True
        return m

    def is_on_at(self, when: datetime) -> bool:
        return self.mask()[minute_of_week(when)]

    def events(self, since: datetime, until: datetime) -> list[tuple[str, datetime]]:
        """Accensioni e spegnimenti dopo `since` fino a `until` compreso, in ordine: lista di ("on"|"off", istante)."""
        if until <= since or not self.slots:
            return []
        if until - since > timedelta(days=7):
            since = until - timedelta(days=7)
        mask = self.mask()
        out: list[tuple[str, datetime]] = []
        t = since.replace(second=0, microsecond=0) + timedelta(minutes=1)
        while t <= until:
            m = minute_of_week(t)
            cur, prev = mask[m], mask[(m - 1) % WEEK_MINUTES]
            if cur != prev:
                out.append(("on" if cur else "off", t))
            t += timedelta(minutes=1)
        return out

    def next_event(self, now: datetime) -> tuple[str, datetime] | None:
        """Il prossimo cambio dopo `now`, entro una settimana; None se non ce ne sono (nessuna fascia o sempre accesa)."""
        if not self.slots:
            return None
        mask = self.mask()
        t = now.replace(second=0, microsecond=0) + timedelta(minutes=1)
        for _ in range(WEEK_MINUTES):
            m = minute_of_week(t)
            cur, prev = mask[m], mask[(m - 1) % WEEK_MINUTES]
            if cur != prev:
                return ("on" if cur else "off", t)
            t += timedelta(minutes=1)
        return None

    def day_intervals(self) -> list[list[tuple[int, int]]]:
        """Per ogni giorno (lunedì..domenica) gli intervalli (inizio, fine) in minuti, già uniti: per la vista settimanale."""
        mask = self.mask()
        out: list[list[tuple[int, int]]] = []
        for d in range(7):
            segs: list[tuple[int, int]] = []
            start: int | None = None
            for i in range(1440):
                on = mask[d * 1440 + i]
                if on and start is None:
                    start = i
                elif not on and start is not None:
                    segs.append((start, i))
                    start = None
            if start is not None:
                segs.append((start, 1440))
            out.append(segs)
        return out


def minute_of_week(when: datetime) -> int:
    return when.weekday() * 1440 + when.hour * 60 + when.minute


def decide_mode(
    schedule_enabled: bool, timer_active: bool, expected_on: bool, state: str, recent_action: bool
) -> str:
    """"timer", "manuale" (programmazione spenta), "programma" o "fuori_programma" (programma attivo ma la stufa fa altro)."""
    if timer_active:
        return "timer"
    if not schedule_enabled:
        return "manuale"
    running = state in ("accensione", "accesa")
    winding_down = state == "spegnimento"
    if recent_action:                      # appena eseguito un comando: la stufa ha bisogno di tempo
        return "programma"
    if expected_on == running or (not expected_on and winding_down):
        return "programma"
    return "fuori_programma"
