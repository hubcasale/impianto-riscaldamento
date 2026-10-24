"""Interruttore del programma settimanale: attiva o disattiva le fasce (il timer resta a parte)."""
from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .controller import TermoController
from .logic import MODE_MANUAL, MODE_PROGRAM
from .sensor import TermoEntity


class ScheduleSwitch(TermoEntity, SwitchEntity):
    _attr_icon = "mdi:calendar-check"

    def __init__(self, controller: TermoController) -> None:
        super().__init__(controller, "programmazione")

    @property
    def is_on(self) -> bool:
        return self.controller.schedule.enabled

    async def async_turn_on(self, **kwargs: Any) -> None:
        self.controller.set_mode(MODE_PROGRAM)

    async def async_turn_off(self, **kwargs: Any) -> None:
        self.controller.set_mode(MODE_MANUAL)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    controller: TermoController = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([ScheduleSwitch(controller)])
