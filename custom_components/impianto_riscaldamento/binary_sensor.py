"""Piattaforma binary_sensor: smista alla stufa o al termostato secondo il tipo della voce."""
from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import CONF_KIND, KIND_STUFA
from .stufa import binary_sensor as _stufa
from .termostato import binary_sensor as _termostato


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    module = _stufa if entry.data.get(CONF_KIND) == KIND_STUFA else _termostato
    await module.async_setup_entry(hass, entry, async_add_entities)
