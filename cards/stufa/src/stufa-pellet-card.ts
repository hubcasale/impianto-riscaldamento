import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { STATE_COLOR, STATE_LABEL, STATE_TONE, asState, fmt, formatDuration, gaugeModel, modeView, stateSegments, toNumber, type Seg } from "./card-logic";
import { stoveSvg } from "./stove-svg";
import "./info-dialog";
import "./charts-dialog";
import "./settings-dialog";
import "./schedule-dialog";
import "./timer-dialog";
import type { HomeAssistant, RawState, StufaInfo, StufaMode } from "./types";

const TIMELINE_MS = 24 * 3600000;

interface CardConfig {
  type: string;
  title?: string;
  entry_id?: string;
  /** versione compatta (per stare accanto ad altre schede della stessa altezza): riquadri in una riga, immagine piu' piccola, pulsanti piu' stretti */
  compact?: boolean;
}

/** Scheda della stufa a pellet: illustrazione, stato, barra della potenza con le soglie, riquadri, cronologia 24 ore e pulsanti. */
export class StufaPelletCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config: CardConfig = { type: "custom:stufa-pellet-card" };
  @state() private _info: StufaInfo | null = null;
  @state() private _error = "";
  @state() private _segs: Seg[] = [];
  @state() private _now = Date.now();
  private _loadedAt = 0;
  private _timelineAt = 0;
  private _loading = false;
  private _tick?: number;

  setConfig(config: CardConfig): void {
    this._config = { ...config };
    this.toggleAttribute("compact", config.compact === true);
    this._info = null;
    this._loadedAt = 0;
  }

  getCardSize(): number {
    return 6;
  }

  static getStubConfig(): CardConfig {
    return { type: "custom:stufa-pellet-card" };
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._tick = window.setInterval(() => (this._now = Date.now()), 15000);
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._tick) window.clearInterval(this._tick);
  }

  protected updated(): void {
    if (this.hass && !this._loading && (!this._info || Date.now() - this._loadedAt > 5 * 60000)) void this._loadInfo();
    if (this._info && Date.now() - this._timelineAt > 5 * 60000) void this._loadTimeline();
  }

  private async _loadInfo(): Promise<void> {
    this._loading = true;
    try {
      const msg: Record<string, unknown> = { type: "stufa_pellet/info" };
      if (this._config.entry_id) msg.entry_id = this._config.entry_id;
      this._info = await this.hass.callWS<StufaInfo>(msg);
      this._error = "";
    } catch (err) {
      const m = err instanceof Error ? err.message : (err as { message?: string })?.message ?? String(err);
      this._error = `Stufa non configurata o integrazione non caricata (${m}).`;
    } finally {
      this._loadedAt = Date.now();
      this._loading = false;
    }
  }

  private async _loadTimeline(): Promise<void> {
    const id = this._info?.entities.stato;
    if (!id) return;
    this._timelineAt = Date.now();
    const t1 = Date.now();
    const t0 = t1 - TIMELINE_MS;
    try {
      const res = await this.hass.callWS<Record<string, RawState[]>>({
        type: "history/history_during_period",
        start_time: new Date(t0).toISOString(),
        end_time: new Date(t1).toISOString(),
        entity_ids: [id],
        include_start_time_state: true,
        significant_changes_only: false,
        minimal_response: true,
        no_attributes: true,
      });
      this._segs = stateSegments(res[id], t0, t1);
    } catch {
      this._timelineAt = 0;
    }
  }

  private async _open(tag: "stufa-info-dialog" | "stufa-charts-dialog" | "stufa-settings-dialog" | "stufa-schedule-dialog" | "stufa-timer-dialog"): Promise<void> {
    if (!this._info) return;
    if (tag === "stufa-schedule-dialog" || tag === "stufa-timer-dialog" || tag === "stufa-settings-dialog") {
      while (this._loading) await new Promise((r) => setTimeout(r, 50));
      await this._loadInfo();
      if (!this._info) return;
    }
    const el = document.createElement(tag) as HTMLElement & { hass: HomeAssistant; info: StufaInfo };
    el.hass = this.hass;
    el.info = this._info;
    el.addEventListener("saved", () => {
      this._loadedAt = 0;
      this._timelineAt = 0;
      void this._loadInfo();
    });
    document.body.appendChild(el);
    const sync = () => {
      if (el.isConnected) el.hass = this.hass;
    };
    this._syncers.add(sync);
    el.addEventListener("closed", () => this._syncers.delete(sync));
  }
  private _syncers = new Set<() => void>();

  protected willUpdate(): void {
    for (const s of this._syncers) s();
  }

  private _toggleSwitch(): void {
    const sw = this._info?.sources.switch;
    if (!sw) return;
    void this.hass.callService("homeassistant", "toggle", { entity_id: sw });
  }

  private _live() {
    const info = this._info!;
    const ent = info.entities;
    const st = ent.stato ? this.hass.states[ent.stato] : undefined;
    const a = (st?.attributes ?? {}) as Record<string, unknown>;
    const state = asState(st?.state ?? info.state);
    const power = toNumber(a.potenza) ?? toNumber(this.hass.states[info.sources.power_sensor]?.state);
    const sinceRaw = (a.da as string | null) ?? info.since;
    const swState = info.sources.switch ? this.hass.states[info.sources.switch]?.state : undefined;
    const plugState = info.sources.plug ? this.hass.states[info.sources.plug]?.state : undefined;
    const num = (k: string) => (ent[k] ? toNumber(this.hass.states[ent[k]]?.state) : null);
    const mo = ent.modo ? this.hass.states[ent.modo] : undefined;
    const ma = (mo?.attributes ?? {}) as Record<string, unknown>;
    const mode = (["programma", "manuale", "fuori_programma", "timer"].includes(String(mo?.state)) ? mo!.state : info.mode) as StufaMode;
    const nextRaw = (ma.prossimo_evento as string | null | undefined) ?? info.next_event?.time ?? null;
    const nextKind = ma.prossima_azione ? (ma.prossima_azione === "accensione" ? "on" : "off") : info.next_event?.kind ?? "off";
    const timerRaw = (ma.timer_fino as string | null | undefined) ?? info.timer_until;
    return {
      mode,
      scheduleEnabled: ma.programmazione_attiva === true || (mo === undefined && info.schedule.enabled),
      next: nextRaw ? { kind: nextKind as "on" | "off", time: Date.parse(nextRaw) } : null,
      timerUntil: timerRaw ? Date.parse(timerRaw) : null,
      state,
      power,
      sinceMs: sinceRaw ? Date.parse(sinceRaw) : null,
      switchOn: swState === "on" ? true : swState === "off" ? false : null,
      plugOn: plugState === "on" ? true : plugState === "off" ? false : null,
      blocked: a.azioni_bloccate === true,
      ignitions: num("accensioni_oggi"),
      hours: num("ore_in_funzione_oggi"),
      energy: num("energia_oggi"),
    };
  }

  private _tile(icon: string, label: string, value: string, sub = "") {
    return html`<div class="tile"><ha-icon icon=${icon}></ha-icon><div class="v">${value}</div><div class="l">${label}</div>${sub ? html`<div class="s">${sub}</div>` : nothing}</div>`;
  }

  render() {
    if (!this.hass) return nothing;
    const title = this._config.title ?? this._info?.title ?? "Stufa a pellet";
    if (this._error && !this._info)
      return html`<ha-card><div class="pad"><div class="title">${title}</div><div class="errbox">${this._error}</div></div></ha-card>`;
    if (!this._info) return html`<ha-card><div class="pad"><div class="title">${title}</div><div class="muted">Carico…</div></div></ha-card>`;

    const info = this._info;
    const s = info.settings;
    const lv = this._live();
    const gauge = gaugeModel(lv.power, s);
    const tone = STATE_TONE[lv.state];
    const since = lv.sinceMs !== null ? formatDuration(this._now - lv.sinceMs) : "";
    const t0 = this._now - TIMELINE_MS;
    const pct = (t: number) => Math.min(100, Math.max(0, ((t - t0) / TIMELINE_MS) * 100));

    const compact = this._config.compact === true;
    return html`
      <ha-card class=${compact ? "compact-host" : ""}>
        <div class=${compact ? "pad compact" : "pad"}>
          <div class="top">
            <div class="title">${title}</div>
            <div class="pill ${tone}"><i></i>${STATE_LABEL[lv.state]}${since && lv.state !== "non_disponibile" ? html`<span class="since"> · da ${since}</span>` : nothing}</div>
          </div>

          ${info.sources.switch
            ? (() => {
                const mv = modeView(lv.mode, lv.scheduleEnabled, lv.next, lv.timerUntil, this._now);
                return html`<div class="mode ${mv.tone}"><ha-icon icon=${mv.icon}></ha-icon><span class="ml">${mv.label}</span>${mv.detail ? html`<span class="md">· ${mv.detail}</span>` : nothing}</div>`;
              })()
            : nothing}

          <div class="main">
            <div class="stove">${unsafeSVG(stoveSvg(lv.state, s.tile_color))}</div>
            <div class="side">
              <div class="power">
                <div class="big">${fmt(lv.power, lv.power !== null && lv.power % 1 ? 1 : 0)}<span> W</span></div>
                <div class="muted">potenza della presa</div>
              </div>
              <div class="gauge" aria-label="Potenza e soglie">
                <div class="bar">
                  ${gauge.zones.map((z) => html`<div class="zone" style="left:${z.from}%;width:${Math.max(0.8, z.to - z.from)}%;background:${z.color}" title=${z.label}></div>`)}
                  ${gauge.marker !== null ? html`<div class="mark" style="left:${gauge.marker}%"></div>` : nothing}
                </div>
                <div class="ticks">${gauge.ticks.map((t) => html`<span style="left:${t.at}%">${t.label}</span>`)}</div>
              </div>
              <div class="tiles">
                ${this._tile("mdi:fire-circle", compact ? "Accensioni" : "Accensioni oggi", lv.ignitions !== null ? fmt(lv.ignitions) : "–")}
                ${this._tile("mdi:clock-outline", compact ? "In funzione" : "In funzione oggi", lv.hours !== null ? `${fmt(lv.hours, 1)} h` : "–")}
                ${info.sources.switch ? this._tile("mdi:toggle-switch", "Interruttore", lv.switchOn === null ? "–" : lv.switchOn ? "Acceso" : "Spento", lv.blocked ? "azioni bloccate" : "") : nothing}
                ${info.sources.plug ? this._tile(lv.plugOn === false ? "mdi:power-plug-off" : "mdi:power-plug", "Presa", lv.plugOn === null ? "–" : lv.plugOn ? "Accesa" : "Spenta") : nothing}
                ${lv.energy !== null ? this._tile("mdi:lightning-bolt", compact ? "Energia" : "Energia oggi", `${fmt(lv.energy, 2)} kWh`) : nothing}
              </div>
            </div>
          </div>

          <div class="tl">
            <div class="tlh"><span>Ultime 24 ore</span><span class="muted">${this._segs.length === 0 ? "nessun dato" : ""}</span></div>
            <div class="tlbar">
              ${this._segs.map((g) => html`<div class="seg" title=${STATE_LABEL[g.state]} style="left:${pct(g.from)}%;width:${Math.max(0.3, pct(g.to) - pct(g.from))}%;background:${STATE_COLOR[g.state] === "transparent" ? "#9aa1ad" : STATE_COLOR[g.state]}"></div>`)}
            </div>
            <div class="tlt"><span>24 h fa</span><span>12 h fa</span><span>ora</span></div>
          </div>

          <div class="actions">
            <button class="btn" @click=${() => void this._open("stufa-info-dialog")}><ha-icon icon="mdi:information-outline"></ha-icon>Stato</button>
            <button class="btn" @click=${() => void this._open("stufa-charts-dialog")}><ha-icon icon="mdi:chart-line"></ha-icon>Grafici</button>
            ${info.sources.switch
              ? html`<button class="btn" @click=${() => void this._open("stufa-schedule-dialog")}><ha-icon icon="mdi:calendar-clock"></ha-icon>Programma</button>
                <button class="btn" @click=${() => void this._open("stufa-timer-dialog")}><ha-icon icon="mdi:timer-outline"></ha-icon>Timer</button>`
              : nothing}
            ${s.show_switch_button && info.sources.switch
              ? html`<button class=${lv.switchOn ? "btn plug on" : "btn plug"} title="Tocca per accendere o spegnere la stufa" @click=${() => this._toggleSwitch()} aria-pressed=${lv.switchOn ? "true" : "false"}><ha-icon icon="mdi:power"></ha-icon>${compact ? (lv.switchOn ? "Acceso" : "Spento") : lv.switchOn ? "Interruttore acceso" : "Interruttore spento"}</button>`
              : nothing}
            <span class="grow"></span>
            <button class="btn icon" aria-label="Preferenze" @click=${() => void this._open("stufa-settings-dialog")}><ha-icon icon="mdi:cog"></ha-icon></button>
          </div>
        </div>
      </ha-card>
    `;
  }

  static styles = css`
    :host { display: block; }
    ha-card { overflow: hidden; }
    .pad { padding: 14px 16px 16px; }
    .top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
    .title { font-size: 1.15rem; font-weight: 600; }
    .muted { color: var(--secondary-text-color, #727272); font-size: 0.8rem; }
    .errbox { margin-top: 8px; padding: 10px; border-radius: 10px; background: rgba(220, 38, 38, 0.1); color: #b91c1c; font-size: 0.9rem; }
    .pill { display: inline-flex; align-items: center; gap: 7px; padding: 5px 12px; border-radius: 999px; font-size: 0.85rem; font-weight: 600; background: var(--secondary-background-color, #eee); }
    .pill i { width: 9px; height: 9px; border-radius: 50%; background: #9aa1ad; }
    .pill .since { font-weight: 400; opacity: 0.8; }
    .pill.success { background: rgba(22, 163, 74, 0.16); color: #166534; } .pill.success i { background: #16a34a; }
    .pill.warning { background: rgba(245, 158, 11, 0.2); color: #92400e; } .pill.warning i { background: #f59e0b; }
    .pill.accent { background: rgba(96, 165, 250, 0.2); color: #1e40af; } .pill.accent i { background: #60a5fa; }
    .pill.danger { background: rgba(220, 38, 38, 0.14); color: #b91c1c; } .pill.danger i { background: #dc2626; }
    .mode { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; padding: 8px 12px; margin-bottom: 12px; border-radius: 12px; font-size: 0.88rem; background: var(--secondary-background-color, #f2f2f2); }
    .mode ha-icon { --mdc-icon-size: 18px; }
    .mode .ml { font-weight: 600; }
    .mode .md { color: var(--secondary-text-color, #727272); }
    .mode.success { background: rgba(22, 163, 74, 0.13); } .mode.success ha-icon, .mode.success .ml { color: #166534; }
    .mode.warning { background: rgba(245, 158, 11, 0.16); } .mode.warning ha-icon, .mode.warning .ml { color: #92400e; }
    .mode.accent { background: rgba(96, 165, 250, 0.16); } .mode.accent ha-icon, .mode.accent .ml { color: #1e40af; }
    .main { display: flex; gap: 16px; align-items: stretch; }
    .stove { flex: 0 0 34%; max-width: 190px; min-width: 110px; }
    .stove svg { width: 100%; height: auto; display: block; }
    .side { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; justify-content: center; }
    .big { font-size: 2.4rem; font-weight: 700; line-height: 1; }
    .big span { font-size: 1rem; font-weight: 500; color: var(--secondary-text-color, #727272); }
    .gauge { position: relative; padding-bottom: 18px; }
    .bar { position: relative; height: 12px; border-radius: 6px; background: var(--secondary-background-color, #e6e6e6); overflow: hidden; }
    .zone { position: absolute; top: 0; bottom: 0; opacity: 0.55; }
    .mark { position: absolute; top: -2px; bottom: -2px; width: 4px; margin-left: -2px; border-radius: 2px; background: var(--primary-text-color, #212121); }
    .ticks { position: absolute; left: 0; right: 0; top: 16px; height: 14px; }
    .ticks span { position: absolute; transform: translateX(-50%); font-size: 0.66rem; color: var(--secondary-text-color, #727272); white-space: nowrap; }
    .ticks span:first-child { transform: none; }
    .ticks span:last-child { transform: translateX(-100%); }
    .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(92px, 1fr)); gap: 8px; }
    .tile { padding: 8px 10px; border-radius: 12px; background: var(--secondary-background-color, #f2f2f2); }
    .tile ha-icon { --mdc-icon-size: 18px; color: var(--secondary-text-color, #727272); }
    .tile .v { font-size: 1.05rem; font-weight: 600; margin-top: 2px; }
    .tile .l { font-size: 0.72rem; color: var(--secondary-text-color, #727272); }
    .tile .s { font-size: 0.68rem; color: #b45309; margin-top: 2px; }
    .tl { margin-top: 14px; }
    .tlh { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px; }
    .tlbar { position: relative; height: 16px; border-radius: 6px; background: var(--secondary-background-color, #e6e6e6); overflow: hidden; }
    .seg { position: absolute; top: 0; bottom: 0; opacity: 0.9; }
    .tlt { display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--secondary-text-color, #727272); margin-top: 3px; }
    .actions { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; align-items: center; }
    .grow { flex: 1; }
    .btn { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--divider-color, #ccc); background: var(--secondary-background-color, #f4f4f4); color: inherit; border-radius: 12px; padding: 8px 14px; font-size: 0.88rem; cursor: pointer; }
    .btn ha-icon { --mdc-icon-size: 18px; }
    .btn.plug.on { background: rgba(22, 163, 74, 0.16); border-color: #16a34a; color: #166534; }
    .btn.icon { padding: 8px 10px; }
    /* versione compatta: stessa informazione in poco piu' di meta' altezza */
    /* se la scheda ha un'altezza imposta (accanto a schede piu' alte) le sezioni si distribuiscono su tutta l'altezza */
    :host([compact]) { height: 100%; }
    ha-card.compact-host { height: 100%; }
    .pad.compact { padding: 10px 14px 12px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
    .compact .top { margin-bottom: 4px; }
    .compact .title { font-size: 1.1rem; }
    .compact .pill { padding: 4px 12px; font-size: 0.84rem; }
    .compact .mode { padding: 6px 12px; margin-bottom: 6px; font-size: 0.88rem; }
    .compact .main { gap: 10px; }
    .compact .stove { flex: 0 0 26%; max-width: 124px; min-width: 84px; align-self: center; }
    .compact .side { gap: 8px; }
    .compact .big { font-size: 2.3rem; }
    .compact .muted { font-size: 0.78rem; }
    .compact .gauge { padding-bottom: 16px; }
    .compact .tiles { grid-template-columns: repeat(3, 1fr); gap: 6px; }
    .compact .tile { padding: 5px 6px; border-radius: 10px; min-width: 0; }
    .compact .tile ha-icon { display: none; }
    .compact .tile .v { font-size: 1.05rem; margin-top: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .compact .tile .l { font-size: 0.68rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .compact .tile .s { display: none; }
    .compact .tl { margin-top: 8px; }
    .compact .tlh { font-size: 0.86rem; }
    .compact .tlbar { height: 16px; }
    .compact .actions { margin-top: 8px; gap: 8px; }
    .compact .btn { padding: 8px 12px; font-size: 0.88rem; border-radius: 12px; }
    .compact .btn ha-icon { --mdc-icon-size: 18px; }
    @media (max-width: 420px) {
      .main { flex-direction: column; align-items: center; }
      .stove { flex: none; width: 52%; }
      .side { width: 100%; }
    }
  `;
}

if (!customElements.get("stufa-pellet-card")) customElements.define("stufa-pellet-card", StufaPelletCard);

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "stufa-pellet-card",
  name: "Stufa a pellet",
  description: "Stato della stufa, potenza con le soglie, cronologia, grafici e preferenze.",
});

// eslint-disable-next-line no-console
console.info("%c STUFA-PELLET-MONITOR %c v0.3.3 ", "color: white; background: #8b2a22; font-weight: 700;", "color: #8b2a22; background: white; font-weight: 700;");
