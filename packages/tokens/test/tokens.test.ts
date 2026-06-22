import { test } from "node:test";
import assert from "node:assert/strict";
import { color, font, tokens, cssVar, toCss } from "../src/index.ts";

test("signature colors are stable (these are the brand)", () => {
  assert.equal(color.paper, "#f1ead8");
  assert.equal(color.ink, "#211c14");
  assert.equal(color.oxblood, "#9c3a2c");
  assert.equal(color.crit, "#c8341e");
  assert.equal(color.ok, "#2e5e3a");
});

test("every color is a 6-digit hex", () => {
  for (const [name, v] of Object.entries(color)) {
    assert.match(v, /^#[0-9a-f]{6}$/, `${name} should be lowercase 6-digit hex, got ${v}`);
  }
});

test("font stacks lead with the canonical families", () => {
  assert.ok(font.mono.startsWith('"IBM Plex Mono"'));
  assert.ok(font.serif.startsWith('"Fraunces"'));
});

test("cssVar maps token name to kebab-cased --gm-* property", () => {
  assert.equal(cssVar("oxblood"), "--gm-oxblood");
  assert.equal(cssVar("paper"), "--gm-paper");
  assert.equal(cssVar("oxbloodDeep"), "--gm-oxblood-deep");
  assert.equal(cssVar("inkSoft"), "--gm-ink-soft");
});

test("toCss emits a :root block with all colors as kebab --gm-* vars", () => {
  const css = toCss();
  assert.ok(css.startsWith(":root {"));
  for (const name of Object.keys(color) as (keyof typeof color)[]) {
    assert.ok(css.includes(`${cssVar(name)}: ${color[name]};`), `missing ${cssVar(name)}`);
  }
  assert.ok(css.includes("--gm-font-mono:"));
  assert.ok(css.includes("--gm-stamp-rotation: -7deg;"));
});

test("toCss accepts a custom selector", () => {
  assert.ok(toCss(".gm").startsWith(".gm {"));
});

test("toCss is deterministic", () => {
  assert.equal(toCss(), toCss());
});

test("effects are present and well-formed", () => {
  assert.ok(tokens.inkbleedFilter.includes('id="gm-inkbleed"'));
  assert.ok(tokens.inkbleedFilter.includes("feDisplacementMap"));
  assert.ok(tokens.grainDataUri.startsWith("data:image/svg+xml,"));
  assert.equal(tokens.stampRotation, "-7deg");
});
