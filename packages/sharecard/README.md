# @greymoth/sharecard

born-to-share cards as zero-dependency SVG strings — a hero value, a title, an
optional verdict stamp, on warm paper with a risograph off-register hero. Runs on
a server, an edge runtime, or in the browser. Deterministic, including the serial.

Part of [greymoth-devkit](https://github.com/greymoth-jp/greymoth-devkit).

```bash
npm i @greymoth/sharecard
```

```ts
import { shareCardSvg, scoreCardSvg, serialOf } from "@greymoth/sharecard";

// from a raw score: score → verdict → card (one call)
scoreCardSvg({ score: 91, title: "Repository health" });

// or compose the card yourself
shareCardSvg({
  kicker: "greymoth · llm-shield",
  metric: "97",
  title: "Prompt-injection risk",
  verdict: { label: "BLOCK" },
});

serialOf({ metric: "97" }); // "CARD-1A2B3C" — deterministic (FNV-1a, no clock/random)
```

## API

- `shareCardSvg(data, opts?) → string` — full 1200×630 (configurable) SVG card.
- `scoreCardSvg(input, opts?) → string` — resolves a verdict from a 0–100 score
  (via `@greymoth/scorecard`) and renders the card; hero = the score, stamp = the verdict.
- `serialOf(data) → string` — the deterministic `CARD-XXXXXX` serial for a card.

Why SVG strings, not Canvas: portability (server/edge/browser), zero dependencies,
nothing external embedded, and trivial testing (assert on the output string).
Rasterize with any headless browser or with `@vercel/og`'s Satori.

MIT © greymoth
