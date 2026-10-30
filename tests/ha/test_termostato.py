"""Prove dentro un Home Assistant vero (pytest-homeassistant-custom-component): configurazione, entità, programma, timer, assenza."""
from datetime import datetime
from zoneinfo import ZoneInfo

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

from custom_components.impianto_riscaldamento.const import DOMAIN
from custom_components.impianto_riscaldamento.termostato.schedule import Schedule

CLIMATE = "climate.termostato"
AWAY = "binary_sensor.nessuno_in_casa"
GUESTS = "input_boolean.ospiti"
ROME = ZoneInfo("Europe/Rome")


def _set_climate(hass: HomeAssistant, mode: str = "heat", target: float = 20.0, current: float = 19.0, action: str = "idle") -> None:
    hass.states.async_set(CLIMATE, mode, {"temperature": target, "current_temperature": current, "hvac_action": action,
                                          "hvac_modes": ["heat", "auto", "off"], "min_temp": 5, "max_temp": 35})


def _fake_climate(hass: HomeAssistant) -> list[tuple[str, object]]:
    """Il termostato finto: registra i comandi e ne aggiorna lo stato come farebbe quello vero."""
    calls: list[tuple[str, object]] = []

    async def _mode(call):
        st = hass.states.get(CLIMATE)
        calls.append(("mode", call.data["hvac_mode"]))
        hass.states.async_set(CLIMATE, call.data["hvac_mode"], dict(st.attributes))

    async def _temp(call):
        st = hass.states.get(CLIMATE)
        calls.append(("temp", call.data["temperature"]))
        hass.states.async_set(CLIMATE, st.state, {**st.attributes, "temperature": call.data["temperature"]})

    hass.services.async_register("climate", "set_hvac_mode", _mode)
    hass.services.async_register("climate", "set_temperature", _temp)
    return calls


def _fake_notify(hass: HomeAssistant) -> list[dict]:
    sent: list[dict] = []

    async def _n(call):
        sent.append(dict(call.data))

    hass.services.async_register("notify", "alexa_media", _n)
    return sent


async def _setup(hass: HomeAssistant, options: dict | None = None, data: dict | None = None, start: float = 20.0, mode: str = "heat"):
    await hass.config.async_set_time_zone("Europe/Rome")
    _set_climate(hass, mode, start)
    calls = _fake_climate(hass)
    entry = MockConfigEntry(domain=DOMAIN, title="Termostato", data={"kind": "termostato", "climate": CLIMATE, **(data or {})}, options=options or {})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry, hass.data[DOMAIN][entry.entry_id], calls


async def _tick(hass: HomeAssistant, freezer, when: datetime) -> None:
    freezer.move_to(when)
    async_fire_time_changed(hass, when)
    await hass.async_block_till_done()


def _entity(hass: HomeAssistant, entry, domain: str, key: str) -> str:
    eid = er.async_get(hass).async_get_entity_id(domain, DOMAIN, f"{entry.entry_id}_{key}")
    assert eid
    return eid


async def test_setup_entities_and_mode(hass: HomeAssistant) -> None:
    entry, ctl, _ = await _setup(hass)
    st = hass.states.get(_entity(hass, entry, "sensor", "modo"))
    assert st.state == "manuale" and st.attributes["obiettivo"] == 20.0 and st.attributes["temperatura"] == 19.0
    assert hass.states.get(_entity(hass, entry, "switch", "programmazione")).state == "off"
    assert hass.states.get(_entity(hass, entry, "binary_sensor", "assenza_attiva")).state == "off"
    _set_climate(hass, "heat", 5.0)
    await hass.async_block_till_done()
    assert hass.states.get(_entity(hass, entry, "sensor", "modo")).state == "spento"
    _set_climate(hass, "unavailable")
    hass.states.async_set(CLIMATE, "unavailable")
    await hass.async_block_till_done()
    assert ctl.info()["available"] is False


async def test_set_target_refused_when_off(hass: HomeAssistant, hass_ws_client) -> None:
    """Da Spento il + e il − non accendono niente: prima si sceglie Manuale."""
    entry, ctl, calls = await _setup(hass, mode="off")
    client = await hass_ws_client(hass)
    n = len(calls)
    await client.send_json({"id": 1, "type": "termostato_riscaldamento/target", "temperature": 21.0})
    res = await client.receive_json()
    await hass.async_block_till_done()
    assert not res["success"] and res["error"]["code"] == "spento"
    assert len(calls) == n and ctl.mode == "spento"       # nessun comando al termostato


async def test_set_target_clamps_and_turns_on(hass: HomeAssistant, hass_ws_client) -> None:
    entry, ctl, calls = await _setup(hass, mode="off")
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "termostato_riscaldamento/mode", "mode": "manuale"})
    assert (await client.receive_json())["success"]
    await hass.async_block_till_done()
    assert ctl.mode == "manuale"                           # scelto Manuale, ora si regola
    await client.send_json({"id": 2, "type": "termostato_riscaldamento/target", "temperature": 31.3})
    res = await client.receive_json()
    await hass.async_block_till_done()
    assert res["success"] and res["result"]["target"] == 23.0           # massimo delle preferenze
    assert ("mode", "heat") in calls and ("temp", 23.0) in calls
    assert ctl.mode == "manuale"


async def test_mode_switching(hass: HomeAssistant, hass_ws_client, freezer) -> None:
    entry, ctl, calls = await _setup(hass, start=18.0)
    client = await hass_ws_client(hass)          # prima di spostare l'orologio, altrimenti il token risulta scaduto
    freezer.move_to(datetime(2030, 10, 21, 8, 0, tzinfo=ROME))
    ctl.set_schedule(Schedule.from_dict({"enabled": False, "slots": [{"days": [0], "start": "07:00", "end": "22:00", "temp": 21}]}))
    await client.send_json({"id": 1, "type": "termostato_riscaldamento/mode", "mode": "programma"})
    assert (await client.receive_json())["success"]
    await hass.async_block_till_done()
    assert ctl.schedule.enabled and calls[-1] == ("temp", 21.0)           # applica subito la fascia in corso
    await client.send_json({"id": 2, "type": "termostato_riscaldamento/mode", "mode": "spento"})
    assert (await client.receive_json())["success"]
    await hass.async_block_till_done()
    assert not ctl.schedule.enabled and calls[-1] == ("temp", 5.0)
    await client.send_json({"id": 3, "type": "termostato_riscaldamento/mode", "mode": "manuale"})
    assert (await client.receive_json())["success"]
    await hass.async_block_till_done()
    assert calls[-1] == ("temp", 20.5)                                    # dall'antigelo si torna all'obiettivo predefinito
    await client.send_json({"id": 4, "type": "termostato_riscaldamento/mode", "mode": "timer"})
    assert not (await client.receive_json())["success"]                   # il timer ha il suo comando


async def test_frost_off_option(hass: HomeAssistant, freezer) -> None:
    freezer.move_to(datetime(2030, 10, 21, 8, 0, tzinfo=ROME))
    _, ctl, calls = await _setup(hass, options={"frost_keep_heat": False})
    ctl.set_mode("spento")
    await hass.async_block_till_done()
    assert calls == [("mode", "off"), ("temp", 5.0)]


async def test_schedule_runs_slots_with_temperatures(hass: HomeAssistant, freezer) -> None:
    freezer.move_to(datetime(2030, 10, 21, 6, 0, tzinfo=ROME))             # lunedì
    entry, ctl, calls = await _setup(hass, start=5.0)
    sent = _fake_notify(hass)
    ctl.update_settings(ctl.settings.from_dict({"notify_service": "notify.alexa_media", "notify_targets": ["media_player.soggiorno"]}))
    ctl.set_schedule(Schedule.from_dict({"enabled": True, "slots": [
        {"days": [0], "start": "06:30", "end": "08:30", "temp": 21},
        {"days": [0], "start": "17:00", "end": "22:00", "temp": 20.5}]}))
    await hass.async_block_till_done()
    base = len(calls)
    await _tick(hass, freezer, datetime(2030, 10, 21, 6, 29, tzinfo=ROME))
    assert len(calls) == base
    await _tick(hass, freezer, datetime(2030, 10, 21, 6, 30, 30, tzinfo=ROME))
    assert calls[-1] == ("temp", 21.0)
    assert ctl.mode == "programma"
    await _tick(hass, freezer, datetime(2030, 10, 21, 8, 30, 30, tzinfo=ROME))
    assert calls[-1] == ("temp", 5.0)
    await _tick(hass, freezer, datetime(2030, 10, 21, 17, 0, 30, tzinfo=ROME))
    assert calls[-1] == ("temp", 20.5)
    assert sent and sent[-1]["target"] == ["media_player.soggiorno"] and "20,5" in sent[-1]["message"]
    nxt = ctl.info()["next_event"]
    assert nxt["kind"] == "idle" and nxt["temp"] is None


async def test_manual_change_is_kept_until_next_event(hass: HomeAssistant, freezer) -> None:
    freezer.move_to(datetime(2030, 10, 21, 6, 0, tzinfo=ROME))
    entry, ctl, calls = await _setup(hass, start=5.0)
    ctl.set_schedule(Schedule.from_dict({"enabled": True, "slots": [{"days": [0], "start": "07:00", "end": "09:00", "temp": 21}]}))
    await _tick(hass, freezer, datetime(2030, 10, 21, 7, 0, 30, tzinfo=ROME))
    assert ctl.mode == "programma"
    freezer.move_to(datetime(2030, 10, 21, 7, 30, tzinfo=ROME))
    _set_climate(hass, "heat", 23.0)                                      # qualcuno cambia a mano
    await hass.async_block_till_done()
    n = len(calls)
    await _tick(hass, freezer, datetime(2030, 10, 21, 8, 0, tzinfo=ROME))
    assert len(calls) == n and ctl.mode == "fuori_programma"             # il programma non insiste
    await _tick(hass, freezer, datetime(2030, 10, 21, 9, 0, 30, tzinfo=ROME))
    assert calls[-1] == ("temp", 5.0)


async def test_timer_then_back_to_idle_or_program(hass: HomeAssistant, hass_ws_client, freezer) -> None:
    entry, ctl, calls = await _setup(hass, start=5.0)
    client = await hass_ws_client(hass)
    freezer.move_to(datetime(2030, 10, 21, 12, 0, tzinfo=ROME))
    sent = _fake_notify(hass)
    ctl.update_settings(ctl.settings.from_dict({"notify_service": "notify.alexa_media"}))
    await client.send_json({"id": 1, "type": "termostato_riscaldamento/timer", "minutes": 90, "temperature": 21.5})
    assert (await client.receive_json())["success"]
    await hass.async_block_till_done()
    assert calls[-1] == ("temp", 21.5) and ctl.mode == "timer" and ctl.timer_until is not None
    assert "21,5" in sent[-1]["message"] and "1 ora e 30 minuti" in sent[-1]["message"]
    await _tick(hass, freezer, datetime(2030, 10, 21, 13, 31, tzinfo=ROME))
    assert ctl.timer_until is None and calls[-1] == ("temp", 5.0) and ctl.mode == "spento"
    # con il programma attivo il timer torna al programma, non all'antigelo
    ctl.set_schedule(Schedule.from_dict({"enabled": True, "slots": [{"days": [0], "start": "13:00", "end": "23:00", "temp": 19}]}))
    ctl.start_timer(30, 22.0)
    await _tick(hass, freezer, datetime(2030, 10, 21, 14, 5, tzinfo=ROME))
    assert calls[-1] == ("temp", 19.0) and ctl.mode == "programma"


async def test_timer_cap_and_cancel(hass: HomeAssistant, freezer) -> None:
    freezer.move_to(datetime(2030, 10, 21, 12, 0, tzinfo=ROME))
    _, ctl, calls = await _setup(hass, start=5.0, options={"timer_max_hours": 2})
    ctl.start_timer(600)
    assert (ctl.timer_until - datetime(2030, 10, 21, 12, 0, tzinfo=ROME)).total_seconds() == 2 * 3600     # tetto delle preferenze
    ctl.start_timer(0)
    await hass.async_block_till_done()
    assert ctl.timer_until is None and calls[-1] == ("temp", 5.0)


async def test_timer_survives_restart_and_expired_timer_is_closed(hass: HomeAssistant, freezer) -> None:
    freezer.move_to(datetime(2030, 10, 21, 12, 0, tzinfo=ROME))
    entry, ctl, calls = await _setup(hass, start=5.0)
    ctl.start_timer(60, 21.0)
    await hass.async_block_till_done()
    await hass.config_entries.async_unload(entry.entry_id)
    freezer.move_to(datetime(2030, 10, 21, 14, 0, tzinfo=ROME))             # il timer è scaduto mentre era spento
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    ctl2 = hass.data[DOMAIN][entry.entry_id]
    assert ctl2.timer_until is None and calls[-1] == ("temp", 5.0)


async def test_timer_services_for_scripts_and_assist(hass: HomeAssistant, freezer) -> None:
    """I servizi avvia_timer / annulla_timer fanno quello che fa la scheda e restituiscono l'esito."""
    freezer.move_to(datetime(2030, 10, 21, 12, 0, tzinfo=ROME))
    _, ctl, calls = await _setup(hass, start=5.0, options={"timer_max_hours": 2})
    assert hass.services.has_service(DOMAIN, "avvia_timer") and hass.services.has_service(DOMAIN, "annulla_timer")
    res = await hass.services.async_call(DOMAIN, "avvia_timer", {"minuti": 90, "temperatura": 21.5}, blocking=True, return_response=True)
    await hass.async_block_till_done()
    assert calls[-1] == ("temp", 21.5) and ctl.mode == "timer"
    assert res["temperatura"] == 21.5 and res["modalita"] == "timer"
    assert datetime.fromisoformat(res["timer_fino_a"]) == datetime(2030, 10, 21, 13, 30, tzinfo=ROME)
    # durata oltre il tetto delle preferenze: si accorcia come dalla scheda
    res = await hass.services.async_call(DOMAIN, "avvia_timer", {"minuti": 600}, blocking=True, return_response=True)
    assert datetime.fromisoformat(res["timer_fino_a"]) == datetime(2030, 10, 21, 14, 0, tzinfo=ROME)
    res = await hass.services.async_call(DOMAIN, "annulla_timer", {}, blocking=True, return_response=True)
    await hass.async_block_till_done()
    assert res["timer_fino_a"] is None and ctl.timer_until is None and calls[-1] == ("temp", 5.0)
    # anche senza chiedere la risposta (come da un'automazione)
    await hass.services.async_call(DOMAIN, "avvia_timer", {"minuti": 30}, blocking=True)
    assert ctl.timer_until is not None


# ---------------------------------------------------------------------- casa vuota
async def _away_setup(hass: HomeAssistant, freezer, **kw):
    freezer.move_to(datetime(2030, 10, 21, 12, 0, tzinfo=ROME))
    hass.states.async_set(AWAY, "off")
    hass.states.async_set(GUESTS, "off")
    return await _setup(hass, data={"away_entity": AWAY, "guests_entity": GUESTS}, start=20.0, options={"away_minutes": 30, **kw})


async def test_away_sets_frost_after_delay_and_manual_is_respected(hass: HomeAssistant, freezer) -> None:
    entry, ctl, calls = await _away_setup(hass, freezer)
    hass.states.async_set(AWAY, "on")
    await hass.async_block_till_done()
    await _tick(hass, freezer, datetime(2030, 10, 21, 12, 20, tzinfo=ROME))
    assert not ctl.away_applied
    await _tick(hass, freezer, datetime(2030, 10, 21, 12, 31, tzinfo=ROME))
    assert ctl.away_applied and calls[-1] == ("temp", 5.0)
    assert hass.states.get(_entity(hass, entry, "binary_sensor", "assenza_attiva")).state == "on"
    # qualcuno scalda a mano: il termostato obbedisce e l'assenza non lo contraddice subito
    freezer.move_to(datetime(2030, 10, 21, 13, 0, tzinfo=ROME))
    _set_climate(hass, "heat", 21.0)
    await hass.async_block_till_done()
    n = len(calls)
    await _tick(hass, freezer, datetime(2030, 10, 21, 14, 0, tzinfo=ROME))
    assert len(calls) == n and ctl.away_override_until is not None
    # dopo il tempo massimo, con la casa ancora vuota, torna all'antigelo
    await _tick(hass, freezer, datetime(2030, 10, 21, 19, 5, tzinfo=ROME))
    assert calls[-1] == ("temp", 5.0) and ctl.away_override_until is None


async def test_away_guests_block_and_return_follows_program(hass: HomeAssistant, freezer) -> None:
    entry, ctl, calls = await _away_setup(hass, freezer)
    hass.states.async_set(GUESTS, "on")
    hass.states.async_set(AWAY, "on")
    await hass.async_block_till_done()
    await _tick(hass, freezer, datetime(2030, 10, 21, 13, 0, tzinfo=ROME))
    assert not ctl.away_applied                                           # con gli ospiti non si abbassa
    hass.states.async_set(GUESTS, "off")
    await hass.async_block_till_done()
    await _tick(hass, freezer, datetime(2030, 10, 21, 13, 40, tzinfo=ROME))
    assert ctl.away_applied
    ctl.schedule = Schedule.from_dict({"enabled": True, "slots": [{"days": [0], "start": "12:00", "end": "23:00", "temp": 20.5}]})
    await _tick(hass, freezer, datetime(2030, 10, 21, 14, 0, tzinfo=ROME))
    assert calls[-1] == ("temp", 5.0)                                     # il programma non scalda a casa vuota
    hass.states.async_set(AWAY, "off")
    await hass.async_block_till_done()
    assert not ctl.away_applied and calls[-1] == ("temp", 20.5)           # al rientro riparte il programma


async def test_away_disabled(hass: HomeAssistant, freezer) -> None:
    _, ctl, calls = await _away_setup(hass, freezer, away_setback=False)
    hass.states.async_set(AWAY, "on")
    await hass.async_block_till_done()
    await _tick(hass, freezer, datetime(2030, 10, 21, 15, 0, tzinfo=ROME))
    assert not ctl.away_applied and calls == []


# ---------------------------------------------------------------------- comandi e scheda
async def test_ws_update_info_and_schedule(hass: HomeAssistant, hass_ws_client) -> None:
    entry, ctl, _ = await _setup(hass)
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "termostato_riscaldamento/update", "settings": {"antigelo": 6, "notify_targets": ["media_player.cucina"]}})
    res = await client.receive_json()
    assert res["success"] and res["result"]["settings"]["antigelo"] == 6.0
    await hass.async_block_till_done()
    assert ctl.settings.antigelo == 6.0 and ctl.settings.notify_targets == ("media_player.cucina",)
    await client.send_json({"id": 2, "type": "termostato_riscaldamento/schedule", "schedule": {
        "enabled": False, "slots": [{"days": [0, 1], "start": "07:00", "end": "09:00", "temp": 21}, {"days": [3], "start": "xx", "end": "09:00", "temp": 21}]}})
    res = await client.receive_json()
    assert res["success"] and len(res["result"]["schedule"]["slots"]) == 1          # la fascia rotta si scarta
    await client.send_json({"id": 3, "type": "termostato_riscaldamento/info"})
    info = (await client.receive_json())["result"]
    assert info["sources"]["climate"] == CLIMATE and info["entities"]["modo"].startswith("sensor.") and info["settings"]["antigelo"] == 6.0
    await client.send_json({"id": 4, "type": "termostato_riscaldamento/update", "sources": {"climate": ""}})
    assert not (await client.receive_json())["success"]                              # il termostato è obbligatorio


async def test_schedule_switch_entity(hass: HomeAssistant, freezer) -> None:
    freezer.move_to(datetime(2030, 10, 21, 8, 0, tzinfo=ROME))
    entry, ctl, calls = await _setup(hass)
    eid = _entity(hass, entry, "switch", "programmazione")
    await hass.services.async_call("switch", "turn_on", {"entity_id": eid}, blocking=True)
    assert hass.states.get(eid).state == "on"
    await hass.services.async_call("switch", "turn_off", {"entity_id": eid}, blocking=True)
    assert hass.states.get(eid).state == "off"


async def test_card_is_served(hass: HomeAssistant, hass_client) -> None:
    await _setup(hass)
    client = await hass_client()
    resp = await client.get("/impianto_riscaldamento_static/termostato-card.js")
    assert resp.status == 200
    assert "termostato-card" in await resp.text()
