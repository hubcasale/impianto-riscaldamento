"""Programma settimanale del termostato: fasce (anche più di una al giorno), ognuna con la sua temperatura.

Logica pura, senza Home Assistant, provata con pytest. Il tempo è quello locale: si usano solo giorno della settimana,
ore e minuti. Dove due fasce si sovrappongono vale la temperatura più alta. Fuori da ogni fascia non c'è un obiettivo
(`None`): il termostato va all'antigelo.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from .logic import TEMP_MAX, TEMP_MIN, round_step, valid_temp

WEEK_MINUTES = 7 * 1440
MAX_SLOTS = 30
DEFAULT_SLOT_TEMP = 20.5
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


def minute_of_week(when: datetime) -> int:
    return when.weekday() * 1440 + when.hour * 60 + when.minute


@dataclass(frozen=True)
class Slot:
    """Una fascia: dalle `start` alle `end` (minuti) nei giorni indicati (0 = lunedì) alla temperatura `temp`.
    Se end <= start la fascia finisce il giorno dopo."""

    days: tuple[int, ...]
    start: int
    end: int
    temp: float = DEFAULT_SLOT_TEMP

    def to_dict(self) -> dict[str, Any]:
        return {"days": list(self.days), "start": fmt_hhmm(self.start), "end": fmt_hhmm(self.end), "temp": self.temp}

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
        temp = valid_temp(raw.get("temp", DEFAULT_SLOT_TEMP))
        if not clean or start is None or end is None or start == end or temp is None or not TEMP_MIN <= temp <= TEMP_MAX:
            return None
        return Slot(clean, start, end, round_step(temp))


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
    def mask(self) -> list[float | None]:
        """Un valore per ogni minuto della settimana (lunedì 00:00 = 0): la temperatura prevista, None fuori fascia."""
        m: list[float | None] = [None] * WEEK_MINUTES
        for slot in self.slots:
            length = slot.end - slot.start if slot.end > slot.start else 1440 - slot.start + slot.end
            for day in slot.days:
                a = day * 1440 + slot.start
                for i in range(length):
                    k = (a + i) % WEEK_MINUTES
                    if m[k] is None or slot.temp > m[k]:
                        m[k] = slot.temp
        return m

    def target_at(self, when: datetime) -> float | None:
        return self.mask()[minute_of_week(when)]

    def events(self, since: datetime, until: datetime) -> list[tuple[str, datetime, float | None]]:
        """I cambi dopo `since` fino a `until` compreso, in ordine: ("set", istante, temperatura) all'inizio di una
        fascia o quando cambia la temperatura, ("idle", istante, None) alla fine dell'ultima fascia."""
        if until <= since or not self.slots:
            return []
        if until - since > timedelta(days=7):
            since = until - timedelta(days=7)
        mask = self.mask()
        out: list[tuple[str, datetime, float | None]] = []
        t = since.replace(second=0, microsecond=0) + timedelta(minutes=1)
        while t <= until:
            m = minute_of_week(t)
            cur, prev = mask[m], mask[(m - 1) % WEEK_MINUTES]
            if cur != prev:
                out.append(("set" if cur is not None else "idle", t, cur))
            t += timedelta(minutes=1)
        return out

    def next_event(self, now: datetime) -> tuple[str, datetime, float | None] | None:
        """Il prossimo cambio dopo `now`, entro una settimana; None se non ce ne sono (nessuna fascia o sempre uguale)."""
        if not self.slots:
            return None
        mask = self.mask()
        t = now.replace(second=0, microsecond=0) + timedelta(minutes=1)
        for _ in range(WEEK_MINUTES):
            m = minute_of_week(t)
            cur, prev = mask[m], mask[(m - 1) % WEEK_MINUTES]
            if cur != prev:
                return ("set" if cur is not None else "idle", t, cur)
            t += timedelta(minutes=1)
        return None

    def day_intervals(self) -> list[list[tuple[int, int, float]]]:
        """Per ogni giorno (lunedì..domenica) gli intervalli (inizio, fine, temperatura) in minuti, già uniti: per la
        vista settimanale."""
        mask = self.mask()
        out: list[list[tuple[int, int, float]]] = []
        for d in range(7):
            segs: list[tuple[int, int, float]] = []
            start = 0
            cur: float | None = None
            for i in range(1441):
                val = mask[d * 1440 + i] if i < 1440 else None
                if val != cur:
                    if cur is not None:
                        segs.append((start, i, cur))
                    start, cur = i, val
            out.append(segs)
        return out
