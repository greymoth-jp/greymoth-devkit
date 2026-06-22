/**
 * @greymoth/sharecard
 *
 * born-to-share cards as zero-dependency SVG strings. The pattern recurring
 * across 105_sharecard, cc-usage, gh-wrapped, inkdex and others: a hero
 * value, a title, an optional verdict stamp, on warm paper with a risograph
 * off-register hero and a faint grain.
 *
 * SVG strings (not Canvas) on purpose: they run on a server, an edge runtime
 * or a browser, embed nothing external, and are trivially testable. Rasterize
 * with any headless browser or with @vercel/og's Satori.
 *
 * Deterministic: identical input always yields an identical string, including
 * the CARD-XXXXXX serial. No clock, no randomness, no network.
 */

import { color, font, tokens } from "@greymoth/tokens";
import {
  verdict as toVerdict,
  verdictStampSvg,
  escapeXml,
  type VerdictLevel,
  type Band,
} from "@greymoth/scorecard";

export interface ShareCardVerdict {
  label: string;
  color?: string;
}

export interface ShareCardData {
  /** Eyebrow label, top-left. Defaults to "GREYMOTH". */
  kicker?: string;
  /** The hero value: "73", "87%", "¥1.5M", "1,204". */
  metric?: string;
  /** What the metric means. */
  title?: string;
  /** A context line under the title. */
  subtitle?: string;
  /** Optional verdict stamp, bottom-right. */
  verdict?: ShareCardVerdict;
  /** Brand wordmark, bottom-left. Defaults to "greymoth". */
  brand?: string;
}

export interface ShareCardOptions {
  width?: number;
  height?: number;
  /** Override the computed serial. */
  serial?: string;
  /** Render the risograph grain overlay. Default true. */
  grain?: boolean;
}

/** Deterministic 32-bit FNV-1a hash → 6 hex chars. No randomness. */
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 6).toUpperCase();
}

/** The deterministic serial for a card's data, e.g. "CARD-1A2B3C". */
export function serialOf(data: ShareCardData): string {
  return `CARD-${fnv1a(JSON.stringify(data))}`;
}

function heroFontSize(len: number): number {
  if (len <= 3) return 240;
  if (len <= 6) return 168;
  if (len <= 10) return 120;
  return 92;
}

/**
 * Render a born-to-share card as an SVG string.
 */
export function shareCardSvg(data: ShareCardData, opts: ShareCardOptions = {}): string {
  const W = opts.width ?? 1200;
  const H = opts.height ?? 630;
  const grain = opts.grain ?? true;
  const serial = opts.serial ?? serialOf(data);

  const kicker = escapeXml((data.kicker ?? "GREYMOTH").toUpperCase());
  const metric = data.metric ? escapeXml(data.metric) : "";
  const title = data.title ? escapeXml(data.title) : "";
  const subtitle = data.subtitle ? escapeXml(data.subtitle) : "";
  const brand = escapeXml(data.brand ?? "greymoth");

  const mono = font.mono.replace(/"/g, "'");
  const serif = font.serif.replace(/"/g, "'");

  const m = 64;
  const heroSize = heroFontSize(metric.length);
  const heroBaseline = 300;

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${title || metric || brand}">`,
  );

  // defs: ink-bleed for the stamp + tiled grain
  parts.push(`<defs>${tokens.inkbleedFilter}`);
  if (grain) {
    parts.push(
      `<pattern id="gm-grain" width="220" height="220" patternUnits="userSpaceOnUse"><image href="${tokens.grainDataUri}" width="220" height="220"/></pattern>`,
    );
  }
  parts.push(`</defs>`);

  // surface
  parts.push(`<rect width="${W}" height="${H}" fill="${color.paper}"/>`);

  // double frame (ink outer, oxblood inner)
  parts.push(
    `<rect x="18" y="18" width="${W - 36}" height="${H - 36}" fill="none" stroke="${color.ink}" stroke-width="2.5"/>`,
  );
  parts.push(
    `<rect x="27" y="27" width="${W - 54}" height="${H - 54}" fill="none" stroke="${color.oxblood}" stroke-width="1.25"/>`,
  );

  // kicker eyebrow
  parts.push(
    `<text x="${m}" y="96" font-family="${mono}" font-size="22" letter-spacing="6" fill="${color.oxblood}">${kicker}</text>`,
  );
  parts.push(`<line x1="${m}" y1="116" x2="${m + 120}" y2="116" stroke="${color.oxblood}" stroke-width="3"/>`);

  // hero metric with risograph off-register ghost
  if (metric) {
    parts.push(
      `<text x="${m + 6}" y="${heroBaseline + 6}" font-family="${mono}" font-weight="700" font-size="${heroSize}" letter-spacing="-6" fill="${color.oxblood}" opacity="0.26">${metric}</text>`,
    );
    parts.push(
      `<text x="${m}" y="${heroBaseline}" font-family="${mono}" font-weight="700" font-size="${heroSize}" letter-spacing="-6" fill="${color.ink}">${metric}</text>`,
    );
  }

  // verdict stamp, upper-right
  if (data.verdict) {
    const stampColor = data.verdict.color ?? color.crit;
    parts.push(verdictStampSvg({ color: stampColor, label: data.verdict.label }, W - 230, 150, { scale: 1.1 }));
  }

  // title + subtitle
  if (title) {
    parts.push(
      `<text x="${m}" y="430" font-family="${serif}" font-weight="900" font-size="50" fill="${color.ink}">${title}</text>`,
    );
  }
  if (subtitle) {
    parts.push(
      `<text x="${m}" y="474" font-family="${mono}" font-size="22" letter-spacing="0.5" fill="${color.inkSoft}">${subtitle}</text>`,
    );
  }

  // footer rule + brand + serial
  const fy = H - 48;
  parts.push(`<line x1="${m}" y1="${fy - 26}" x2="${W - m}" y2="${fy - 26}" stroke="${color.rule}" stroke-width="1.5"/>`);
  parts.push(
    `<text x="${m}" y="${fy}" font-family="${serif}" font-weight="900" font-size="26" fill="${color.ink}">${brand}</text>`,
  );
  parts.push(
    `<text x="${W - m}" y="${fy}" text-anchor="end" font-family="${mono}" font-size="16" letter-spacing="2" fill="${color.inkSoft}">${escapeXml(serial)}</text>`,
  );

  // grain overlay last (multiply)
  if (grain) {
    parts.push(
      `<rect width="${W}" height="${H}" fill="url(#gm-grain)" opacity="0.18" style="mix-blend-mode:multiply"/>`,
    );
  }

  parts.push(`</svg>`);
  return parts.join("\n");
}

export interface ScoreCardInput {
  score: number;
  kicker?: string;
  title?: string;
  subtitle?: string;
  brand?: string;
  bands?: ReadonlyArray<Band>;
}

/**
 * The headline composition: take a 0–100 score, resolve a verdict via
 * @greymoth/scorecard, and render a share card whose hero is the score and
 * whose stamp is the verdict. This is rules-core → scorecard → sharecard in
 * one call.
 */
export function scoreCardSvg(input: ScoreCardInput, opts: ShareCardOptions = {}): string {
  const v = toVerdict(input.score, input.bands);
  const data: ShareCardData = {
    metric: String(v.score),
    verdict: { label: v.label, color: v.color },
  };
  if (input.kicker !== undefined) data.kicker = input.kicker;
  if (input.title !== undefined) data.title = input.title;
  if (input.subtitle !== undefined) data.subtitle = input.subtitle;
  if (input.brand !== undefined) data.brand = input.brand;
  return shareCardSvg(data, opts);
}

export type { VerdictLevel, Band };
