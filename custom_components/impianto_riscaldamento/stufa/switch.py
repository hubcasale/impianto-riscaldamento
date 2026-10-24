"""Interruttore della programmazione settimanale: attiva o disattiva le fasce (il timer resta a parte)."""
from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .controller import StufaController
from .schedule import Schedule
from .sensor import StufaEntity


class ScheduleSwitch(StufaEntity, SwitchEntity):
    _attr_icon = "mdi:calendar-check"

    def __init__(self, controller: StufaController) -> None:
        super().__init__(controller, "programmazione")

    @property
    def is_on(self) -> bool:
        return self.controller.schedule.enabled

    async def async_turn_on(self, **kwargs: Any) -> None:
        s = self.controller.schedule
        self.controller.set_schedule(Schedule(True, s.slots))

    async def async_turn_off(self, **kwargs: Any) -> None:
        s = self.controller.schedule
        self.controller.set_schedule(Schedule(False, s.slots))


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    controller: StufaController = hass.data[DOMAIN][entry.entry_id]
    if controller.switch_entity:
        async_add_entities([ScheduleSwitch(controller)])
