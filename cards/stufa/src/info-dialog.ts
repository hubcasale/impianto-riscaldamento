import { LitElement, html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { dialogStyles } from "./dialog-style";
import { STATE_LABEL, STATE_TONE, asState, summaryLines, toNumber } from "./card-logic";
import type { HomeAssistant, StufaInfo } from "./types";

/** Finestra "Stato": che cosa sta facendo la stufa, in frasi, con i numeri di oggi. */
export class StufaInfoDialog extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) info!: StufaInfo;
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

  render() {
    if (!this.hass || !this.info) return nothing;
    const ent = this.info.entities;
    const st = ent.stato ? this.hass.states[ent.stato] : undefined;
    const state = asState(st?.state ?? this.info.state);
    const a = (st?.attributes ?? {}) as Record<string, unknown>;
    const sinceRaw = (a.da as string | null) ?? this.info.since;
    const sw = a.interruttore === "acceso" ? true : a.interruttore === "spento" ? false : null;
    const plugOn = a.presa === "accesa" ? true : a.presa === "spenta" ? false : null;
    const num = (key: string) => (ent[key] ? toNumber(this.hass.states[ent[key]]?.state) : null);
    const lines = summaryLines(
      {
        state,
        power: toNumber(a.potenza) ?? this.info.power,
        sinceMs: sinceRaw ? Date.parse(sinceRaw) : null,
        switchOn: sw,
        plugOn,
        blocked: a.azioni_bloccate === true,
        ignitionsToday: num("accensioni_oggi"),
        hoursToday: num("ore_in_funzione_oggi"),
        lastOn: null,
        lastOff: null,
        settings: this.info.settings,
      },
      Date.now(),
    );
    return html`
      <div class="backdrop" @click=${(e: Event) => e.target === e.currentTarget && this._close()}>
        <div class="panel" role="dialog" aria-modal="true" aria-label="Stato stufa">
          <div class="head">
            <div class="title">Stato della stufa</div>
            <button class="x" aria-label="Chiudi" @click=${() => this._close()}>✕</button>
          </div>
          <div class="body">
            <div class="badge ${STATE_TONE[state]}">${STATE_LABEL[state]}</div>
            ${lines.map(
              (l) => html`<div class="line ${l.tone}"><ha-icon icon=${l.icon}></ha-icon><span>${l.text}</span></div>`,
            )}
          </div>
        </div>
      </div>
    `;
  }

  static styles = [
    dialogStyles,
    css`
      .badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 999px;
        font-weight: 600;
        font-size: 0.85rem;
        margin-bottom: 10px;
        background: var(--secondary-background-color, #eee);
      }
      .badge.success { background: rgba(22, 163, 74, 0.18); color: #166534; }
      .badge.warning { background: rgba(245, 158, 11, 0.2); color: #92400e; }
      .badge.accent { background: rgba(96, 165, 250, 0.2); color: #1e40af; }
      .badge.danger { background: rgba(220, 38, 38, 0.15); color: #b91c1c; }
      .line {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 9px 0;
        border-top: 1px solid var(--divider-color, #eee);
        line-height: 1.35;
        font-size: 0.93rem;
      }
      .line ha-icon { --mdc-icon-size: 20px; flex: none; margin-top: 1px; color: var(--secondary-text-color, #727272); }
      .line.ok ha-icon { color: #16a34a; }
      .line.warn ha-icon { color: #d97706; }
      .line.bad ha-icon { color: #dc2626; }
    `,
  ];
}

if (!customElements.get("stufa-info-dialog")) customElements.define("stufa-info-dialog", StufaInfoDialog);
