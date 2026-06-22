# @greymoth/tokens

The greymoth visual identity in one authoritative place: a "letterpress on warm
paper" system — paper + ink + an oxblood anchor, IBM Plex Mono, a distressed
verdict stamp, and a faint risograph grain. **Not** a dark dev-tool theme.

Available as typed JS objects and as matching `--gm-*` CSS variables.

Part of [greymoth-devkit](https://github.com/greymoth-jp/greymoth-devkit).

```bash
npm i @greymoth/tokens
```

```ts
import { color, font, toCss, cssVar } from "@greymoth/tokens";

color.paper;    // "#f1ead8"
color.ink;      // "#211c14"
color.oxblood;  // "#9c3a2c"  ← the brand anchor
font.mono;      // "IBM Plex Mono", ...
cssVar("oxblood"); // "--gm-oxblood"
```

```css
/* or pull the variables */
@import "@greymoth/tokens/tokens.css";
.thing { color: var(--gm-oxblood); font-family: var(--gm-font-mono); }
```

## What's inside

- `color` — paper / paper2 / ink / ink-soft / rule / **oxblood** / ochre / amber /
  sage, plus the semantic verdict triad crit / warn / ok.
- `font` — `mono` (IBM Plex Mono–led) and `serif` (Fraunces–led) stacks.
- `space`, `radius`, `shadow`, `stampRotation`.
- `inkbleedFilter` — an SVG `<filter>` for stamp distress.
- `grainDataUri` — a tileable risograph grain for `background-image`.
- `toCss(selector?)` — generates the `:root { --gm-* }` block (the single source
  `tokens.css` is built from, so JS and CSS never drift).

MIT © greymoth
