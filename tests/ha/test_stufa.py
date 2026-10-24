"""Prove dentro un Home Assistant vero (pytest-homeassistant-custom-component): configurazione, entità, azioni sulla presa, comandi per la scheda."""
from datetime import timedelta

from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

from custom_components.impianto_riscaldamento.const import DOMAIN
from custom_components.impianto_riscaldamento.stufa.schedule import Schedule

POWER = "sensor.presa_stufa_pellet_power"
SWITCH = "switch.stufa_pellet"


async def _setup(hass: HomeAssistant, power: str = "1.0", switch: str = "off", options: dict | None = None) -> MockConfigEntry:
    hass.states.async_set(POWER, power, {"unit_of_measurement": "W", "device_class": "power"})
    hass.states.async_set(SWITCH, switch)
    entry = MockConfigEntry(domain=DOMAIN, title="Stufa a pellet", data={"kind": "stufa", "power_sensor": POWER, "switch": SWITCH}, options=options or {})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


def _state_entity(hass: HomeAssistant, entry: MockConfigEntry) -> str:
    from homeassistant.helpers import entity_registry as er

    eid = er.async_get(hass).async_get_entity_id("sensor", DOMAIN, f"{entry.entry_id}_stato")
    assert eid
    return eid


async def test_setup_and_off_state(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    st = hass.states.get(_state_entity(hass, entry))
    assert st is not None and st.state == "spenta"
    assert st.attributes["potenza"] == 1.0


async def test_ignition_then_running(hass: HomeAssistant) -> None:
    entry = await _setup(hass, options={"confirm_seconds": 0})
    eid = _state_entity(hass, entry)
    hass.states.async_set(POWER, "300", {"unit_of_measurement": "W"})
    await hass.async_block_till_done()
    assert hass.states.get(eid).state == "accensione"
    hass.states.async_set(POWER, "70", {"unit_of_measurement": "W"})
    await hass.async_block_till_done()
    assert hass.states.get(eid).state == "accesa"


async def test_unavailable_sensor(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    eid = _state_entity(hass, entry)
    hass.states.async_set(POWER, "unavailable")
    await hass.async_block_till_done()
    assert hass.states.get(eid).state == "non_disponibile"


async def test_switch_follows_ignition(hass: HomeAssistant) -> None:
    """La stufa parte da sola con la presa spenta: la presa si deve accendere."""
    calls = []

    async def _turn_on(call):
        calls.append(call.data["entity_id"])

    hass.services.async_register("homeassistant", "turn_on", _turn_on)
    entry = await _setup(hass, options={"confirm_seconds": 0})
    hass.states.async_set(POWER, "300", {"unit_of_measurement": "W"})
    await hass.async_block_till_done()
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=60))
    await hass.async_block_till_done()
    assert entry.state.value == "loaded"
    assert any(SWITCH in (c if isinstance(c, list) else [c]) for c in calls)


async def test_websocket_info_and_update(hass: HomeAssistant, hass_ws_client) -> None:
    entry = await _setup(hass)
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "stufa_pellet/info"})
    res = await client.receive_json()
    assert res["success"]
    assert res["result"]["state"] == "spenta"
    assert res["result"]["sources"]["power_sensor"] == POWER
    assert "stato" in res["result"]["entities"]
    assert res["result"]["settings"]["ignition_above"] == 250

    await client.send_json({"id": 2, "type": "stufa_pellet/update", "settings": {"ignition_above": 260, "tile_color": "arancio"}})
    res = await client.receive_json()
    assert res["success"]
    await hass.async_block_till_done()
    assert entry.options["ignition_above"] == 260
    assert entry.options["tile_color"] == "arancio"

    # senza sensore di potenza non si salva
    await client.send_json({"id": 3, "type": "stufa_pellet/update", "sources": {"power_sensor": ""}})
    res = await client.receive_json()
    assert not res["success"]


async def test_config_flow(hass: HomeAssistant) -> None:
    hass.states.async_set(POWER, "1", {"unit_of_measurement": "W", "device_class": "power"})
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["type"] == "menu"
    assert result["menu_options"] == ["stufa", "termostato"]
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "stufa"})
    assert result["type"] == "form"
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"name": "Stufa", "power_sensor": POWER})
    assert result["type"] == "create_entry"
    assert result["data"] == {"power_sensor": POWER, "kind": "stufa"}
    # doppia configurazione dello stesso sensore
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "stufa"})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"name": "Altra", "power_sensor": POWER})
    assert result["type"] == "abort"


async def test_options_flow(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] == "form"


async def test_card_is_served(hass: HomeAssistant, hass_client) -> None:
    await _setup(hass)
    client = await hass_client()
    resp = await client.get("/impianto_riscaldamento_static/stufa-pellet-card.js")
    assert resp.status == 200
    assert "stufa-pellet-card" in await resp.text()


# ---------------------------------------------------------------------- programmazione e timer
from datetime import datetime  # noqa: E402
from zoneinfo import ZoneInfo  # noqa: E402


def _record_switch_calls(hass: HomeAssistant) -> list[tuple[str, str]]:
    calls: list[tuple[str, str]] = []

    async def _on(call):
        calls.append(("turn_on", call.data["entity_id"]))
        hass.states.async_set(SWITCH, "on")

    async def _off(call):
        calls.append(("turn_off", call.data["entity_id"]))
        hass.states.async_set(SWITCH, "off")

    hass.services.async_register("homeassistant", "turn_on", _on)
    hass.services.async_register("homeassistant", "turn_off", _off)
    return calls


async def _tick(hass: HomeAssistant, freezer, when: datetime) -> None:
    freezer.move_to(when)
    async_fire_time_changed(hass, when)
    await hass.async_block_till_done()


async def test_schedule_runs_two_slots_a_day(hass: HomeAssistant, freezer) -> None:
    await hass.config.async_set_time_zone("Europe/Rome")
    rome = ZoneInfo("Europe/Rome")
    calls = _record_switch_calls(hass)
    entry = await _setup(hass, options={"confirm_seconds": 0, "sync_switch_off": False, "sync_switch_on": False})
    freezer.move_to(datetime(2030, 10, 21, 6, 0, tzinfo=rome))      # lunedì
    ctl = hass.data[DOMAIN][entry.entry_id]
    ctl.set_schedule(Schedule.from_dict({
        "enabled": True,
        "slots": [{"days": [0], "start": "07:00", "end": "09:00"}, {"days": [0], "start": "17:00", "end": "22:00"}],
    }))

    await _tick(hass, freezer, datetime(2030, 10, 21, 6, 30, tzinfo=rome))
    assert calls == []
    await _tick(hass, freezer, datetime(2030, 10, 21, 7, 0, 30, tzinfo=rome))
    assert calls == [("turn_on", SWITCH)]
    await _tick(hass, freezer, datetime(2030, 10, 21, 9, 0, 30, tzinfo=rome))
    assert calls[-1] == ("turn_off", SWITCH)
    await _tick(hass, freezer, datetime(2030, 10, 21, 17, 0, 30, tzinfo=rome))
    assert calls[-1] == ("turn_on", SWITCH)
    assert len(calls) == 3

    info = ctl.info()
    assert info["schedule"]["enabled"] is True and len(info["schedule"]["slots"]) == 2
    assert info["next_event"]["kind"] == "off"
    assert entry.state.value == "loaded"


async def test_schedule_disabled_does_nothing(hass: HomeAssistant, freezer) -> None:
    await hass.config.async_set_time_zone("Europe/Rome")
    rome = ZoneInfo("Europe/Rome")
    calls = _record_switch_calls(hass)
    entry = await _setup(hass)
    freezer.move_to(datetime(2030, 10, 21, 6, 0, tzinfo=rome))
    hass.data[DOMAIN][entry.entry_id].set_schedule(
        Schedule.from_dict({"enabled": False, "slots": [{"days": [0], "start": "07:00", "end": "09:00"}]})
    )
    await _tick(hass, freezer, datetime(2030, 10, 21, 8, 0, tzinfo=rome))
    assert calls == []


async def test_timer_turns_on_then_off(hass: HomeAssistant, freezer) -> None:
    await hass.config.async_set_time_zone("Europe/Rome")
    rome = ZoneInfo("Europe/Rome")
    calls = _record_switch_calls(hass)
    entry = await _setup(hass, options={"sync_switch_off": False, "sync_switch_on": False})
    freezer.move_to(datetime(2030, 10, 21, 12, 0, tzinfo=rome))
    ctl = hass.data[DOMAIN][entry.entry_id]
    ctl.start_timer(60)
    await hass.async_block_till_done()
    assert calls == [("turn_on", SWITCH)]
    from homeassistant.helpers import entity_registry as er

    mode = er.async_get(hass).async_get_entity_id("sensor", DOMAIN, f"{entry.entry_id}_modo")
    assert hass.states.get(mode).state == "timer"
    assert hass.states.get(mode).attributes["timer_fino"].startswith("2030-10-21T13:00")

    await _tick(hass, freezer, datetime(2030, 10, 21, 12, 30, tzinfo=rome))
    assert len(calls) == 1
    await _tick(hass, freezer, datetime(2030, 10, 21, 13, 1, tzinfo=rome))
    assert calls[-1] == ("turn_off", SWITCH)
    assert hass.states.get(mode).state == "manuale"

    # annullamento anticipato
    ctl.start_timer(30)
    ctl.start_timer(0)
    await hass.async_block_till_done()
    assert calls[-1] == ("turn_off", SWITCH)


async def test_schedule_switch_entity(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    from homeassistant.helpers import entity_registry as er

    eid = er.async_get(hass).async_get_entity_id("switch", DOMAIN, f"{entry.entry_id}_programmazione")
    assert eid and hass.states.get(eid).state == "off"
    await hass.services.async_call("switch", "turn_on", {"entity_id": eid}, blocking=True)
    assert hass.states.get(eid).state == "on"


async def test_schedule_requires_switch(hass: HomeAssistant, hass_ws_client) -> None:
    hass.states.async_set(POWER, "1.0", {"unit_of_measurement": "W", "device_class": "power"})
    entry = MockConfigEntry(domain=DOMAIN, title="Stufa", data={"kind": "stufa", "power_sensor": POWER})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "stufa_pellet/timer", "minutes": 10})
    assert not (await client.receive_json())["success"]


async def test_websocket_schedule_and_timer(hass: HomeAssistant, hass_ws_client) -> None:
    entry = await _setup(hass)
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "stufa_pellet/schedule", "schedule": {
        "enabled": True, "slots": [{"days": [0, 1], "start": "07:00", "end": "09:00"}, {"days": [3], "start": "xx", "end": "09:00"}]}})
    res = await client.receive_json()
    assert res["success"] and len(res["result"]["schedule"]["slots"]) == 1
    await client.send_json({"id": 2, "type": "stufa_pellet/timer", "minutes": 5000})
    assert not (await client.receive_json())["success"]
    assert hass.data[DOMAIN][entry.entry_id].schedule.enabled is True


PLUG = "switch.presa_stufa_pellet"


async def test_plug_is_shown_but_never_commanded(hass: HomeAssistant, hass_ws_client) -> None:
    """L'interruttore di accensione è lo Shelly; la presa si legge soltanto (attributo `presa`, nessun comando)."""
    hass.states.async_set(POWER, "300", {"unit_of_measurement": "W", "device_class": "power"})
    hass.states.async_set(SWITCH, "off")
    hass.states.async_set(PLUG, "on")
    calls = _record_switch_calls(hass)
    entry = MockConfigEntry(
        domain=DOMAIN, title="Stufa a pellet", data={"kind": "stufa", "power_sensor": POWER, "switch": SWITCH, "plug": PLUG}, options={"confirm_seconds": 0}
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    # la stufa parte da sola: si accende lo Shelly, mai la presa
    hass.states.async_set(POWER, "320", {"unit_of_measurement": "W"})
    await hass.async_block_till_done()
    assert calls and all(entity == SWITCH for _, entity in calls)
    eid = _state_entity(hass, entry)
    assert hass.states.get(eid).attributes["presa"] == "accesa"
    hass.states.async_set(PLUG, "off")
    await hass.async_block_till_done()
    assert hass.states.get(eid).attributes["presa"] == "spenta"
    assert all(entity == SWITCH for _, entity in calls)

    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "stufa_pellet/info"})
    res = await client.receive_json()
    assert res["success"] and res["result"]["sources"]["plug"] == PLUG and res["result"]["sources"]["switch"] == SWITCH


async def test_plug_optional_and_editable(hass: HomeAssistant, hass_ws_client) -> None:
    entry = await _setup(hass)
    eid = _state_entity(hass, entry)
    assert hass.states.get(eid).attributes["presa"] is None
    hass.states.async_set(PLUG, "off")
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "stufa_pellet/update", "sources": {"plug": PLUG}})
    assert (await client.receive_json())["success"]
    await hass.async_block_till_done()
    assert entry.data["plug"] == PLUG and entry.data["switch"] == SWITCH
    assert hass.data[DOMAIN][entry.entry_id].plug_on is False
    await client.send_json({"id": 2, "type": "stufa_pellet/update", "sources": {"plug": ""}})
    assert (await client.receive_json())["success"]
    await hass.async_block_till_done()
    assert "plug" not in entry.data and entry.data["switch"] == SWITCH
