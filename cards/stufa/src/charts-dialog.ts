import { LitElement, html, css, svg, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { dialogStyles } from "./dialog-style";
import {
  STATE_COLOR, STATE_LABEL, formatMoment, fmt, linePath, niceAxis, parseNumeric, resample, stateAt, stateSegments, timeTicks,
  type Pt, type Seg,
} from "./card-logic";
import type { HomeAssistant, RawState, StufaInfo } from "./types";

const RANGES = [
  { id: "6h", label: "6 ore", ms: 6 * 3600000 },
  { id: "24h", label: "24 ore", ms: 24 * 3600000 },
  { id: "3d", label: "3 giorni", ms: 3 * 86400000 },
  { id: "7d", label: "7 giorni", ms: 7 * 86400000 },
];
const PLOT_H = 220;
const MT = 10;
const ML = 40;
const LABELS_H = 22;
const STRIP_H = 12;

/** Finestra "Grafici": potenza della presa con le soglie e, sotto, le fasce dello stato (dal recorder di Home Assistant). */
export class StufaChartsDialog extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) info!: StufaInfo;
  @state() private _range = "24h";
  @state() private _loading = false;
  @state() private _error = "";
  @state() private _w = 640;
  @state() private _hover: number | null = null;
  @state() private _values: (number | null)[] = [];
  @state() private _segs: Seg[] = [];
  private _t0 = 0;
  private _t1 = 0;
  private _n = 240;
  private _raw: Pt[] = [];
  private _rawStates: RawState[] = [];
  private _ro?: ResizeObserver;
  private _timer?: number;
  private _seq = 0;
  private _onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") this._close();
  };

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("keydown", this._onKey);
    this._timer = window.setInterval(() => void this._load(), 60000);
    void this._load();
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this._onKey);
    this._ro?.disconnect();
    if (this._timer) window.clearInterval(this._timer);
  }
  protected firstUpdated(): void {
    const wrap = this.renderRoot.querySelector(".chartwrap");
    if (!wrap) return;
    this._ro = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0]?.contentRect.width ?? 640);
      if (w > 100 && Math.abs(w - this._w) > 2) {
        this._w = w;
        this._recompute();
      }
    });
    this._ro.observe(wrap);
  }
  private _close(): void {
    this.dispatchEvent(new CustomEvent("closed"));
    this.remove();
  }

  private async _history(ids: string[], start: number, end: number): Promise<Record<string, RawState[]>> {
    return this.hass.callWS<Record<string, RawState[]>>({
      type: "history/history_during_period",
      start_time: new Date(start).toISOString(),
      end_time: new Date(end).toISOString(),
      entity_ids: ids,
      include_start_time_state: true,
      significant_changes_only: false,
      minimal_response: true,
      no_attributes: true,
    });
  }

  private async _load(): Promise<void> {
    if (!this.hass || !this.info) return;
    const seq = ++this._seq;
    const range = RANGES.find((r) => r.id === this._range) ?? RANGES[1];
    const t1 = Date.now();
    const t0 = t1 - range.ms;
    const ids = [this.info.sources.power_sensor];
    if (this.info.entities.stato) ids.push(this.info.entities.stato);
    this._loading = true;
    try {
      const res = await this._history(ids, t0, t1);
      if (seq !== this._seq) return;
      this._t0 = t0;
      this._t1 = t1;
      this._raw = parseNumeric(res[this.info.sources.power_sensor]);
      this._rawStates = this.info.entities.stato ? res[this.info.entities.stato] ?? [] : [];
      this._error = "";
      this._recompute();
    } catch (err) {
      if (seq === this._seq) this._error = `Impossibile leggere lo storico: ${err instanceof Error ? err.message : String(err)}`;
    } finally {
      if (seq === this._seq) this._loading = false;
    }
  }

  private _recompute(): void {
    if (!this._t1) return;
    this._n = Math.max(60, Math.min(480, Math.floor((this._w - ML - 8) / 2)));
        this._values = resample(this._raw, this._t0, this._t1, this._n, 30 * 60000);
    this._segs = stateSegments(this._rawStates, this._t0, this._t1);
  }

  private _setRange(id: string): void {
    this._range = id;
    this._hover = null;
    void this._load();
  }

  private _move(ev: PointerEvent): void {
    const svgEl = ev.currentTarget as SVGSVGElement;
    const box = svgEl.getBoundingClientRect();
    const x = ev.clientX - box.left;
    const i = Math.round(((x - ML) / (this._w - ML - 8)) * (this._n - 1));
    this._hover = i >= 0 && i < this._n ? i : null;
  }

  render() {
    if (!this.info) return nothing;
    const s = this.info.settings;
    const vals = this._values.filter((v): v is number => v !== null);
    const top = Math.max(s.ignition_above * 1.1, ...(vals.length ? vals : [0]));
    const ax = niceAxis(0, top, 5);
    const W = this._w;
    const pw = W - ML - 8;
    const H = MT + PLOT_H + STRIP_H + LABELS_H + 6;
    const xOf = (i: number) => ML + (this._n <= 1 ? 0 : (i / (this._n - 1)) * pw);
    const yOf = (v: number) => MT + PLOT_H - ((v - ax.min) / (ax.max - ax.min || 1)) * PLOT_H;
    const tx = (t: number) => ML + ((t - this._t0) / (this._t1 - this._t0 || 1)) * pw;
    const thresholds = [
      { v: s.off_below, c: STATE_COLOR.spenta, l: "spenta" },
      { v: s.shutdown_min, c: STATE_COLOR.spegnimento, l: "spegnimento" },
      { v: s.shutdown_max, c: STATE_COLOR.spegnimento, l: "" },
      { v: s.ignition_above, c: STATE_COLOR.accensione, l: "accensione" },
    ];
    const hover = this._hover;
    const hoverT = hover !== null && this._n > 1 ? this._t0 + (hover / (this._n - 1)) * (this._t1 - this._t0) : null;
    const hoverV = hover !== null ? this._values[hover] : null;
    const hoverS = hoverT !== null ? stateAt(this._segs, hoverT) : null;
    return html`
      <div class="backdrop" @click=${(e: Event) => e.target === e.currentTarget && this._close()}>
        <div class="panel wide" role="dialog" aria-modal="true" aria-label="Grafici stufa">
          <div class="head">
            <div class="title">Grafici della stufa</div>
            <button class="x" aria-label="Chiudi" @click=${() => this._close()}>✕</button>
          </div>
          <div class="body">
            <div class="ranges">
              ${RANGES.map((r) => html`<button class=${r.id === this._range ? "chip on" : "chip"} @click=${() => this._setRange(r.id)}>${r.label}</button>`)}
              ${this._loading ? html`<span class="load">aggiorno…</span>` : nothing}
            </div>
            <div class="chartwrap">
              <div class="tip">
                ${hoverT !== null
                  ? html`<b>${formatMoment(hoverT)}</b> · ${hoverV !== null ? `${fmt(hoverV, 0)} W` : "nessun dato"}${hoverS ? html` · <span style="color:${STATE_COLOR[hoverS] === "transparent" ? "inherit" : STATE_COLOR[hoverS]}">${STATE_LABEL[hoverS]}</span>` : nothing}`
                  : html`<span class="muted">Passa sopra il grafico per leggere i valori</span>`}
              </div>
              <svg width=${W} height=${H} viewBox="0 0 ${W} ${H}" @pointermove=${(e: PointerEvent) => this._move(e)} @pointerleave=${() => (this._hover = null)}>
                ${ax.ticks.map((t) => svg`
                  <line x1=${ML} x2=${W - 8} y1=${yOf(t)} y2=${yOf(t)} stroke="var(--divider-color,#ddd)" stroke-width="1" />
                  <text x=${ML - 6} y=${yOf(t) + 4} text-anchor="end" class="ax">${fmt(t)}</text>`)}
                ${thresholds.map((t) => svg`<line x1=${ML} x2=${W - 8} y1=${yOf(t.v)} y2=${yOf(t.v)} stroke=${t.c} stroke-width="1.2" stroke-dasharray="5 4" opacity="0.9" />
                  ${t.l ? svg`<text x=${W - 10} y=${yOf(t.v) - 3} text-anchor="end" class="th" fill=${t.c}>${t.l} ${fmt(t.v, t.v % 1 ? 1 : 0)} W</text>` : nothing}`)}
                <path d=${linePath(this._values, xOf, yOf)} fill="none" stroke="var(--primary-color,#03a9f4)" stroke-width="1.8" stroke-linejoin="round" />
                ${hover !== null && hoverV !== null ? svg`<line x1=${xOf(hover)} x2=${xOf(hover)} y1=${MT} y2=${MT + PLOT_H} stroke="var(--secondary-text-color,#888)" stroke-width="1" /><circle cx=${xOf(hover)} cy=${yOf(hoverV)} r="4" fill="var(--primary-color,#03a9f4)" />` : nothing}
                ${this._segs.map((g) => svg`<rect x=${tx(g.from)} y=${MT + PLOT_H + 4} width=${Math.max(1, tx(g.to) - tx(g.from))} height=${STRIP_H} fill=${STATE_COLOR[g.state] === "transparent" ? "#9aa1ad" : STATE_COLOR[g.state]} opacity=${g.state === "non_disponibile" ? 0.35 : 0.9} />`)}
                ${timeTicks(this._t0, this._t1).map((t) => svg`
                  <line x1=${tx(t.t)} x2=${tx(t.t)} y1=${MT + PLOT_H + STRIP_H + 4} y2=${MT + PLOT_H + STRIP_H + 8} stroke="var(--secondary-text-color,#888)" />
                  <text x=${tx(t.t)} y=${H - 4} text-anchor="middle" class=${t.major ? "ax maj" : "ax"}>${t.label}</text>`)}
              </svg>
              <div class="legend">
                ${(["spenta", "accensione", "accesa", "spegnimento"] as const).map((k) => html`<span><i style="background:${STATE_COLOR[k]}"></i>${STATE_LABEL[k]}</span>`)}
              </div>
            </div>
            ${this._error ? html`<div class="err">${this._error}</div>` : nothing}
            ${!this._loading && !this._error && vals.length === 0 ? html`<div class="empty">Nessun dato di potenza nel periodo.</div>` : nothing}
          </div>
        </div>
      </div>
    `;
  }

  static styles = [
    dialogStyles,
    css`
      .ranges { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-bottom: 8px; }
      .chip { border: 1px solid var(--divider-color, #ccc); background: transparent; color: inherit; border-radius: 999px; padding: 5px 12px; font-size: 0.85rem; cursor: pointer; }
      .chip.on { background: var(--primary-color, #03a9f4); color: #fff; border-color: transparent; }
      .load { font-size: 0.8rem; color: var(--secondary-text-color, #727272); }
      .chartwrap { width: 100%; }
      svg { display: block; touch-action: pan-y; }
      .ax { font-size: 10px; fill: var(--secondary-text-color, #727272); }
      .ax.maj { font-weight: 700; }
      .th { font-size: 10px; }
      .tip { min-height: 22px; font-size: 0.88rem; margin-bottom: 4px; }
      .muted { color: var(--secondary-text-color, #727272); }
      .legend { display: flex; gap: 14px; flex-wrap: wrap; font-size: 0.8rem; margin-top: 6px; color: var(--secondary-text-color, #727272); }
      .legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 5px; }
    `,
  ];
}

if (!customElements.get("stufa-charts-dialog")) customElements.define("stufa-charts-dialog", StufaChartsDialog);
