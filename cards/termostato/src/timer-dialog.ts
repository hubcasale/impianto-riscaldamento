import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { dialogStyles } from "./dialog-style";
import { TIMER_PRESETS, clampStep, fmtTemp, formatDuration, whenText } from "./card-logic";
import type { HomeAssistant, TermoInfo } from "./types";

const label = (m: number) => (m < 60 ? `${m} min` : m % 60 === 0 ? `${m / 60} h` : `${Math.floor(m / 60)} h ${m % 60} min`);

/** Finestra "Timer": scalda alla temperatura scelta per il tempo scelto, poi torna al programma o all'antigelo. */
export class TermostatoTimerDialog extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) info!: TermoInfo;
  @state() private _temp = 20.5;
  @state() private _custom = "";
  @state() private _busy = false;
  @state() private _error = "";
  private _onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") this._close();
  };

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("keydown", this._onKey);
    const s = this.info.settings;
    const heating = this.info.target !== null && this.info.target > s.antigelo + 0.01 && this.info.hvac_mode !== "off";
    this._temp = clampStep(heating && this.info.target !== null ? this.info.target : s.default_target, s.min_target, s.max_target, 0.5);
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this._onKey);
  }
  private _close(): void {
    this.dispatchEvent(new CustomEvent("closed"));
    this.remove();
  }

  private _bump(dir: 1 | -1): void {
    const s = this.info.settings;
    this._temp = clampStep(this._temp + dir * 0.5, s.min_target, s.max_target, 0.5);
  }

  private async _start(minutes: number): Promise<void> {
    const max = this.info.settings.timer_max_hours * 60;
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > max) {
      this._error = `Scegli un tempo tra 1 minuto e ${this.info.settings.timer_max_hours} ore.`;
      return;
    }
    this._busy = true;
    this._error = "";
    try {
      const msg: Record<string, unknown> = { type: "termostato_riscaldamento/timer", entry_id: this.info.entry_id, minutes };
      if (minutes > 0) msg.temperature = this._temp;
      await this.hass.callWS(msg);
      this.dispatchEvent(new CustomEvent("saved"));
      this._close();
    } catch (err) {
      this._error = `Impossibile avviare il timer: ${err instanceof Error ? err.message : (err as { message?: string })?.message ?? String(err)}`;
    } finally {
      this._busy = false;
    }
  }

  render() {
    if (!this.info) return nothing;
    const until = this.info.timer_until ? Date.parse(this.info.timer_until) : null;
    const now = Date.now();
    const maxMin = this.info.settings.timer_max_hours * 60;
    const customMinutes = Number(this._custom.replace(",", "."));
    const presets = TIMER_PRESETS.filter((m) => m <= maxMin);
    return html`
      <div class="backdrop" @click=${(e: Event) => e.target === e.currentTarget && this._close()}>
        <div class="panel" role="dialog" aria-modal="true" aria-label="Timer termostato">
          <div class="head">
            <div class="title">Timer</div>
            <button class="x" aria-label="Chiudi" @click=${() => this._close()}>✕</button>
          </div>
          <div class="body">
            ${until !== null && until > now
              ? html`<div class="active">Timer in corso: ${fmtTemp(this.info.timer_temp)} °C fino a ${whenText(until, now)} (tra ${formatDuration(until - now)}).
                  <div><button class="btn" ?disabled=${this._busy} @click=${() => void this._start(0)}>Annulla il timer</button></div></div>`
              : nothing}
            <div class="lab">Temperatura</div>
            <div class="tmp">
              <button class="st" aria-label="Meno caldo" @click=${() => this._bump(-1)}>−</button>
              <b>${fmtTemp(this._temp)} °C</b>
              <button class="st" aria-label="Più caldo" @click=${() => this._bump(1)}>+</button>
            </div>
            <div class="lab">Scalda per</div>
            <div class="chips">
              ${presets.map((m) => html`<button class="chip" ?disabled=${this._busy} @click=${() => void this._start(m)}>${label(m)}</button>`)}
            </div>
            <div class="custom">
              <input type="text" inputmode="numeric" placeholder="minuti" .value=${this._custom} @input=${(e: Event) => (this._custom = (e.target as HTMLInputElement).value)} aria-label="Minuti" />
              <button class="btn primary" ?disabled=${this._busy || !(customMinutes >= 1)} @click=${() => void this._start(Math.round(customMinutes))}>Avvia</button>
            </div>
            <div class="hint">Finito il tempo il termostato torna al programma, se è attivo, altrimenti all'antigelo (${fmtTemp(this.info.settings.antigelo)} °C). Durata massima ${this.info.settings.timer_max_hours} ore, modificabile nelle preferenze.</div>
            ${this._error ? html`<div class="err">${this._error}</div>` : nothing}
          </div>
        </div>
      </div>
    `;
  }

  static styles = [
    dialogStyles,
    css`
      .lab { font-size: 0.95rem; font-weight: 500; margin: 6px 0 8px; }
      .tmp { display: flex; align-items: center; justify-content: center; gap: 18px; margin-bottom: 12px; }
      .tmp b { min-width: 100px; text-align: center; font-size: 1.6rem; }
      .st { width: 52px; height: 52px; border-radius: 50%; border: 1px solid var(--divider-color, #ccc); background: var(--secondary-background-color, #f4f4f4); color: inherit; font-size: 1.6rem; cursor: pointer; }
      .chips { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .chip { min-height: 52px; padding: 12px 6px; border-radius: 12px; border: 1px solid var(--divider-color, #ccc); background: var(--secondary-background-color, #f4f4f4); color: inherit; font-size: 1rem; cursor: pointer; }
      .custom { display: flex; gap: 8px; margin: 12px 0; }
      .custom input { flex: 1; min-height: 48px; box-sizing: border-box; padding: 9px 10px; border-radius: 10px; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff); color: inherit; font-size: 1rem; }
      .hint { font-size: 0.78rem; color: var(--secondary-text-color, #727272); line-height: 1.35; }
      .active { padding: 10px 12px; margin-bottom: 14px; border-radius: 12px; background: rgba(96, 165, 250, 0.16); font-size: 0.9rem; }
      .active .btn { margin-top: 8px; min-height: 44px; }
    `,
  ];
}

if (!customElements.get("termostato-timer-dialog")) customElements.define("termostato-timer-dialog", TermostatoTimerDialog);
