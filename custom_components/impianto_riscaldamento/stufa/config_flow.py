"""Configurazione guidata: sensori richiesti e preferenze (soglie, tempi, notifiche)."""
from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigFlowResult, OptionsFlow
from homeassistant.helpers import selector

from .const import CONF_ENERGY, CONF_NAME, CONF_PLUG, CONF_POWER, CONF_SWITCH
from .logic import TILE_COLORS, Settings


def _number(min_: float, max_: float, step: float, unit: str | None = None) -> selector.NumberSelector:
    cfg: dict[str, Any] = {"min": min_, "max": max_, "step": step, "mode": selector.NumberSelectorMode.BOX}
    if unit:
        cfg["unit_of_measurement"] = unit
    return selector.NumberSelector(selector.NumberSelectorConfig(**cfg))


def source_schema(with_name: bool = False) -> vol.Schema:
    fields: dict[Any, Any] = {}
    if with_name:
        fields[vol.Required(CONF_NAME, default="Stufa a pellet")] = str
    fields[vol.Required(CONF_POWER)] = selector.EntitySelector(selector.EntitySelectorConfig(domain="sensor", device_class="power"))
    fields[vol.Optional(CONF_SWITCH)] = selector.EntitySelector(
        selector.EntitySelectorConfig(domain=["switch", "input_boolean", "light"])
    )
    fields[vol.Optional(CONF_PLUG)] = selector.EntitySelector(
        selector.EntitySelectorConfig(domain=["switch", "input_boolean", "light"])
    )
    fields[vol.Optional(CONF_ENERGY)] = selector.EntitySelector(selector.EntitySelectorConfig(domain="sensor", device_class="energy"))
    return vol.Schema(fields)


def settings_schema(s: Settings) -> vol.Schema:
    return vol.Schema(
        {
            vol.Required("off_below", default=s.off_below): _number(0, 50, 0.1, "W"),
            vol.Required("ignition_above", default=s.ignition_above): _number(50, 3000, 1, "W"),
            vol.Required("shutdown_min", default=s.shutdown_min): _number(0, 3000, 0.1, "W"),
            vol.Required("shutdown_max", default=s.shutdown_max): _number(0, 3000, 0.1, "W"),
            vol.Required("shutdown_needs_switch_off", default=s.shutdown_needs_switch_off): selector.BooleanSelector(),
            vol.Required("confirm_seconds", default=s.confirm_seconds): _number(0, 300, 1, "s"),
            vol.Required("grace_seconds", default=s.grace_seconds): _number(0, 600, 1, "s"),
            vol.Required("restore_delay_seconds", default=s.restore_delay_seconds): _number(0, 600, 1, "s"),
            vol.Required("sync_switch_on", default=s.sync_switch_on): selector.BooleanSelector(),
            vol.Required("sync_switch_off", default=s.sync_switch_off): selector.BooleanSelector(),
            vol.Required("notify_events", default=s.notify_events): selector.BooleanSelector(),
            vol.Required("notify_sensor_problem", default=s.notify_sensor_problem): selector.BooleanSelector(),
            vol.Optional("notify_service", default=s.notify_service): selector.TextSelector(),
            vol.Required("tile_color", default=s.tile_color): selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=TILE_COLORS, translation_key="tile_color", mode=selector.SelectSelectorMode.DROPDOWN
                )
            ),
            vol.Required("show_switch_button", default=s.show_switch_button): selector.BooleanSelector(),
        }
    )


class StufaOptionsFlow(OptionsFlow):
    """Le stesse preferenze della scheda: soglie, tempi, comportamento e notifiche."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        return await self.async_step_stufa(user_input)

    async def async_step_stufa(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(title="", data=Settings.from_dict(user_input).to_dict())
        return self.async_show_form(
            step_id="stufa", data_schema=settings_schema(Settings.from_dict(self.config_entry.options))
        )
