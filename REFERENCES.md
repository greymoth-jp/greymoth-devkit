# References & provenance

This toolkit is an **extraction and canonicalization of greymoth's own code** — the
same patterns reimplemented across roughly two dozen apps, written once here. No
third-party source was copied. Everything below is the author's own work, MIT.

## Where each package came from (own code, canonicalized)

| Package | Canonicalized from (own apps) |
|---|---|
| `@greymoth/tokens` | `builder-archive` (`index.html`, `src/cards.ts`), `geo-citation-radar` (`ui/terminal.template.html`), `oss-survival-corpus` (`src/build_site.ts`), `cancel-friction-analyzer` (`src/scorecard.ts`), `inkdex` (`extension/popup.css`) |
| `@greymoth/rules-core` | `llm-shield` (`src/engine.ts`, `src/heuristics.ts` — noisy-OR), `cancel-friction-analyzer` (`src/score.ts` — penalty budget), `oss-survival-corpus` (`src/survival.ts`, `src/audit.ts` — invariants), audit-ledger suite (`REQ_DEFINITIONS.md`) |
| `@greymoth/scorecard` | `deliverability-checker` (`ScoreRing.tsx`, `CheckBadge.tsx`), `subject-checker`, `overfit-checker` (`dsr.ts`), `cancel-friction-analyzer` (`scorecard.ts`), `geo-checker` (`geo-analyzer.ts`) |
| `@greymoth/sharecard` | `105_sharecard` (`card-renderer.ts` — the SVG-string prototype), `cc-usage`/`gh-wrapped` (`card.mjs`), `inkdex` (`card.js`), plus the `@vercel/og` cards in `warikancho`/`kelly-calculator`/`tane`/`Glovrex` |

The 6 scoring invariants (bounded · deterministic · monotone · conservative ·
explainable · graded) are carried over from `oss-survival-corpus/src/audit.ts`.

## Third-party code

None vendored or copied. Runtime dependencies across all four packages: **zero**.
Dev dependency: `typescript` (Apache-2.0). The published cards reference the
`IBM Plex Mono` / `Fraunces` families by name via font stacks (with system
fallbacks); no font files are bundled.

## Design

Direction was the existing greymoth identity (above); build quality bar via the
`frontend-design` skill. No external design templates or code references were
fetched, so there is nothing to log to `Desktop/GitRepo/REFERENCES.md` for this work.

## License

MIT for all packages — see [LICENSE](./LICENSE). © 2026 greymoth (Masahiro Hirakawa).
