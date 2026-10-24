"""Costanti dell'integrazione Impianto riscaldamento (stufa a pellet e termostato in un'unica integrazione)."""
from homeassistant.const import Platform

DOMAIN = "impianto_riscaldamento"
PLATFORMS = [Platform.SENSOR, Platform.BINARY_SENSOR, Platform.SWITCH]

# tipo della voce di configurazione
CONF_KIND = "kind"
KIND_STUFA = "stufa"
KIND_TERMOSTATO = "termostato"

# migrazione dalle due integrazioni separate (stufa_pellet e termostato_riscaldamento)
CONF_MIGRATED_FROM = "migrated_from"      # id della voce vecchia da cui arriva questa
CONF_LEGACY_DOMAIN = "legacy_domain"      # dominio dell'integrazione vecchia
CONF_MIGRATION_DONE = "migration_done"    # entita', dispositivo e dati gia' spostati
LEGACY_DOMAINS = {"stufa_pellet": KIND_STUFA, "termostato_riscaldamento": KIND_TERMOSTATO}

STORAGE_VERSION = 1
