// Logica pura della scheda del termostato: nessuna dipendenza da Lit o da Home Assistant, si prova con node:test.
import type { ScheduleData, SlotData, TermoMode, TermoSettings } from "./types";

export const MODE_LABEL: Record<TermoMode, string> = {
  programma: "Programma",
  fuori_programma: "Fuori programma",
  manuale: "Manuale",
  timer: "Timer",
  spento: "Spento",
};

export function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "" || typeof v === "boolean") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** "20,5" (una cifra decimale solo se serve), "–" se manca. */
export function fmtTemp(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "–";
  const r = Math.round(n * 10) / 10;
  return r.toLocaleString("it-IT", { minimumFractionDigits: Number.isInteger(r) ? 0 : 1, maximumFractionDigits: 1 });
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return `${h} h ${String(m).padStart(2, "0")} min`;
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

/**
 * Il + e il − cambiano l'obiettivo e accendono il termostato: da Spento non si può, bisogna scegliere prima Manuale
 * (che riporta l'obiettivo predefinito).
 */
export function canAdjustTarget(mode: TermoMode, available: boolean): boolean {
  return available && mode !== "spento";
}

export function clampStep(v: number, min: number, max: number, step: number): number {
  const c = Math.min(max, Math.max(min, v));
  const decimals = (String(step).split(".")[1] ?? "").length;
  return Number((Math.round(c / step) * step).toFixed(decimals));
}

// ---- il quadrante (gauge)
export interface GaugeArc {
  from: number;   // 0..1 sulla scala
  to: number;
  color: string;
}
export interface GaugeModel {
  min: number;
  max: number;
  arcs: GaugeArc[];
  /** posizione dell'ago (temperatura ambiente) e del segno dell'obiettivo, 0..1; null se manca il dato */
  needle: number | null;
  mark: number | null;
  idle: boolean;
}

export const GAUGE_MIN = 10;
export const GAUGE_MAX = 28;
export const COLD = "#3b82f6";
export const OK = "#22c55e";
export const WARM = "#f59e0b";
export const NEUTRAL = "#9ca3af";

export function gaugeModel(current: number | null, target: number | null, s: Pick<TermoSettings, "antigelo">): GaugeModel {
  const pos = (v: number) => Math.min(1, Math.max(0, (v - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)));
  const idle = target === null || target <= s.antigelo + 0.01;
  const arcs: GaugeArc[] = [];
  if (idle) arcs.push({ from: 0, to: 1, color: NEUTRAL });
  else {
    const lo = pos(target - 1);
    const hi = pos(target + 1);
    if (lo > 0) arcs.push({ from: 0, to: lo, color: COLD });
    arcs.push({ from: lo, to: hi, color: OK });
    if (hi < 1) arcs.push({ from: hi, to: 1, color: WARM });
  }
  return { min: GAUGE_MIN, max: GAUGE_MAX, arcs, needle: current === null ? null : pos(current), mark: idle || target === null ? null : pos(target), idle };
}

// ---- modalità e frasi
export interface ModeLine {
  icon: string;
  text: string;
  tone: "neutral" | "success" | "warning" | "accent";
}

export function modeLine(
  mode: TermoMode,
  info: { target: number | null; expected: number | null; timerUntil: number | null; timerTemp: number | null; next: { kind: "set" | "idle"; time: number; temp: number | null } | null; awayApplied: boolean; antigelo: number },
  now: number,
): ModeLine {
  const nextText = info.next
    ? info.next.kind === "set"
      ? `${whenText(info.next.time, now)} a ${fmtTemp(info.next.temp)} °C`
      : `${whenText(info.next.time, now)} antigelo ${fmtTemp(info.antigelo)} °C`
    : "";
  if (info.awayApplied && mode !== "timer")
    return { icon: "mdi:home-off", text: `Casa vuota: antigelo ${fmtTemp(info.antigelo)} °C. Puoi comunque scaldare a mano.`, tone: "accent" };
  switch (mode) {
    case "timer":
      return {
        icon: "mdi:timer-outline",
        text: `Timer: ${fmtTemp(info.timerTemp ?? info.target)} °C${info.timerUntil !== null ? ` fino a ${whenText(info.timerUntil, now)} (tra ${formatDuration(info.timerUntil - now)})` : ""}`,
        tone: "accent",
      };
    case "programma":
      return { icon: "mdi:calendar-check", text: nextText ? `Prossimo cambio: ${nextText}` : "Programma attivo, senza altri cambi nella settimana", tone: "success" };
    case "fuori_programma":
      return { icon: "mdi:hand-back-right", text: `Cambiato a mano${nextText ? `: il programma riprende ${nextText}` : ""}`, tone: "warning" };
    case "manuale":
      return { icon: "mdi:hand-back-right-outline", text: `Manuale: mantiene ${fmtTemp(info.target)} °C finché non lo cambi`, tone: "neutral" };
    default:
      return { icon: "mdi:snowflake-thermometer", text: `Spento: resta l'antigelo a ${fmtTemp(info.antigelo)} °C`, tone: "neutral" };
  }
}

// ---- programma settimanale e timer
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
  if (!Number.isFinite(s.temp) || s.temp < 5 || s.temp > 35) return "La temperatura deve stare tra 5 e 35 °C.";
  return null;
}

export function crossesMidnight(s: SlotData): boolean {
  const a = parseHm(s.start);
  const b = parseHm(s.end, true);
  return a !== null && b !== null && b <= a;
}

export interface DaySegment {
  from: number;
  to: number;
  temp: number;
}

/** Intervalli con temperatura per ogni giorno (lunedì..domenica), già uniti: stessa logica del server (vale la più alta). */
export function dayIntervals(slots: SlotData[]): DaySegment[][] {
  const week = 7 * 1440;
  const mask: (number | null)[] = new Array(week).fill(null);
  for (const s of slots) {
    const a = parseHm(s.start);
    const b = parseHm(s.end, true);
    if (a === null || b === null || a === b) continue;
    const len = b > a ? b - a : 1440 - a + b;
    for (const d of s.days) {
      if (d < 0 || d > 6) continue;
      for (let i = 0; i < len; i++) {
        const k = (d * 1440 + a + i) % week;
        const cur = mask[k];
        if (cur === null || s.temp > cur) mask[k] = s.temp;
      }
    }
  }
  const out: DaySegment[][] = [];
  for (let d = 0; d < 7; d++) {
    const segs: DaySegment[] = [];
    let start = 0;
    let cur: number | null = null;
    for (let i = 0; i <= 1440; i++) {
      const val = i < 1440 ? mask[d * 1440 + i] : null;
      if (val !== cur) {
        if (cur !== null) segs.push({ from: start, to: i, temp: cur });
        start = i;
        cur = val;
      }
    }
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

export function emptySchedule(): ScheduleData {
  return { enabled: false, slots: [] };
}

export function defaultSlot(temp = 20.5): SlotData {
  return { days: [0, 1, 2, 3, 4], start: "07:00", end: "09:00", temp };
}

export function scheduleErrors(sch: ScheduleData): string[] {
  const errs: string[] = [];
  sch.slots.forEach((s, i) => {
    const e = slotError(s);
    if (e) errs.push(`Fascia ${i + 1}: ${e}`);
  });
  if (sch.slots.length > 30) errs.push("Al massimo 30 fasce.");
  return errs;
}

/** Colore di una fascia dalla temperatura: più caldo, più acceso (scala da 15 a 24 °C). */
export function tempColor(temp: number): string {
  const t = Math.min(1, Math.max(0, (temp - 15) / 9));
  const hue = 45 - t * 40;             // dall'arancio chiaro al rosso
  return `hsl(${hue.toFixed(0)} 85% ${(58 - t * 8).toFixed(0)}%)`;
}

// ---- preferenze
export function validateSettings(s: TermoSettings): string[] {
  const errs: string[] = [];
  if (!(s.antigelo < s.min_target)) errs.push("L'antigelo deve stare sotto l'obiettivo minimo.");
  if (!(s.min_target < s.max_target)) errs.push("L'obiettivo minimo deve stare sotto il massimo.");
  if (s.default_target < s.min_target || s.default_target > s.max_target) errs.push("L'obiettivo predefinito deve stare tra minimo e massimo.");
  if (s.notify_enabled && s.notify_service.trim() !== "" && !s.notify_service.includes(".")) errs.push("Il servizio di annuncio va scritto come notify.nome.");
  return errs;
}
