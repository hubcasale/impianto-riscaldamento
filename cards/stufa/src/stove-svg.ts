// Illustrazione della stufa Edilkamin Iris (simmetrica, ceramiche ai due lati, porta in vetro con maniglia a destra).
// Funzione pura: restituisce il testo SVG, cosi' si prova con node:test e si usa dentro Lit con unsafeSVG.
import { TILE_COLORS } from "./card-logic";
import type { StufaState } from "./types";

export function stoveSvg(state: StufaState, tile: string): string {
  const [c1, c2] = TILE_COLORS[tile] ?? TILE_COLORS.rosso;
  const lit = state === "accesa" || state === "accensione" || state === "spegnimento";
  const unavailable = state === "non_disponibile";

  const glow =
    state === "accesa" ? "#ff8a2a" : state === "accensione" ? "#ff9d3c" : state === "spegnimento" ? "#4a7bd0" : null;
  const glowOpacity = state === "accesa" ? 0.55 : state === "accensione" ? 0.32 : state === "spegnimento" ? 0.18 : 0;

  const bigFlame = `
    <path d="M94 186 C70 178 66 150 82 132 C84 144 92 146 94 138 C96 122 90 114 98 104 C104 122 124 134 118 160 C116 172 106 182 94 186Z" fill="#ffb21f"/>
    <path d="M94 186 C80 180 78 160 88 148 C90 156 96 158 97 150 C98 140 96 134 100 128 C106 144 114 156 108 170 C105 178 100 184 94 186Z" fill="#ff6a1a"/>
    <path d="M94 186 C86 182 86 170 92 162 C94 168 98 168 99 163 C103 170 102 180 94 186Z" fill="#fff0a8"/>
    <path d="M68 186 C58 178 60 164 68 158 C68 166 72 168 74 164 C78 172 76 182 68 186Z" fill="#ff8a1f"/>
    <path d="M120 186 C112 180 114 168 121 162 C121 170 125 172 127 167 C131 175 128 183 120 186Z" fill="#ff8a1f"/>`;
  const smallFlame = `
    <path d="M94 186 C84 182 84 170 90 162 C92 168 96 168 98 162 C102 170 102 180 94 186Z" fill="#ffa21f"/>
    <path d="M94 186 C89 183 89 177 92 173 C94 176 96 176 97 173 C99 177 98 183 94 186Z" fill="#fff0a8"/>`;
  const dimBlue = `
    <path d="M94 186 C86 183 86 174 91 168 C93 172 96 172 98 168 C101 174 101 182 94 186Z" fill="#6aa4ff" opacity="0.8"/>
    <path d="M94 186 C90 184 90 180 93 177 C95 179 96 179 97 177 C98 180 98 184 94 186Z" fill="#c9e0ff" opacity="0.8"/>`;
  const igniter = state === "accensione" ? `<rect x="79" y="180" width="30" height="4" rx="2" fill="#ff3b30"/><rect x="79" y="180" width="30" height="4" rx="2" fill="#ff7a6e" opacity="0.5"/>` : "";
  const flames = state === "accesa" ? bigFlame : state === "accensione" ? smallFlame + igniter : state === "spegnimento" ? dimBlue : "";

  const lcdColor = lit ? (state === "spegnimento" ? "#7fb2ff" : "#ffcf5a") : "#1b2028";
  const lcdText = state === "accesa" ? "ON" : state === "accensione" ? "ACC" : state === "spegnimento" ? "OFF" : "";

  const slats = [0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="40" y="${54 + i * 4.8}" width="108" height="2.4" rx="1.2" fill="#0f1217"/>`).join("");

  return `<svg viewBox="0 0 188 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Stufa a pellet ${state}">
  <defs>
    <linearGradient id="spBody" x1="0" x2="1"><stop offset="0" stop-color="#2a2f38"/><stop offset=".5" stop-color="#3a414d"/><stop offset="1" stop-color="#2a2f38"/></linearGradient>
    <linearGradient id="spTile" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c2}"/><stop offset="1" stop-color="${c1}"/></linearGradient>
    <linearGradient id="spGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14181e"/><stop offset="1" stop-color="#0b0d11"/></linearGradient>
    <radialGradient id="spGlow" cx=".5" cy=".85" r=".7"><stop offset="0" stop-color="${glow ?? "#000"}" stop-opacity="${glowOpacity}"/><stop offset="1" stop-color="${glow ?? "#000"}" stop-opacity="0"/></radialGradient>
    <clipPath id="spGlassClip"><rect x="53" y="100" width="82" height="88" rx="6"/></clipPath>
  </defs>
  <ellipse cx="94" cy="326" rx="78" ry="8" fill="#000" opacity="0.18"/>
  <rect x="85" y="6" width="18" height="40" rx="3" fill="#2b2f36"/>
  <rect x="85" y="6" width="5" height="40" rx="2" fill="#4a505b" opacity="0.6"/>
  <rect x="10" y="42" width="168" height="12" rx="6" fill="#20242b"/>
  <path d="M12 54 H176 C180 54 182 58 182 62 V292 C182 300 176 306 168 306 H20 C12 306 6 300 6 292 V62 C6 58 8 54 12 54Z" fill="url(#spBody)"/>
  <rect x="14" y="60" width="8" height="226" rx="3" fill="url(#spTile)"/>
  <rect x="166" y="60" width="8" height="226" rx="3" fill="url(#spTile)"/>
  <g stroke="#000" stroke-opacity="0.18" stroke-width="0.8">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => `<line x1="14" x2="22" y1="${80 + i * 20}" y2="${80 + i * 20}"/><line x1="166" x2="174" y1="${80 + i * 20}" y2="${80 + i * 20}"/>`).join("")}</g>
  <rect x="38" y="50" width="112" height="40" rx="4" fill="#161a20"/>${slats}
  <rect x="44" y="88" width="100" height="126" rx="8" fill="#1d2128"/>
  <rect x="53" y="100" width="82" height="88" rx="6" fill="url(#spGlass)"/>
  <g clip-path="url(#spGlassClip)">
    ${glow ? `<rect x="53" y="100" width="82" height="88" fill="url(#spGlow)"/>` : ""}
    ${flames}
    <path d="M60 104 L80 104 L58 150 Z" fill="#fff" opacity="0.06"/>
  </g>
  <rect x="53" y="100" width="82" height="88" rx="6" fill="none" stroke="#5b626e" stroke-width="1.5"/>
  <rect x="141" y="130" width="6" height="30" rx="3" fill="#b9bec8"/>
  <rect x="38" y="216" width="112" height="32" rx="6" fill="#1a1e24"/>
  <circle cx="66" cy="232" r="8" fill="#9aa1ad"/><circle cx="66" cy="232" r="8" fill="none" stroke="#5b626e"/><line x1="66" y1="232" x2="66" y2="226" stroke="#20242b" stroke-width="2" stroke-linecap="round"/>
  <circle cx="122" cy="232" r="8" fill="#9aa1ad"/><circle cx="122" cy="232" r="8" fill="none" stroke="#5b626e"/><line x1="122" y1="232" x2="127" y2="228" stroke="#20242b" stroke-width="2" stroke-linecap="round"/>
  <rect x="82" y="222" width="24" height="20" rx="3" fill="${lcdColor}"/>
  ${lcdText ? `<text x="94" y="236" text-anchor="middle" font-family="monospace" font-size="9" font-weight="700" fill="#10141a">${lcdText}</text>` : ""}
  <rect x="56" y="254" width="76" height="30" rx="5" fill="#222730"/>
  <rect x="62" y="262" width="64" height="4" rx="2" fill="#0f1217"/>
  <rect x="82" y="270" width="24" height="5" rx="2.5" fill="#9aa1ad"/>
  <rect x="20" y="294" width="148" height="12" rx="5" fill="#161a20"/>
  ${unavailable ? `<rect x="6" y="42" width="176" height="264" rx="14" fill="#9aa1ad" opacity="0.55"/><text x="94" y="190" text-anchor="middle" font-family="sans-serif" font-size="64" font-weight="700" fill="#fff">?</text>` : ""}
</svg>`;
}
