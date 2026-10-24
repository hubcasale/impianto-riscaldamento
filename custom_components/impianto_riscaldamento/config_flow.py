"""Configurazione guidata: si sceglie che cosa aggiungere (stufa a pellet o termostato) oppure si importano le voci delle
integrazioni precedenti (stufa_pellet e termostato_riscaldamento)."""
from __future__ import annotations

from typing import Any

from homeassistant.config_entries import SOURCE_IMPORT, ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback

from .const import CONF_KIND, CONF_LEGACY_DOMAIN, CONF_MIGRATED_FROM, DOMAIN, KIND_STUFA, KIND_TERMOSTATO
from .migrate import import_payload, legacy_entries, orphan_for_kind
from .stufa import config_flow as stufa_flow
from .stufa.const import CONF_NAME as STUFA_NAME, CONF_POWER
from .termostato import config_flow as termo_flow
from .termostato.const import CONF_CLIMATE, CONF_NAME as TERMO_NAME


class ImpiantoConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        options = ["stufa", "termostato"]
        if legacy_entries(self.hass):
            options.insert(0, "importa")
        return self.async_show_menu(step_id="user", menu_options=options)

    # ------------------------------------------------------------------ aggiunta nuova
    async def async_step_stufa(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            await self.async_set_unique_id(f"{KIND_STUFA}:{user_input[CONF_POWER]}")
            self._abort_if_unique_id_configured()
            data = {k: v for k, v in user_input.items() if k != STUFA_NAME and v not in (None, "")}
            return self.async_create_entry(title=user_input[STUFA_NAME], data={**data, CONF_KIND: KIND_STUFA, **self._adopt(KIND_STUFA)}, options={})
        return self.async_show_form(step_id="stufa", data_schema=stufa_flow.source_schema(with_name=True))

    async def async_step_termostato(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            await self.async_set_unique_id(f"{KIND_TERMOSTATO}:{user_input[CONF_CLIMATE]}")
            self._abort_if_unique_id_configured()
            data = {k: v for k, v in user_input.items() if k != TERMO_NAME and v not in (None, "")}
            return self.async_create_entry(title=user_input[TERMO_NAME], data={**data, CONF_KIND: KIND_TERMOSTATO, **self._adopt(KIND_TERMOSTATO)}, options={})
        return self.async_show_form(step_id="termostato", data_schema=termo_flow.source_schema(with_name=True))

    def _adopt(self, kind: str) -> dict[str, str]:
        """Una voce nuova adotta le entita' e i dati rimasti da una voce vecchia eliminata a mano (stessi entity_id)."""
        orphan = orphan_for_kind(self.hass, kind)
        return {CONF_MIGRATED_FROM: orphan[0], CONF_LEGACY_DOMAIN: orphan[1]} if orphan else {}

    # ------------------------------------------------------------------ importazione dalle integrazioni precedenti
    async def async_step_importa(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        old = legacy_entries(self.hass)
        if user_input is None:
            return self.async_show_form(step_id="importa", description_placeholders={"voci": ", ".join(e.title for e in old)})
        for entry in old:
            await self.hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_IMPORT}, data=import_payload(entry))
        return self.async_abort(reason="importato")

    async def async_step_import(self, import_data: dict[str, Any]) -> ConfigFlowResult:
        await self.async_set_unique_id(f"legacy:{import_data['data']['migrated_from']}")
        self._abort_if_unique_id_configured()
        return self.async_create_entry(title=import_data["title"], data=import_data["data"], options=import_data["options"])

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        if config_entry.data.get(CONF_KIND) == KIND_STUFA:
            return stufa_flow.StufaOptionsFlow()
        return termo_flow.TermoOptionsFlow()
