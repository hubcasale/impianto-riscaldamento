import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { dialogStyles } from "./dialog-style";
import { BEHAVIOUR_FIELDS, THRESHOLD_FIELDS, TILE_COLORS, clampStep, fmt, validateSettings, type NumberField } from "./card-logic";
import type { HomeAssistant, StufaInfo, StufaSettings } from "./types";

interface Suggestion {
  samples: number;
  days: number;
  suggestion: Partial<StufaSettings> | null;
}

type BoolKey = "shutdown_needs_switch_off" | "sync_switch_on" | "sync_switch_off" | "notify_events" | "notify_sensor_problem" | "show_switch_button";

const TOGGLES: Record<string, { key: BoolKey; label: string; hint: string }[]> = {
  soglie: [{ key: "shutdown_needs_switch_off", label: "Spegnimento solo con l'interruttore spento", hint: "La fascia di spegnimento vale solo se l'interruttore della stufa è spento; con l'interruttore acceso la stessa potenza vuol dire 'in funzione'." }],
  comportamento: [
    { key: "sync_switch_on", label: "Accendi l'interruttore quando la stufa parte", hint: "Se la stufa si accende da sola, l'interruttore della stufa si allinea." },
    { key: "sync_switch_off", label: "Spegni l'interruttore a stufa spenta", hint: "Dopo il periodo di grazia l'interruttore della stufa si spegne quando la stufa risulta spenta." },
    { key: "show_switch_button", label: "Pulsante di accensione sulla scheda", hint: "Mostra il pulsante per accendere e spegnere la stufa con il suo interruttore." },
  ],
  notifiche: [
    { key: "notify_events", label: "Avvisa su accensione e spegnimento", hint: "" },
    { key: "notify_sensor_problem", label: "Avvisa se il sensore non risponde", hint: "" },
  ],
};

/** Finestra "Preferenze": sensori, soglie, comportamento, notifiche e colore. Salva con il comando `stufa_pellet/update`. */
export class StufaSettingsDialog extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) info!: StufaInfo;
  @state() private _s!: StufaSettings;
  @state() private _src!: { power_sensor: string; switch: string; plug: string; energy_sensor: string };
  @state() private _busy = false;
  @state() private _error = "";
  @state() private _msg = "";
  @state() private _suggest: Suggestion | null = null;
  private _onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") this._close();
  };

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("keydown", this._onKey);
    this._s = { ...this.info.settings };
    this._src = {
      power_sensor: this.info.sources.power_sensor ?? "",
      switch: this.info.sources.switch ?? "",
      plug: this.info.sources.plug ?? "",
      energy_sensor: this.info.sources.energy_sensor ?? "",
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

  private _set<K extends keyof StufaSettings>(key: K, value: StufaSettings[K]): void {
    this._s = { ...this._s, [key]: value };
    this._msg = "";
  }

  private _typed(f: NumberField, ev: Event): void {
    const raw = (ev.target as HTMLInputElement).value.replace(",", ".");
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(n)) {
      (ev.target as HTMLInputElement).value = String(this._s[f.key]);
      return;
    }
    this._set(f.key, clampStep(n, f.min, f.max, f.step));
  }

  private _step(f: NumberField, dir: 1 | -1): void {
    this._set(f.key, clampStep(this._s[f.key] + dir * f.step, f.min, f.max, f.step));
  }

  private async _suggestFromHistory(): Promise<void> {
    this._busy = true;
    this._error = "";
    try {
      this._suggest = await this.hass.callWS<Suggestion>({ type: "stufa_pellet/suggest", entry_id: this.info.entry_id, days: 14 });
    } catch (err) {
      this._error = `Non riesco a leggere lo storico: ${err instanceof Error ? err.message : String(err)}`;
    } finally {
      this._busy = false;
    }
  }

  private _applySuggestion(): void {
    const sg = this._suggest?.suggestion;
    if (!sg) return;
    const next = { ...this._s };
    for (const k of ["off_below", "ignition_above", "shutdown_min", "shutdown_max"] as const) {
      const v = sg[k];
      if (typeof v === "number") next[k] = v;
    }
    this._s = next;
    this._suggest = null;
    this._msg = "Soglie proposte applicate: controlla e premi Salva.";
  }

  private async _save(): Promise<void> {
    const errs = validateSettings(this._s);
    if (errs.length) {
      this._error = errs[0];
      return;
    }
    if (!this._src.power_sensor) {
      this._error = "Il sensore di potenza è obbligatorio.";
      return;
    }
    this._busy = true;
    this._error = "";
    try {
      await this.hass.callWS({
        type: "stufa_pellet/update",
        entry_id: this.info.entry_id,
        settings: this._s,
        sources: this._src,
      });
      this.dispatchEvent(new CustomEvent("saved"));
      this._close();
    } catch (err) {
      this._error = `Impossibile salvare: ${err instanceof Error ? err.message : String(err)}`;
    } finally {
      this._busy = false;
    }
  }

  private _entityRow(label: string, key: "power_sensor" | "switch" | "plug" | "energy_sensor", domains: string[], required: boolean) {
    const listId = `dl-${key}`;
    const options = Object.keys(this.hass.states).filter((id) => domains.includes(id.split(".")[0]));
    return html`
      <div class="row col">
        <div class="lab">${label}${required ? html` <span class="req">obbligatorio</span>` : html` <span class="opt">facoltativo</span>`}</div>
        <input
          class="txt"
          list=${listId}
          .value=${this._src[key]}
          placeholder=${domains.join(" / ") + ".nome"}
          @change=${(e: Event) => {
            this._src = { ...this._src, [key]: (e.target as HTMLInputElement).value.trim() };
          }}
        />
        <datalist id=${listId}>${options.map((o) => html`<option value=${o}></option>`)}</datalist>
        ${this._src[key] && !this.hass.states[this._src[key]] ? html`<div class="hint warn">Entità non trovata in Home Assistant.</div>` : nothing}
      </div>
    `;
  }

  private _numRow(f: NumberField) {
    return html`
      <div class="row">
        <div class="t"><div class="lab">${f.label}</div><div class="hint">${f.hint}</div></div>
        <div class="num">
          <button class="st" aria-label="Diminuisci" @click=${() => this._step(f, -1)}>−</button>
          <input type="text" inputmode="decimal" .value=${String(this._s[f.key])} aria-label=${f.label} @change=${(e: Event) => this._typed(f, e)} />
          <span class="unit">${f.unit}</span>
          <button class="st" aria-label="Aumenta" @click=${() => this._step(f, 1)}>+</button>
        </div>
      </div>
    `;
  }

  private _toggleRows(group: string) {
    return TOGGLES[group].map(
      (t) => html`
        <div class="row">
          <div class="t"><div class="lab">${t.label}</div>${t.hint ? html`<div class="hint">${t.hint}</div>` : nothing}</div>
          <button class=${this._s[t.key] ? "sw on" : "sw"} role="switch" aria-checked=${this._s[t.key] ? "true" : "false"} aria-label=${t.label} @click=${() => this._set(t.key, !this._s[t.key])}><span class="knob"></span></button>
        </div>
      `,
    );
  }

  render() {
    if (!this.hass || !this._s) return nothing;
    const errs = validateSettings(this._s);
    const sg = this._suggest?.suggestion ?? null;
    return html`
      <div class="backdrop" @click=${(e: Event) => e.target === e.currentTarget && this._close()}>
        <div class="panel" role="dialog" aria-modal="true" aria-label="Preferenze stufa">
          <div class="head">
            <div class="title">Preferenze della stufa</div>
            <button class="x" aria-label="Chiudi" @click=${() => this._close()}>✕</button>
          </div>
          <div class="body">
            <div class="sec">Sensori</div>
            ${this._entityRow("Sensore di potenza (W)", "power_sensor", ["sensor"], true)}
            ${this._entityRow("Interruttore di accensione della stufa (per esempio lo Shelly)", "switch", ["switch", "input_boolean", "light"], false)}
            ${this._entityRow("Interruttore della presa (solo stato)", "plug", ["switch", "input_boolean", "light"], false)}
            ${this._entityRow("Contatore di energia (kWh)", "energy_sensor", ["sensor"], false)}

            <div class="sec">Soglie di potenza</div>
            ${THRESHOLD_FIELDS.map((f) => this._numRow(f))}
            ${this._toggleRows("soglie")}
            <div class="row col">
              <button class="btn" ?disabled=${this._busy} @click=${() => void this._suggestFromHistory()}>Suggerisci le soglie dallo storico</button>
              ${this._suggest
                ? sg
                  ? html`<div class="sugg">
                      Dai ${fmt(this._suggest.samples)} campioni degli ultimi ${this._suggest.days} giorni:
                      ${Object.entries(sg).map(([k, v]) => html`<span class="pill">${k.replaceAll("_", " ")} ${fmt(v as number, 1)} W</span>`)}
                      <div><button class="btn primary" @click=${() => this._applySuggestion()}>Usa questi valori</button></div>
                    </div>`
                  : html`<div class="hint">Lo storico non basta per proporre soglie: accendi e spegni la stufa almeno una volta con il sensore attivo.</div>`
                : nothing}
            </div>

            <div class="sec">Comportamento</div>
            ${BEHAVIOUR_FIELDS.map((f) => this._numRow(f))}
            ${this._toggleRows("comportamento")}

            <div class="sec">Notifiche</div>
            ${this._toggleRows("notifiche")}
            <div class="row col">
              <div class="lab">Servizio di notifica</div>
              <input class="txt" .value=${this._s.notify_service} placeholder="notify.mobile_app_telefono (vuoto = notifica di Home Assistant)" @change=${(e: Event) => this._set("notify_service", (e.target as HTMLInputElement).value.trim())} />
            </div>

            <div class="sec">Aspetto</div>
            <div class="row col">
              <div class="lab">Colore delle ceramiche</div>
              <div class="tiles">
                ${Object.entries(TILE_COLORS).map(
                  ([k, [a, b]]) => html`<button class=${this._s.tile_color === k ? "tile on" : "tile"} style="background:linear-gradient(135deg,${b},${a})" aria-label=${k} @click=${() => this._set("tile_color", k as StufaSettings["tile_color"])}><span>${k}</span></button>`,
                )}
              </div>
            </div>

            ${errs.length ? html`<div class="err">${errs[0]}</div>` : nothing}
            ${this._error ? html`<div class="err">${this._error}</div>` : nothing}
            ${this._msg ? html`<div class="okbox">${this._msg}</div>` : nothing}
          </div>
          <div class="foot">
            <button class="btn" @click=${() => this._close()}>Annulla</button>
            <button class="btn primary" ?disabled=${this._busy || errs.length > 0} @click=${() => void this._save()}>Salva</button>
          </div>
        </div>
      </div>
    `;
  }

  static styles = [
    dialogStyles,
    css`
      .sec { font-weight: 600; font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--secondary-text-color, #727272); margin: 16px 0 4px; }
      .sec:first-child { margin-top: 0; }
      .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 0; border-top: 1px solid var(--divider-color, #eee); }
      .row.col { flex-direction: column; align-items: stretch; gap: 6px; }
      .t { flex: 1; min-width: 0; }
      .lab { font-size: 0.93rem; }
      .hint { font-size: 0.78rem; color: var(--secondary-text-color, #727272); margin-top: 2px; line-height: 1.3; }
      .hint.warn { color: #b45309; }
      .req, .opt { font-size: 0.7rem; color: var(--secondary-text-color, #727272); }
      .txt { width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff); color: inherit; font-size: 0.9rem; }
      .num { display: flex; align-items: center; gap: 4px; flex: none; }
      .num input { width: 62px; text-align: center; padding: 6px 4px; border-radius: 8px; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff); color: inherit; font-size: 0.95rem; }
      .unit { width: 18px; font-size: 0.8rem; color: var(--secondary-text-color, #727272); }
      .st { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--divider-color, #ccc); background: var(--secondary-background-color, #f4f4f4); color: inherit; font-size: 1.1rem; cursor: pointer; }
      .sw { flex: none; width: 44px; height: 26px; border-radius: 13px; border: 0; background: var(--disabled-color, #bdbdbd); position: relative; cursor: pointer; transition: background 0.2s; }
      .sw.on { background: var(--primary-color, #03a9f4); }
      .sw .knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform 0.2s; }
      .sw.on .knob { transform: translateX(18px); }
      .tiles { display: flex; gap: 10px; }
      .tile { flex: 1; height: 44px; border-radius: 10px; border: 2px solid transparent; cursor: pointer; color: #fff; font-size: 0.8rem; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5); text-transform: capitalize; }
      .tile.on { border-color: var(--primary-text-color, #222); }
      .sugg { font-size: 0.85rem; line-height: 1.9; }
      .pill { display: inline-block; padding: 1px 8px; margin: 0 4px 0 0; border-radius: 999px; background: var(--secondary-background-color, #eee); font-size: 0.78rem; }
    `,
  ];
}

if (!customElements.get("stufa-settings-dialog")) customElements.define("stufa-settings-dialog", StufaSettingsDialog);
