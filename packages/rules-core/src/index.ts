/**
 * @greymoth/rules-core
 *
 * A deterministic rule engine. No LLM, no network, no randomness.
 * Define rules as plain data, run any subject through them, and get back
 * a list of findings plus a 0–100 score. This is the engine that sits
 * underneath greymoth's audit tools (reviewos, the audit-ledger suite,
 * llm-shield); the same shape every time so a score is always comparable.
 *
 * Design rules:
 *  - Pure: evaluate() is a function of (rules, subject) only.
 *  - Transparent: every point lost is attributable to a named rule.
 *  - Graded: a rule may pass partially (ratio 0..1), not only pass/fail.
 */

export type Severity = "info" | "warn" | "error";

/** Result a rule's `test` may return when it needs to explain itself. */
export interface RuleOutcome {
  /** true = the subject satisfies the rule (good); false = a problem. */
  passed: boolean;
  /**
   * Fraction of the rule's weight that is *lost* when not fully passed,
   * in [0, 1]. Omit for a binary rule (fail = lose full weight).
   * Example: 0.5 means "half credit" — half the weight counts against score.
   */
  penaltyRatio?: number;
  /** Human-readable explanation attached to the finding. */
  detail?: string;
}

export interface Rule<TSubject> {
  /** Stable, unique identifier (kebab-case recommended). */
  id: string;
  /** Short human label, e.g. "Has a LICENSE file". */
  title: string;
  /** Optional longer description of what the rule checks and why. */
  description?: string;
  /** Severity tag. Does not affect score by itself — `weight` does. */
  severity: Severity;
  /**
   * Non-negative contribution to the maximum score budget.
   * A failing rule subtracts up to `weight` from the budget.
   * Defaults to 1 when omitted.
   */
  weight?: number;
  /** Optional remediation hint shown when the rule fails. */
  remediation?: string;
  /**
   * The check. Return a boolean for a simple pass/fail, or a RuleOutcome
   * to attach detail / partial credit. Must be pure and deterministic.
   */
  test: (subject: TSubject) => boolean | RuleOutcome;
}

export interface Finding {
  ruleId: string;
  title: string;
  severity: Severity;
  /** true if the rule passed for this subject. */
  passed: boolean;
  /** The rule's configured weight (default 1). */
  weight: number;
  /** Weight actually lost (0 when passed; up to `weight` when failed). */
  lost: number;
  detail?: string;
  remediation?: string;
}

export interface Report {
  /** 0–100, rounded. 100 when there are no rules or nothing was lost. */
  score: number;
  findings: Finding[];
  passed: number;
  failed: number;
  total: number;
  /** Sum of all rule weights (the score budget). */
  maxWeight: number;
  /** Sum of weight lost across failing rules. */
  lostWeight: number;
}

function normalizeOutcome(raw: boolean | RuleOutcome): Required<Pick<RuleOutcome, "passed">> & {
  penaltyRatio: number;
  detail?: string;
} {
  if (typeof raw === "boolean") {
    return { passed: raw, penaltyRatio: raw ? 0 : 1 };
  }
  const passed = raw.passed;
  // A passed rule loses nothing. A failed rule loses penaltyRatio of its
  // weight (default full). Clamp to [0,1] so a bad rule can't over/under-count.
  let penaltyRatio: number;
  if (passed) {
    penaltyRatio = 0;
  } else {
    const r = raw.penaltyRatio ?? 1;
    penaltyRatio = r < 0 ? 0 : r > 1 ? 1 : r;
  }
  return raw.detail === undefined
    ? { passed, penaltyRatio }
    : { passed, penaltyRatio, detail: raw.detail };
}

/**
 * Run `subject` through `rules` and produce a transparent Report.
 * Deterministic: same inputs always yield the same output.
 */
export function evaluate<TSubject>(rules: ReadonlyArray<Rule<TSubject>>, subject: TSubject): Report {
  const findings: Finding[] = [];
  let maxWeight = 0;
  let lostWeight = 0;
  let passed = 0;
  let failed = 0;

  for (const rule of rules) {
    const weight = rule.weight ?? 1;
    if (weight < 0) {
      throw new RangeError(`Rule "${rule.id}" has negative weight ${weight}`);
    }
    maxWeight += weight;

    const outcome = normalizeOutcome(rule.test(subject));
    const lost = weight * outcome.penaltyRatio;
    lostWeight += lost;
    if (outcome.passed) passed++;
    else failed++;

    const finding: Finding = {
      ruleId: rule.id,
      title: rule.title,
      severity: rule.severity,
      passed: outcome.passed,
      weight,
      lost,
    };
    if (outcome.detail !== undefined) finding.detail = outcome.detail;
    else if (rule.description !== undefined && !outcome.passed) finding.detail = rule.description;
    if (!outcome.passed && rule.remediation !== undefined) finding.remediation = rule.remediation;
    findings.push(finding);
  }

  const score = maxWeight === 0 ? 100 : Math.round((1 - lostWeight / maxWeight) * 100);

  return {
    score,
    findings,
    passed,
    failed,
    total: rules.length,
    maxWeight,
    lostWeight,
  };
}

/** Convenience: the failing findings only, worst (highest lost weight) first. */
export function failures(report: Report): Finding[] {
  return report.findings
    .filter((f) => !f.passed)
    .sort((a, b) => b.lost - a.lost || b.weight - a.weight);
}

export interface RiskReport {
  /** Aggregate risk in [0, 1]. 0 = no signals, →1 as signals accumulate. */
  risk: number;
  /** risk × 100, rounded — a 0–100 risk score. */
  score: number;
  /** Findings whose rule fired (test returned a problem), worst-first. */
  matched: Finding[];
  /** All findings, in rule order. */
  findings: Finding[];
}

/**
 * Noisy-OR aggregation, the model used by llm-shield: treat each rule's
 * `weight` as an independent probability in [0, 1] that the subject is bad.
 * A rule that *fails* (test returns a problem) contributes its weight.
 *
 *   risk = 1 - ∏(1 - weight_i)   over failed rules
 *
 * Independent weak signals accumulate but saturate toward 1 — the opposite
 * orientation to evaluate()'s "goodness" score. Use this for threat/abuse
 * detection where any one strong signal should dominate.
 */
export function noisyOr<TSubject>(rules: ReadonlyArray<Rule<TSubject>>, subject: TSubject): RiskReport {
  const findings: Finding[] = [];
  const matched: Finding[] = [];
  let inv = 1;

  for (const rule of rules) {
    const weight = rule.weight ?? 1;
    if (weight < 0 || weight > 1) {
      throw new RangeError(`noisyOr requires rule "${rule.id}" weight in [0,1], got ${weight}`);
    }
    const outcome = normalizeOutcome(rule.test(subject));
    // A "failed" rule means the signal is present (bad). penaltyRatio scales it.
    const contribution = outcome.passed ? 0 : weight * outcome.penaltyRatio;
    if (!outcome.passed) inv *= 1 - contribution;

    const finding: Finding = {
      ruleId: rule.id,
      title: rule.title,
      severity: rule.severity,
      passed: outcome.passed,
      weight,
      lost: contribution,
    };
    if (outcome.detail !== undefined) finding.detail = outcome.detail;
    else if (rule.description !== undefined && !outcome.passed) finding.detail = rule.description;
    findings.push(finding);
    if (!outcome.passed) matched.push(finding);
  }

  const risk = 1 - inv;
  matched.sort((a, b) => b.weight - a.weight);
  return { risk: Number(risk.toFixed(4)), score: Math.round(risk * 100), matched, findings };
}

/**
 * Build a single rule with sensible defaults. Purely ergonomic — the rule
 * object it returns is plain data you could also write by hand.
 */
export function rule<TSubject>(def: Rule<TSubject>): Rule<TSubject> {
  return def;
}
