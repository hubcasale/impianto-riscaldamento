import type { GaugeModel } from "./card-logic";

const CX = 110;
const CY = 102;
const R = 86;

function point(frac: number, r: number): [number, number] {
  const a = Math.PI * (1 - frac);
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
}

function arc(from: number, to: number, color: string): string {
  const [x1, y1] = point(from, R);
  const [x2, y2] = point(to, R);
  return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${R} ${R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${color}" stroke-width="14"/>`;
}

/** Quadrante a semicerchio come la gauge di Home Assistant: fasce di colore attorno all'obiettivo, ago sulla temperatura ambiente. */
export function gaugeSvg(g: GaugeModel): string {
  const arcs = g.arcs.map((a) => arc(a.from, a.to, a.color)).join("");
  let needle = "";
  if (g.needle !== null) {
    const [nx, ny] = point(g.needle, R - 20);
    needle = `<line x1="${CX}" y1="${CY}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><circle cx="${CX}" cy="${CY}" r="5" fill="currentColor"/>`;
  }
  let mark = "";
  if (g.mark !== null) {
    const [ax, ay] = point(g.mark, R + 11);
    const [bx, by] = point(g.mark, R - 11);
    mark = `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="currentColor" stroke-width="3"/>`;
  }
  const [lx, ly] = point(0, R + 2);
  const [rx, ry] = point(1, R + 2);
  const labels = `<text x="${lx.toFixed(0)}" y="${(ly + 16).toFixed(0)}" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.6">${g.min}</text><text x="${rx.toFixed(0)}" y="${(ry + 16).toFixed(0)}" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.6">${g.max}</text>`;
  return `<svg viewBox="0 0 220 118" role="img" aria-label="Temperatura ambiente e obiettivo">${arcs}${mark}${needle}${labels}</svg>`;
}
