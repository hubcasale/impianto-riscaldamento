import importlib.util
import sys
from datetime import datetime, timedelta
from pathlib import Path

spec = importlib.util.spec_from_file_location("logic", Path(__file__).parent.parent / "custom_components/impianto_riscaldamento/stufa/logic.py")
logic = importlib.util.module_from_spec(spec)
sys.modules["logic"] = logic
spec.loader.exec_module(logic)
from logic import (  # noqa: E402
    STATE_IGNITION, STATE_OFF, STATE_ON, STATE_SHUTDOWN, STATE_UNAVAILABLE, Blocker, DailyStats, Settings,
    StateTracker, classify, decide_switch_action, format_duration, suggest_thresholds, valid_power,
)

S = Settings()
T0 = datetime(2026, 10, 15, 7, 0, 0)


def t(sec):
    return T0 + timedelta(seconds=sec)


# --- valori e preferenze
def test_valid_power():
    assert valid_power("86.4") == 86.4
    assert valid_power(0) == 0.0
    for bad in (None, "unavailable", "unknown", "", "abc", "nan", True, float("nan"), float("inf")):
        assert valid_power(bad) is None


def test_settings_defaults_match_the_old_package():
    assert (S.off_below, S.ignition_above, S.shutdown_min, S.shutdown_max) == (5.0, 250.0, 126.0, 129.0)
    assert (S.grace_seconds, S.restore_delay_seconds) == (15, 30)


def test_settings_from_dict_fixes_types_and_ignores_garbage():
    s = Settings.from_dict({"off_below": "7.5", "ignition_above": "300", "confirm_seconds": "20.0", "sync_switch_on": "false",
                            "tile_color": "viola", "sconosciuta": 1, "notify_service": "  notify.telefono  ", "grace_seconds": "boh"})
    assert s.off_below == 7.5 and s.ignition_above == 300.0 and s.confirm_seconds == 20
    assert s.sync_switch_on is False
    assert s.tile_color == "rosso"            # colore non valido -> predefinito
    assert s.notify_service == "notify.telefono"
    assert s.grace_seconds == 15              # valore non valido -> predefinito


def test_settings_are_normalized():
    s = Settings(shutdown_min=129, shutdown_max=126, ignition_above=100, confirm_seconds=-5).normalized()
    assert (s.shutdown_min, s.shutdown_max) == (126, 129)
    assert s.ignition_above > s.shutdown_max
    assert s.confirm_seconds == 0


def test_settings_roundtrip():
    s = Settings(off_below=6.0, tile_color="arancio")
    assert Settings.from_dict(s.to_dict()) == s


# --- classificazione
def test_classify_bands():
    assert classify(0.0, False, S) == STATE_OFF
    assert classify(4.9, True, S) == STATE_OFF
    assert classify(5.0, True, S) == STATE_ON
    assert classify(86, True, S) == STATE_ON
    assert classify(249.9, True, S) == STATE_ON
    assert classify(250, True, S) == STATE_IGNITION
    assert classify(420, False, S) == STATE_IGNITION
    assert classify(None, True, S) == STATE_UNAVAILABLE


def test_shutdown_band_needs_switch_off_by_default():
    assert classify(127, False, S) == STATE_SHUTDOWN
    assert classify(127, None, S) == STATE_SHUTDOWN      # senza interruttore configurato
    assert classify(127, True, S) == STATE_ON            # interruttore acceso: funzionamento normale
    assert classify(125.9, False, S) == STATE_ON
    assert classify(129.1, False, S) == STATE_ON
    loose = Settings(shutdown_needs_switch_off=False)
    assert classify(127, True, loose) == STATE_SHUTDOWN


# --- conferma del cambio di stato
def test_first_value_is_taken_immediately():
    tr = StateTracker()
    assert tr.update(t(0), STATE_OFF, 10) == (STATE_OFF, True)


def test_change_needs_confirmation():
    tr = StateTracker()
    tr.update(t(0), STATE_OFF, 10)
    assert tr.update(t(5), STATE_ON, 10) == (STATE_OFF, False)       # ancora in attesa
    assert tr.update(t(9), STATE_ON, 10) == (STATE_OFF, False)
    assert tr.update(t(16), STATE_ON, 10) == (STATE_ON, True)        # stabile da 11 secondi
    assert tr.since == t(16)


def test_flicker_does_not_change_state():
    tr = StateTracker()
    tr.update(t(0), STATE_ON, 10)
    tr.update(t(3), STATE_SHUTDOWN, 10)
    assert tr.update(t(6), STATE_ON, 10) == (STATE_ON, False)        # tornato com'era: l'attesa si annulla
    assert tr.update(t(30), STATE_ON, 10) == (STATE_ON, False)


def test_unavailable_is_immediate_both_ways():
    tr = StateTracker()
    tr.update(t(0), STATE_ON, 10)
    assert tr.update(t(1), STATE_UNAVAILABLE, 10) == (STATE_UNAVAILABLE, True)
    assert tr.update(t(2), STATE_ON, 10) == (STATE_ON, True)


def test_zero_confirmation_is_immediate():
    tr = StateTracker()
    tr.update(t(0), STATE_OFF, 0)
    assert tr.update(t(1), STATE_IGNITION, 0) == (STATE_IGNITION, True)


def test_pending_check():
    tr = StateTracker()
    tr.update(t(0), STATE_OFF, 10)
    tr.update(t(2), STATE_ON, 10)
    assert not tr.pending(t(5), 10)
    assert tr.pending(t(12), 10)


# --- interruttore della presa
def act(power, state, sw, since=None, blocked=False, s=S):
    return decide_switch_action(power, state, sw, since, blocked, s)


def test_switch_follows_ignition_detected_from_power():
    assert act(300, STATE_IGNITION, False) == "turn_on"
    assert act(300, STATE_IGNITION, True) is None
    assert act(300, STATE_IGNITION, None) is None
    assert act(200, STATE_ON, False) is None


def test_switch_off_after_grace_period():
    assert act(1.0, STATE_OFF, True, since=100) == "turn_off"
    assert act(1.0, STATE_OFF, True, since=10) is None          # periodo di grazia (15 s)
    assert act(1.0, STATE_OFF, True, since=None) == "turn_off"  # accensione sconosciuta: nessuna grazia
    assert act(1.0, STATE_OFF, False, since=100) is None
    assert act(80, STATE_ON, True, since=100) is None


def test_no_actions_when_blocked_or_unknown():
    assert act(300, STATE_IGNITION, False, blocked=True) is None
    assert act(None, STATE_UNAVAILABLE, True) is None


def test_sync_can_be_disabled():
    assert act(300, STATE_IGNITION, False, s=Settings(sync_switch_on=False)) is None
    assert act(1.0, STATE_OFF, True, since=100, s=Settings(sync_switch_off=False)) is None


# --- blocco delle azioni
def test_blocker():
    b = Blocker()
    assert b.update(t(0), True, 30) is False
    assert b.update(t(10), False, 30) is True
    assert b.update(t(20), True, 30) is True        # appena tornato: ancora bloccato
    assert b.update(t(49), True, 30) is True
    assert b.update(t(51), True, 30) is False       # 31 secondi dopo il ritorno
    assert b.update(t(52), False, 30) is True
    assert b.update(t(60), True, 30) is True        # l'attesa riparte da capo


# --- statistiche del giorno
def test_daily_stats_ignitions_and_hours():
    d = DailyStats()
    d.on_change(t(0), None, STATE_OFF)
    d.on_change(t(60), STATE_OFF, STATE_IGNITION)
    d.on_change(t(960), STATE_IGNITION, STATE_ON)
    d.on_change(t(960 + 7200), STATE_ON, STATE_SHUTDOWN)
    d.on_change(t(960 + 7200 + 1200), STATE_SHUTDOWN, STATE_OFF)
    assert d.ignitions == 1
    assert d.running_hours == round((960 + 7200 + 1200 - 60) / 3600, 2)
    assert d.last_on == t(60)
    assert d.last_off == t(960 + 7200 + 1200)


def test_ignition_to_ignition_is_not_counted_twice():
    d = DailyStats()
    d.on_change(t(0), None, STATE_OFF)
    d.on_change(t(10), STATE_OFF, STATE_IGNITION)
    d.on_change(t(20), STATE_IGNITION, STATE_IGNITION)
    assert d.ignitions == 1


def test_tick_accumulates_while_running_and_rolls_at_midnight():
    d = DailyStats()
    d.on_change(datetime(2026, 10, 15, 23, 0, 0), None, STATE_OFF)
    d.on_change(datetime(2026, 10, 15, 23, 10, 0), STATE_OFF, STATE_ON)
    d.tick(datetime(2026, 10, 15, 23, 50, 0))
    assert d.running_hours == round(2400 / 3600, 2)
    d.tick(datetime(2026, 10, 16, 0, 5, 0))
    assert d.ignitions == 0 and d.running_seconds == 0.0 and d.day == "2026-10-16"
    d.tick(datetime(2026, 10, 16, 0, 35, 0))
    assert d.running_hours == 0.5               # la stufa e' ancora in funzione: si riparte da mezzanotte


def test_stats_persistence_roundtrip():
    d = DailyStats()
    d.on_change(t(0), None, STATE_OFF)
    d.on_change(t(30), STATE_OFF, STATE_IGNITION)
    d.tick(t(130))
    e = DailyStats.from_dict(d.to_dict(), t(200))
    assert (e.ignitions, e.last_on, e.day) == (1, t(30), d.day)
    assert e.running_seconds == d.running_seconds
    assert DailyStats.from_dict({"ignitions": "x"}, t(0)).ignitions == 0     # dati rovinati: si riparte da zero


def test_format_duration():
    assert format_duration(timedelta(seconds=50)) == "50 s"
    assert format_duration(timedelta(minutes=35)) == "35 min"
    assert format_duration(timedelta(hours=2, minutes=18)) == "2 h 18 min"
    assert format_duration(timedelta(hours=1, minutes=5)) == "1 h 05 min"


# --- suggerimento delle soglie
def synth():
    """Giorno di prova: riposo a 1-2 W, accensione a 300 W per 8 min, funzionamento a 90 W, spegnimento a 127 W per 20 min."""
    pts, now = [], 0.0
    def seg(w, minutes, jitter=0.0):
        nonlocal now
        for i in range(int(minutes * 6)):
            pts.append((now, w + (jitter if i % 2 else -jitter)))
            now += 10
    seg(1.5, 60, 0.4); seg(300, 8, 5); seg(90, 120, 6); seg(127, 20, 0.3); seg(1.2, 60, 0.3)
    return pts


def test_suggest_thresholds_from_a_typical_cycle():
    r = suggest_thresholds(synth())
    assert r is not None
    assert 2 <= r["off_below"] <= 6
    assert 200 <= r["ignition_above"] <= 300
    assert r["shutdown_min"] <= 127 <= r["shutdown_max"]
    assert r["shutdown_max"] - r["shutdown_min"] <= 4


def test_suggest_thresholds_without_data():
    assert suggest_thresholds([]) is None
    assert suggest_thresholds([(i * 10.0, 1.0) for i in range(100)]) == {"off_below": 3.0}


def test_sync_after_restart_does_not_count_an_ignition():
    d = DailyStats()
    d.sync(t(0), STATE_IGNITION)
    assert d.ignitions == 0
    d.tick(t(600))
    assert d.running_seconds == 600
    d.on_change(t(700), STATE_IGNITION, STATE_ON)
    assert d.ignitions == 0
