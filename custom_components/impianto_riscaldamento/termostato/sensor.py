"""Sensori del termostato: modalità e prossimo evento."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .controller import TermoController
from .logic import MODES


def device_info(controller: TermoController) -> DeviceInfo:
    return DeviceInfo(
        identifiers={(DOMAIN, controller.entry.entry_id)},
        name=controller.entry.title,
        manufacturer="hubcasale",
        model="Termostato riscaldamento",
    )


class TermoEntity:
    """Base comune: si aggiorna quando il controller lo chiede."""

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, controller: TermoController, key: str) -> None:
        self.controller = controller
        self._attr_unique_id = f"{controller.entry.entry_id}_{key}"
        self._attr_translation_key = f"termostato_{key}"
        self._attr_device_info = device_info(controller)

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(async_dispatcher_connect(self.hass, self.controller.signal, self._refresh))

    @callback
    def _refresh(self) -> None:
        self.async_write_ha_state()


class ModeSensor(TermoEntity, SensorEntity):
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = MODES
    _attr_icon = "mdi:thermostat"

    def __init__(self, controller: TermoController) -> None:
        super().__init__(controller, "modo")

    @property
    def native_value(self) -> str:
        return self.controller.mode

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        c = self.controller
        nxt = c.next_event
        hvac, target, current, action = c._climate()
        return {
            "programmazione_attiva": c.schedule.enabled,
            "timer_fino": c.timer_until.isoformat() if c.timer_until else None,
            "temperatura_timer": c.timer_temp,
            "obiettivo": target,
            "temperatura": current,
            "atteso": c.expected,
            "azione_termostato": action,
            "prossima_azione": None if nxt is None else ("riscaldamento" if nxt[0] == "set" else "antigelo"),
            "prossima_temperatura": None if nxt is None else nxt[2],
            "prossimo_evento": None if nxt is None else nxt[1].isoformat(),
            "assenza_attiva": c.away_applied,
            "ultima_azione": c.last_action,
        }


class NextEventSensor(TermoEntity, SensorEntity):
    _attr_device_class = SensorDeviceClass.TIMESTAMP
    _attr_icon = "mdi:clock-start"

    def __init__(self, controller: TermoController) -> None:
        super().__init__(controller, "prossimo_evento")

    @property
    def native_value(self) -> datetime | None:
        nxt = self.controller.next_event
        return nxt[1] if nxt else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        nxt = self.controller.next_event
        return {
            "azione": None if nxt is None else ("riscaldamento" if nxt[0] == "set" else "antigelo"),
            "temperatura": None if nxt is None else nxt[2],
        }


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    controller: TermoController = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([ModeSensor(controller), NextEventSensor(controller)])
