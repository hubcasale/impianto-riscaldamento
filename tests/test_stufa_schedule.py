from datetime import datetime, timedelta

from custom_components.impianto_riscaldamento.stufa.schedule import Schedule, Slot, decide_mode, fmt_hhmm, parse_hhmm

MON = datetime(2026, 10, 12, 0, 0)  # lunedì


def sched(*slots, enabled=True):
    return Schedule(enabled, tuple(Slot(tuple(d), parse_hhmm(a), parse_hhmm(b, True)) for d, a, b in slots))


def test_parse_hhmm():
    assert parse_hhmm("07:30") == 450
    assert parse_hhmm("7:05") == 425
    assert parse_hhmm("24:00") is None
    assert parse_hhmm("24:00", allow_24=True) == 1440
    assert parse_hhmm("12:60") is None
    assert parse_hhmm("abc") is None
    assert fmt_hhmm(450) == "07:30"


def test_from_dict_sanitizes():
    s = Schedule.from_dict(
        {"enabled": True, "slots": [
            {"days": [0, 1, 9, "2"], "start": "07:00", "end": "09:00"},
            {"days": [], "start": "07:00", "end": "09:00"},
            {"days": [1], "start": "08:00", "end": "08:00"},
            {"days": [1], "start": "xx", "end": "08:00"},
            "boh",
        ]}
    )
    assert s.enabled is True
    assert len(s.slots) == 1
    assert s.slots[0].days == (0, 1, 2)
    assert Schedule.from_dict(None) == Schedule()
    assert Schedule.from_dict({"enabled": "yes"}).enabled is False
    assert Schedule.from_dict(s.to_dict()) == s


def test_more_slots_per_day():
    s = sched(([0], "06:30", "08:30"), ([0], "17:00", "22:00"))
    assert s.is_on_at(MON.replace(hour=7))
    assert not s.is_on_at(MON.replace(hour=12))
    assert s.is_on_at(MON.replace(hour=18))
    ev = s.events(MON - timedelta(minutes=1), MON + timedelta(days=1))
    assert [(k, t.strftime("%H:%M")) for k, t in ev] == [("on", "06:30"), ("off", "08:30"), ("on", "17:00"), ("off", "22:00")]


def test_overnight_slot_and_week_wrap():
    s = sched(([6], "22:00", "02:00"))  # domenica sera fino a lunedì 02:00
    sun = MON + timedelta(days=6)
    assert s.is_on_at(sun.replace(hour=23))
    assert s.is_on_at(MON.replace(hour=1))
    assert not s.is_on_at(MON.replace(hour=3))
    nxt = s.next_event(sun.replace(hour=23))
    assert nxt and nxt[0] == "off" and nxt[1].weekday() == 0 and nxt[1].hour == 2


def test_overlapping_slots_merge():
    s = sched(([1], "08:00", "12:00"), ([1], "10:00", "14:00"))
    tue = MON + timedelta(days=1)
    ev = s.events(tue - timedelta(minutes=1), tue + timedelta(days=1))
    assert [(k, t.strftime("%H:%M")) for k, t in ev] == [("on", "08:00"), ("off", "14:00")]
    assert s.day_intervals()[1] == [(480, 840)]


def test_next_event_and_empty():
    s = sched(([2], "07:00", "09:00"))
    nxt = s.next_event(MON.replace(hour=12))
    assert nxt and nxt[0] == "on" and nxt[1].weekday() == 2 and nxt[1].hour == 7
    assert Schedule().next_event(MON) is None
    assert sched(([0, 1, 2, 3, 4, 5, 6], "00:00", "24:00")).next_event(MON) is None


def test_events_window_is_open_closed():
    s = sched(([0], "07:00", "08:00"))
    at = MON.replace(hour=7)
    assert s.events(at - timedelta(minutes=2), at)[0][0] == "on"
    assert s.events(at, at + timedelta(minutes=5)) == []   # l'istante di `since` è escluso


def test_decide_mode():
    assert decide_mode(False, False, False, "spenta", False) == "manuale"
    assert decide_mode(True, True, False, "accesa", False) == "timer"
    assert decide_mode(True, False, True, "accesa", False) == "programma"
    assert decide_mode(True, False, False, "spenta", False) == "programma"
    assert decide_mode(True, False, False, "spegnimento", False) == "programma"
    assert decide_mode(True, False, False, "accesa", False) == "fuori_programma"
    assert decide_mode(True, False, True, "spenta", False) == "fuori_programma"
    assert decide_mode(True, False, True, "spenta", True) == "programma"
