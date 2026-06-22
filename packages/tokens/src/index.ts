/**
 * @greymoth/tokens
 *
 * The greymoth visual identity, in one place. This is the "letterpress on
 * warm paper" look that had been hand-copied across builder-archive,
 * geo-citation-radar, oss-survival-corpus, cancel-friction-analyzer and
 * others — reconciled here into a single authoritative source.
 *
 * It is NOT a dark dev-tool theme. The anchor is paper + ink + oxblood,
 * a distressed verdict stamp, and a faint risograph grain.
 *
 * Everything is a plain value: import the typed objects in JS/TS, or pull
 * `tokens.css` for the matching `--gm-*` custom properties.
 */

/** Core palette. `oxblood` is the brand anchor; crit/warn/ok are semantic. */
export const color = {
  /** Warm bone paper — the default surface. */
  paper: "#f1ead8",
  /** Slightly deeper paper, for raised/inset panels. */
  paper2: "#e9e0c9",
  /** Paper edge / hairline fills. */
  paperEdge: "#d8ccb4",
  /** Deep brown ink — primary text. NOT pure black. */
  ink: "#211c14",
  /** Muted ink — secondary text. */
  inkSoft: "#4a4233",
  /** Divider / grid rule. */
  rule: "#cfc4a6",
  /** Signature oxblood accent — the single most recognizable greymoth color. */
  oxblood: "#9c3a2c",
  /** Deeper oxblood, for pressed/active states. */
  oxbloodDeep: "#7c2415",
  /** Ochre tertiary accent. */
  ochre: "#b07d2c",
  /** Amber, used as the "warn" hue in some tools. */
  amber: "#c2790b",
  /** Sage, used as the "ok" hue in some tools. */
  sage: "#5e6b4f",
  /** Semantic: critical / fail (distressed vermillion). */
  crit: "#c8341e",
  /** Semantic: warning. */
  warn: "#a8761a",
  /** Semantic: ok / pass. */
  ok: "#2e5e3a",
} as const;

export type ColorToken = keyof typeof color;

/** Type stacks. IBM Plex Mono leads; serif display is Fraunces-first. */
export const font = {
  mono: '"IBM Plex Mono", "DM Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  serif: '"Fraunces", "Didot", "Bodoni MT", Georgia, "Times New Roman", serif',
} as const;

/** Spacing scale (px). Compact, print-grid feel. */
export const space = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 22,
  xl: 36,
  xxl: 56,
} as const;

/** Radii. The aesthetic is mostly sharp; only stamps/cards round slightly. */
export const radius = {
  sharp: "0",
  stamp: "3px",
  card: "4px",
} as const;

/** Shadows lifted verbatim from the recurring card style. */
export const shadow = {
  card: "0 1px 0 #fff8, 0 12px 30px -18px #0007",
  inset: "0 1px 0 #fff inset, 0 18px 50px -30px rgba(0,0,0,.45)",
  frame: "0 0 0 4px var(--gm-paper), 0 0 0 5px var(--gm-ink)",
} as const;

/** The verdict stamp's signature rotation. */
export const stampRotation = "-7deg" as const;

/**
 * An SVG `<filter>` that gives ink-bleed distress to stamps. Drop the markup
 * inside an `<svg><defs>…</defs></svg>` and reference it via
 * `filter: url(#gm-inkbleed)`.
 */
export const inkbleedFilter = `<filter id="gm-inkbleed" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2" xChannelSelector="R" yChannelSelector="G"/></filter>`;

/**
 * A tileable risograph grain as a data-URI, for `background-image`.
 * Layer it with `mix-blend-mode: multiply; opacity: .30`.
 */
export const grainDataUri =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

/** The full token set, grouped. */
export const tokens = {
  color,
  font,
  space,
  radius,
  shadow,
  stampRotation,
  inkbleedFilter,
  grainDataUri,
} as const;

export type Tokens = typeof tokens;

const camelToKebab = (s: string): string => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** Map a color token to its CSS custom-property name, e.g. "oxbloodDeep" → "--gm-oxblood-deep". */
export function cssVar(name: ColorToken): string {
  return `--gm-${camelToKebab(name)}`;
}

/**
 * Generate the `:root { … }` block of `--gm-*` custom properties.
 * This is the single source `tokens.css` is built from.
 */
export function toCss(selector = ":root"): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(color)) lines.push(`  --gm-${camelToKebab(k)}: ${v};`);
  lines.push(`  --gm-font-mono: ${font.mono};`);
  lines.push(`  --gm-font-serif: ${font.serif};`);
  for (const [k, v] of Object.entries(space)) lines.push(`  --gm-space-${k}: ${v}px;`);
  for (const [k, v] of Object.entries(radius)) lines.push(`  --gm-radius-${camelToKebab(k)}: ${v};`);
  for (const [k, v] of Object.entries(shadow)) lines.push(`  --gm-shadow-${camelToKebab(k)}: ${v};`);
  lines.push(`  --gm-stamp-rotation: ${stampRotation};`);
  return `${selector} {\n${lines.join("\n")}\n}\n`;
}
