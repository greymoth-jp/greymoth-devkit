# @greymoth/scorecard

Turn a 0–100 score into a verdict (level + label + color) and render it the
greymoth way: a big mono number with a distressed, rotated verdict stamp.
Framework-agnostic — everything returns SVG or HTML strings.

Part of [greymoth-devkit](https://github.com/greymoth-jp/greymoth-devkit).

```bash
npm i @greymoth/scorecard
```

```ts
import { verdict, verdictStampSvg, verdictStampHtml, scorecardHtml } from "@greymoth/scorecard";

verdict(73);
// { score: 73, level: "warn", label: "NEEDS WORK", color: "#c2790b" }

verdictStampSvg(verdict(30), 100, 50);     // <g> fragment for an SVG
verdictStampHtml(verdict(50));             // <span> with inline styles
scorecardHtml({ score: 91, title: "Deliverability" }); // a full HTML block
```

## API

- `verdict(score, bands?, colors?) → Verdict` — clamps/rounds the score and maps
  it to a band. Default bands: `≥80 PASS · ≥60 NEEDS WORK · ≥40 AT RISK · FAIL`.
- `verdictStampSvg(v, x, y, opts?)` — the stamp as an SVG `<g>` (double border,
  −7° rotation, optional `#gm-inkbleed` distress filter).
- `verdictStampHtml(v, rotate?)` — the stamp as an inline-styled `<span>`.
- `scorecardHtml({ score, title?, unit?, bands? })` — a self-contained scorecard block.
- `escapeXml(s)` — XML/HTML escaping used by the renderers.

Colors come from [`@greymoth/tokens`](https://www.npmjs.com/package/@greymoth/tokens)
and are overridable per call.

MIT © greymoth
