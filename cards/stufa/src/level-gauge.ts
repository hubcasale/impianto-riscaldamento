// Indicatori piccoli accanto alla potenza: semicerchio con i livelli P1-P3 e ventolina che gira piu' o meno in fretta.
// Funzioni pure che restituiscono testo SVG (si provano con node:test e si usano in Lit con unsafeSVG).

const LEVEL_COLORS = ["#f5b324", "#f97316", "#dc2626"];

/** Secondi per un giro della ventolina: da 2,6 s (ventilatore al minimo) a 0,4 s (al massimo); null = ferma. */
export function fanSpinSeconds(fan: number | null): number | null {
  if (fan === null || !Number.isFinite(fan)) return null;
  const f = Math.min(100, Math.max(0, fan)) / 100;
  return Math.round((2.6 - 2.2 * f) * 100) / 100;
}

function arc(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): string {
  const pt = (d: number) => `${(cx + r * Math.cos((d * Math.PI) / 180)).toFixed(2)} ${(cy - r * Math.sin((d * Math.PI) / 180)).toFixed(2)}`;
  return `M${pt(fromDeg)} A${r} ${r} 0 0 1 ${pt(toDeg)}`;
}

/** Semicerchio in tre tratti (P1, P2, P3): quello del livello stimato e' colorato, gli altri restano spenti; al centro la sigla. */
export function levelGaugeSvg(level: number | null, uncertain = false): string {
  const segs = [0, 1, 2]
    .map((i) => {
      const from = 180 - i * 60 - 2.5;
      const to = 180 - (i + 1) * 60 + 2.5;
      const on = level === i + 1;
      return `<path d="${arc(45, 44, 34, from, to)}" fill="none" stroke="${on ? LEVEL_COLORS[i] : "var(--divider-color, #cfcfcf)"}" stroke-width="9" stroke-linecap="butt" opacity="${on ? 1 : 0.55}"/>`;
    })
    .join("");
  const label = level === null ? "–" : `${uncertain ? "≈" : ""}P${level}`;
  return `<svg viewBox="0 0 90 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${segs}<text x="45" y="45" text-anchor="middle" font-size="${label.length > 2 ? 15 : 18}" font-weight="700" fill="currentColor">${label}</text></svg>`;
}

/** Ventolina a quattro pale. */
export function fanSvg(): string {
  const blade = (deg: number) =>
    `<path d="M20 20 C13 15 14 5 20 2.5 C26 5 27 15 20 20 Z" transform="rotate(${deg} 20 20)" fill="currentColor"/>`;
  return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${[0, 90, 180, 270].map(blade).join("")}<circle cx="20" cy="20" r="3.2" fill="var(--card-background-color, #fff)" stroke="currentColor" stroke-width="1.2"/></svg>`;
}
