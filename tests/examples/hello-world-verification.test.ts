/**
 * SPECLANG: runs the flagship example spec's OWN Verification Steps.
 * Source: @speclang/examples/hello-world (specs/examples.spec.dir/hello-world.spec.md)
 *
 * The four numbered lines under "## Verification Steps" are parsed out of the
 * markdown on every run and EXECUTED verbatim, in order, from the repository
 * root. Nothing about the commands is duplicated here: if the spec's commands
 * stop working — a renamed source path, a stale dist layout, a TypeScript
 * option that now collides with tsconfig.json — this file goes red instead of
 * the spec silently rotting.
 *
 * WHAT THIS PROVES
 *   step 1 (Generate) exits 0 and the spec still yields exactly one code block,
 *   step 2 (Compile)  exits 0,
 *   step 3 (Run)      exits 0,
 *   step 4 (Verify)   step 3's stdout equals the string step 4 promises,
 *   plus: the spec's own `@block::hello/function` code is the code shipped at
 *   src/examples/hello-world.ts, so the artifact steps 2-4 compile cannot drift
 *   away from the spec that describes it.
 *
 * WHAT THIS DOES NOT PROVE — that the SpecLang cascade wrote that artifact
 * (it is committed; step 1 only re-extracts the block with --dry-run), that
 * `npm run build` is correct beyond compiling this example, or that any other
 * spec's Verification Steps are runnable.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SPEC_REL_PATH = "specs/examples.spec.dir/hello-world.spec.md";
const SPEC_PATH = path.join(REPO_ROOT, SPEC_REL_PATH);
const SHIPPED_ARTIFACT = "src/examples/hello-world.ts";

interface VerificationStep {
  n: number;
  label: string;
  /** Everything after the "Label:" prefix — the command, or step 4's promise. */
  body: string;
}

/**
 * Extract the ordered list under "## Verification Steps". Reading stops at the
 * next "## " heading and only "N. Label: body" lines are accepted, so the prose
 * around the list is ignored.
 */
function parseVerificationSteps(markdown: string): VerificationStep[] {
  const lines = markdown.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) =>
    /^##\s+Verification Steps\s*$/.test(line)
  );
  if (headingIndex === -1) {
    throw new Error(`${SPEC_REL_PATH} has no "## Verification Steps" heading`);
  }

  const steps: VerificationStep[] = [];
  for (let i = headingIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s+/.test(line)) break;
    const match = /^\s*(\d+)\.\s+(.*\S)\s*$/.exec(line);
    if (!match) continue;
    const text = match[2];
    const colon = text.indexOf(":");
    if (colon === -1) {
      throw new Error(
        `verification step ${match[1]} is not "Label: command" shaped: ${text}`
      );
    }
    steps.push({
      n: Number(match[1]),
      label: text.slice(0, colon).trim(),
      body: text.slice(colon + 1).trim(),
    });
  }
  return steps;
}

/** The ```typescript fence that follows the spec's `### @block::hello/function`. */
function extractSpecBlock(markdown: string): string {
  const match =
    /###\s+@block::hello\/function\s+@kind:code\s*\n```typescript\n([\s\S]*?)```/.exec(
      markdown
    );
  if (!match) {
    throw new Error(
      `${SPEC_REL_PATH} no longer contains @block::hello/function's typescript block`
    );
  }
  return match[1];
}

/**
 * Compare code by what it MEANS at runtime: drop block/line comments, trailing
 * whitespace and blank lines. The generated header and the JSDoc preamble differ
 * between the spec block and the shipped artifact; the statements must not.
 */
function normalizeCode(source: string): string[] {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\/\/.*$/, "").trimEnd())
    .filter((line) => line.trim().length > 0);
}

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
}

/** Run one spec command verbatim through the shell, from the repository root. */
function runSpecCommand(command: string, tmpDir: string): RunResult {
  try {
    const stdout = execSync(command, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      // Keep scratch writes off /tmp (shared 30G tmpfs) and inside the project.
      env: { ...process.env, TMPDIR: tmpDir, NO_COLOR: "1" },
    });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    const err = error as {
      status?: number;
      stdout?: string | Buffer;
      stderr?: string | Buffer;
      message?: string;
    };
    return {
      status: typeof err.status === "number" ? err.status : -1,
      stdout: String(err.stdout ?? ""),
      stderr: String(err.stderr ?? err.message ?? ""),
    };
  }
}

describe("flagship example spec: Verification Steps run verbatim", () => {
  let markdown = "";
  let steps: VerificationStep[] = [];
  let tmpDir = "";
  const outputs: RunResult[] = [];

  beforeAll(() => {
    markdown = fs.readFileSync(SPEC_PATH, "utf8");
    steps = parseVerificationSteps(markdown);
    tmpDir = fs.mkdtempSync(path.join(REPO_ROOT, ".tmp", "example-verify-"));
  });

  afterAll(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("parses exactly four ordered Verification Steps", () => {
    expect(
      steps.map((s) => s.n),
      `expected 4 numbered steps under "## Verification Steps", got ${steps.length}`
    ).toEqual([1, 2, 3, 4]);
    expect(steps.map((s) => s.label)).toEqual([
      "Generate",
      "Compile",
      "Run",
      "Verify",
    ]);
  });

  it("runs steps 1-3 verbatim, in order, each exiting 0", () => {
    // Step 4 is the assertion, not a command: running it is the next test.
    for (const step of steps.slice(0, 3)) {
      const result = runSpecCommand(step.body, tmpDir);
      outputs.push(result);
      expect(
        result.status,
        `step ${step.n} (${step.label}) failed with exit ${result.status}: ${step.body}\n` +
          `--- stderr ---\n${result.stderr}\n--- stdout ---\n${result.stdout}`
      ).toBe(0);
    }
  }, 300_000);

  it("step 1 (Generate) still extracts the spec's single code block", () => {
    // The command is `speclang generate ... --dry-run`, whose contract is the
    // "Code blocks found: N" line. Anything else means the block stopped being
    // extractable and the rest of the pipeline is running on stale code.
    expect(
      outputs[0].stdout,
      `step 1 stdout did not report a single extracted block:\n${outputs[0].stdout}`
    ).toMatch(/Code blocks found:\s*1\b/);
  });

  it("step 3 (Run) prints the output step 4 promises", () => {
    const verifyStep = steps[3];
    const quoted = /"([^"]+)"/.exec(verifyStep.body);
    expect(
      quoted,
      `step 4 (${verifyStep.label}) does not quote an expected output: ${verifyStep.body}`
    ).not.toBeNull();
    const expected = quoted![1];
    expect(
      outputs[2].stdout.trim(),
      `step 4 promises ${JSON.stringify(expected)}; step 3 printed ` +
        `${JSON.stringify(outputs[2].stdout.trim())}`
    ).toBe(expected);
  });

  it("the spec's code block is still the code shipped in src/examples/hello-world.ts", () => {
    const shipped = fs.readFileSync(path.join(REPO_ROOT, SHIPPED_ARTIFACT), "utf8");
    expect(
      normalizeCode(shipped),
      `${SHIPPED_ARTIFACT} and the @block::hello/function block in ${SPEC_REL_PATH} ` +
        `have drifted apart — regenerate the artifact or update the spec block`
    ).toEqual(normalizeCode(extractSpecBlock(markdown)));
  });
});
