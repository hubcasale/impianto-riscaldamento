// Logica pura della scheda: etichette, soglie, tratti dello stato, frasi, assi e campionamento dei grafici.
// Nessuna dipendenza da Lit o da Home Assistant: si prova con node:test.
import type { RawState, ScheduleData, SlotData, StufaMode, StufaSettings, StufaState } from "./types";

export const STATES: StufaState[] = ["spenta", "accensione", "accesa", "spegnimento", "non_disponibile"];

export const STATE_LABEL: Record<StufaState, string> = {
  spenta: "Spenta",
  accensione: "Accensione",
  accesa: "In funzione",
  spegnimento: "Spegnimento",
  non_disponibile: "Non disponibile",
};

export type Tone = "neutral" | "warning" | "success" | "accent" | "danger";
export const STATE_TONE: Record<StufaState, Tone> = {
  spenta: "neutral",
  accensione: "warning",
  accesa: "success",
  spegnimento: "accent",
  non_disponibile: "danger",
};

export const STATE_COLOR: Record<StufaState, string> = {
  spenta: "#6b7280",
  accensione: "#f59e0b",
  accesa: "#ef4444",
  spegnimento: "#60a5fa",
  non_disponibile: "transparent",
};

export const TILE_COLORS: Record<string, [string, string]> = {
  rosso: ["#8b2a22", "#b53b2f"],
  arancio: ["#d9822b", "#f0a24a"],
  avorio: ["#d8cdb4", "#efe6d0"],
};

export function asState(v: unknown): StufaState {
  return (STATES as string[]).includes(String(v)) ? (v as StufaState) : "non_disponibile";
}

export function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "" || v === "unknown" || v === "unavailable") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function fmt(n: number | null | undefined, decimals = 0): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "–";
  return n.toFixed(decimals).replace(".", ",");
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  if (total < 60) return `${total} s`;
  const minutes = Math.floor(total / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} min`;
}

// ---- barra della potenza
export interface GaugeModel {
  max: number;
  marker: number | null;
  zones: { from: number; to: number; color: string; label: string }[];
  ticks: { at: number; label: string }[];
}

/** Barra 0..max W con le tre zone delle soglie e la posizione attuale (in percentuale). */
export function gaugeModel(power: number | null, s: StufaSettings): GaugeModel {
  const max = Math.max(300, Math.ceil((s.ignition_above * 1.2) / 50) * 50);
  const pct = (w: number) => Math.round(Math.min(Math.max(w / max, 0), 1) * 1000) / 10;
  const zones = [
    { from: 0, to: pct(s.off_below), color: STATE_COLOR.spenta, label: "spenta" },
    { from: pct(s.shutdown_min), to: pct(s.shutdown_max), color: STATE_COLOR.spegnimento, label: "spegnimento" },
    { from: pct(s.ignition_above), to: 100, color: STATE_COLOR.accensione, label: "accensione" },
  ];
  const ticks = [
    { at: 0, label: "0" },
    { at: pct(s.off_below), label: fmt(s.off_below, s.off_below % 1 ? 1 : 0) },
    { at: pct((s.shutdown_min + s.shutdown_max) / 2), label: `${fmt(s.shutdown_min, s.shutdown_min % 1 ? 1 : 0)}-${fmt(s.shutdown_max, s.shutdown_max % 1 ? 1 : 0)}` },
    { at: pct(s.ignition_above), label: fmt(s.ignition_above) },
    { at: 100, label: `${max} W` },
  ];
  // etichette troppo vicine si sovrappongono: si tiene la più significativa (la seconda)
  const spaced = ticks.filter((tk, i) => i === 0 ? ticks[1].at - tk.at >= 8 : i === ticks.length - 1 ? tk.at - ticks[i - 1].at >= 8 : true);
  return { max, marker: power === null ? null : pct(power), zones, ticks: spaced };
}

// ---- storico
function toMs(v: number | string | undefined): number | null {
  if (v === undefined || v === null) return null;
  if (typeof v === "number") return v < 1e11 ? v * 1000 : v;
  const d = Date.parse(v);
  return Number.isNaN(d) ? null : d;
}
function rawTime(r: RawState): number | null {
  return toMs(r.lu ?? r.last_updated ?? r.lc ?? r.last_changed);
}

export interface Pt {
  t: number;
  v: number;
}
export interface Seg {
  from: number;
  to: number;
  state: StufaState;
}

export function parseNumeric(raw: RawState[] | undefined): Pt[] {
  const out: Pt[] = [];
  for (const r of raw ?? []) {
    const t = rawTime(r);
    const s = r.s ?? r.state;
    if (t === null || s === undefined || s === "" || s === "unavailable" || s === "unknown") continue;
    const v = Number(s);
    if (Number.isFinite(v)) out.push({ t, v });
  }
  return out.sort((a, b) => a.t - b.t);
}

/** Tratti dello stato nel periodo [t0, t1]: lo stato precedente al periodo si estende dall'inizio, i tratti uguali si uniscono. */
export function stateSegments(raw: RawState[] | undefined, t0: number, t1: number): Seg[] {
  const pts: { t: number; s: StufaState }[] = [];
  for (const r of raw ?? []) {
    const t = rawTime(r);
    const s = r.s ?? r.state;
    if (t !== null && s !== undefined) pts.push({ t, s: asState(s) });
  }
  pts.sort((a, b) => a.t - b.t);
  let cur: StufaState | null = null;
  for (const p of pts) {
    if (p.t <= t0) cur = p.s;
    else break;
  }
  const out: Seg[] = [];
  let from = t0;
  for (const p of pts) {
    if (p.t <= t0 || p.t >= t1) continue;
    if (cur !== null) out.push({ from, to: p.t, state: cur });
    from = p.t;
    cur = p.s;
  }
  if (cur !== null && from < t1) out.push({ from, to: t1, state: cur });
  const merged: Seg[] = [];
  for (const s of out) {
    const last = merged[merged.length - 1];
    if (last && last.state === s.state && last.to === s.from) last.to = s.to;
    else merged.push({ ...s });
  }
  return merged;
}

export function stateAt(segs: Seg[], t: number): StufaState | null {
  for (const s of segs) if (t >= s.from && t < s.to) return s.state;
  return null;
}

/** `n` valori fra t0 e t1: media pesata nel tempo del valore tenuto fino alla lettura successiva (null prima della prima lettura). */
export function resample(pts: Pt[], t0: number, t1: number, n: number, maxGap = 3 * 3600 * 1000): (number | null)[] {
  const out: (number | null)[] = new Array(n).fill(null);
  if (n <= 0 || t1 <= t0) return out;
  const dt = (t1 - t0) / n;
  let idx = 0;
  let curV: number | null = null;
  let curT = 0;
  for (let i = 0; i < n; i++) {
    const a = t0 + i * dt;
    const b = a + dt;
    while (idx < pts.length && pts[idx].t <= a) {
      curV = pts[idx].v;
      curT = pts[idx].t;
      idx++;
    }
    let sum = 0;
    let cov = 0;
    let segStart = a;
    let v = curV;
    let vT = curT;
    const add = (end: number) => {
      if (v === null) return;
      const len = Math.min(end, vT + maxGap) - segStart;
      if (len > 0) {
        sum += v * len;
        cov += len;
      }
    };
    let k = idx;
    while (k < pts.length && pts[k].t < b) {
      add(pts[k].t);
      segStart = pts[k].t;
      v = pts[k].v;
      vT = pts[k].t;
      k++;
    }
    add(b);
    out[i] = cov > 0 ? sum / cov : null;
  }
  return out;
}

export interface Axis {
  min: number;
  max: number;
  ticks: number[];
}

function niceStep(raw: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}

export function niceAxis(min: number, max: number, count = 5): Axis {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1, ticks: [0, 1] };
  if (max - min < 1e-9) {
    min -= 1;
    max += 1;
  }
  const step = niceStep((max - min) / Math.max(1, count - 1));
  const lo = Math.floor(min / step + 1e-9) * step;
  const hi = Math.ceil(max / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step * 1e-6; v += step) ticks.push(Math.round(v / step) * step);
  return { min: lo, max: hi, ticks };
}

const DAYS = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
const MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export function timeTicks(t0: number, t1: number, maxTicks = 6): { t: number; label: string; major: boolean }[] {
  const hours = (t1 - t0) / 3600000;
  const stepH = [1, 2, 3, 6, 12, 24, 48].find((s) => hours / s <= maxTicks) ?? 48;
  const first = new Date(t0);
  first.setMinutes(0, 0, 0);
  if (stepH >= 24) first.setHours(0);
  else first.setHours(Math.ceil(first.getHours() / stepH) * stepH);
  const out: { t: number; label: string; major: boolean }[] = [];
  for (let t = first.getTime(); t <= t1; t += stepH * 3600000) {
    if (t < t0) continue;
    const d = new Date(t);
    const major = d.getHours() === 0;
    out.push({ t, major, label: hours > 30 ? (major ? `${DAYS[d.getDay()]} ${d.getDate()}` : hhmm(d)) : hhmm(d) });
  }
  return out;
}

export function formatMoment(t: number): string {
  const d = new Date(t);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}, ${hhmm(d)}`;
}

export function linePath(values: (number | null)[], xOf: (i: number) => number, yOf: (v: number) => number): string {
  let d = "";
  let pen = false;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v === null) {
      pen = false;
      continue;
    }
    d += `${pen ? "L" : "M"}${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}`;
    pen = true;
  }
  return d;
}

// ---- frasi della finestra "Stato"
export interface SummaryInput {
  state: StufaState;
  power: number | null;
  sinceMs: number | null;
  /** interruttore che accende e spegne la stufa */
  switchOn: boolean | null;
  /** interruttore della presa che alimenta la stufa (solo stato); non presente se non configurato */
  plugOn?: boolean | null;
  blocked: boolean;
  ignitionsToday: number | null;
  hoursToday: number | null;
  lastOn: string | null;
  lastOff: string | null;
  settings: StufaSettings;
}
export interface SummaryLine {
  icon: string;
  text: string;
  tone: "ok" | "info" | "warn" | "bad";
}

export function summaryLines(i: SummaryInput, nowMs: number): SummaryLine[] {
  const s = i.settings;
  const w = i.power !== null ? `${fmt(i.power, i.power % 1 ? 1 : 0)} W` : "–";
  const dur = i.sinceMs !== null ? formatDuration(nowMs - i.sinceMs) : null;
  const lines: SummaryLine[] = [];
  switch (i.state) {
    case "accesa":
      lines.push({ icon: "mdi:fire", text: `Stufa in funzione${dur ? ` da ${dur}` : ""}, potenza ${w}.`, tone: "ok" });
      break;
    case "accensione":
      lines.push({ icon: "mdi:fire-circle", text: `Accensione in corso: l'accenditore assorbe ${w}, oltre la soglia di ${fmt(s.ignition_above)} W.`, tone: "info" });
      break;
    case "spegnimento":
      lines.push({ icon: "mdi:fan", text: `Spegnimento in corso: la ventola raffredda (${w}, fascia ${fmt(s.shutdown_min, 1)}-${fmt(s.shutdown_max, 1)} W).`, tone: "info" });
      break;
    case "spenta":
      lines.push({ icon: "mdi:fire-off", text: `Stufa spenta${dur ? ` da ${dur}` : ""}, potenza ${w} (sotto ${fmt(s.off_below, s.off_below % 1 ? 1 : 0)} W).`, tone: "info" });
      break;
    default:
      lines.push({ icon: "mdi:lan-disconnect", text: "Il sensore di potenza non risponde: non so in che stato sia la stufa.", tone: "bad" });
  }
  if (i.blocked) {
    lines.push({
      icon: "mdi:shield-lock",
      text: `Azioni automatiche sull'interruttore bloccate: riprendono ${s.restore_delay_seconds} secondi dopo il ritorno del sensore.`,
      tone: "warn",
    });
  }
  if (i.switchOn !== null) {
    lines.push({ icon: "mdi:toggle-switch", text: `L'interruttore della stufa è ${i.switchOn ? "acceso" : "spento"}.`, tone: "info" });
    if (i.switchOn && i.state === "spenta" && !i.blocked)
      lines.push({ icon: "mdi:timer-sand", text: `Interruttore acceso con la stufa spenta: si spegne dopo il periodo di grazia (${s.grace_seconds} s).`, tone: "info" });
    if (!i.switchOn && i.state === "accensione")
      lines.push({ icon: "mdi:sync", text: "La stufa è partita da sola: l'interruttore si accende per restare allineato.", tone: "info" });
  }
  if (i.plugOn === false)
    lines.push({ icon: "mdi:power-plug-off", text: "La presa è spenta: la stufa non è alimentata.", tone: "warn" });
  else if (i.plugOn === true) lines.push({ icon: "mdi:power-plug", text: "La presa è accesa.", tone: "info" });
  if (i.ignitionsToday !== null && i.hoursToday !== null) {
    lines.push({
      icon: "mdi:calendar-today",
      text: `Oggi: ${i.ignitionsToday} ${i.ignitionsToday === 1 ? "accensione" : "accensioni"}, ${fmt(i.hoursToday, 1)} ore in funzione.`,
      tone: "info",
    });
  }
  return lines;
}

// ---- preferenze
export interface NumberField {
  key: "off_below" | "shutdown_min" | "shutdown_max" | "ignition_above" | "confirm_seconds" | "grace_seconds" | "restore_delay_seconds";
  label: string;
  hint: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

export const THRESHOLD_FIELDS: NumberField[] = [
  { key: "off_below", label: "Spenta sotto", hint: "Sotto questa potenza la stufa è spenta (consumo a riposo).", unit: "W", min: 0, max: 100, step: 0.5 },
  { key: "shutdown_min", label: "Spegnimento da", hint: "Inizio della fascia di potenza della ventola in raffreddamento.", unit: "W", min: 1, max: 400, step: 0.5 },
  { key: "shutdown_max", label: "Spegnimento fino a", hint: "Fine della fascia di spegnimento.", unit: "W", min: 1, max: 400, step: 0.5 },
  { key: "ignition_above", label: "Accensione sopra", hint: "Oltre questa potenza l'accenditore è acceso: la stufa si sta accendendo.", unit: "W", min: 20, max: 2000, step: 5 },
];

export const BEHAVIOUR_FIELDS: NumberField[] = [
  { key: "confirm_seconds", label: "Conferma del cambio di stato", hint: "Un nuovo stato deve durare tanti secondi prima di essere accettato (filtra i picchi).", unit: "s", min: 0, max: 600, step: 1 },
  { key: "grace_seconds", label: "Periodo di grazia dell'interruttore", hint: "Dopo aver acceso l'interruttore della stufa si aspetta tanti secondi prima di spegnerlo se la stufa risulta spenta.", unit: "s", min: 0, max: 600, step: 1 },
  { key: "restore_delay_seconds", label: "Ripresa dopo guasto del sensore", hint: "Dopo il ritorno del sensore le azioni sull'interruttore restano bloccate per tanti secondi.", unit: "s", min: 0, max: 900, step: 1 },
];

/** Errori che impediscono di salvare le soglie (lista vuota = valide). */
export function validateSettings(s: StufaSettings): string[] {
  const errs: string[] = [];
  if (!(s.off_below < s.shutdown_min)) errs.push("La soglia di spenta deve essere minore dell'inizio della fascia di spegnimento.");
  if (s.shutdown_min > s.shutdown_max) errs.push("L'inizio della fascia di spegnimento non può superare la fine.");
  if (!(s.shutdown_max < s.ignition_above)) errs.push("La fascia di spegnimento deve stare sotto la soglia di accensione.");
  return errs;
}

export function clampStep(v: number, min: number, max: number, step: number): number {
  const c = Math.min(max, Math.max(min, v));
  const decimals = (String(step).split(".")[1] ?? "").length;
  return Number((Math.round(c / step) * step).toFixed(decimals));
}

// ---- programmazione settimanale e timer
export const DAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
export const DAY_INITIALS = ["L", "M", "M", "G", "V", "S", "D"];
export const TIMER_PRESETS = [30, 60, 120, 180, 240, 360];

export function parseHm(v: string, allow24 = false): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m || Number(m[2]) > 59) return null;
  const n = Number(m[1]) * 60 + Number(m[2]);
  return n >= 0 && n <= (allow24 ? 1440 : 1439) ? n : null;
}

export function fmtHm(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Errore di una fascia (testo) oppure null se è valida. */
export function slotError(s: SlotData): string | null {
  if (s.days.length === 0) return "Scegli almeno un giorno.";
  const a = parseHm(s.start);
  const b = parseHm(s.end, true);
  if (a === null || b === null) return "Orario non valido.";
  if (a === b) return "Inizio e fine non possono coincidere.";
  return null;
}

export function crossesMidnight(s: SlotData): boolean {
  const a = parseHm(s.start);
  const b = parseHm(s.end, true);
  return a !== null && b !== null && b <= a;
}

/** Intervalli accesi per ogni giorno (lunedì..domenica) in minuti, già uniti: stessa logica del server. */
export function dayIntervals(slots: SlotData[]): [number, number][][] {
  const week = 7 * 1440;
  const mask = new Uint8Array(week);
  for (const s of slots) {
    const a = parseHm(s.start);
    const b = parseHm(s.end, true);
    if (a === null || b === null || a === b) continue;
    const len = b > a ? b - a : 1440 - a + b;
    for (const d of s.days) {
      if (d < 0 || d > 6) continue;
      for (let i = 0; i < len; i++) mask[(d * 1440 + a + i) % week] = 1;
    }
  }
  const out: [number, number][][] = [];
  for (let d = 0; d < 7; d++) {
    const segs: [number, number][] = [];
    let start: number | null = null;
    for (let i = 0; i < 1440; i++) {
      const on = mask[d * 1440 + i] === 1;
      if (on && start === null) start = i;
      else if (!on && start !== null) {
        segs.push([start, i]);
        start = null;
      }
    }
    if (start !== null) segs.push([start, 1440]);
    out.push(segs);
  }
  return out;
}

export function describeDays(days: number[]): string {
  const d = [...new Set(days)].sort((a, b) => a - b);
  if (d.length === 7) return "Tutti i giorni";
  if (d.length === 5 && d.join() === "0,1,2,3,4") return "Lun–Ven";
  if (d.length === 2 && d.join() === "5,6") return "Sab–Dom";
  return d.map((x) => DAY_LABELS[x]).join(" ");
}

/** "oggi alle 17:00", "domani alle 07:00", "sab 24 alle 07:00". */
export function whenText(t: number, now: number): string {
  const d = new Date(t);
  const n = new Date(now);
  const midnight = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((midnight(d) - midnight(n)) / 86400000);
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const names = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
  if (days === 0) return `oggi alle ${hm}`;
  if (days === 1) return `domani alle ${hm}`;
  return `${names[d.getDay()]} ${d.getDate()} alle ${hm}`;
}

export interface ModeView {
  label: string;
  tone: Tone;
  icon: string;
  detail: string;
}

export function modeView(mode: StufaMode, scheduleEnabled: boolean, next: { kind: "on" | "off"; time: number } | null, timerUntil: number | null, now: number): ModeView {
  const nextText = next ? `${next.kind === "on" ? "prossima accensione" : "spegnimento"} ${whenText(next.time, now)}` : "";
  switch (mode) {
    case "timer":
      return {
        label: "Timer",
        tone: "accent",
        icon: "mdi:timer-outline",
        detail: timerUntil !== null ? `si spegne ${whenText(timerUntil, now)} (tra ${formatDuration(timerUntil - now)})` : "",
      };
    case "programma":
      return { label: "Programma attivo", tone: "success", icon: "mdi:calendar-check", detail: nextText };
    case "fuori_programma":
      return {
        label: "Manuale, fuori programma",
        tone: "warning",
        icon: "mdi:hand-back-right",
        detail: nextText ? `il programma riprende: ${nextText}` : "",
      };
    default:
      return {
        label: "Manuale",
        tone: "neutral",
        icon: "mdi:hand-back-right-outline",
        detail: scheduleEnabled ? "" : "programmazione non attiva",
      };
  }
}

export function emptySchedule(): ScheduleData {
  return { enabled: false, slots: [] };
}

export function defaultSlot(): SlotData {
  return { days: [0, 1, 2, 3, 4], start: "07:00", end: "09:00" };
}

export function scheduleErrors(sch: ScheduleData): string[] {
  const errs: string[] = [];
  sch.slots.forEach((s, i) => {
    const e = slotError(s);
    if (e) errs.push(`Fascia ${i + 1}: ${e}`);
  });
  return errs;
}
