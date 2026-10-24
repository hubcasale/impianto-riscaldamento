import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { dialogStyles } from "./dialog-style";
import { TIMER_PRESETS, formatDuration, whenText } from "./card-logic";
import type { HomeAssistant, StufaInfo } from "./types";

const label = (m: number) => (m < 60 ? `${m} min` : m % 60 === 0 ? `${m / 60} h` : `${Math.floor(m / 60)} h ${m % 60} min`);

/** Finestra "Timer": accende ora e spegne dopo il tempo scelto. */
export class StufaTimerDialog extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) info!: StufaInfo;
  @state() private _custom = "";
  @state() private _busy = false;
  @state() private _error = "";
  private _onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") this._close();
  };

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("keydown", this._onKey);
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this._onKey);
  }
  private _close(): void {
    this.dispatchEvent(new CustomEvent("closed"));
    this.remove();
  }

  private async _start(minutes: number): Promise<void> {
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 1440) {
      this._error = "Scegli un tempo tra 1 minuto e 24 ore.";
      return;
    }
    this._busy = true;
    this._error = "";
    try {
      await this.hass.callWS({ type: "stufa_pellet/timer", entry_id: this.info.entry_id, minutes });
      this.dispatchEvent(new CustomEvent("saved"));
      this._close();
    } catch (err) {
      const m = err instanceof Error ? err.message : (err as { message?: string })?.message ?? String(err);
      this._error = `Impossibile avviare il timer: ${m}`;
    } finally {
      this._busy = false;
    }
  }

  render() {
    if (!this.info) return nothing;
    const until = this.info.timer_until ? Date.parse(this.info.timer_until) : null;
    const now = Date.now();
    const customMinutes = Number(this._custom.replace(",", "."));
    return html`
      <div class="backdrop" @click=${(e: Event) => e.target === e.currentTarget && this._close()}>
        <div class="panel" role="dialog" aria-modal="true" aria-label="Timer stufa">
          <div class="head">
            <div class="title">Timer</div>
            <button class="x" aria-label="Chiudi" @click=${() => this._close()}>✕</button>
          </div>
          <div class="body">
            ${until !== null && until > now
              ? html`<div class="active">Timer in corso: la stufa si spegne ${whenText(until, now)} (tra ${formatDuration(until - now)}).
                  <div><button class="btn" ?disabled=${this._busy} @click=${() => void this._start(0)}>Annulla il timer</button></div></div>`
              : nothing}
            <div class="lab">Accendi ora e spegni dopo</div>
            <div class="chips">
              ${TIMER_PRESETS.map((m) => html`<button class="chip" ?disabled=${this._busy} @click=${() => void this._start(m)}>${label(m)}</button>`)}
            </div>
            <div class="custom">
              <input type="text" inputmode="numeric" placeholder="minuti" .value=${this._custom} @input=${(e: Event) => (this._custom = (e.target as HTMLInputElement).value)} aria-label="Minuti" />
              <button class="btn primary" ?disabled=${this._busy || !(customMinutes >= 1)} @click=${() => void this._start(Math.round(customMinutes))}>Avvia</button>
            </div>
            <div class="hint">Il timer accende subito l'interruttore e lo spegne alla scadenza; durante il timer le fasce del programma non intervengono.</div>
            ${this._error ? html`<div class="err">${this._error}</div>` : nothing}
          </div>
        </div>
      </div>
    `;
  }

  static styles = [
    dialogStyles,
    css`
      .lab { font-size: 0.95rem; font-weight: 500; margin-bottom: 8px; }
      .chips { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .chip { padding: 12px 6px; border-radius: 12px; border: 1px solid var(--divider-color, #ccc); background: var(--secondary-background-color, #f4f4f4); color: inherit; font-size: 0.95rem; cursor: pointer; }
      .chip:hover { border-color: var(--primary-color, #03a9f4); }
      .custom { display: flex; gap: 8px; margin: 12px 0; }
      .custom input { flex: 1; padding: 9px 10px; border-radius: 10px; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff); color: inherit; font-size: 0.95rem; }
      .hint { font-size: 0.78rem; color: var(--secondary-text-color, #727272); line-height: 1.35; }
      .active { padding: 10px 12px; margin-bottom: 14px; border-radius: 12px; background: rgba(96, 165, 250, 0.16); font-size: 0.9rem; }
      .active .btn { margin-top: 8px; }
    `,
  ];
}

if (!customElements.get("stufa-timer-dialog")) customElements.define("stufa-timer-dialog", StufaTimerDialog);
