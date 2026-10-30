"""Impianto riscaldamento: stufa a pellet e termostato ambiente in un'unica integrazione, con le loro schede e preferenze."""
from __future__ import annotations

import json
import logging
from pathlib import Path

import voluptuous as vol

from homeassistant.components import frontend, websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

from . import stufa, termostato
from .const import CONF_KIND, CONF_MIGRATED_FROM, CONF_MIGRATION_DONE, DOMAIN, KIND_STUFA, PLATFORMS
from .migrate import async_finish_migration, async_migrate_legacy
from .services import async_register_services

_LOGGER = logging.getLogger(__name__)
CONFIG_SCHEMA = vol.Schema({DOMAIN: vol.Schema({})}, extra=vol.ALLOW_EXTRA)

# le schede servite dall'integrazione (nessuna risorsa da aggiungere alla dashboard)
CARDS = (
    (stufa.const.CARD_URL, stufa.const.CARD_FILE),
    (termostato.const.CARD_URL, termostato.const.CARD_FILE),
)


def _version() -> str:
    try:
        return json.loads((Path(__file__).parent / "manifest.json").read_text())["version"]
    except (OSError, ValueError, KeyError):
        return "0"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Registra le due schede, i comandi (websocket) che usano e i servizi per script e Assist."""
    hass.data.setdefault(DOMAIN, {})
    version = await hass.async_add_executor_job(_version)
    for url, rel in CARDS:
        path = Path(__file__).parent / rel
        if await hass.async_add_executor_job(path.is_file):
            await hass.http.async_register_static_paths([StaticPathConfig(url, str(path), cache_headers=False)])
            frontend.add_extra_js_url(hass, f"{url}?v={version}")
        else:
            _LOGGER.warning("Scheda non trovata in %s: costruiscila con npm run build", path)
    for cmd in (*stufa.COMMANDS, *termostato.COMMANDS):
        websocket_api.async_register_command(hass, cmd)
    async_register_services(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    # voce nata dalla migrazione: prima si spostano entita', dispositivo e dati salvati della voce vecchia
    if entry.data.get(CONF_MIGRATED_FROM) and not entry.data.get(CONF_MIGRATION_DONE):
        await async_migrate_legacy(hass, entry)
    module = stufa if entry.data.get(CONF_KIND) == KIND_STUFA else termostato
    if not await module.async_setup_entry(hass, entry):
        return False
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    async_finish_migration(hass, entry)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if ok:
        module = stufa if entry.data.get(CONF_KIND) == KIND_STUFA else termostato
        await module.async_unload_entry(hass, entry)
    return ok
