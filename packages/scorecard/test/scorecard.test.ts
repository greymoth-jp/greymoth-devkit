import { test } from "node:test";
import assert from "node:assert/strict";
import {
  verdict,
  defaultBands,
  levelColor,
  escapeXml,
  verdictStampSvg,
  verdictStampHtml,
  scorecardHtml,
  type Band,
} from "../src/index.ts";
import { color } from "@greymoth/tokens";

test("verdict maps default bands correctly", () => {
  assert.equal(verdict(95).level, "ok");
  assert.equal(verdict(80).level, "ok"); // inclusive lower bound
  assert.equal(verdict(79).level, "warn");
  assert.equal(verdict(60).level, "warn");
  assert.equal(verdict(59).level, "risk");
  assert.equal(verdict(40).level, "risk");
  assert.equal(verdict(39).level, "crit");
  assert.equal(verdict(0).level, "crit");
});

test("verdict color comes from the level map (tokens)", () => {
  assert.equal(verdict(90).color, color.ok);
  assert.equal(verdict(10).color, color.crit);
  assert.equal(levelColor.risk, color.oxblood);
});

test("verdict clamps and rounds the score", () => {
  assert.equal(verdict(150).score, 100);
  assert.equal(verdict(-20).score, 0);
  assert.equal(verdict(72.6).score, 73);
});

test("verdict uses lowest band as floor even with custom bands", () => {
  const bands: Band[] = [
    { min: 50, level: "ok", label: "GOOD" },
    { min: 10, level: "crit", label: "BAD" },
  ];
  assert.equal(verdict(5, bands).label, "BAD"); // below all mins -> floor
  assert.equal(verdict(60, bands).label, "GOOD");
});

test("verdict throws on empty bands", () => {
  assert.throws(() => verdict(50, []), RangeError);
});

test("escapeXml neutralizes markup", () => {
  assert.equal(escapeXml(`<img src=x onerror="alert(1)">`), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  assert.equal(escapeXml("a & b"), "a &amp; b");
});

test("verdictStampSvg is a well-formed <g> with the color and label", () => {
  const v = verdict(30);
  const svg = verdictStampSvg(v, 100, 50);
  assert.ok(svg.startsWith("<g "));
  assert.ok(svg.includes("</g>"));
  assert.ok(svg.includes(v.color));
  assert.ok(svg.includes("FAIL"));
  assert.ok(svg.includes("rotate(-7)"));
  assert.ok(svg.includes('filter="url(#gm-inkbleed)"'));
  // two rects = double border
  assert.equal(svg.match(/<rect /g)?.length, 2);
});

test("verdictStampSvg can disable distress filter", () => {
  const svg = verdictStampSvg(verdict(90), 0, 0, { distress: false });
  assert.ok(!svg.includes("filter="));
});

test("verdictStampSvg escapes the label", () => {
  const svg = verdictStampSvg({ color: "#000", label: "<x>" }, 0, 0);
  assert.ok(svg.includes("&lt;X&gt;"));
  assert.ok(!svg.includes("<x>"));
});

test("verdictStampHtml carries inline style and label", () => {
  const html = verdictStampHtml(verdict(50));
  assert.ok(html.startsWith("<span"));
  assert.ok(html.includes("rotate(-7deg)"));
  assert.ok(html.includes("AT RISK"));
});

test("scorecardHtml renders the number, unit and stamp", () => {
  const html = scorecardHtml({ score: 73, title: "Deliverability" });
  assert.ok(html.includes(">73<"));
  assert.ok(html.includes("/ 100"));
  assert.ok(html.includes("Deliverability")); // title kept verbatim; CSS uppercases visually
  assert.ok(html.includes("text-transform:uppercase"));
  assert.ok(html.includes("NEEDS WORK")); // verdict for 73
});

test("scorecardHtml accepts a custom unit", () => {
  assert.ok(scorecardHtml({ score: 50, unit: "pts" }).includes("pts"));
});

test("render functions are deterministic", () => {
  assert.equal(verdictStampSvg(verdict(42), 10, 20), verdictStampSvg(verdict(42), 10, 20));
  assert.equal(scorecardHtml({ score: 42, title: "x" }), scorecardHtml({ score: 42, title: "x" }));
});

test("defaultBands cover the full 0-100 range", () => {
  assert.ok(defaultBands.some((b) => b.min === 0));
  for (let s = 0; s <= 100; s += 7) assert.ok(verdict(s).label.length > 0);
});
