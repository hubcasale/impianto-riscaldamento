"""Migrazione dalle due integrazioni separate (stufa_pellet e termostato_riscaldamento).

Una voce vecchia diventa una voce nuova dello stesso tipo: stesse impostazioni, stesso programma salvato, e le sue entita'
e il suo dispositivo si spostano nel registro mantenendo entity_id (quindi lo storico dei grafici), nome, area e personalizzazioni.
Le voci vecchie si rimuovono alla fine.
"""
from __future__ import annotations

import inspect
import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.helpers.storage import Store

from .const import CONF_KIND, CONF_LEGACY_DOMAIN, CONF_MIGRATED_FROM, CONF_MIGRATION_DONE, DOMAIN, LEGACY_DOMAINS, STORAGE_VERSION

_LOGGER = logging.getLogger(__name__)


def legacy_entries(hass: HomeAssistant) -> list[ConfigEntry]:
    """Le voci delle integrazioni vecchie non ancora importate."""
    done = {e.data.get(CONF_MIGRATED_FROM) for e in hass.config_entries.async_entries(DOMAIN)}
    return [e for dom in LEGACY_DOMAINS for e in hass.config_entries.async_entries(dom) if e.entry_id not in done]


def import_payload(old: ConfigEntry) -> dict[str, Any]:
    """Dati per creare la voce nuova (flusso «import») dalla voce vecchia."""
    return {
        "title": old.title,
        "data": {**old.data, CONF_KIND: LEGACY_DOMAINS[old.domain], CONF_MIGRATED_FROM: old.entry_id, CONF_LEGACY_DOMAIN: old.domain},
        "options": dict(old.options),
    }


async def async_migrate_legacy(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Sposta dati salvati, dispositivo ed entita' della voce vecchia in quella nuova (prima che si creino le entita' nuove)."""
    old_id: str = entry.data[CONF_MIGRATED_FROM]
    old_domain: str = entry.data[CONF_LEGACY_DOMAIN]
    new_id = entry.entry_id

    # 1. dati salvati (programma settimanale, timer, contatori, ...)
    old_store: Store = Store(hass, STORAGE_VERSION, f"{old_domain}.{old_id}")
    new_store: Store = Store(hass, STORAGE_VERSION, f"{DOMAIN}.{new_id}")
    saved = await old_store.async_load()
    if saved is not None and await new_store.async_load() is None:
        await new_store.async_save(saved)

    # 2. entita': stesso entity_id, piattaforma e unique_id nuovi
    ent_reg = er.async_get(hass)
    for ent in list(er.async_entries_for_config_entry(ent_reg, old_id)):
        suffix = ent.unique_id[len(old_id):] if ent.unique_id.startswith(old_id) else f"_{ent.unique_id}"
        ent_reg.async_update_entity_platform(ent.entity_id, DOMAIN, new_config_entry_id=new_id, new_unique_id=f"{new_id}{suffix}")

    # 3. dispositivo: stesso dispositivo (nome, area), identificatore e voce nuovi
    dev_reg = dr.async_get(hass)
    for dev in dr.async_entries_for_config_entry(dev_reg, old_id):
        identifiers = {i for i in dev.identifiers if i != (old_domain, old_id)} | {(DOMAIN, new_id)}
        if "new_config_entry_id" in inspect.signature(dev_reg.async_update_device).parameters:
            dev_reg.async_update_device(dev.id, new_identifiers=identifiers, new_config_entry_id=new_id)
        else:  # Home Assistant meno recente: un dispositivo puo' avere piu' voci
            dev_reg.async_update_device(dev.id, new_identifiers=identifiers, add_config_entry_id=new_id, remove_config_entry_id=old_id)

    _LOGGER.info("Voce «%s» di %s importata", entry.title, old_domain)
    hass.config_entries.async_update_entry(entry, data={**entry.data, CONF_MIGRATION_DONE: True})


@callback
def async_finish_migration(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """A voce nuova avviata si toglie quella vecchia (in una attivita' a parte: non si rimuove una voce da dentro l'avvio di un'altra)."""
    old_id = entry.data.get(CONF_MIGRATED_FROM)
    if old_id and hass.config_entries.async_get_entry(old_id) is not None:
        hass.async_create_task(hass.config_entries.async_remove(old_id))
