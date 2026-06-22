# @greymoth/rules-core

A deterministic rule engine. No LLM, no network, no randomness. Define rules as
plain data, run any subject through them, get back findings plus a 0–100 score
where every point lost is attributable to a named rule.

Part of [greymoth-devkit](https://github.com/greymoth-jp/greymoth-devkit).

```bash
npm i @greymoth/rules-core
```

```ts
import { evaluate, noisyOr, failures, rule } from "@greymoth/rules-core";

const rules = [
  rule({ id: "license", title: "LICENSE present", severity: "error", weight: 3, test: (r) => r.hasLicense }),
  rule({ id: "tests",   title: "Has a test suite", severity: "error", weight: 3, test: (r) => r.hasTests }),
];

const r = evaluate(rules, { hasLicense: true, hasTests: false });
r.score;       // 50
failures(r);   // [{ ruleId: "tests", lost: 3, ... }]
```

## API

- `evaluate(rules, subject) → Report` — linear budget scoring. A failing rule
  subtracts up to its `weight`; rules may return `{ passed, penaltyRatio }` for
  partial credit. `score = round((1 − lostWeight / maxWeight) × 100)`.
- `noisyOr(rules, subject) → RiskReport` — independent signals accumulate but
  saturate: `risk = 1 − ∏(1 − weight_i)` over failed rules (weights in [0,1]).
- `failures(report) → Finding[]` — failing findings, worst-first.
- `rule(def)` — identity helper for authoring a typed rule.

Deterministic and idempotent: identical inputs always produce identical output.

MIT © greymoth
