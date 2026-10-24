import { test } from "node:test";
import assert from "node:assert/strict";
import { canAdjustTarget, clampStep, crossesMidnight, dayIntervals, defaultSlot, describeDays, fmtTemp, formatDuration, gaugeModel, modeLine, scheduleErrors, slotError, tempColor, toNumber, validateSettings, whenText } from "../src/card-logic";
import { gaugeSvg } from "../src/gauge";
import { HELP } from "../src/help";
import type { SlotData, TermoSettings } from "../src/types";

const S: TermoSettings = { antigelo: 5, min_target: 10, max_target: 23, default_target: 20.5, timer_max_hours: 6, frost_keep_heat: true, away_setback: true, away_minutes: 30, notify_enabled: true, notify_service: "", notify_targets: [] };

test("fmtTemp e toNumber", () => {
  assert.equal(fmtTemp(20.5), "20,5");
  assert.equal(fmtTemp(21), "21");
  assert.equal(fmtTemp(null), "–");
  assert.equal(toNumber("20,5"), 20.5);
  assert.equal(toNumber("unknown"), null);
  assert.equal(toNumber(true), null);
});

test("clampStep porta sul passo e nei limiti", () => {
  assert.equal(clampStep(20.3, 10, 23, 0.5), 20.5);
  assert.equal(clampStep(30, 10, 23, 0.5), 23);
  assert.equal(clampStep(2, 10, 23, 0.5), 10);
});

test("gaugeModel: fasce attorno all'obiettivo, grigio all'antigelo", () => {
  const g = gaugeModel(19.4, 20.5, S);
  assert.equal(g.arcs.length, 3);
  assert.ok(g.needle! > 0 && g.needle! < g.mark!);
  const flat = gaugeModel(19.4, 5, S);
  assert.equal(flat.idle, true);
  assert.equal(flat.arcs.length, 1);
  assert.equal(flat.mark, null);
  assert.equal(gaugeModel(null, 20, S).needle, null);
  assert.equal(gaugeModel(40, 20, S).needle, 1);        // fuori scala: l'ago si ferma in fondo
});

test("gaugeSvg: SVG valido con ago e segno", () => {
  const svg = gaugeSvg(gaugeModel(19.4, 20.5, S));
  assert.ok(svg.startsWith("<svg") && svg.endsWith("</svg>"));
  assert.ok(svg.includes("<line"));
  assert.ok(!gaugeSvg(gaugeModel(null, null, S)).includes("<line"));
});

test("modeLine: una frase per modalità", () => {
  const now = Date.parse("2026-10-19T08:00:00");
  const base = { target: 20.5, expected: 20.5, timerUntil: null, timerTemp: null, next: { kind: "set" as const, time: Date.parse("2026-10-19T17:00:00"), temp: 21 }, awayApplied: false, antigelo: 5 };
  assert.match(modeLine("programma", base, now).text, /oggi alle 17:00 a 21 °C/);
  assert.equal(modeLine("fuori_programma", base, now).tone, "warning");
  assert.match(modeLine("manuale", base, now).text, /mantiene 20,5/);
  assert.match(modeLine("spento", base, now).text, /antigelo a 5/);
  const t = modeLine("timer", { ...base, timerUntil: now + 72 * 60000, timerTemp: 21.5 }, now);
  assert.match(t.text, /21,5 °C fino a oggi alle 09:12 \(tra 1 h 12 min\)/);
  assert.match(modeLine("programma", { ...base, awayApplied: true }, now).text, /Casa vuota/);
  assert.match(modeLine("programma", { ...base, next: { kind: "idle", time: now + 3600000, temp: null } }, now).text, /antigelo 5/);
});

test("slotError e scheduleErrors", () => {
  const ok: SlotData = { days: [0], start: "07:00", end: "09:00", temp: 21 };
  assert.equal(slotError(ok), null);
  assert.match(slotError({ ...ok, days: [] })!, /giorno/);
  assert.match(slotError({ ...ok, end: "07:00" })!, /coincidere/);
  assert.match(slotError({ ...ok, start: "25:00" })!, /non valido/);
  assert.match(slotError({ ...ok, temp: 40 })!, /tra 5 e 35/);
  assert.equal(scheduleErrors({ enabled: true, slots: [ok, { ...ok, temp: 2 }] }).length, 1);
  assert.equal(crossesMidnight({ ...ok, start: "22:00", end: "02:00" }), true);
  assert.equal(defaultSlot(21).temp, 21);
});

test("dayIntervals: stessa logica del server (la temperatura più alta vince, fasce unite)", () => {
  const d = dayIntervals([
    { days: [1], start: "08:00", end: "12:00", temp: 19 },
    { days: [1], start: "10:00", end: "14:00", temp: 22 },
  ]);
  assert.deepEqual(d[1], [{ from: 480, to: 600, temp: 19 }, { from: 600, to: 840, temp: 22 }]);
  const wrap = dayIntervals([{ days: [6], start: "22:00", end: "02:00", temp: 20 }]);
  assert.deepEqual(wrap[6], [{ from: 1320, to: 1440, temp: 20 }]);
  assert.deepEqual(wrap[0], [{ from: 0, to: 120, temp: 20 }]);
  assert.deepEqual(dayIntervals([])[3], []);
});

test("describeDays, whenText, formatDuration, tempColor", () => {
  assert.equal(describeDays([0, 1, 2, 3, 4]), "Lun–Ven");
  assert.equal(describeDays([6, 5]), "Sab–Dom");
  assert.equal(describeDays([0, 1, 2, 3, 4, 5, 6]), "Tutti i giorni");
  const now = Date.parse("2026-10-19T08:00:00");
  assert.equal(whenText(Date.parse("2026-10-20T07:00:00"), now), "domani alle 07:00");
  assert.equal(formatDuration(95 * 60000), "1 h 35 min");
  assert.notEqual(tempColor(16), tempColor(23));
});

test("validateSettings", () => {
  assert.deepEqual(validateSettings(S), []);
  assert.match(validateSettings({ ...S, antigelo: 12, min_target: 10 })[0], /antigelo/);
  assert.match(validateSettings({ ...S, min_target: 23, max_target: 20 })[0], /minimo/);
  assert.match(validateSettings({ ...S, default_target: 30 })[0], /predefinito/);
  assert.match(validateSettings({ ...S, notify_service: "alexa" })[0], /notify/);
});

test("ogni preferenza ha la sua spiegazione completa", () => {
  const ids = ["block_temperature", "antigelo", "min_target", "max_target", "default_target", "frost_keep_heat", "block_timer", "timer_max_hours", "block_away", "away_setback", "away_minutes", "block_notify", "notify_enabled", "notify_service", "notify_targets", "block_links", "climate", "temperature_sensor", "away_entity", "guests_entity"];
  for (const id of ids) {
    const h = HELP[id];
    assert.ok(h, id);
    assert.ok(h.title.length > 2 && h.what.length > 20 && h.when.length > 10, id);
  }
});

test("obiettivo: da Spento il + e il − sono disattivati, negli altri modi no", () => {
  assert.equal(canAdjustTarget("spento", true), false);
  assert.equal(canAdjustTarget("manuale", true), true);
  assert.equal(canAdjustTarget("programma", true), true);
  assert.equal(canAdjustTarget("fuori_programma", true), true);
  assert.equal(canAdjustTarget("timer", true), true);
  assert.equal(canAdjustTarget("manuale", false), false);
});
