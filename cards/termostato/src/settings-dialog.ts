import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { dialogStyles } from "./dialog-style";
import { clampStep, fmtTemp, validateSettings } from "./card-logic";
import { HELP } from "./help";
import type { HomeAssistant, TermoInfo, TermoSettings } from "./types";

type NumKey = "antigelo" | "min_target" | "max_target" | "default_target" | "timer_max_hours" | "away_minutes";
type BoolKey = "frost_keep_heat" | "away_setback" | "notify_enabled";
type SrcKey = "climate" | "temperature_sensor" | "away_entity" | "guests_entity";

interface NumField { key: NumKey; label: string; unit: string; min: number; max: number; step: number }

const NUMS: Record<NumKey, NumField> = {
  antigelo: { key: "antigelo", label: "Temperatura antigelo", unit: "°C", min: 5, max: 15, step: 0.5 },
  min_target: { key: "min_target", label: "Obiettivo minimo", unit: "°C", min: 5, max: 35, step: 0.5 },
  max_target: { key: "max_target", label: "Obiettivo massimo", unit: "°C", min: 5, max: 35, step: 0.5 },
  default_target: { key: "default_target", label: "Obiettivo predefinito", unit: "°C", min: 5, max: 35, step: 0.5 },
  timer_max_hours: { key: "timer_max_hours", label: "Durata massima del timer", unit: "h", min: 1, max: 24, step: 1 },
  away_minutes: { key: "away_minutes", label: "Minuti di casa vuota prima di abbassare", unit: "min", min: 0, max: 1440, step: 5 },
};

interface Block {
  id: string;
  icon: string;
  title: string;
  helpId: string;
}

const BLOCKS: Block[] = [
  { id: "temperature", icon: "mdi:thermometer", title: "Temperature", helpId: "block_temperature" },
  { id: "timer", icon: "mdi:timer-outline", title: "Timer", helpId: "block_timer" },
  { id: "away", icon: "mdi:home-off", title: "Casa vuota", helpId: "block_away" },
  { id: "notify", icon: "mdi:bullhorn-outline", title: "Annunci vocali", helpId: "block_notify" },
  { id: "links", icon: "mdi:link-variant", title: "Collegamenti", helpId: "block_links" },
];

/** Finestra "Preferenze": blocchi per funzione, ognuno con la sua spiegazione (tocca la "i"). Salva con `termostato_riscaldamento/update`. */
export class TermostatoSettingsDialog extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) info!: TermoInfo;
  @state() private _s!: TermoSettings;
  @state() private _src!: Record<SrcKey, string>;
  @state() private _open: string | null = "temperature";
  @state() private _help: string | null = null;
  @state() private _busy = false;
  @state() private _error = "";
  private _onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    if (this._help) this._help = null;
    else this._close();
  };

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("keydown", this._onKey);
    this._s = { ...this.info.settings, notify_targets: [...this.info.settings.notify_targets] };
    this._src = {
      climate: this.info.sources.climate ?? "",
      temperature_sensor: this.info.sources.temperature_sensor ?? "",
      away_entity: this.info.sources.away_entity ?? "",
      guests_entity: this.info.sources.guests_entity ?? "",
    };
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this._onKey);
  }
  private _close(): void {
    this.dispatchEvent(new CustomEvent("closed"));
    this.remove();
  }

  private _set<K extends keyof TermoSettings>(key: K, value: TermoSettings[K]): void {
    this._s = { ...this._s, [key]: value };
  }

  private _step(f: NumField, dir: 1 | -1): void {
    this._set(f.key, clampStep(this._s[f.key] + dir * f.step, f.min, f.max, f.step));
  }

  private _typed(f: NumField, ev: Event): void {
    const raw = (ev.target as HTMLInputElement).value.replace(",", ".");
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(n)) {
      (ev.target as HTMLInputElement).value = String(this._s[f.key]).replace(".", ",");
      return;
    }
    this._set(f.key, clampStep(n, f.min, f.max, f.step));
  }

  private _toggleTarget(id: string): void {
    const cur = this._s.notify_targets;
    this._set("notify_targets", cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }

  private async _save(): Promise<void> {
    const errs = validateSettings(this._s);
    if (errs.length) {
      this._error = errs[0];
      return;
    }
    if (!this._src.climate) {
      this._error = "Il termostato è obbligatorio.";
      return;
    }
    this._busy = true;
    this._error = "";
    try {
      await this.hass.callWS({ type: "termostato_riscaldamento/update", entry_id: this.info.entry_id, settings: this._s, sources: this._src });
      this.dispatchEvent(new CustomEvent("saved"));
      this._close();
    } catch (err) {
      this._error = `Impossibile salvare: ${err instanceof Error ? err.message : (err as { message?: string })?.message ?? String(err)}`;
    } finally {
      this._busy = false;
    }
  }

  private _helpBtn(id: string) {
    return html`<button class="i" aria-label="Spiegazione: ${HELP[id]?.title ?? id}" @click=${(e: Event) => { e.stopPropagation(); this._help = id; }}>i</button>`;
  }

  private _numRow(key: NumKey) {
    const f = NUMS[key];
    return html`
      <div class="row">
        <div class="t"><span class="lab">${f.label}</span>${this._helpBtn(key)}</div>
        <div class="num">
          <button class="st" aria-label="Diminuisci" @click=${() => this._step(f, -1)}>−</button>
          <input type="text" inputmode="decimal" .value=${String(this._s[key]).replace(".", ",")} aria-label=${f.label} @change=${(e: Event) => this._typed(f, e)} />
          <span class="unit">${f.unit}</span>
          <button class="st" aria-label="Aumenta" @click=${() => this._step(f, 1)}>+</button>
        </div>
      </div>`;
  }

  private _boolRow(key: BoolKey, label: string) {
    const on = this._s[key];
    return html`
      <div class="row">
        <div class="t"><span class="lab">${label}</span>${this._helpBtn(key)}</div>
        <button class=${on ? "sw on" : "sw"} role="switch" aria-checked=${on ? "true" : "false"} aria-label=${label} @click=${() => this._set(key, !on)}><span class="knob"></span></button>
      </div>`;
  }

  private _entityRow(key: SrcKey, label: string, domains: string[], required: boolean) {
    const options = Object.keys(this.hass.states).filter((id) => domains.includes(id.split(".")[0]));
    return html`
      <div class="row col">
        <div class="t"><span class="lab">${label}</span> <span class="opt">${required ? "obbligatorio" : "facoltativo"}</span>${this._helpBtn(key)}</div>
        <input class="txt" list=${`dl-${key}`} .value=${this._src[key]} placeholder=${domains.join(" / ") + ".nome"} @change=${(e: Event) => { this._src = { ...this._src, [key]: (e.target as HTMLInputElement).value.trim() }; }} />
        <datalist id=${`dl-${key}`}>${options.map((o) => html`<option value=${o}></option>`)}</datalist>
        ${this._src[key] && !this.hass.states[this._src[key]] ? html`<div class="warn">Entità non trovata in Home Assistant.</div>` : nothing}
      </div>`;
  }

  private _summary(id: string): string {
    const s = this._s;
    switch (id) {
      case "temperature": return `Antigelo ${fmtTemp(s.antigelo)} °C · da ${fmtTemp(s.min_target)} a ${fmtTemp(s.max_target)} °C`;
      case "timer": return `Al massimo ${s.timer_max_hours} h`;
      case "away": return s.away_setback ? `Abbassa dopo ${s.away_minutes} min` : "Disattivato";
      case "notify": return !s.notify_enabled || !s.notify_service ? "Nessun annuncio" : s.notify_targets.length ? `${s.notify_targets.length} altoparlanti` : s.notify_service;
      default: return "Termostato e sensori";
    }
  }

  private _blockBody(id: string) {
    switch (id) {
      case "temperature":
        return html`${this._numRow("antigelo")}${this._numRow("min_target")}${this._numRow("max_target")}${this._numRow("default_target")}${this._boolRow("frost_keep_heat", "Fuori programma resta acceso all'antigelo")}`;
      case "timer":
        return html`${this._numRow("timer_max_hours")}`;
      case "away":
        return html`${this._boolRow("away_setback", "Abbassa a casa vuota")}${this._numRow("away_minutes")}${!this._src.away_entity ? html`<div class="warn">Indica il sensore «Casa vuota» tra i collegamenti perché funzioni.</div>` : nothing}`;
      case "notify": {
        const players = Object.values(this.hass.states).filter((e) => e.entity_id.startsWith("media_player."));
        return html`
          ${this._boolRow("notify_enabled", "Annunci attivi")}
          <div class="row col">
            <div class="t"><span class="lab">Servizio di annuncio</span>${this._helpBtn("notify_service")}</div>
            <input class="txt" .value=${this._s.notify_service} placeholder="notify.alexa_media" @change=${(e: Event) => this._set("notify_service", (e.target as HTMLInputElement).value.trim())} />
          </div>
          <div class="row col">
            <div class="t"><span class="lab">Altoparlanti</span>${this._helpBtn("notify_targets")}</div>
            <div class="chips">
              ${players.length === 0 ? html`<span class="opt">Nessun media player trovato.</span>` : nothing}
              ${players.map((p) => html`<button class=${this._s.notify_targets.includes(p.entity_id) ? "chip on" : "chip"} aria-pressed=${this._s.notify_targets.includes(p.entity_id) ? "true" : "false"} @click=${() => this._toggleTarget(p.entity_id)}>${String(p.attributes.friendly_name ?? p.entity_id)}</button>`)}
            </div>
          </div>`;
      }
      default:
        return html`${this._entityRow("climate", "Termostato", ["climate"], true)}${this._entityRow("temperature_sensor", "Sensore di temperatura", ["sensor"], false)}${this._entityRow("away_entity", "Casa vuota", ["binary_sensor", "input_boolean"], false)}${this._entityRow("guests_entity", "Ospiti in casa", ["binary_sensor", "input_boolean"], false)}`;
    }
  }

  private _helpOverlay() {
    const h = this._help ? HELP[this._help] : undefined;
    if (!h) return nothing;
    return html`
      <div class="hback" @click=${(e: Event) => e.target === e.currentTarget && (this._help = null)}>
        <div class="hbox" role="dialog" aria-modal="true" aria-label=${h.title}>
          <div class="ht">${h.title}</div>
          <div class="hs">Cosa fa</div><p>${h.what}</p>
          <div class="hs">Quando serve</div><p>${h.when}</p>
          ${h.suggested ? html`<div class="hs">Valore consigliato</div><p>${h.suggested}</p>` : nothing}
          <button class="btn primary" @click=${() => (this._help = null)}>Ho capito</button>
        </div>
      </div>`;
  }

  render() {
    if (!this.hass || !this._s) return nothing;
    const errs = validateSettings(this._s);
    return html`
      <div class="backdrop" @click=${(e: Event) => e.target === e.currentTarget && this._close()}>
        <div class="panel" role="dialog" aria-modal="true" aria-label="Preferenze termostato">
          <div class="head">
            <div class="title">Preferenze del termostato</div>
            <button class="x" aria-label="Chiudi" @click=${() => this._close()}>✕</button>
          </div>
          <div class="body">
            ${BLOCKS.map((b) => {
              const open = this._open === b.id;
              return html`
                <section class="block ${open ? "open" : ""}">
                  <div class="bh" role="button" tabindex="0" aria-expanded=${open ? "true" : "false"} @click=${() => (this._open = open ? null : b.id)} @keydown=${(e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") this._open = open ? null : b.id; }}>
                    <ha-icon icon=${b.icon}></ha-icon>
                    <div class="bt"><div class="bn">${b.title}</div><div class="bs">${this._summary(b.id)}</div></div>
                    ${this._helpBtn(b.helpId)}
                    <span class="chev">${open ? "▾" : "▸"}</span>
                  </div>
                  ${open ? html`<div class="bb">${this._blockBody(b.id)}</div>` : nothing}
                </section>`;
            })}
            ${errs.length ? html`<div class="err">${errs[0]}</div>` : nothing}
            ${this._error ? html`<div class="err">${this._error}</div>` : nothing}
          </div>
          <div class="foot">
            <button class="btn" @click=${() => this._close()}>Annulla</button>
            <button class="btn primary" ?disabled=${this._busy || errs.length > 0} @click=${() => void this._save()}>Salva</button>
          </div>
          ${this._helpOverlay()}
        </div>
      </div>
    `;
  }

  static styles = [
    dialogStyles,
    css`
      .panel { position: relative; }
      .block { border: 1px solid var(--divider-color, #ddd); border-radius: 14px; margin-bottom: 8px; overflow: hidden; }
      .block.open { border-color: var(--primary-color, #03a9f4); }
      .bh { display: flex; align-items: center; gap: 10px; min-height: 56px; padding: 6px 12px; cursor: pointer; }
      .bh ha-icon { --mdc-icon-size: 24px; color: var(--secondary-text-color, #727272); flex: none; }
      .bt { flex: 1; min-width: 0; }
      .bn { font-size: 1rem; font-weight: 600; }
      .bs { font-size: 0.78rem; color: var(--secondary-text-color, #727272); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .chev { width: 18px; text-align: center; color: var(--secondary-text-color, #727272); }
      .bb { padding: 0 12px 8px; border-top: 1px solid var(--divider-color, #eee); }
      .i { flex: none; width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--divider-color, #ccc); background: transparent; color: var(--secondary-text-color, #727272); font-size: 0.95rem; font-style: italic; font-family: Georgia, serif; cursor: pointer; margin-left: 6px; }
      .row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 0; border-top: 1px solid var(--divider-color, #eee); }
      .row:first-child { border-top: 0; }
      .row.col { flex-direction: column; align-items: stretch; gap: 6px; }
      .t { flex: 1; min-width: 0; display: flex; align-items: center; flex-wrap: wrap; }
      .lab { font-size: 0.93rem; }
      .opt { font-size: 0.7rem; color: var(--secondary-text-color, #727272); margin-left: 6px; }
      .warn { font-size: 0.78rem; color: #d97706; padding: 6px 0; }
      .txt { width: 100%; box-sizing: border-box; min-height: 44px; padding: 8px 10px; border-radius: 10px; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff); color: inherit; font-size: 0.95rem; }
      .num { display: flex; align-items: center; gap: 4px; flex: none; }
      .num input { width: 66px; min-height: 44px; box-sizing: border-box; text-align: center; padding: 6px 4px; border-radius: 10px; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff); color: inherit; font-size: 1rem; }
      .unit { width: 28px; font-size: 0.8rem; color: var(--secondary-text-color, #727272); }
      .st { width: 44px; height: 44px; border-radius: 12px; border: 1px solid var(--divider-color, #ccc); background: var(--secondary-background-color, #f4f4f4); color: inherit; font-size: 1.3rem; cursor: pointer; }
      .sw { flex: none; width: 52px; height: 30px; border-radius: 15px; border: 0; background: var(--disabled-color, #bdbdbd); position: relative; cursor: pointer; transition: background 0.2s; }
      .sw.on { background: var(--primary-color, #03a9f4); }
      .sw .knob { position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; transition: transform 0.2s; }
      .sw.on .knob { transform: translateX(22px); }
      .chips { display: flex; flex-wrap: wrap; gap: 8px; }
      .chip { min-height: 44px; padding: 8px 14px; border-radius: 22px; border: 1px solid var(--divider-color, #ccc); background: transparent; color: inherit; font-size: 0.9rem; cursor: pointer; }
      .chip.on { background: var(--primary-color, #03a9f4); color: #fff; border-color: transparent; }
      .hback { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; padding: 14px; z-index: 2; }
      .hbox { background: var(--card-background-color, #fff); border-radius: 16px; padding: 16px 18px; max-width: 420px; max-height: 90%; overflow: auto; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4); }
      .ht { font-size: 1.05rem; font-weight: 600; margin-bottom: 6px; }
      .hs { font-size: 0.72rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--secondary-text-color, #727272); margin-top: 8px; }
      .hbox p { margin: 2px 0 0; font-size: 0.92rem; line-height: 1.4; }
      .hbox .btn { margin-top: 14px; min-height: 44px; width: 100%; }
    `,
  ];
}

if (!customElements.get("termostato-settings-dialog")) customElements.define("termostato-settings-dialog", TermostatoSettingsDialog);
