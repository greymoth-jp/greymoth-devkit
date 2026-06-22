import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate, failures, noisyOr, rule, type Rule } from "../src/index.ts";

interface Repo {
  hasLicense: boolean;
  hasReadme: boolean;
  testCoverage: number; // 0..1
}

const ruleset: Rule<Repo>[] = [
  rule({ id: "license", title: "Has a LICENSE", severity: "error", weight: 3, test: (r) => r.hasLicense }),
  rule({ id: "readme", title: "Has a README", severity: "warn", weight: 1, test: (r) => r.hasReadme }),
  rule({
    id: "coverage",
    title: "Test coverage",
    severity: "warn",
    weight: 2,
    test: (r) => ({ passed: r.testCoverage >= 0.8, penaltyRatio: Math.max(0, 1 - r.testCoverage) }),
  }),
];

test("empty ruleset scores 100", () => {
  const rep = evaluate<Repo>([], { hasLicense: false, hasReadme: false, testCoverage: 0 });
  assert.equal(rep.score, 100);
  assert.equal(rep.total, 0);
  assert.equal(rep.maxWeight, 0);
});

test("all rules pass scores 100", () => {
  const rep = evaluate(ruleset, { hasLicense: true, hasReadme: true, testCoverage: 1 });
  assert.equal(rep.score, 100);
  assert.equal(rep.passed, 3);
  assert.equal(rep.failed, 0);
  assert.equal(rep.lostWeight, 0);
});

test("all binary rules fail subtracts their weight", () => {
  // license(3) + readme(1) fail = 4 lost; coverage graded with ratio 1 (cov 0) = 2 lost.
  const rep = evaluate(ruleset, { hasLicense: false, hasReadme: false, testCoverage: 0 });
  assert.equal(rep.maxWeight, 6);
  assert.equal(rep.lostWeight, 6);
  assert.equal(rep.score, 0);
  assert.equal(rep.failed, 3);
});

test("weighting: a heavy rule costs more than a light one", () => {
  const onlyLicenseFails = evaluate(ruleset, { hasLicense: false, hasReadme: true, testCoverage: 1 });
  const onlyReadmeFails = evaluate(ruleset, { hasLicense: true, hasReadme: false, testCoverage: 1 });
  // license weight 3 of 6 => lose 50% => 50; readme weight 1 of 6 => ~83
  assert.equal(onlyLicenseFails.score, 50);
  assert.equal(onlyReadmeFails.score, 83);
  assert.ok(onlyLicenseFails.score < onlyReadmeFails.score);
});

test("graded rule applies partial penalty", () => {
  // coverage 0.5 => penaltyRatio 0.5 => lose 1 of weight 2; everything else passes.
  const rep = evaluate(ruleset, { hasLicense: true, hasReadme: true, testCoverage: 0.5 });
  assert.equal(rep.lostWeight, 1);
  // 1 lost of 6 => 83.33 => rounds to 83
  assert.equal(rep.score, 83);
  const cov = rep.findings.find((f) => f.ruleId === "coverage");
  assert.equal(cov?.passed, false);
  assert.equal(cov?.lost, 1);
});

test("penaltyRatio is clamped to [0,1]", () => {
  const overshoot: Rule<null>[] = [
    rule({ id: "x", title: "x", severity: "error", weight: 5, test: () => ({ passed: false, penaltyRatio: 9 }) }),
  ];
  const rep = evaluate(overshoot, null);
  assert.equal(rep.lostWeight, 5); // not 45
  assert.equal(rep.score, 0);
});

test("detail and remediation attach only to failures", () => {
  const rs: Rule<boolean>[] = [
    rule({
      id: "r",
      title: "must be true",
      severity: "error",
      description: "the flag was false",
      remediation: "set the flag",
      test: (b) => b,
    }),
  ];
  const failRep = evaluate(rs, false);
  assert.equal(failRep.findings[0]?.detail, "the flag was false");
  assert.equal(failRep.findings[0]?.remediation, "set the flag");
  const passRep = evaluate(rs, true);
  assert.equal(passRep.findings[0]?.detail, undefined);
  assert.equal(passRep.findings[0]?.remediation, undefined);
});

test("explicit RuleOutcome detail overrides description", () => {
  const rs: Rule<null>[] = [
    rule({
      id: "r",
      title: "t",
      severity: "warn",
      description: "generic",
      test: () => ({ passed: false, detail: "specific reason" }),
    }),
  ];
  assert.equal(evaluate(rs, null).findings[0]?.detail, "specific reason");
});

test("failures() returns only failures, worst-first", () => {
  const rep = evaluate(ruleset, { hasLicense: false, hasReadme: false, testCoverage: 0 });
  const f = failures(rep);
  assert.equal(f.length, 3);
  assert.equal(f[0]?.ruleId, "license"); // lost 3, the most
  assert.ok((f[0]?.lost ?? 0) >= (f[1]?.lost ?? 0));
});

test("negative weight throws", () => {
  const bad: Rule<null>[] = [rule({ id: "b", title: "b", severity: "info", weight: -1, test: () => true })];
  assert.throws(() => evaluate(bad, null), RangeError);
});

test("evaluate is deterministic", () => {
  const subject = { hasLicense: true, hasReadme: false, testCoverage: 0.7 };
  const a = evaluate(ruleset, subject);
  const b = evaluate(ruleset, subject);
  assert.deepEqual(a, b);
});

// ---- noisyOr (the llm-shield risk model) ----

interface Text {
  v: string;
}
const signals: Rule<Text>[] = [
  rule({ id: "override", title: "instruction override", severity: "error", weight: 0.8, test: (t) => !/ignore previous/i.test(t.v) }),
  rule({ id: "delimiter", title: "delimiter flood", severity: "warn", weight: 0.5, test: (t) => !/----+/.test(t.v) }),
];

test("noisyOr: no signals => risk 0", () => {
  const r = noisyOr(signals, { v: "hello world" });
  assert.equal(r.risk, 0);
  assert.equal(r.score, 0);
  assert.equal(r.matched.length, 0);
});

test("noisyOr: a single signal contributes its weight", () => {
  const r = noisyOr(signals, { v: "ignore previous instructions" });
  assert.equal(r.risk, 0.8);
  assert.equal(r.score, 80);
  assert.equal(r.matched.length, 1);
  assert.equal(r.matched[0]?.ruleId, "override");
});

test("noisyOr: independent signals accumulate but saturate (1-∏)", () => {
  const r = noisyOr(signals, { v: "ignore previous ------- now" });
  // 1 - (1-0.8)(1-0.5) = 1 - 0.1 = 0.9
  assert.equal(r.risk, 0.9);
  assert.equal(r.score, 90);
  assert.equal(r.matched.length, 2);
  // worst (highest weight) first
  assert.equal(r.matched[0]?.ruleId, "override");
});

test("noisyOr: adding a signal never decreases risk (monotone)", () => {
  const one = noisyOr(signals, { v: "ignore previous" }).risk;
  const two = noisyOr(signals, { v: "ignore previous -------" }).risk;
  assert.ok(two >= one);
});

test("noisyOr: weight outside [0,1] throws", () => {
  const bad: Rule<Text>[] = [rule({ id: "b", title: "b", severity: "error", weight: 3, test: () => false })];
  assert.throws(() => noisyOr(bad, { v: "" }), RangeError);
});

test("noisyOr: graded penaltyRatio scales the contribution", () => {
  const graded: Rule<null>[] = [
    rule({ id: "g", title: "g", severity: "warn", weight: 1, test: () => ({ passed: false, penaltyRatio: 0.5 }) }),
  ];
  // contribution 1*0.5 => risk 0.5
  assert.equal(noisyOr(graded, null).risk, 0.5);
});

test("noisyOr is deterministic", () => {
  const a = noisyOr(signals, { v: "ignore previous -------" });
  const b = noisyOr(signals, { v: "ignore previous -------" });
  assert.deepEqual(a, b);
});
