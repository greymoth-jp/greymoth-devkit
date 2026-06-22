/**
 * @greymoth/scorecard
 *
 * Turn a 0–100 score into a verdict (level + label + color) and render it the
 * greymoth way: a big mono number with a distressed, rotated verdict stamp.
 *
 * This is the piece copy-pasted across the checker apps (deliverability,
 * subject, overfit, geo, cancel-friction): every one mapped a score to bands
 * and drew the same stamp. Here it is once, as framework-agnostic strings.
 */

import { color } from "@greymoth/tokens";

export type VerdictLevel = "ok" | "warn" | "risk" | "crit";

/** A scoring band. `min` is the inclusive lower bound on a 0–100 scale. */
export interface Band {
  min: number;
  level: VerdictLevel;
  label: string;
}

export interface Verdict {
  score: number;
  level: VerdictLevel;
  label: string;
  color: string;
}

/** Default four-band split, the median of what the apps actually used. */
export const defaultBands: ReadonlyArray<Band> = [
  { min: 80, level: "ok", label: "PASS" },
  { min: 60, level: "warn", label: "NEEDS WORK" },
  { min: 40, level: "risk", label: "AT RISK" },
  { min: 0, level: "crit", label: "FAIL" },
];

/** Maps a verdict level to a greymoth color. Override per call if needed. */
export const levelColor: Readonly<Record<VerdictLevel, string>> = {
  ok: color.ok,
  warn: color.amber,
  risk: color.oxblood,
  crit: color.crit,
};

const clamp100 = (n: number): number => (n < 0 ? 0 : n > 100 ? 100 : n);

/** Escape text for safe inclusion in SVG/HTML. */
export function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}

/**
 * Resolve a score to a verdict using `bands` (sorted high→low internally).
 * The score is clamped to 0–100 and rounded.
 */
export function verdict(
  score: number,
  bands: ReadonlyArray<Band> = defaultBands,
  colors: Readonly<Record<VerdictLevel, string>> = levelColor,
): Verdict {
  if (bands.length === 0) throw new RangeError("verdict() requires at least one band");
  const s = Math.round(clamp100(score));
  const sorted = [...bands].sort((a, b) => b.min - a.min);
  // The lowest band acts as the floor regardless of its min.
  const hit = sorted.find((b) => s >= b.min) ?? sorted[sorted.length - 1]!;
  return { score: s, level: hit.level, label: hit.label, color: colors[hit.level] };
}

export interface StampOptions {
  label: string;
  color?: string;
  /** Rotation in degrees. Defaults to the greymoth -7°. */
  rotate?: number;
  /** Apply the ink-bleed SVG filter (host SVG must define #gm-inkbleed). */
  distress?: boolean;
}

/**
 * A verdict stamp as an SVG `<g>` fragment, positioned at (x, y) = its center.
 * Drop it into a larger SVG. The double border is drawn as two rects.
 */
export function verdictStampSvg(
  v: Pick<Verdict, "color"> & { label: string },
  x: number,
  y: number,
  opts: { rotate?: number; distress?: boolean; scale?: number } = {},
): string {
  const { rotate = -7, distress = true, scale = 1 } = opts;
  const label = escapeXml(v.label.toUpperCase());
  const fontSize = 30 * scale;
  const padX = 22 * scale;
  const padY = 12 * scale;
  // Approx text width for monospace at ~0.6em per char.
  const w = label.length * fontSize * 0.62 + padX * 2;
  const h = fontSize + padY * 2;
  const filter = distress ? ` filter="url(#gm-inkbleed)"` : "";
  return `<g transform="translate(${x} ${y}) rotate(${rotate})"${filter} opacity="0.92">
  <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="none" stroke="${v.color}" stroke-width="${2 * scale}"/>
  <rect x="${-w / 2 + 4 * scale}" y="${-h / 2 + 4 * scale}" width="${w - 8 * scale}" height="${h - 8 * scale}" fill="none" stroke="${v.color}" stroke-width="${1.5 * scale}"/>
  <text x="0" y="${fontSize * 0.35}" text-anchor="middle" font-family="'IBM Plex Mono', ui-monospace, monospace" font-weight="700" font-size="${fontSize}" letter-spacing="${2 * scale}" fill="${v.color}">${label}</text>
</g>`;
}

/** A verdict stamp as an inline-styled HTML `<span>` (assumes tokens.css loaded). */
export function verdictStampHtml(v: Pick<Verdict, "color" | "label">, rotate = -7): string {
  const label = escapeXml(v.label.toUpperCase());
  return `<span style="display:inline-block;border:3px double ${v.color};color:${v.color};padding:8px 16px;transform:rotate(${rotate}deg);font-family:var(--gm-font-mono,'IBM Plex Mono',monospace);letter-spacing:.12em;font-weight:700;font-size:16px;border-radius:3px;opacity:.92;text-transform:uppercase">${label}</span>`;
}

export interface ScorecardOptions {
  score: number;
  title?: string;
  /** Unit shown after the number. Defaults to "/ 100". */
  unit?: string;
  bands?: ReadonlyArray<Band>;
}

/**
 * A self-contained HTML scorecard block (big number + verdict stamp), the
 * shape the checker apps render inline. Assumes `@greymoth/tokens/tokens.css`
 * is loaded for the `--gm-*` variables; falls back to literal colors otherwise.
 */
export function scorecardHtml(opts: ScorecardOptions): string {
  const v = verdict(opts.score, opts.bands);
  const title = opts.title ? escapeXml(opts.title) : "";
  const unit = escapeXml(opts.unit ?? "/ 100");
  return `<div style="display:flex;align-items:center;gap:24px;font-family:var(--gm-font-mono,'IBM Plex Mono',monospace);color:var(--gm-ink,#211c14)">
  <div style="display:flex;flex-direction:column;gap:2px">
    ${title ? `<div style="font-size:13px;letter-spacing:.15em;text-transform:uppercase;color:var(--gm-ink-soft,#4a4233)">${title}</div>` : ""}
    <div style="display:flex;align-items:baseline;gap:8px">
      <span style="font-size:clamp(64px,14vw,96px);font-weight:600;line-height:1;letter-spacing:-.04em;color:${v.color}">${v.score}</span>
      <span style="font-size:16px;color:var(--gm-ink-soft,#4a4233)">${unit}</span>
    </div>
  </div>
  ${verdictStampHtml(v)}
</div>`;
}
