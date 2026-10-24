"""Termostato riscaldamento: modalità manuale, timer e programma settimanale per un termostato esistente, con scheda e preferenze."""
from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er

from .const import CONF_AWAY, CONF_CLIMATE, CONF_GUESTS, CONF_TEMP, DOMAIN
from .controller import TermoController, sources_of
from .logic import MODE_OFF, MODES, Settings
from .schedule import Schedule

ENTITY_KEYS = {
    "sensor": ["modo", "prossimo_evento"],
    "binary_sensor": ["assenza_attiva", "sta_scaldando"],
    "switch": ["programmazione"],
}
SETTABLE_MODES = ["programma", "manuale", "spento"]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    controller = TermoController(hass, entry)
    hass.data[DOMAIN][entry.entry_id] = controller
    await controller.async_start()
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    return True


async def _async_options_updated(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Preferenze cambiate: si applicano subito; se cambiano le entità collegate si ricarica la voce."""
    controller: TermoController | None = hass.data[DOMAIN].get(entry.entry_id)
    if controller is None or sources_of(entry.data) != controller.sources:
        await hass.config_entries.async_reload(entry.entry_id)
        return
    controller.update_settings(Settings.from_dict(entry.options))


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    controller: TermoController | None = hass.data[DOMAIN].pop(entry.entry_id, None)
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


def _controller(hass: HomeAssistant, entry_id: str | None) -> TermoController | None:
    controllers: dict[str, TermoController] = {k: v for k, v in hass.data.get(DOMAIN, {}).items() if isinstance(v, TermoController)}
    if entry_id:
        return controllers.get(entry_id)
    return next(iter(controllers.values()), None)


def _missing(connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_error(msg["id"], "not_found", "Nessun termostato configurato")


@websocket_api.websocket_command({vol.Required("type"): "termostato_riscaldamento/info", vol.Optional("entry_id"): str})
@callback
def ws_info(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    c = _controller(hass, msg.get("entry_id"))
    if c is None:
        _missing(connection, msg)
        return
    data = c.info()
    data["entities"] = _entities_of(hass, c.entry)
    connection.send_result(msg["id"], data)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "termostato_riscaldamento/update",
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
        _missing(connection, msg)
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
        if CONF_CLIMATE in src and not src[CONF_CLIMATE]:
            connection.send_error(msg["id"], "invalid", "Il termostato è obbligatorio")
            return
        for key in (CONF_CLIMATE, CONF_TEMP, CONF_AWAY, CONF_GUESTS):
            if key in src:
                if src[key]:
                    new[key] = src[key]
                elif key != CONF_CLIMATE:
                    new.pop(key, None)
        data = new
    hass.config_entries.async_update_entry(entry, data=data, options=options)
    connection.send_result(msg["id"], {"settings": Settings.from_dict(options).to_dict()})


@websocket_api.websocket_command(
    {vol.Required("type"): "termostato_riscaldamento/schedule", vol.Optional("entry_id"): str, vol.Required("schedule"): dict}
)
@callback
def ws_schedule(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Salva il programma settimanale (fasce e attivazione); i dati non validi si scartano."""
    c = _controller(hass, msg.get("entry_id"))
    if c is None:
        _missing(connection, msg)
        return
    c.set_schedule(Schedule.from_dict(msg["schedule"]))
    connection.send_result(msg["id"], {"schedule": c.schedule.to_dict()})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "termostato_riscaldamento/timer",
        vol.Optional("entry_id"): str,
        vol.Required("minutes"): vol.All(int, vol.Range(min=0, max=24 * 60)),
        vol.Optional("temperature"): vol.Coerce(float),
    }
)
@callback
def ws_timer(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Scalda per il tempo indicato (alla temperatura scelta o a quella attuale); 0 annulla il timer."""
    c = _controller(hass, msg.get("entry_id"))
    if c is None:
        _missing(connection, msg)
        return
    c.start_timer(msg["minutes"], msg.get("temperature"))
    connection.send_result(msg["id"], {"timer_until": c.timer_until.isoformat() if c.timer_until else None})


@websocket_api.websocket_command(
    {vol.Required("type"): "termostato_riscaldamento/target", vol.Optional("entry_id"): str, vol.Required("temperature"): vol.Coerce(float)}
)
@callback
def ws_target(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Cambia l'obiettivo a mano (nei limiti delle preferenze); da Spento non fa niente."""
    c = _controller(hass, msg.get("entry_id"))
    if c is None:
        _missing(connection, msg)
        return
    if c.mode == MODE_OFF:
        # da Spento il + e il − non devono accendere niente: prima si sceglie Manuale
        connection.send_error(msg["id"], "spento", "Il termostato è spento: scegli prima Manuale per regolare la temperatura.")
        return
    connection.send_result(msg["id"], {"target": c.set_target(msg["temperature"])})


@websocket_api.websocket_command(
    {vol.Required("type"): "termostato_riscaldamento/mode", vol.Optional("entry_id"): str, vol.Required("mode"): vol.In(SETTABLE_MODES)}
)
@callback
def ws_mode(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Sceglie la modalità: programma, manuale o spento (il timer ha il suo comando)."""
    c = _controller(hass, msg.get("entry_id"))
    if c is None:
        _missing(connection, msg)
        return
    c.set_mode(msg["mode"])
    connection.send_result(msg["id"], {"mode": c.mode})


COMMANDS = (ws_info, ws_update, ws_schedule, ws_timer, ws_target, ws_mode)
