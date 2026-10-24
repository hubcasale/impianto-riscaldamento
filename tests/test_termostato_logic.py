"""Logica pura: preferenze, modalità e programma settimanale con le temperature."""
from datetime import datetime

import pytest

from custom_components.impianto_riscaldamento.termostato.logic import (
    MODE_MANUAL, MODE_OFF, MODE_OFF_PROGRAM, MODE_PROGRAM, MODE_TIMER, Settings, clamp_target, decide_mode, format_minutes, format_temp,
    is_idle, round_step, timer_target, valid_temp,
)
from custom_components.impianto_riscaldamento.termostato.schedule import Schedule, Slot, parse_hhmm

S = Settings()


def test_valid_temp() -> None:
    assert valid_temp("20.5") == 20.5
    for bad in (None, "", "unknown", "unavailable", "nan", True, "x"):
        assert valid_temp(bad) is None


def test_settings_defaults_and_normalization() -> None:
    assert S.antigelo == 5.0 and S.frost_keep_heat and S.away_setback and S.notify_targets == ()
    s = Settings.from_dict({"antigelo": "30", "min_target": "25", "max_target": "12", "default_target": "40", "timer_max_hours": "99",
                            "notify_targets": "media_player.a, media_player.b,media_player.a", "frost_keep_heat": "false", "bogus": 1})
    assert s.antigelo == 15.0                          # l'antigelo non supera i 15 °C
    assert s.min_target < s.max_target                 # sempre un intervallo valido
    assert s.min_target <= s.default_target <= s.max_target
    assert s.timer_max_hours == 24
    assert s.notify_targets == ("media_player.a", "media_player.b")
    assert s.frost_keep_heat is False
    assert Settings.from_dict(s.to_dict()) == s       # andata e ritorno


def test_clamp_and_round() -> None:
    assert round_step(20.3) == 20.5 and round_step(20.2) == 20.0
    assert clamp_target(30, S) == S.max_target and clamp_target(2, S) == S.min_target and clamp_target(19.8, S) == 20.0


def test_idle_and_timer_target() -> None:
    assert is_idle("off", 20, S) and is_idle("heat", 5, S) and not is_idle("heat", 20, S)
    assert timer_target(21.5, "heat", S) == 21.5
    assert timer_target(5.0, "heat", S) == S.default_target
    assert timer_target(21.5, "off", S) == S.default_target
    assert timer_target(None, None, S) == S.default_target


def test_decide_mode() -> None:
    d = lambda sched, timer, exp, hvac, tgt, recent=False: decide_mode(sched, timer, exp, hvac, tgt, recent, S)  # noqa: E731
    assert d(True, True, 21, "heat", 21) == MODE_TIMER
    assert d(False, False, None, "heat", 20) == MODE_MANUAL
    assert d(False, False, None, "heat", 5) == MODE_OFF and d(False, False, None, "off", 20) == MODE_OFF
    assert d(True, False, 21, "heat", 21) == MODE_PROGRAM
    assert d(True, False, 21, "heat", 22) == MODE_OFF_PROGRAM
    assert d(True, False, 21, "off", 21) == MODE_OFF_PROGRAM
    assert d(True, False, None, "heat", 5) == MODE_PROGRAM          # fuori fascia, all'antigelo
    assert d(True, False, None, "heat", 20) == MODE_OFF_PROGRAM     # fuori fascia ma acceso a mano
    assert d(True, False, 21, "heat", 18, recent=True) == MODE_PROGRAM


def test_formats() -> None:
    assert format_temp(20.5) == "20,5" and format_temp(21.0) == "21" and format_temp(5.0) == "5"
    assert format_minutes(90) == "1 ora e 30 minuti" and format_minutes(120) == "2 ore" and format_minutes(1) == "1 minuto"


# ------------------------------------------------------------------ programma
MON = datetime(2026, 10, 19)       # lunedì


def at(day: int, hh: int, mm: int = 0) -> datetime:
    return datetime(2026, 10, 19 + day, hh, mm)


def test_slot_validation() -> None:
    ok = Slot.from_dict({"days": [0, 1], "start": "06:30", "end": "08:00", "temp": 21})
    assert ok == Slot((0, 1), 390, 480, 21.0)
    assert Slot.from_dict({"days": [0], "start": "06:30", "end": "06:30", "temp": 21}) is None       # stessa ora
    assert Slot.from_dict({"days": [], "start": "06:30", "end": "07:30", "temp": 21}) is None         # nessun giorno
    assert Slot.from_dict({"days": [0], "start": "06:30", "end": "07:30", "temp": 3}) is None         # sotto i limiti
    assert Slot.from_dict({"days": [0], "start": "06:30", "end": "07:30", "temp": 40}) is None
    assert Slot.from_dict({"days": [0], "start": "06:30", "end": "07:30", "temp": "x"}) is None
    assert Slot.from_dict({"days": [0], "start": "06:30", "end": "24:00", "temp": 20.2}).temp == 20.0  # passo 0,5
    assert parse_hhmm("24:00") is None and parse_hhmm("24:00", allow_24=True) == 1440


def test_schedule_target_and_events() -> None:
    sch = Schedule.from_dict({"enabled": True, "slots": [
        {"days": [0], "start": "07:00", "end": "09:00", "temp": 21},
        {"days": [0], "start": "09:00", "end": "10:00", "temp": 19},        # attaccata: cambia solo la temperatura
        {"days": [0], "start": "17:00", "end": "22:00", "temp": 20.5},
    ]})
    assert sch.target_at(at(0, 6, 59)) is None
    assert sch.target_at(at(0, 7)) == 21.0 and sch.target_at(at(0, 9)) == 19.0 and sch.target_at(at(0, 10)) is None
    ev = sch.events(at(0, 6), at(0, 23))
    assert [(k, t.hour, temp) for k, t, temp in ev] == [("set", 7, 21.0), ("set", 9, 19.0), ("idle", 10, None), ("set", 17, 20.5), ("idle", 22, None)]
    assert sch.events(at(0, 23), at(0, 6)) == []
    nxt = sch.next_event(at(0, 8))
    assert nxt is not None and nxt[0] == "set" and nxt[1].hour == 9 and nxt[2] == 19.0


def test_overlap_takes_the_highest_temperature() -> None:
    sch = Schedule.from_dict({"enabled": True, "slots": [
        {"days": [1], "start": "08:00", "end": "12:00", "temp": 19},
        {"days": [1], "start": "10:00", "end": "14:00", "temp": 22},
    ]})
    assert sch.target_at(at(1, 9)) == 19.0 and sch.target_at(at(1, 11)) == 22.0 and sch.target_at(at(1, 13)) == 22.0
    assert sch.day_intervals()[1] == [(480, 600, 19.0), (600, 840, 22.0)]


def test_slot_across_midnight_and_week_wrap() -> None:
    sch = Schedule.from_dict({"enabled": True, "slots": [{"days": [6], "start": "22:00", "end": "02:00", "temp": 20}]})
    assert sch.target_at(at(6, 23)) == 20.0
    assert sch.target_at(at(0, 1)) == 20.0               # il lunedì successivo, dentro la stessa fascia
    assert sch.target_at(at(0, 3)) is None
    assert sch.day_intervals()[6] == [(1320, 1440, 20.0)] and sch.day_intervals()[0] == [(0, 120, 20.0)]


def test_empty_or_broken_schedule() -> None:
    assert Schedule.from_dict(None) == Schedule() and Schedule().events(at(0, 1), at(0, 23)) == [] and Schedule().next_event(at(0, 1)) is None
    sch = Schedule.from_dict({"enabled": "yes", "slots": "oops"})
    assert sch.enabled is False and sch.slots == ()
    full = Schedule.from_dict({"enabled": True, "slots": [{"days": [0, 1, 2, 3, 4, 5, 6], "start": "00:00", "end": "24:00", "temp": 20}]})
    assert full.next_event(at(0, 5)) is None             # sempre uguale: nessun cambio
    assert Schedule.from_dict(full.to_dict()) == full


@pytest.mark.parametrize("raw", [{}, {"days": "x"}, 5, None])
def test_slot_garbage(raw) -> None:
    assert Slot.from_dict(raw) is None
