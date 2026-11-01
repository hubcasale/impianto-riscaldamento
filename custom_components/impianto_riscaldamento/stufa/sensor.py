"""Sensori della stufa: stato, accensioni e ore di oggi, ultimo avvio e spegnimento, energia di oggi."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorStateClass
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import PERCENTAGE, UnitOfEnergy, UnitOfTime
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .controller import StufaController
from .logic import STATES


def device_info(controller: StufaController) -> DeviceInfo:
    return DeviceInfo(
        identifiers={(DOMAIN, controller.entry.entry_id)},
        name=controller.entry.title,
        manufacturer="Edilkamin",
        model="Stufa a pellet",
    )


class StufaEntity:
    """Base comune: si aggiorna quando il controller lo chiede."""

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, controller: StufaController, key: str) -> None:
        self.controller = controller
        self._attr_unique_id = f"{controller.entry.entry_id}_{key}"
        self._attr_translation_key = key
        self._attr_device_info = device_info(controller)

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(async_dispatcher_connect(self.hass, self.controller.signal, self._refresh))

    @callback
    def _refresh(self) -> None:
        self.async_write_ha_state()


class StateSensor(StufaEntity, SensorEntity):
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = STATES
    _attr_icon = "mdi:fire"

    def __init__(self, controller: StufaController) -> None:
        super().__init__(controller, "stato")

    @property
    def native_value(self) -> str:
        return self.controller.state

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        c = self.controller
        return {
            "potenza": c.power,
            "da": c.since.isoformat() if c.since else None,
            "durata": c.duration_text,
            "interruttore": None if c.switch_on is None else ("acceso" if c.switch_on else "spento"),
            "presa": None if c.plug_on is None else ("accesa" if c.plug_on else "spenta"),
            "azioni_bloccate": c.blocked,
            "livello": None if c.level is None else f"P{c.level.level}",
            "ventilatore": None if c.level is None else c.level.fan,
            "livello_incerto": None if c.level is None else c.level.uncertain,
            "potenza_mediana": None if c.level_power is None else round(c.level_power, 1),
        }


class LevelSensor(StufaEntity, SensorEntity):
    """Livello di potenza P1-P3 stimato dalla potenza assorbita (solo a stufa in funzione normale, dopo 45 secondi)."""

    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = ["P1", "P2", "P3"]
    _attr_icon = "mdi:speedometer"

    def __init__(self, controller: StufaController) -> None:
        super().__init__(controller, "livello_potenza")

    @property
    def native_value(self) -> str | None:
        lv = self.controller.level
        return None if lv is None else f"P{lv.level}"

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        lv = self.controller.level
        return {"incerto": None if lv is None else lv.uncertain, "potenza_mediana": self.controller.level_power, "stima": True}


class FanSensor(StufaEntity, SensorEntity):
    """Ventilatore ambiente in percentuale (0 = minimo, 100 = massimo), stimato dalla potenza assorbita."""

    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_icon = "mdi:fan"

    def __init__(self, controller: StufaController) -> None:
        super().__init__(controller, "ventilatore")

    @property
    def native_value(self) -> int | None:
        lv = self.controller.level
        return None if lv is None else lv.fan

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        lv = self.controller.level
        return {"incerto": None if lv is None else lv.uncertain, "stima": True}


class ModeSensor(StufaEntity, SensorEntity):
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = ["programma", "manuale", "fuori_programma", "timer"]
    _attr_icon = "mdi:calendar-clock"

    def __init__(self, controller: StufaController) -> None:
        super().__init__(controller, "modo")

    @property
    def native_value(self) -> str:
        return self.controller.mode

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        c = self.controller
        nxt = c.next_event
        return {
            "programmazione_attiva": c.schedule.enabled,
            "timer_fino": c.timer_until.isoformat() if c.timer_until else None,
            "prossima_azione": None if nxt is None else ("accensione" if nxt[0] == "on" else "spegnimento"),
            "prossimo_evento": None if nxt is None else nxt[1].isoformat(),
            "ultima_azione": c.last_action,
        }


class NextEventSensor(StufaEntity, SensorEntity):
    _attr_device_class = SensorDeviceClass.TIMESTAMP
    _attr_icon = "mdi:clock-start"

    def __init__(self, controller: StufaController) -> None:
        super().__init__(controller, "prossimo_evento")

    @property
    def native_value(self) -> datetime | None:
        nxt = self.controller.next_event
        return nxt[1] if nxt else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        nxt = self.controller.next_event
        return {"azione": None if nxt is None else ("accensione" if nxt[0] == "on" else "spegnimento")}


class IgnitionsSensor(StufaEntity, SensorEntity):
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_icon = "mdi:fire-circle"

    def __init__(self, controller: StufaController) -> None:
        super().__init__(controller, "accensioni_oggi")

    @property
    def native_value(self) -> int:
        return self.controller.stats.ignitions


class HoursSensor(StufaEntity, SensorEntity):
    _attr_device_class = SensorDeviceClass.DURATION
    _attr_native_unit_of_measurement = UnitOfTime.HOURS
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_suggested_display_precision = 1

    def __init__(self, controller: StufaController) -> None:
        super().__init__(controller, "ore_in_funzione_oggi")

    @property
    def native_value(self) -> float:
        return self.controller.stats.running_hours


class LastTimeSensor(StufaEntity, SensorEntity):
    _attr_device_class = SensorDeviceClass.TIMESTAMP

    def __init__(self, controller: StufaController, key: str, attr: str) -> None:
        super().__init__(controller, key)
        self._attr = attr

    @property
    def native_value(self) -> datetime | None:
        return getattr(self.controller.stats, self._attr)


class EnergySensor(StufaEntity, SensorEntity):
    _attr_device_class = SensorDeviceClass.ENERGY
    _attr_native_unit_of_measurement = UnitOfEnergy.KILO_WATT_HOUR
    _attr_state_class = SensorStateClass.TOTAL_INCREASING
    _attr_suggested_display_precision = 2

    def __init__(self, controller: StufaController) -> None:
        super().__init__(controller, "energia_oggi")

    @property
    def native_value(self) -> float | None:
        return self.controller.energy_today


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    controller: StufaController = hass.data[DOMAIN][entry.entry_id]
    entities: list[SensorEntity] = [
        StateSensor(controller),
        LevelSensor(controller),
        FanSensor(controller),
        ModeSensor(controller),
        NextEventSensor(controller),
        IgnitionsSensor(controller),
        HoursSensor(controller),
        LastTimeSensor(controller, "ultima_accensione", "last_on"),
        LastTimeSensor(controller, "ultimo_spegnimento", "last_off"),
    ]
    if controller.energy_entity:
        entities.append(EnergySensor(controller))
    async_add_entities(entities)
