"""Migrazione dalle integrazioni separate (stufa_pellet e termostato_riscaldamento): stessi id, stesso storico, stessi dati."""
import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.helpers.storage import Store
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.impianto_riscaldamento.const import DOMAIN

SCHEDULE = {"enabled": True, "slots": [{"on": "06:00", "off": "08:00", "days": [0, 1, 2, 3, 4]}]}


def _old_entry(hass: HomeAssistant, domain: str, title: str, data: dict, options: dict) -> MockConfigEntry:
    entry = MockConfigEntry(domain=domain, title=title, data=data, options=options)
    entry.add_to_hass(hass)
    return entry


def _old_registry(hass: HomeAssistant, old: MockConfigEntry, entities: list[tuple[str, str, str]]) -> str:
    """Il registro come l'avevano lasciato le integrazioni vecchie: dispositivo ed entita' con il loro entity_id."""
    dev = dr.async_get(hass).async_get_or_create(
        config_entry_id=old.entry_id, identifiers={(old.domain, old.entry_id)}, name=old.title, manufacturer="x", model="y"
    )
    reg = er.async_get(hass)
    for platform_domain, key, entity_id in entities:
        reg.async_get_or_create(
            platform_domain, old.domain, f"{old.entry_id}_{key}", suggested_object_id=entity_id.split(".", 1)[1],
            config_entry=old, device_id=dev.id,
        )
    return dev.id


def _entries_of(dev) -> set[str]:
    """Le voci del dispositivo (una sola nelle versioni recenti di Home Assistant, un elenco nelle precedenti)."""
    one = getattr(dev, "config_entry_id", None)
    return {one} if one else set(dev.config_entries)


async def _import(hass: HomeAssistant) -> None:
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["type"] == "menu"
    assert result["menu_options"][0] == "importa"
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "importa"})
    assert result["type"] == "form"
    assert "Stufa a pellet" in result["description_placeholders"]["voci"]
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    assert result["type"] == "abort"
    assert result["reason"] == "importato"
    await hass.async_block_till_done()


async def test_import_stove_keeps_entity_ids_device_and_saved_data(hass: HomeAssistant) -> None:
    hass.states.async_set("sensor.presa_power", "0", {"unit_of_measurement": "W", "device_class": "power"})
    old = _old_entry(hass, "stufa_pellet", "Stufa a pellet", {"power_sensor": "sensor.presa_power"}, {"confirm_seconds": 0, "tile_color": "avorio"})
    dev_id = _old_registry(hass, old, [("sensor", "stato", "sensor.stufa_a_pellet_stato"), ("switch", "programmazione", "switch.stufa_a_pellet_programmazione")])
    await Store(hass, 1, f"stufa_pellet.{old.entry_id}").async_save({"schedule": SCHEDULE})

    await _import(hass)

    new = hass.config_entries.async_entries(DOMAIN)
    assert len(new) == 1
    entry = new[0]
    assert entry.data["kind"] == "stufa" and entry.data["power_sensor"] == "sensor.presa_power"
    assert entry.options["tile_color"] == "avorio"
    # la voce vecchia e' stata tolta
    assert hass.config_entries.async_entries("stufa_pellet") == []
    # stessi entity_id, ora della nuova integrazione, senza doppioni
    reg = er.async_get(hass)
    ent = reg.async_get("sensor.stufa_a_pellet_stato")
    assert ent is not None and ent.platform == DOMAIN and ent.config_entry_id == entry.entry_id
    assert ent.unique_id == f"{entry.entry_id}_stato"
    assert reg.async_get("sensor.stufa_a_pellet_stato_2") is None
    assert reg.async_get("switch.stufa_a_pellet_programmazione").platform == DOMAIN
    assert [e.entity_id for e in er.async_entries_for_config_entry(reg, entry.entry_id) if e.entity_id.endswith("_stato_2")] == []
    # lo stesso dispositivo
    dev = dr.async_get(hass).async_get(dev_id)
    assert dev is not None and (DOMAIN, entry.entry_id) in dev.identifiers and _entries_of(dev) == {entry.entry_id}
    # il programma salvato e' arrivato al controller
    assert hass.data[DOMAIN][entry.entry_id].schedule.enabled is True
    assert hass.states.get("sensor.stufa_a_pellet_stato") is not None


async def test_import_thermostat_and_stove_together(hass: HomeAssistant) -> None:
    hass.states.async_set("sensor.presa_power", "0", {"unit_of_measurement": "W", "device_class": "power"})
    hass.states.async_set("climate.termostato", "heat", {"temperature": 20, "current_temperature": 19, "hvac_modes": ["heat", "off"]})
    stove = _old_entry(hass, "stufa_pellet", "Stufa a pellet", {"power_sensor": "sensor.presa_power"}, {})
    termo = _old_entry(hass, "termostato_riscaldamento", "Termostato", {"climate": "climate.termostato"}, {"antigelo": 7.0})
    _old_registry(hass, stove, [("sensor", "stato", "sensor.stufa_a_pellet_stato")])
    _old_registry(hass, termo, [("binary_sensor", "sta_scaldando", "binary_sensor.termostato_sta_scaldando"), ("sensor", "modo", "sensor.termostato_modalita")])

    await _import(hass)

    entries = {e.data["kind"]: e for e in hass.config_entries.async_entries(DOMAIN)}
    assert set(entries) == {"stufa", "termostato"}
    assert entries["termostato"].options["antigelo"] == 7.0
    assert hass.config_entries.async_entries("termostato_riscaldamento") == []
    reg = er.async_get(hass)
    assert reg.async_get("binary_sensor.termostato_sta_scaldando").config_entry_id == entries["termostato"].entry_id
    assert reg.async_get("sensor.termostato_modalita").platform == DOMAIN
    assert reg.async_get("sensor.stufa_a_pellet_stato").config_entry_id == entries["stufa"].entry_id


async def test_import_is_offered_only_when_there_is_something_to_import(hass: HomeAssistant) -> None:
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["menu_options"] == ["stufa", "termostato"]


async def test_import_twice_does_not_duplicate(hass: HomeAssistant) -> None:
    hass.states.async_set("sensor.presa_power", "0", {"unit_of_measurement": "W", "device_class": "power"})
    old = _old_entry(hass, "stufa_pellet", "Stufa a pellet", {"power_sensor": "sensor.presa_power"}, {})
    _old_registry(hass, old, [("sensor", "stato", "sensor.stufa_a_pellet_stato")])
    await _import(hass)
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["menu_options"] == ["stufa", "termostato"]
    assert len(hass.config_entries.async_entries(DOMAIN)) == 1




async def test_new_entry_adopts_entities_left_by_a_deleted_old_entry(hass: HomeAssistant) -> None:
    """La voce vecchia e' stata eliminata a mano: restano entita' orfane e i dati salvati; la voce nuova li adotta."""
    hass.states.async_set("climate.termostato", "heat", {"temperature": 20, "current_temperature": 19, "hvac_modes": ["heat", "off"]})
    reg = er.async_get(hass)
    old_id = "01OLDENTRYIDXXXXXXXXXXXXXX"
    reg.async_get_or_create("sensor", "termostato_riscaldamento", f"{old_id}_modo", suggested_object_id="termostato_riscaldamento_modalita")
    reg.async_get_or_create("switch", "termostato_riscaldamento", f"{old_id}_programmazione", suggested_object_id="termostato_riscaldamento_programmazione")
    await Store(hass, 1, f"termostato_riscaldamento.{old_id}").async_save({"schedule": SCHEDULE})

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["menu_options"] == ["stufa", "termostato"]
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "termostato"})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"name": "Termostato", "climate": "climate.termostato"})
    assert result["type"] == "create_entry"
    await hass.async_block_till_done()

    entry = hass.config_entries.async_entries(DOMAIN)[0]
    ent = reg.async_get("sensor.termostato_riscaldamento_modalita")
    assert ent is not None and ent.platform == DOMAIN and ent.config_entry_id == entry.entry_id
    assert reg.async_get("sensor.termostato_riscaldamento_modalita_2") is None
    assert reg.async_get("switch.termostato_riscaldamento_programmazione").unique_id == f"{entry.entry_id}_programmazione"
    assert hass.data[DOMAIN][entry.entry_id].schedule.enabled is True


async def test_other_kind_does_not_adopt_foreign_orphans(hass: HomeAssistant) -> None:
    reg = er.async_get(hass)
    reg.async_get_or_create("sensor", "termostato_riscaldamento", "01OLDXXXXXXXXXXXXXXXXXXXXX_modo", suggested_object_id="termostato_riscaldamento_modalita")
    hass.states.async_set("sensor.presa_power", "0", {"unit_of_measurement": "W", "device_class": "power"})
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "stufa"})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"name": "Stufa", "power_sensor": "sensor.presa_power"})
    assert "migrated_from" not in result["data"]
