import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { MODE_LABEL, canAdjustTarget, clampStep, fmtTemp, gaugeModel, modeLine, toNumber } from "./card-logic";
import { gaugeSvg } from "./gauge";
import "./schedule-dialog";
import "./timer-dialog";
import "./settings-dialog";
import type { HomeAssistant, TermoInfo, TermoMode } from "./types";

interface CardConfig {
  type: string;
  title?: string;
  entry_id?: string;
  /** senza cornice, per metterla dentro un'altra scheda */
  embedded?: boolean;
}

type DialogTag = "termostato-schedule-dialog" | "termostato-timer-dialog" | "termostato-settings-dialog";

const STEP = 0.5;

/** Scheda del termostato: quadrante, obiettivo, modalità (programma, manuale, timer, spento) e preferenze. */
export class TermostatoCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ type: Boolean, reflect: true }) embedded = false;
  @state() private _config: CardConfig = { type: "custom:termostato-card" };
  @state() private _info: TermoInfo | null = null;
  @state() private _error = "";
  @state() private _now = Date.now();
  @state() private _pending: { value: number; until: number } | null = null;
  private _loadedAt = 0;
  private _loading = false;
  private _tick?: number;
  private _writeTimer?: number;
  private _syncers = new Set<() => void>();

  setConfig(config: CardConfig): void {
    this._config = { ...config };
    this.embedded = config.embedded === true;
    this._info = null;
    this._loadedAt = 0;
  }

  getCardSize(): number {
    return 5;
  }

  static getStubConfig(): CardConfig {
    return { type: "custom:termostato-card" };
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._tick = window.setInterval(() => (this._now = Date.now()), 15000);
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._tick) window.clearInterval(this._tick);
    if (this._writeTimer) window.clearTimeout(this._writeTimer);
  }

  protected willUpdate(): void {
    for (const s of this._syncers) s();
  }

  protected updated(): void {
    if (this.hass && !this._loading && (!this._info || Date.now() - this._loadedAt > 5 * 60000)) void this._loadInfo();
  }

  private async _loadInfo(): Promise<void> {
    this._loading = true;
    try {
      const msg: Record<string, unknown> = { type: "termostato_riscaldamento/info" };
      if (this._config.entry_id) msg.entry_id = this._config.entry_id;
      this._info = await this.hass.callWS<TermoInfo>(msg);
      this._error = "";
    } catch (err) {
      const m = err instanceof Error ? err.message : (err as { message?: string })?.message ?? String(err);
      this._error = `Termostato non configurato o integrazione non caricata (${m}).`;
    } finally {
      this._loadedAt = Date.now();
      this._loading = false;
    }
  }

  private _refreshSoon(): void {
    this._loadedAt = 0;
    void this._loadInfo();
  }

  private async _ws(msg: Record<string, unknown>): Promise<boolean> {
    try {
      await this.hass.callWS({ ...msg, entry_id: this._info?.entry_id });
      this._error = "";
      return true;
    } catch (err) {
      const m = err instanceof Error ? err.message : (err as { message?: string })?.message ?? String(err);
      this._error = `Comando non riuscito: ${m}`;
      return false;
    } finally {
      this._refreshSoon();
    }
  }

  private async _open(tag: DialogTag): Promise<void> {
    if (!this._info) return;
    while (this._loading) await new Promise((r) => setTimeout(r, 50));
    await this._loadInfo();
    if (!this._info) return;
    const el = document.createElement(tag) as HTMLElement & { hass: HomeAssistant; info: TermoInfo };
    el.hass = this.hass;
    el.info = this._info;
    el.addEventListener("saved", () => this._refreshSoon());
    document.body.appendChild(el);
    const sync = () => {
      if (el.isConnected) el.hass = this.hass;
    };
    this._syncers.add(sync);
    el.addEventListener("closed", () => this._syncers.delete(sync));
  }

  // ---- lettura dal vivo: i valori vengono dal termostato stesso (si aggiornano senza ricaricare le info)
  private _live() {
    const info = this._info!;
    const st = this.hass.states[info.sources.climate];
    const a = (st?.attributes ?? {}) as Record<string, unknown>;
    const available = !!st && st.state !== "unavailable" && st.state !== "unknown";
    const mo = info.entities.modo ? this.hass.states[info.entities.modo] : undefined;
    const ma = (mo?.attributes ?? {}) as Record<string, unknown>;
    const modeNow = (["programma", "fuori_programma", "manuale", "timer", "spento"].includes(String(mo?.state)) ? mo!.state : info.mode) as TermoMode;
    let current = toNumber(a.current_temperature);
    const ts = info.sources.temperature_sensor ? toNumber(this.hass.states[info.sources.temperature_sensor]?.state) : null;
    if (ts !== null) current = ts;
    const nextRaw = (ma.prossimo_evento as string | null | undefined) ?? info.next_event?.time ?? null;
    const nextKind = ma.prossima_azione ? (ma.prossima_azione === "riscaldamento" ? "set" : "idle") : info.next_event?.kind ?? "idle";
    const timerRaw = (ma.timer_fino as string | null | undefined) ?? info.timer_until;
    return {
      available,
      mode: modeNow,
      hvac: st?.state ?? info.hvac_mode,
      action: (a.hvac_action as string | undefined) ?? info.hvac_action,
      target: toNumber(a.temperature) ?? info.target,
      current: current ?? info.current,
      next: nextRaw ? { kind: nextKind as "set" | "idle", time: Date.parse(nextRaw), temp: toNumber(ma.prossima_temperatura) ?? info.next_event?.temp ?? null } : null,
      timerUntil: timerRaw ? Date.parse(timerRaw) : null,
      timerTemp: toNumber(ma.temperatura_timer) ?? info.timer_temp,
      away: ma.assenza_attiva === true || (mo === undefined && info.away_applied),
    };
  }

  // ---- obiettivo con + e −: il valore scelto si vede subito, la scrittura parte dopo una breve pausa
  private _bump(dir: 1 | -1, base: number): void {
    const s = this._info!.settings;
    const cur = this._pending && this._pending.until > Date.now() ? this._pending.value : base;
    const value = clampStep(cur + dir * STEP, s.min_target, s.max_target, STEP);
    this._pending = { value, until: Date.now() + 8000 };
    if (this._writeTimer) window.clearTimeout(this._writeTimer);
    this._writeTimer = window.setTimeout(() => {
      const v = this._pending?.value ?? value;
      void this._ws({ type: "termostato_riscaldamento/target", temperature: v });
    }, 600);
  }

  private async _setMode(mode: "programma" | "manuale" | "spento"): Promise<void> {
    if (mode === "programma" && this._info && this._info.schedule.slots.length === 0) {
      void this._open("termostato-schedule-dialog");
      return;
    }
    await this._ws({ type: "termostato_riscaldamento/mode", mode });
  }

  private _modeButton(label: string, icon: string, active: boolean, onClick: () => void, warn = false) {
    return html`<button class=${active ? (warn ? "mb on warn" : "mb on") : "mb"} aria-pressed=${active ? "true" : "false"} @click=${onClick}>
      <ha-icon icon=${icon}></ha-icon><span>${label}</span>
    </button>`;
  }

  render() {
    if (!this.hass) return nothing;
    const title = this._config.title ?? this._info?.title ?? "Termostato";
    if (this._error && !this._info) return this._wrap(html`<div class="pad"><div class="title">${title}</div><div class="errbox">${this._error}</div></div>`);
    if (!this._info) return this._wrap(html`<div class="pad"><div class="title">${title}</div><div class="muted">Carico…</div></div>`);

    const info = this._info;
    const s = info.settings;
    const lv = this._live();
    const pend = this._pending && this._pending.until > this._now ? this._pending.value : null;
    const shownTarget = pend ?? lv.target;
    const g = gaugeModel(lv.current, shownTarget, s);
    const line = modeLine(lv.mode, { target: shownTarget, expected: info.expected, timerUntil: lv.timerUntil, timerTemp: lv.timerTemp, next: lv.next, awayApplied: lv.away, antigelo: s.antigelo }, this._now);
    const heating = lv.action === "heating";
    const pill = !lv.available ? ["Non disponibile", "bad"] : heating ? ["Sta scaldando", "warn"] : lv.mode === "spento" ? ["Antigelo", "idle"] : ["A temperatura", "ok"];
    const isProgram = lv.mode === "programma" || lv.mode === "fuori_programma";
    const canAdjust = canAdjustTarget(lv.mode, lv.available);

    return this._wrap(html`
      <div class="pad">
        <div class="top">
          <div class="title">${title}</div>
          <div class="pill ${pill[1]}"><i></i>${pill[0]}</div>
        </div>

        <div class="cols">
          <div class="left">
            <div class="gauge">
              ${unsafeSVG(gaugeSvg(g))}
              <div class="read"><div class="big">${fmtTemp(lv.current)}<span> °C</span></div></div>
            </div>
          </div>
          <div class="right">
            <div class="stepper" role="group" aria-label="Obiettivo">
              <button class="st" aria-label="Diminuisci l'obiettivo" ?disabled=${!canAdjust} @click=${() => this._bump(-1, shownTarget ?? s.default_target)}>−</button>
              <div class="tv">${fmtTemp(shownTarget ?? s.default_target)}<span> °C</span></div>
              <button class="st" aria-label="Aumenta l'obiettivo" ?disabled=${!canAdjust} @click=${() => this._bump(1, shownTarget ?? s.default_target)}>+</button>
            </div>
            ${lv.available && !canAdjust ? html`<div class="hintline">Spento: scegli Manuale per regolare la temperatura</div>` : nothing}
            <div class="modes" role="group" aria-label="Modalità">
              ${this._modeButton(MODE_LABEL.programma, "mdi:calendar-clock", isProgram, () => void this._setMode("programma"), lv.mode === "fuori_programma")}
              ${this._modeButton(MODE_LABEL.manuale, "mdi:hand-back-right-outline", lv.mode === "manuale", () => void this._setMode("manuale"))}
              ${this._modeButton(MODE_LABEL.timer, "mdi:timer-outline", lv.mode === "timer", () => void this._open("termostato-timer-dialog"))}
              ${this._modeButton(MODE_LABEL.spento, "mdi:snowflake", lv.mode === "spento", () => void this._setMode("spento"))}
            </div>
          </div>
        </div>

        <div class="lrow">
          <div class="line ${line.tone}"><ha-icon icon=${line.icon}></ha-icon><span>${line.text}</span></div>
          <button class="btn icon" aria-label="Modifica il programma settimanale" @click=${() => void this._open("termostato-schedule-dialog")}><ha-icon icon="mdi:calendar-edit"></ha-icon></button>
          <button class="btn icon" aria-label="Preferenze del termostato" @click=${() => void this._open("termostato-settings-dialog")}><ha-icon icon="mdi:cog"></ha-icon></button>
        </div>
        ${this._error ? html`<div class="errbox">${this._error}</div>` : nothing}
      </div>
    `);
  }

  private _wrap(content: unknown) {
    return this.embedded ? html`<div class="embed">${content}</div>` : html`<ha-card>${content}</ha-card>`;
  }

  static styles = css`
    :host { display: block; container-type: inline-size; }
    ha-card { overflow: hidden; }
    .embed { border-radius: 14px; background: var(--secondary-background-color, rgba(127, 127, 127, 0.1)); }
    .pad { padding: 12px 14px 14px; }
    .top { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
    .title { font-size: 1.05rem; font-weight: 600; }
    .muted { color: var(--secondary-text-color, #727272); font-size: 0.82rem; }
    .errbox { margin-top: 8px; padding: 8px 10px; border-radius: 10px; background: rgba(220, 38, 38, 0.12); color: #ef4444; font-size: 0.85rem; }
    .pill { display: inline-flex; align-items: center; gap: 7px; padding: 5px 12px; border-radius: 999px; font-size: 0.82rem; font-weight: 600; background: rgba(127, 127, 127, 0.18); }
    .pill i { width: 9px; height: 9px; border-radius: 50%; background: #9aa1ad; }
    .pill.ok i { background: #22c55e; } .pill.warn i { background: #f59e0b; } .pill.bad i { background: #ef4444; }
    .cols { display: block; }
    .gauge { max-width: 230px; margin: 2px auto 0; color: var(--primary-text-color, #212121); }
    .gauge svg { display: block; width: 100%; height: auto; }
    .read { text-align: center; line-height: 1.1; margin-top: 2px; }
    .big { font-size: 2.1rem; font-weight: 700; }
    .big span, .tv span { font-size: 0.95rem; font-weight: 500; color: var(--secondary-text-color, #727272); }
    .stepper { display: flex; align-items: center; justify-content: center; gap: 18px; margin: 6px 0 10px; }
    .tv { min-width: 96px; text-align: center; font-size: 1.5rem; font-weight: 600; }
    .st { width: 48px; height: 48px; border-radius: 50%; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff); color: inherit; font-size: 1.6rem; line-height: 1; cursor: pointer; }
    .st:disabled { opacity: 0.4; cursor: not-allowed; }
    .hintline { margin: -4px 0 8px; text-align: center; font-size: 0.78rem; color: var(--secondary-text-color, #727272); }
    .modes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .mb { min-height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; padding: 4px 2px; border-radius: 12px; border: 1px solid var(--divider-color, #ccc); background: transparent; color: inherit; font-size: 0.74rem; cursor: pointer; }
    .mb ha-icon { --mdc-icon-size: 20px; }
    .mb.on { background: rgba(96, 165, 250, 0.2); border-color: #60a5fa; font-weight: 600; }
    .mb.on.warn { background: rgba(245, 158, 11, 0.2); border-color: #f59e0b; }
    .lrow { display: flex; align-items: stretch; gap: 6px; margin-top: 10px; }
    .line { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 10px; font-size: 0.85rem; line-height: 1.25; background: rgba(127, 127, 127, 0.1); }
    .line ha-icon { --mdc-icon-size: 18px; flex: none; }
    .line.success { background: rgba(34, 197, 94, 0.14); } .line.warning { background: rgba(245, 158, 11, 0.16); } .line.accent { background: rgba(96, 165, 250, 0.16); }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; min-width: 44px; box-sizing: border-box; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, rgba(127, 127, 127, 0.08)); color: inherit; border-radius: 12px; padding: 4px 10px; font-size: 0.88rem; cursor: pointer; }
    .btn ha-icon { --mdc-icon-size: 20px; }
    /* con spazio in larghezza (colonna di una scheda più grande, tablet): quadrante a sinistra, controlli a destra */
    @container (min-width: 430px) {
      .cols { display: grid; grid-template-columns: minmax(150px, 0.9fr) 1.1fr; gap: 14px; align-items: center; }
      .gauge { max-width: 210px; }
      .big { font-size: 1.8rem; }
      .stepper { margin: 0 0 8px; }
      .modes { grid-template-columns: repeat(2, 1fr); }
      .mb { min-height: 44px; flex-direction: row; gap: 6px; font-size: 0.82rem; }
    }
    /* striscia larga (sotto le altre schede): tre colonne - quadrante | obiettivo e modalita' | stato, calendario e preferenze */
    @container (min-width: 900px) {
      .pad {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr) minmax(0, 1fr);
        grid-template-areas:
          "titolo comandi stato"
          "quadrante comandi riga"
          "errore errore errore";
        gap: 2px 24px;
        align-items: center;
        padding: 6px 14px 8px;
      }
      .top { display: contents; }
      .title { grid-area: titolo; font-size: 0.98rem; }
      .pill { grid-area: stato; justify-self: end; padding: 3px 10px; font-size: 0.78rem; }
      .cols { display: contents; }
      .left { grid-area: quadrante; }
      .right { grid-area: comandi; }
      .lrow { grid-area: riga; margin-top: 0; flex-wrap: wrap; justify-content: flex-end; gap: 4px; }
      .lrow .line { flex: 1 1 100%; padding: 4px 10px; font-size: 0.8rem; }
      .lrow .btn { min-height: 38px; min-width: 38px; padding: 2px 8px; }
      .errbox { grid-area: errore; }
      .modes { grid-template-columns: repeat(4, 1fr); gap: 5px; }
      .mb { min-height: 38px; flex-direction: column; gap: 0; font-size: 0.74rem; }
      .mb ha-icon { --mdc-icon-size: 18px; }
      .gauge { max-width: 140px; margin-top: 0; }
      .big { font-size: 1.3rem; }
      .read { margin-top: 0; }
      .stepper { margin: 0 0 4px; gap: 14px; }
      .st { width: 40px; height: 40px; font-size: 1.4rem; }
      .tv { font-size: 1.3rem; }
      .hintline { margin: 0 0 4px; }
    }
  `;
}

if (!customElements.get("termostato-card")) customElements.define("termostato-card", TermostatoCard);

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "termostato-card",
  name: "Termostato riscaldamento",
  description: "Quadrante, obiettivo, programma settimanale, timer e preferenze del termostato ambiente.",
});

// eslint-disable-next-line no-console
console.info("%c TERMOSTATO-RISCALDAMENTO %c v0.1.4 ", "color: white; background: #b45309; font-weight: 700;", "color: #b45309; background: white; font-weight: 700;");
