"""Stufa a pellet: stato, interruttore allineato, conteggi, scheda e preferenze, da una presa con misura di potenza."""
# Entità collegate: sensore di potenza (obbligatorio), interruttore della stufa (per esempio lo Shelly sul contatto AUX,
# comanda programma, timer e pulsante), interruttore della presa (solo stato) e contatore di energia.
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util

from .const import CONF_ENERGY, CONF_PLUG, CONF_POWER, CONF_SWITCH, DOMAIN
from .controller import StufaController, sources_of
from .logic import Settings, suggest_thresholds, valid_power
from .schedule import Schedule

ENTITY_KEYS = {
    "sensor": ["stato", "modo", "prossimo_evento", "accensioni_oggi", "ore_in_funzione_oggi", "ultima_accensione", "ultimo_spegnimento", "energia_oggi"],
    "binary_sensor": ["in_funzione", "azioni_bloccate"],
    "switch": ["programmazione"],
}


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    controller = StufaController(hass, entry)
    hass.data[DOMAIN][entry.entry_id] = controller
    await controller.async_start()
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    return True


async def _async_options_updated(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Preferenze cambiate: si applicano subito; se cambiano i sensori si ricarica la voce."""
    controller: StufaController | None = hass.data[DOMAIN].get(entry.entry_id)
    if controller is None or sources_of(entry.data) != controller.sources:
        await hass.config_entries.async_reload(entry.entry_id)
        return
    controller.update_settings(Settings.from_dict(entry.options))


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    controller: StufaController | None = hass.data[DOMAIN].pop(entry.entry_id, None)
    if controller is not None:
        await controller.async_stop()


# ---------------------------------------------------------------------- comandi per la scheda
def _entities_of(hass: HomeAssistant, entry: ConfigEntry) -> dict[str, str]:
    reg = er.async_get(hass)
    out: dict[str, str] = {}
    for domain, keys in ENTITY_KEYS.items():
        for key in keys:
            eid = reg.async_get_entity_id(domain, DOMAIN, f"{entry.entry_id}_{key}")
            if eid:
                out[key] = eid
    return out


def _controller(hass: HomeAssistant, entry_id: str | None) -> StufaController | None:
    controllers: dict[str, StufaController] = {k: v for k, v in hass.data.get(DOMAIN, {}).items() if isinstance(v, StufaController)}
    if entry_id:
        return controllers.get(entry_id)
    return next(iter(controllers.values()), None)


@websocket_api.websocket_command({vol.Required("type"): "stufa_pellet/info", vol.Optional("entry_id"): str})
@callback
def ws_info(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    c = _controller(hass, msg.get("entry_id"))
    if c is None:
        connection.send_error(msg["id"], "not_found", "Nessuna stufa configurata")
        return
    data = c.info()
    data["entities"] = _entities_of(hass, c.entry)
    connection.send_result(msg["id"], data)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "stufa_pellet/update",
        vol.Optional("entry_id"): str,
        vol.Optional("settings"): dict,
        vol.Optional("sources"): dict,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_update(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    c = _controller(hass, msg.get("entry_id"))
    if c is None:
        connection.send_error(msg["id"], "not_found", "Nessuna stufa configurata")
        return
    entry = c.entry
    options = entry.options
    data = entry.data
    if "settings" in msg:
        merged = {**Settings.from_dict(entry.options).to_dict(), **msg["settings"]}
        options = Settings.from_dict(merged).to_dict()
    if "sources" in msg:
        src = msg["sources"]
        new = dict(entry.data)
        if CONF_POWER in src and not src[CONF_POWER]:
            connection.send_error(msg["id"], "invalid", "Il sensore di potenza è obbligatorio")
            return
        for key in (CONF_POWER, CONF_SWITCH, CONF_PLUG, CONF_ENERGY):
            if key in src:
                if src[key]:
                    new[key] = src[key]
                elif key != CONF_POWER:
                    new.pop(key, None)
        if not new.get(CONF_POWER):
            connection.send_error(msg["id"], "invalid", "Il sensore di potenza e' obbligatorio")
            return
        data = new
    hass.config_entries.async_update_entry(entry, data=data, options=options)
    connection.send_result(msg["id"], {"settings": Settings.from_dict(options).to_dict()})


@websocket_api.websocket_command(
    {vol.Required("type"): "stufa_pellet/suggest", vol.Optional("entry_id"): str, vol.Optional("days", default=14): vol.All(int, vol.Range(min=1, max=60))}
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_suggest(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Propone le soglie dalla storia della potenza della presa."""
    c = _controller(hass, msg.get("entry_id"))
    if c is None:
        connection.send_error(msg["id"], "not_found", "Nessuna stufa configurata")
        return
    try:
        from homeassistant.components.recorder import get_instance, history
    except ImportError:
        connection.send_error(msg["id"], "no_recorder", "Il registratore (recorder) non e' disponibile")
        return
    end = dt_util.utcnow()
    start = end - timedelta(days=msg["days"])

    def _load() -> list[tuple[float, float]]:
        res = history.get_significant_states(
            hass, start, end, [c.power_entity], significant_changes_only=False, minimal_response=False, no_attributes=True
        )
        samples: list[tuple[float, float]] = []
        last_t = -1e9
        for st in res.get(c.power_entity, []):
            w = valid_power(st.state)
            if w is None:
                continue
            ts = st.last_updated.timestamp() if isinstance(st.last_updated, datetime) else float(st.last_updated)
            if ts - last_t >= 10:      # al massimo un campione ogni 10 secondi
                samples.append((ts, w))
                last_t = ts
        return samples

    samples = await get_instance(hass).async_add_executor_job(_load)
    suggestion = suggest_thresholds(samples)
    connection.send_result(msg["id"], {"samples": len(samples), "days": msg["days"], "suggestion": suggestion})


@websocket_api.websocket_command(
    {vol.Required("type"): "stufa_pellet/schedule", vol.Optional("entry_id"): str, vol.Required("schedule"): dict}
)
@callback
def ws_schedule(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Salva la programmazione settimanale (fasce e attivazione); i dati non validi si scartano."""
    c = _controller(hass, msg.get("entry_id"))
    if c is None:
        connection.send_error(msg["id"], "not_found", "Nessuna stufa configurata")
        return
    if not c.switch_entity:
        connection.send_error(msg["id"], "no_switch", "Per programmare serve l'interruttore della stufa")
        return
    c.set_schedule(Schedule.from_dict(msg["schedule"]))
    connection.send_result(msg["id"], {"schedule": c.schedule.to_dict()})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "stufa_pellet/timer",
        vol.Optional("entry_id"): str,
        vol.Required("minutes"): vol.All(int, vol.Range(min=0, max=24 * 60)),
    }
)
@callback
def ws_timer(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Accende ora e spegne dopo il tempo indicato; 0 annulla il timer."""
    c = _controller(hass, msg.get("entry_id"))
    if c is None:
        connection.send_error(msg["id"], "not_found", "Nessuna stufa configurata")
        return
    if not c.switch_entity:
        connection.send_error(msg["id"], "no_switch", "Per il timer serve l'interruttore della stufa")
        return
    c.start_timer(msg["minutes"])
    connection.send_result(msg["id"], {"timer_until": c.timer_until.isoformat() if c.timer_until else None})


COMMANDS = (ws_info, ws_update, ws_suggest, ws_schedule, ws_timer)
