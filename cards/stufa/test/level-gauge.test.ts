import { test } from "node:test";
import assert from "node:assert/strict";
import { fanSpinSeconds, fanSvg, levelGaugeSvg } from "../src/level-gauge";

test("ventolina: giro piu' veloce con piu' ventilatore, ferma senza stima", () => {
  assert.equal(fanSpinSeconds(null), null);
  assert.equal(fanSpinSeconds(0), 2.6);
  assert.equal(fanSpinSeconds(100), 0.4);
  assert.ok((fanSpinSeconds(80) as number) < (fanSpinSeconds(20) as number));
  assert.equal(fanSpinSeconds(250), 0.4);
  assert.equal(fanSpinSeconds(-5), 2.6);
});

test("indicatore dei livelli: un solo tratto colorato e la sigla al centro", () => {
  const coloured = (svg: string) => (svg.match(/stroke="#/g) ?? []).length;
  assert.equal(coloured(levelGaugeSvg([2])), 1);
  assert.match(levelGaugeSvg([2]), />P2</);
  assert.equal(coloured(levelGaugeSvg([])), 0);
  assert.match(levelGaugeSvg([]), />–</);
  assert.equal((levelGaugeSvg([1]).match(/<path/g) ?? []).length, 3);
});

test("indicatore dei livelli: dove due livelli sono possibili si colorano entrambi", () => {
  const coloured = (svg: string) => (svg.match(/stroke="#/g) ?? []).length;
  assert.equal(coloured(levelGaugeSvg([1, 2])), 2);
  assert.match(levelGaugeSvg([1, 2]), />P1\/P2</);
});

test("ventolina: quattro pale", () => {
  assert.equal((fanSvg().match(/<path/g) ?? []).length, 4);
});
