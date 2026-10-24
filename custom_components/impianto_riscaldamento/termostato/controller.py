"""Il "cervello" del termostato: modalità, programma settimanale, timer, antigelo e assenza.

Non misura niente da sé: comanda un `climate.*` esistente. Le azioni partono solo ai cambi (inizio o fine di una fascia,
scadenza del timer, uscita o rientro di casa), così il termostato resta libero di essere cambiato a mano.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import Event, EventStateChangedData, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.event import async_track_state_change_event, async_track_time_interval
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import CONF_AWAY, CONF_CLIMATE, CONF_GUESTS, CONF_TEMP, DOMAIN, SIGNAL_UPDATE, STORAGE_VERSION, TICK_SECONDS
from .logic import (
    MODE_MANUAL, MODE_OFF, MODE_PROGRAM, Settings, clamp_target, decide_mode, format_minutes, format_temp, is_idle,
    timer_target, valid_temp,
)
from .schedule import Schedule

_LOGGER = logging.getLogger(__name__)
OWN_CHANGE_SECONDS = 20     # una variazione del termostato entro tanti secondi da un nostro comando è nostra


def sources_of(data: Any) -> tuple[Any, Any, Any, Any]:
    """Le entità collegate alla voce: termostato, sensore di temperatura, assenza, ospiti (None se mancano)."""
    return (data.get(CONF_CLIMATE), data.get(CONF_TEMP) or None, data.get(CONF_AWAY) or None, data.get(CONF_GUESTS) or None)


def _parse_dt(value: Any) -> datetime | None:
    if not isinstance(value, str):
        return None
    return dt_util.parse_datetime(value)


class TermoController:
    """Una voce di configurazione = un termostato."""

    CATCH_UP = timedelta(minutes=10)     # dopo un riavvio si recupera al massimo l'ultimo evento degli ultimi 10 minuti

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.hass = hass
        self.entry = entry
        self.settings = Settings.from_dict(entry.options)
        self.schedule = Schedule()
        self.timer_until: datetime | None = None
        self.timer_temp: float | None = None
        self.last_action: dict[str, Any] | None = None
        self.away_applied = False
        self.away_override_until: datetime | None = None
        self._away_since: datetime | None = None
        self._last_sched_check: datetime | None = None
        self._last_cmd: datetime | None = None
        self._store: Store = Store(hass, STORAGE_VERSION, f"{DOMAIN}.{entry.entry_id}")
        self._unsubs: list = []
        self.sources = sources_of(entry.data)

    # ------------------------------------------------------------------ entità collegate
    @property
    def climate_entity(self) -> str:
        return self.entry.data[CONF_CLIMATE]

    @property
    def temp_entity(self) -> str | None:
        return self.entry.data.get(CONF_TEMP) or None

    @property
    def away_entity(self) -> str | None:
        return self.entry.data.get(CONF_AWAY) or None

    @property
    def guests_entity(self) -> str | None:
        return self.entry.data.get(CONF_GUESTS) or None

    @property
    def signal(self) -> str:
        return SIGNAL_UPDATE.format(self.entry.entry_id)

    # ------------------------------------------------------------------ ciclo di vita
    async def async_start(self) -> None:
        saved = await self._store.async_load() or {}
        now = dt_util.now()
        self.schedule = Schedule.from_dict(saved.get("schedule"))
        self.timer_until = _parse_dt(saved.get("timer_until"))
        self.timer_temp = valid_temp(saved.get("timer_temp"))
        self.last_action = saved.get("last_action") if isinstance(saved.get("last_action"), dict) else None
        self._last_sched_check = _parse_dt(saved.get("last_sched_check"))
        self.away_applied = saved.get("away_applied") is True
        self.away_override_until = _parse_dt(saved.get("away_override_until"))
        entities = [e for e in (self.climate_entity, self.temp_entity, self.away_entity, self.guests_entity) if e]
        self._unsubs.append(async_track_state_change_event(self.hass, entities, self._on_event))
        self._unsubs.append(async_track_time_interval(self.hass, self._on_tick, timedelta(seconds=TICK_SECONDS)))
        away = self._away_state()
        if away:
            st = self.hass.states.get(self.away_entity) if self.away_entity else None
            self._away_since = st.last_changed if st is not None else now
        self._evaluate(now, startup=True)

    async def async_stop(self) -> None:
        for unsub in self._unsubs:
            unsub()
        self._unsubs.clear()
        await self._async_save()

    async def _async_save(self) -> None:
        await self._store.async_save(
            {
                "schedule": self.schedule.to_dict(),
                "timer_until": self.timer_until.isoformat() if self.timer_until else None,
                "timer_temp": self.timer_temp,
                "last_action": self.last_action,
                "last_sched_check": self._last_sched_check.isoformat() if self._last_sched_check else None,
                "away_applied": self.away_applied,
                "away_override_until": self.away_override_until.isoformat() if self.away_override_until else None,
            }
        )

    def _save_soon(self) -> None:
        self.hass.async_create_task(self._async_save())

    @callback
    def update_settings(self, settings: Settings) -> None:
        self.settings = settings
        self._evaluate(dt_util.now())

    # ------------------------------------------------------------------ eventi
    @callback
    def _on_event(self, event: Event[EventStateChangedData]) -> None:
        now = dt_util.now()
        if event.data["entity_id"] == self.climate_entity and self.away_applied and not self._own_change(now):
            # qualcuno ha agito sul termostato a mano mentre la casa è vuota: lo si rispetta per un po'
            self._start_override(now)
        self._evaluate(now)

    @callback
    def _on_tick(self, now: datetime) -> None:
        self._evaluate(dt_util.now())

    def _own_change(self, now: datetime) -> bool:
        return self._last_cmd is not None and (now - self._last_cmd).total_seconds() < OWN_CHANGE_SECONDS

    def _start_override(self, now: datetime) -> None:
        self.away_override_until = now + timedelta(hours=self.settings.timer_max_hours)
        self._save_soon()

    # ------------------------------------------------------------------ lettura del termostato
    def _climate(self) -> tuple[str | None, float | None, float | None, str | None]:
        """(modo, obiettivo, temperatura ambiente, azione) del termostato; None dove non si sa."""
        st = self.hass.states.get(self.climate_entity)
        if st is None or st.state in ("unavailable", "unknown"):
            return None, None, None, None
        target = valid_temp(st.attributes.get("temperature"))
        current = valid_temp(st.attributes.get("current_temperature"))
        if self.temp_entity:
            ts = self.hass.states.get(self.temp_entity)
            override = valid_temp(ts.state) if ts is not None else None
            if override is not None:
                current = override
        return st.state, target, current, st.attributes.get("hvac_action")

    @property
    def available(self) -> bool:
        return self._climate()[0] is not None

    def _away_state(self) -> bool:
        if not self.away_entity:
            return False
        away = self.hass.states.get(self.away_entity)
        if away is None or away.state != "on":
            return False
        guests = self.hass.states.get(self.guests_entity) if self.guests_entity else None
        return not (guests is not None and guests.state == "on")

    # ------------------------------------------------------------------ valutazione
    @callback
    def _evaluate(self, now: datetime, startup: bool = False) -> None:
        if self.available:
            if self.timer_until is not None and now >= self.timer_until:
                self._end_timer(now, "timer")
            self._run_away(now, startup)
            self._run_schedule(now, startup)
        async_dispatcher_send(self.hass, self.signal)

    def _run_away(self, now: datetime, startup: bool) -> None:
        s = self.settings
        away = self._away_state()
        if away:
            if self._away_since is None:
                self._away_since = now
            if not s.away_setback:
                return
            if not self.away_applied:
                if (now - self._away_since).total_seconds() >= s.away_minutes * 60:
                    self.away_applied = True
                    self.away_override_until = None
                    self._cancel_timer_quiet()
                    self._apply_idle("assenza", now)
                    self._announce("Casa vuota: il riscaldamento è stato portato all'antigelo.")
            elif self.away_override_until is not None and now >= self.away_override_until:
                self.away_override_until = None
                mode, target, _, _ = self._climate()
                if not is_idle(mode, target, s):
                    self._apply_idle("assenza", now)
                    self._announce("Casa ancora vuota: il riscaldamento è tornato all'antigelo.")
                self._save_soon()
            return
        self._away_since = None
        if self.away_applied:
            self.away_applied = False
            self.away_override_until = None
            if self.schedule.enabled and self.timer_until is None:
                expected = self.schedule.target_at(now)
                self._apply_expected(expected, "rientro", now)
                self._announce("Bentornato: il riscaldamento segue di nuovo il programma.")
            self._save_soon()

    def _run_schedule(self, now: datetime, startup: bool) -> None:
        """Esegue gli inizi e le fini di fascia previsti (solo ai cambi, non di continuo)."""
        if not self.schedule.enabled or self.timer_until is not None:
            self._last_sched_check = now
            return
        since = self._last_sched_check
        if since is None:
            since = now
        elif startup:
            since = max(since, now - self.CATCH_UP)
        events = self.schedule.events(since, now)
        self._last_sched_check = now
        if events and not self.away_applied:
            kind, _when, temp = events[-1]
            self._apply_expected(temp if kind == "set" else None, "programma", now)
            self._announce_schedule(kind, temp)

    # ------------------------------------------------------------------ comandi al termostato
    def _call_many(self, calls: list[tuple[str, str, dict[str, Any]]]) -> None:
        """Esegue le chiamate in ordine senza aspettare; un servizio che manca o fallisce si scrive nel registro e basta."""

        async def _run() -> None:
            for domain, service, data in calls:
                try:
                    await self.hass.services.async_call(domain, service, data, blocking=True)
                except HomeAssistantError as err:
                    _LOGGER.warning("Servizio %s.%s non riuscito: %s", domain, service, err)

        self._last_cmd = dt_util.now()
        self.hass.async_create_task(_run())

    def _apply_heat(self, temp: float, reason: str, now: datetime) -> None:
        mode, _target, _cur, _act = self._climate()
        calls: list[tuple[str, str, dict[str, Any]]] = []
        if mode not in ("heat",):
            calls.append(("climate", "set_hvac_mode", {"entity_id": self.climate_entity, "hvac_mode": "heat"}))
        calls.append(("climate", "set_temperature", {"entity_id": self.climate_entity, "temperature": temp}))
        self._call_many(calls)
        self._remember("riscaldamento", reason, now, temp)

    def _apply_idle(self, reason: str, now: datetime) -> None:
        s = self.settings
        mode, _target, _cur, _act = self._climate()
        calls: list[tuple[str, str, dict[str, Any]]] = []
        if s.frost_keep_heat:
            if mode != "heat":
                calls.append(("climate", "set_hvac_mode", {"entity_id": self.climate_entity, "hvac_mode": "heat"}))
            calls.append(("climate", "set_temperature", {"entity_id": self.climate_entity, "temperature": s.antigelo}))
        else:
            calls.append(("climate", "set_hvac_mode", {"entity_id": self.climate_entity, "hvac_mode": "off"}))
            calls.append(("climate", "set_temperature", {"entity_id": self.climate_entity, "temperature": s.antigelo}))
        self._call_many(calls)
        self._remember("antigelo", reason, now, s.antigelo)

    def _apply_expected(self, expected: float | None, reason: str, now: datetime) -> None:
        if expected is None:
            self._apply_idle(reason, now)
        else:
            self._apply_heat(expected, reason, now)

    def _remember(self, action: str, reason: str, now: datetime, temp: float | None) -> None:
        self.last_action = {"azione": action, "motivo": reason, "quando": now.isoformat(), "temperatura": temp}
        self._save_soon()

    # ------------------------------------------------------------------ comandi dalla scheda
    @callback
    def set_target(self, temperature: float) -> float:
        """Cambia l'obiettivo a mano: il termostato si accende se serve; col programma attivo vale fino al prossimo cambio."""
        now = dt_util.now()
        value = clamp_target(temperature, self.settings)
        self._apply_heat(value, "manuale", now)
        if self.away_applied:
            self._start_override(now)
        self._evaluate(now)
        return value

    @callback
    def set_mode(self, mode: str) -> None:
        now = dt_util.now()
        self._cancel_timer_quiet()
        if mode == MODE_PROGRAM:
            self.schedule = Schedule(True, self.schedule.slots)
            self._last_sched_check = now
            if not self.away_applied:
                self._apply_expected(self.schedule.target_at(now), "programma", now)
        elif mode == MODE_MANUAL:
            self.schedule = Schedule(False, self.schedule.slots)
            current_mode, target, _, _ = self._climate()
            if is_idle(current_mode, target, self.settings):
                self._apply_heat(self.settings.default_target, "manuale", now)
            if self.away_applied:
                self._start_override(now)
        elif mode == MODE_OFF:
            self.schedule = Schedule(False, self.schedule.slots)
            self._apply_idle("manuale", now)
        self._save_soon()
        self._evaluate(now)

    @callback
    def set_schedule(self, schedule: Schedule) -> None:
        now = dt_util.now()
        self.schedule = schedule
        self._last_sched_check = now
        if schedule.enabled and self.timer_until is None and not self.away_applied:
            self._apply_expected(schedule.target_at(now), "programma", now)
        self._save_soon()
        self._evaluate(now)

    @callback
    def start_timer(self, minutes: int, temperature: float | None = None) -> None:
        """Scalda alla temperatura scelta per `minutes`; con 0 annulla il timer."""
        now = dt_util.now()
        s = self.settings
        if minutes <= 0:
            if self.timer_until is not None:
                self._end_timer(now, "timer")
        else:
            minutes = min(minutes, s.timer_max_hours * 60)
            mode, target, _, _ = self._climate()
            temp = clamp_target(temperature, s) if temperature is not None else timer_target(target, mode, s)
            self.timer_until = now + timedelta(minutes=minutes)
            self.timer_temp = temp
            self._apply_heat(temp, "timer", now)
            if self.away_applied:
                self._start_override(now)
            self._announce(f"Riscaldamento acceso. Temperatura impostata a {format_temp(temp)} gradi per {format_minutes(minutes)}.")
        self._save_soon()
        self._evaluate(now)

    def _cancel_timer_quiet(self) -> None:
        self.timer_until = None
        self.timer_temp = None

    def _end_timer(self, now: datetime, reason: str) -> None:
        """Fine o annullamento del timer: si torna al programma, se attivo e se la casa non è vuota, altrimenti all'antigelo."""
        self._cancel_timer_quiet()
        if self.schedule.enabled and not self.away_applied:
            self._apply_expected(self.schedule.target_at(now), "timer", now)
            self._last_sched_check = now
            self._announce("Timer del riscaldamento terminato: si torna al programma.")
        else:
            self._apply_idle("timer", now)
            self._announce(f"Timer del riscaldamento terminato. Temperatura portata a {format_temp(self.settings.antigelo)} gradi.")
        self._save_soon()

    # ------------------------------------------------------------------ annunci
    def _announce(self, message: str) -> None:
        s = self.settings
        service = s.notify_service.strip()
        if not s.notify_enabled or not service or "." not in service:
            return
        domain, name = service.split(".", 1)
        if not self.hass.services.has_service(domain, name):
            return
        data: dict[str, Any] = {"message": message}
        if s.notify_targets:
            data["target"] = list(s.notify_targets)
        self.hass.async_create_task(self._notify(domain, name, data))

    async def _notify(self, domain: str, name: str, data: dict[str, Any]) -> None:
        try:
            await self.hass.services.async_call(domain, name, data, blocking=True)
        except HomeAssistantError as err:
            _LOGGER.warning("Annuncio %s.%s non riuscito: %s", domain, name, err)

    def _announce_schedule(self, kind: str, temp: float | None) -> None:
        if kind == "set" and temp is not None:
            self._announce(f"Programma: riscaldamento a {format_temp(temp)} gradi.")
        else:
            self._announce(f"Programma terminato: temperatura portata a {format_temp(self.settings.antigelo)} gradi.")

    # ------------------------------------------------------------------ dati per le entità e per la scheda
    @property
    def expected(self) -> float | None:
        """La temperatura che il programma prevede adesso (None = fuori fascia o programma spento)."""
        return self.schedule.target_at(dt_util.now()) if self.schedule.enabled else None

    @property
    def mode(self) -> str:
        now = dt_util.now()
        hvac, target, _cur, _act = self._climate()
        recent = False
        if self.last_action:
            at = _parse_dt(self.last_action.get("quando"))
            recent = at is not None and (now - at).total_seconds() < 60
        return decide_mode(
            self.schedule.enabled, self.timer_until is not None, self.expected, hvac, target, recent, self.settings
        )

    @property
    def next_event(self) -> tuple[str, datetime, float | None] | None:
        """Il prossimo cambio: la fine del timer se c'è, altrimenti quello del programma se attivo."""
        now = dt_util.now()
        if self.timer_until is not None:
            return ("idle", self.timer_until, None)
        return self.schedule.next_event(now) if self.schedule.enabled else None

    def info(self) -> dict[str, Any]:
        hvac, target, current, action = self._climate()
        nxt = self.next_event
        return {
            "entry_id": self.entry.entry_id,
            "title": self.entry.title,
            "mode": self.mode,
            "available": hvac is not None,
            "hvac_mode": hvac,
            "hvac_action": action,
            "target": target,
            "current": current,
            "expected": self.expected,
            "sources": {
                "climate": self.climate_entity,
                "temperature_sensor": self.temp_entity,
                "away_entity": self.away_entity,
                "guests_entity": self.guests_entity,
            },
            "settings": self.settings.to_dict(),
            "schedule": self.schedule.to_dict(),
            "timer_until": self.timer_until.isoformat() if self.timer_until else None,
            "timer_temp": self.timer_temp,
            "next_event": None if nxt is None else {"kind": nxt[0], "time": nxt[1].isoformat(), "temp": nxt[2]},
            "away_applied": self.away_applied,
            "last_action": self.last_action,
        }
