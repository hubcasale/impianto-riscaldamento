import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { dialogStyles } from "./dialog-style";
import { DAY_INITIALS, DAY_LABELS, clampStep, crossesMidnight, dayIntervals, defaultSlot, describeDays, fmtTemp, scheduleErrors, slotError, tempColor } from "./card-logic";
import type { HomeAssistant, ScheduleData, SlotData, TermoInfo } from "./types";

/** Finestra "Programma": fasce settimanali con temperatura (anche più di una al giorno) e vista dell'intera settimana. */
export class TermostatoScheduleDialog extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) info!: TermoInfo;
  @state() private _sch!: ScheduleData;
  @state() private _busy = false;
  @state() private _error = "";
  private _onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") this._close();
  };

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("keydown", this._onKey);
    this._sch = JSON.parse(JSON.stringify(this.info.schedule)) as ScheduleData;
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this._onKey);
  }
  private _close(): void {
    this.dispatchEvent(new CustomEvent("closed"));
    this.remove();
  }

  private get _limits() {
    const s = this.info.settings;
    return { min: s.min_target, max: s.max_target };
  }

  private _patch(i: number, p: Partial<SlotData>): void {
    this._sch = { ...this._sch, slots: this._sch.slots.map((s, k) => (k === i ? { ...s, ...p } : s)) };
  }
  private _toggleDay(i: number, d: number): void {
    const days = this._sch.slots[i].days;
    this._patch(i, { days: days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort((a, b) => a - b) });
  }
  private _bumpTemp(i: number, dir: 1 | -1): void {
    const { min, max } = this._limits;
    this._patch(i, { temp: clampStep(this._sch.slots[i].temp + dir * 0.5, min, max, 0.5) });
  }
  private _add(): void {
    this._sch = { ...this._sch, slots: [...this._sch.slots, defaultSlot(this.info.settings.default_target)] };
  }
  private _remove(i: number): void {
    this._sch = { ...this._sch, slots: this._sch.slots.filter((_, k) => k !== i) };
  }
  private _duplicate(i: number): void {
    const copy = JSON.parse(JSON.stringify(this._sch.slots[i])) as SlotData;
    this._sch = { ...this._sch, slots: [...this._sch.slots.slice(0, i + 1), copy, ...this._sch.slots.slice(i + 1)] };
  }

  private async _save(): Promise<void> {
    const errs = scheduleErrors(this._sch);
    if (errs.length) {
      this._error = errs[0];
      return;
    }
    this._busy = true;
    this._error = "";
    try {
      await this.hass.callWS({ type: "termostato_riscaldamento/schedule", entry_id: this.info.entry_id, schedule: this._sch });
      this.dispatchEvent(new CustomEvent("saved"));
      this._close();
    } catch (err) {
      this._error = `Impossibile salvare: ${err instanceof Error ? err.message : (err as { message?: string })?.message ?? String(err)}`;
    } finally {
      this._busy = false;
    }
  }

  private _week() {
    const days = dayIntervals(this._sch.slots);
    return html`
      <div class="week" aria-label="Vista della settimana">
        ${days.map(
          (segs, d) => html`
            <div class="wd"><span>${DAY_LABELS[d]}</span>
              <div class="wbar">${segs.map((g) => html`<i title="${fmtTemp(g.temp)} °C" style="left:${(g.from / 1440) * 100}%;width:${((g.to - g.from) / 1440) * 100}%;background:${tempColor(g.temp)}"></i>`)}</div>
            </div>`,
        )}
        <div class="wd axis"><span></span><div class="wax"><b>0</b><b>6</b><b>12</b><b>18</b><b>24</b></div></div>
        <div class="legend">Più scuro = più caldo. Fuori dalle fasce: antigelo ${fmtTemp(this.info.settings.antigelo)} °C.</div>
      </div>`;
  }

  render() {
    if (!this._sch) return nothing;
    const errs = scheduleErrors(this._sch);
    return html`
      <div class="backdrop" @click=${(e: Event) => e.target === e.currentTarget && this._close()}>
        <div class="panel" role="dialog" aria-modal="true" aria-label="Programma termostato">
          <div class="head">
            <div class="title">Programma settimanale</div>
            <button class="x" aria-label="Chiudi" @click=${() => this._close()}>✕</button>
          </div>
          <div class="body">
            <div class="row top">
              <div class="t"><div class="lab">Programma attivo</div>
                <div class="hint">Alle ore indicate il termostato va alla temperatura della fascia; fuori fascia va all'antigelo. Se lo cambi a mano, il programma riprende alla fascia successiva.</div></div>
              <button class=${this._sch.enabled ? "sw on" : "sw"} role="switch" aria-checked=${this._sch.enabled ? "true" : "false"} aria-label="Programma attivo" @click=${() => (this._sch = { ...this._sch, enabled: !this._sch.enabled })}><span class="knob"></span></button>
            </div>

            ${this._week()}

            <div class="sec">Fasce</div>
            ${this._sch.slots.length === 0 ? html`<div class="empty">Nessuna fascia: aggiungine una.</div>` : nothing}
            ${this._sch.slots.map((s, i) => {
              const err = slotError(s);
              return html`
                <div class="slot ${err ? "bad" : ""}">
                  <div class="days" role="group" aria-label="Giorni">
                    ${DAY_INITIALS.map((l, d) => html`<button class=${s.days.includes(d) ? "day on" : "day"} aria-label=${DAY_LABELS[d]} aria-pressed=${s.days.includes(d) ? "true" : "false"} @click=${() => this._toggleDay(i, d)}>${l}</button>`)}
                  </div>
                  <div class="times">
                    <label>Da<input type="time" .value=${s.start} @change=${(e: Event) => this._patch(i, { start: (e.target as HTMLInputElement).value })} /></label>
                    <label>A<input type="time" .value=${s.end} @change=${(e: Event) => this._patch(i, { end: (e.target as HTMLInputElement).value })} /></label>
                    <div class="tmp" role="group" aria-label="Temperatura della fascia">
                      <button class="st" aria-label="Meno caldo" @click=${() => this._bumpTemp(i, -1)}>−</button>
                      <b>${fmtTemp(s.temp)} °C</b>
                      <button class="st" aria-label="Più caldo" @click=${() => this._bumpTemp(i, 1)}>+</button>
                    </div>
                  </div>
                  <div class="foot2">
                    <div class="sum">${err ?? `${describeDays(s.days)}${crossesMidnight(s) ? " · finisce il giorno dopo" : ""}`}</div>
                    <button class="mini" aria-label="Duplica fascia" @click=${() => this._duplicate(i)}>⧉</button>
                    <button class="mini del" aria-label="Elimina fascia" @click=${() => this._remove(i)}>🗑</button>
                  </div>
                </div>`;
            })}
            <button class="btn add" @click=${() => this._add()}>+ Aggiungi fascia</button>

            ${errs.length ? html`<div class="err">${errs[0]}</div>` : nothing}
            ${this._error ? html`<div class="err">${this._error}</div>` : nothing}
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
      .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 0 12px; }
      .t { flex: 1; min-width: 0; }
      .lab { font-size: 0.95rem; font-weight: 500; }
      .hint { font-size: 0.78rem; color: var(--secondary-text-color, #727272); margin-top: 2px; line-height: 1.3; }
      .sw { flex: none; width: 52px; height: 30px; border-radius: 15px; border: 0; background: var(--disabled-color, #bdbdbd); position: relative; cursor: pointer; transition: background 0.2s; }
      .sw.on { background: var(--primary-color, #03a9f4); }
      .sw .knob { position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; transition: transform 0.2s; }
      .sw.on .knob { transform: translateX(22px); }
      .week { margin: 4px 0 12px; padding: 10px 12px; border-radius: 12px; background: var(--secondary-background-color, #f2f2f2); }
      .wd { display: flex; align-items: center; gap: 8px; margin: 3px 0; font-size: 0.75rem; }
      .wd span { width: 28px; color: var(--secondary-text-color, #727272); }
      .wbar { position: relative; flex: 1; height: 12px; border-radius: 6px; background: rgba(127, 127, 127, 0.18); overflow: hidden; }
      .wbar i { position: absolute; top: 0; bottom: 0; }
      .wax { flex: 1; display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--secondary-text-color, #727272); }
      .wax b { font-weight: 400; }
      .legend { margin-top: 6px; font-size: 0.72rem; color: var(--secondary-text-color, #727272); }
      .sec { font-weight: 600; font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--secondary-text-color, #727272); margin: 8px 0 6px; }
      .slot { padding: 10px; margin-bottom: 8px; border: 1px solid var(--divider-color, #ddd); border-radius: 12px; }
      .slot.bad { border-color: #dc2626; }
      .days { display: flex; gap: 6px; margin-bottom: 8px; }
      .day { width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--divider-color, #ccc); background: transparent; color: inherit; font-size: 0.9rem; cursor: pointer; }
      .day.on { background: var(--primary-color, #03a9f4); color: #fff; border-color: transparent; }
      .times { display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap; }
      .times label { display: flex; flex-direction: column; font-size: 0.72rem; color: var(--secondary-text-color, #727272); gap: 2px; }
      .times input { min-height: 44px; box-sizing: border-box; padding: 6px 8px; border-radius: 10px; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff); color: var(--primary-text-color, #212121); font-size: 1rem; }
      .tmp { display: flex; align-items: center; gap: 6px; margin-left: auto; }
      .tmp b { min-width: 64px; text-align: center; font-size: 1rem; }
      .st { width: 44px; height: 44px; border-radius: 12px; border: 1px solid var(--divider-color, #ccc); background: var(--secondary-background-color, #f4f4f4); color: inherit; font-size: 1.3rem; cursor: pointer; }
      .foot2 { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
      .sum { flex: 1; font-size: 0.78rem; color: var(--secondary-text-color, #727272); }
      .slot.bad .sum { color: #b91c1c; }
      .mini { border: 1px solid var(--divider-color, #ccc); background: transparent; color: inherit; border-radius: 10px; width: 44px; height: 44px; cursor: pointer; font-size: 1rem; }
      .add { min-height: 44px; }
    `,
  ];
}

if (!customElements.get("termostato-schedule-dialog")) customElements.define("termostato-schedule-dialog", TermostatoScheduleDialog);
