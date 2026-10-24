"""Costanti della parte «termostato riscaldamento»."""
from ..const import DOMAIN

CONF_NAME = "name"
CONF_CLIMATE = "climate"        # il termostato da comandare (climate.*)
CONF_TEMP = "temperature_sensor"  # sensore di temperatura ambiente, se diverso da quello del termostato
CONF_AWAY = "away_entity"       # acceso quando nessuno è in casa
CONF_GUESTS = "guests_entity"   # acceso quando ci sono ospiti: niente abbassamento

STORAGE_VERSION = 1
CARD_URL = "/impianto_riscaldamento_static/termostato-card.js"
CARD_FILE = "frontend/termostato-card.js"

SIGNAL_UPDATE = f"{DOMAIN}_update_{{}}"   # formato con l'id della voce di configurazione
TICK_SECONDS = 20
