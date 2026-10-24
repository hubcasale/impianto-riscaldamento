"""Sensori binari: assenza (antigelo per casa vuota) e termostato che sta scaldando."""
from __future__ import annotations

from homeassistant.components.binary_sensor import BinarySensorDeviceClass, BinarySensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .controller import TermoController
from .sensor import TermoEntity


class AwaySensor(TermoEntity, BinarySensorEntity):
    _attr_icon = "mdi:home-off"

    def __init__(self, controller: TermoController) -> None:
        super().__init__(controller, "assenza_attiva")

    @property
    def is_on(self) -> bool:
        return self.controller.away_applied


class HeatingSensor(TermoEntity, BinarySensorEntity):
    _attr_device_class = BinarySensorDeviceClass.HEAT

    def __init__(self, controller: TermoController) -> None:
        super().__init__(controller, "sta_scaldando")

    @property
    def is_on(self) -> bool:
        return self.controller._climate()[3] == "heating"


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    controller: TermoController = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([AwaySensor(controller), HeatingSensor(controller)])
