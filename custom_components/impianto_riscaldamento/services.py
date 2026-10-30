"""Servizi dell'integrazione: il timer del termostato usabile da script, automazioni e Assist.

Chiamano la stessa funzione della scheda (TermoController.start_timer), quindi valgono gli stessi limiti
(durata massima e temperature delle preferenze), l'annuncio vocale e il ritorno al programma o all'antigelo.
"""
from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse, callback
from homeassistant.exceptions import HomeAssistantError
import homeassistant.helpers.config_validation as cv

from .const import DOMAIN
from .termostato import _controller
from .termostato.controller import TermoController

SERVICE_AVVIA_TIMER = "avvia_timer"
SERVICE_ANNULLA_TIMER = "annulla_timer"
ATTR_ENTRY_ID = "entry_id"
ATTR_MINUTI = "minuti"
ATTR_TEMPERATURA = "temperatura"

SCHEMA_AVVIA_TIMER = vol.Schema(
    {
        vol.Optional(ATTR_ENTRY_ID): cv.string,
        vol.Required(ATTR_MINUTI): vol.All(vol.Coerce(int), vol.Range(min=0, max=24 * 60)),
        vol.Optional(ATTR_TEMPERATURA): vol.Coerce(float),
    }
)
SCHEMA_ANNULLA_TIMER = vol.Schema({vol.Optional(ATTR_ENTRY_ID): cv.string})


def _termostato(hass: HomeAssistant, call: ServiceCall) -> TermoController:
    c = _controller(hass, call.data.get(ATTR_ENTRY_ID))
    if c is None:
        raise HomeAssistantError("Nessun termostato configurato")
    return c


def _esito(c: TermoController) -> dict[str, Any]:
    return {
        "timer_fino_a": c.timer_until.isoformat() if c.timer_until else None,
        "temperatura": c.timer_temp,
        "modalita": c.mode,
    }


@callback
def async_register_services(hass: HomeAssistant) -> None:
    """Registra i servizi una volta sola, all'avvio dell'integrazione."""
    if hass.services.has_service(DOMAIN, SERVICE_AVVIA_TIMER):
        return

    async def _avvia_timer(call: ServiceCall) -> ServiceResponse:
        c = _termostato(hass, call)
        c.start_timer(call.data[ATTR_MINUTI], call.data.get(ATTR_TEMPERATURA))
        return _esito(c)

    async def _annulla_timer(call: ServiceCall) -> ServiceResponse:
        c = _termostato(hass, call)
        c.start_timer(0)
        return _esito(c)

    hass.services.async_register(
        DOMAIN, SERVICE_AVVIA_TIMER, _avvia_timer, schema=SCHEMA_AVVIA_TIMER, supports_response=SupportsResponse.OPTIONAL
    )
    hass.services.async_register(
        DOMAIN, SERVICE_ANNULLA_TIMER, _annulla_timer, schema=SCHEMA_ANNULLA_TIMER, supports_response=SupportsResponse.OPTIONAL
    )
