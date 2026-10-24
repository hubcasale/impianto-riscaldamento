"""Sensori binari: stufa in funzione, azioni automatiche bloccate."""
from __future__ import annotations

from homeassistant.components.binary_sensor import BinarySensorDeviceClass, BinarySensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .controller import StufaController
from .logic import RUNNING_STATES
from .sensor import StufaEntity


class RunningSensor(StufaEntity, BinarySensorEntity):
    _attr_device_class = BinarySensorDeviceClass.RUNNING

    def __init__(self, controller: StufaController) -> None:
        super().__init__(controller, "in_funzione")

    @property
    def is_on(self) -> bool:
        return self.controller.state in RUNNING_STATES


class BlockedSensor(StufaEntity, BinarySensorEntity):
    _attr_device_class = BinarySensorDeviceClass.PROBLEM
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, controller: StufaController) -> None:
        super().__init__(controller, "azioni_bloccate")

    @property
    def is_on(self) -> bool:
        return self.controller.blocked


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    controller: StufaController = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([RunningSensor(controller), BlockedSensor(controller)])
