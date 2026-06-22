import { test } from "node:test";
import assert from "node:assert/strict";
import { shareCardSvg, scoreCardSvg, serialOf } from "../src/index.ts";
import { color } from "@greymoth/tokens";

test("serialOf is deterministic and well-formed", () => {
  const data = { metric: "73", title: "Repo health" };
  const a = serialOf(data);
  const b = serialOf(data);
  assert.equal(a, b);
  assert.match(a, /^CARD-[0-9A-F]{6}$/);
});

test("serialOf changes with the data", () => {
  assert.notEqual(serialOf({ metric: "73" }), serialOf({ metric: "74" }));
});

test("shareCardSvg returns a valid SVG at the OG size", () => {
  const svg = shareCardSvg({ metric: "87", title: "AI visibility" });
  assert.ok(svg.startsWith("<svg "));
  assert.ok(svg.trimEnd().endsWith("</svg>"));
  assert.ok(svg.includes('width="1200"'));
  assert.ok(svg.includes('height="630"'));
  assert.ok(svg.includes(`fill="${color.paper}"`)); // paper surface
});

test("hero metric is drawn twice (riso off-register ghost + ink)", () => {
  const svg = shareCardSvg({ metric: "87" });
  assert.equal(svg.match(/>87</g)?.length, 2);
  assert.ok(svg.includes(color.oxblood)); // the ghost color
});

test("kicker defaults to GREYMOTH and is uppercased", () => {
  assert.ok(shareCardSvg({ metric: "1" }).includes(">GREYMOTH<"));
  assert.ok(shareCardSvg({ metric: "1", kicker: "repo health" }).includes(">REPO HEALTH<"));
});

test("verdict stamp is included when provided", () => {
  const svg = shareCardSvg({ metric: "30", verdict: { label: "FAIL", color: color.crit } });
  assert.ok(svg.includes("FAIL"));
  assert.ok(svg.includes("url(#gm-inkbleed)")); // stamp distress filter + its def
});

test("grain can be disabled", () => {
  const withGrain = shareCardSvg({ metric: "50" });
  const noGrain = shareCardSvg({ metric: "50" }, { grain: false });
  assert.ok(withGrain.includes("gm-grain"));
  assert.ok(!noGrain.includes("gm-grain"));
});

test("custom dimensions are honored", () => {
  const svg = shareCardSvg({ metric: "9" }, { width: 1080, height: 1350 });
  assert.ok(svg.includes('width="1080"'));
  assert.ok(svg.includes('height="1350"'));
});

test("text is escaped (no injection through title)", () => {
  const svg = shareCardSvg({ title: `</text><script>alert(1)</script>` });
  assert.ok(!svg.includes("<script>"));
  assert.ok(svg.includes("&lt;script&gt;"));
});

test("scoreCardSvg composes score -> verdict -> card", () => {
  const fail = scoreCardSvg({ score: 22, title: "Cancel friction" });
  assert.equal(fail.match(/>22</g)?.length, 2); // hero = the score
  assert.ok(fail.includes("FAIL")); // verdict for 22
  assert.ok(fail.includes(color.crit));

  const pass = scoreCardSvg({ score: 95 });
  assert.ok(pass.includes("PASS"));
  assert.ok(pass.includes(color.ok));
});

test("scoreCardSvg clamps the hero to the rounded score", () => {
  assert.ok(scoreCardSvg({ score: 142 }).includes(">100<"));
});

test("rendering is deterministic", () => {
  assert.equal(scoreCardSvg({ score: 64, title: "x" }), scoreCardSvg({ score: 64, title: "x" }));
});
