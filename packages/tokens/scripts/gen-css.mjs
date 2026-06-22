// Generates dist/tokens.css from the compiled tokens, so JS and CSS never drift.
// Runs after `tsc` in the package build step.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { toCss } from "../dist/index.js";

const out = join(import.meta.dirname, "..", "dist", "tokens.css");
const header = "/* @greymoth/tokens — generated from src/index.ts. Do not edit by hand. */\n";
writeFileSync(out, header + toCss(), "utf8");
console.log("[tokens] wrote", out);
