import { test } from "node:test";
import assert from "node:assert/strict";
import {
  asState, clampStep, fmt, formatDuration, gaugeModel, niceAxis, parseNumeric, resample, stateAt, stateSegments, summaryLines, toNumber, validateSettings,
} from "../src/card-logic";
import { stoveSvg } from "../src/stove-svg";
import type { StufaSettings } from "../src/types";

const S: StufaSettings = {
  off_below: 5, ignition_above: 250, shutdown_min: 126, shutdown_max: 129, shutdown_needs_switch_off: true,
  confirm_seconds: 10, grace_seconds: 15, restore_delay_seconds: 30, sync_switch_on: true, sync_switch_off: true,
  notify_events: true, notify_sensor_problem: true, notify_service: "", tile_color: "rosso", show_switch_button: true,
};

test("fmt e toNumber", () => {
  assert.equal(fmt(3.456, 1), "3,5");
  assert.equal(fmt(null), "–");
  assert.equal(toNumber("unavailable"), null);
  assert.equal(toNumber("12.5"), 12.5);
  assert.equal(asState("boh"), "non_disponibile");
  assert.equal(asState("accesa"), "accesa");
});

test("formatDuration", () => {
  assert.equal(formatDuration(30000), "30 s");
  assert.equal(formatDuration(5 * 60000), "5 min");
  assert.equal(formatDuration(125 * 60000), "2 h 05 min");
});

test("gaugeModel: zone e segnaposto", () => {
  const g = gaugeModel(125, S);
  assert.equal(g.max, 300);
  assert.equal(g.marker, 41.7);
  assert.equal(g.zones.length, 3);
  assert.equal(g.zones[2].from, 83.3);
  assert.equal(gaugeModel(null, S).marker, null);
  assert.equal(gaugeModel(900, S).marker, 100);
  assert.equal(gaugeModel(0, { ...S, ignition_above: 400 }).max, 500);
});

test("validateSettings", () => {
  assert.deepEqual(validateSettings(S), []);
  assert.equal(validateSettings({ ...S, off_below: 200 }).length > 0, true);
  assert.equal(validateSettings({ ...S, shutdown_min: 130 }).length > 0, true);
  assert.equal(validateSettings({ ...S, shutdown_max: 260 }).length > 0, true);
});

test("clampStep", () => {
  assert.equal(clampStep(5.3, 0, 100, 0.5), 5.5);
  assert.equal(clampStep(-4, 0, 100, 1), 0);
  assert.equal(clampStep(1e6, 0, 100, 1), 100);
});

test("parseNumeric scarta unavailable e ordina", () => {
  const pts = parseNumeric([{ s: "10", lu: 200 }, { s: "unavailable", lu: 150 }, { s: "5", lu: 100 }]);
  assert.deepEqual(pts.map((p) => p.v), [5, 10]);
});

test("stateSegments: stato precedente esteso e tratti uniti", () => {
  const t0 = 1_000_000_000_000;
  const segs = stateSegments(
    [
      { s: "spenta", lu: (t0 - 5000) / 1000 },
      { s: "accensione", lu: (t0 + 10000) / 1000 },
      { s: "accensione", lu: (t0 + 20000) / 1000 },
      { s: "accesa", lu: (t0 + 30000) / 1000 },
    ],
    t0,
    t0 + 60000,
  );
  assert.deepEqual(segs.map((s) => s.state), ["spenta", "accensione", "accesa"]);
  assert.equal(segs[0].from, t0);
  assert.equal(segs[1].to, t0 + 30000);
  assert.equal(segs[2].to, t0 + 60000);
  assert.equal(stateAt(segs, t0 + 15000), "accensione");
  assert.equal(stateAt(segs, t0 + 61000), null);
});

test("resample: media pesata e buchi", () => {
  const out = resample([{ t: 0, v: 10 }, { t: 50, v: 20 }], 0, 100, 2);
  assert.deepEqual(out, [10, 20]);
  const gap = resample([{ t: 0, v: 10 }], 0, 100000000, 2, 1000);
  assert.equal(gap[1], null);
  assert.equal(resample([{ t: 60, v: 5 }], 0, 100, 2)[0], null);
});

test("niceAxis", () => {
  const a = niceAxis(0, 275, 5);
  assert.equal(a.min, 0);
  assert.ok(a.max >= 275);
  assert.ok(a.ticks.length >= 3);
});

test("summaryLines: casi principali", () => {
  const base = { power: 130, sinceMs: 0, switchOn: false, blocked: false, ignitionsToday: 2, hoursToday: 3.5, lastOn: null, lastOff: null, settings: S };
  const on = summaryLines({ ...base, state: "accesa" }, 3600000);
  assert.match(on[0].text, /in funzione da 1 h 00 min/);
  assert.ok(on.some((l) => /Oggi: 2 accensioni, 3,5 ore/.test(l.text)));
  const bad = summaryLines({ ...base, state: "non_disponibile", power: null, switchOn: null, ignitionsToday: null, hoursToday: null }, 1000);
  assert.equal(bad[0].tone, "bad");
  const blocked = summaryLines({ ...base, state: "spenta", blocked: true }, 1000);
  assert.ok(blocked.some((l) => l.tone === "warn"));
  const start = summaryLines({ ...base, state: "accensione", power: 300 }, 1000);
  assert.ok(start.some((l) => /allinea/.test(l.text)));
});

test("summaryLines: l'interruttore della stufa e la presa sono due cose diverse", () => {
  const base = { power: 130, sinceMs: 0, switchOn: true, blocked: false, ignitionsToday: 1, hoursToday: 1, lastOn: null, lastOff: null, settings: S };
  const noPlug = summaryLines({ ...base, state: "accesa" }, 1000);
  assert.ok(noPlug.some((l) => /interruttore della stufa è acceso/.test(l.text)));
  assert.ok(!noPlug.some((l) => /presa/i.test(l.text)));
  const plugOn = summaryLines({ ...base, state: "accesa", plugOn: true }, 1000);
  assert.ok(plugOn.some((l) => l.text === "La presa è accesa." && l.tone === "info"));
  const plugOff = summaryLines({ ...base, state: "spenta", plugOn: false }, 1000);
  assert.ok(plugOff.some((l) => /presa è spenta/.test(l.text) && l.tone === "warn"));
});

test("stoveSvg: ogni stato produce un SVG valido", () => {
  for (const st of ["spenta", "accensione", "accesa", "spegnimento", "non_disponibile"] as const) {
    for (const tile of ["rosso", "arancio", "avorio", "sconosciuto"]) {
      const s = stoveSvg(st, tile);
      assert.ok(s.startsWith("<svg") && s.endsWith("</svg>"));
    }
  }
  assert.ok(stoveSvg("accesa", "rosso").includes("#ffb21f"));
  assert.ok(!stoveSvg("spenta", "rosso").includes("#ffb21f"));
  assert.ok(stoveSvg("non_disponibile", "rosso").includes(">?<"));
});

test("gaugeModel: etichette vicine non si sovrappongono", () => {
  const g = gaugeModel(0, S);
  assert.ok(!g.ticks.some((t) => t.label === "0"));
  assert.ok(g.ticks.some((t) => t.label === "5"));
  assert.ok(g.ticks.some((t) => t.label === "250"));
});

import { crossesMidnight, dayIntervals, describeDays, modeView, parseHm, scheduleErrors, slotError, whenText } from "../src/card-logic";

test("parseHm e slotError", () => {
  assert.equal(parseHm("07:30"), 450);
  assert.equal(parseHm("24:00"), null);
  assert.equal(parseHm("24:00", true), 1440);
  assert.equal(parseHm("7:61"), null);
  assert.equal(slotError({ days: [], start: "07:00", end: "08:00" }), "Scegli almeno un giorno.");
  assert.equal(slotError({ days: [0], start: "07:00", end: "07:00" }), "Inizio e fine non possono coincidere.");
  assert.equal(slotError({ days: [0], start: "", end: "07:00" }), "Orario non valido.");
  assert.equal(slotError({ days: [0], start: "07:00", end: "08:00" }), null);
  assert.equal(crossesMidnight({ days: [0], start: "22:00", end: "02:00" }), true);
  assert.equal(crossesMidnight({ days: [0], start: "07:00", end: "08:00" }), false);
  assert.equal(scheduleErrors({ enabled: true, slots: [{ days: [0], start: "07:00", end: "07:00" }] }).length, 1);
});

test("dayIntervals: più fasce, unione, notte e fine settimana", () => {
  const iv = dayIntervals([
    { days: [0], start: "06:30", end: "08:30" },
    { days: [0], start: "08:00", end: "10:00" },
    { days: [0], start: "17:00", end: "22:00" },
    { days: [6], start: "22:00", end: "02:00" },
  ]);
  assert.deepEqual(iv[0], [[0, 120], [390, 600], [1020, 1320]]);
  assert.deepEqual(iv[6], [[1320, 1440]]);
});

test("describeDays", () => {
  assert.equal(describeDays([0, 1, 2, 3, 4]), "Lun–Ven");
  assert.equal(describeDays([6, 5]), "Sab–Dom");
  assert.equal(describeDays([0, 1, 2, 3, 4, 5, 6]), "Tutti i giorni");
  assert.equal(describeDays([2, 0]), "Lun Mer");
});

test("whenText: oggi, domani, altro giorno", () => {
  const now = new Date(2026, 9, 14, 20, 0).getTime();
  assert.equal(whenText(new Date(2026, 9, 14, 22, 5).getTime(), now), "oggi alle 22:05");
  assert.equal(whenText(new Date(2026, 9, 15, 6, 30).getTime(), now), "domani alle 06:30");
  assert.equal(whenText(new Date(2026, 9, 17, 7, 0).getTime(), now), "sab 17 alle 07:00");
});

test("modeView: le quattro modalità", () => {
  const now = new Date(2026, 9, 14, 20, 0).getTime();
  const next = { kind: "on" as const, time: new Date(2026, 9, 15, 6, 30).getTime() };
  const p = modeView("programma", true, next, null, now);
  assert.equal(p.label, "Programma attivo");
  assert.match(p.detail, /prossima accensione domani alle 06:30/);
  assert.equal(modeView("manuale", false, null, null, now).detail, "programmazione non attiva");
  const f = modeView("fuori_programma", true, next, null, now);
  assert.equal(f.tone, "warning");
  assert.match(f.detail, /il programma riprende/);
  const t = modeView("timer", false, null, now + 47 * 60000, now);
  assert.equal(t.label, "Timer");
  assert.match(t.detail, /tra 47 min/);
});
