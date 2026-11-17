/**
 * SPECLANG: runs the flagship example spec's OWN Verification Steps.
 * Source: @speclang/examples/hello-world (specs/examples.spec.dir/hello-world.spec.md)
 *
 * The four numbered lines under "## Verification Steps" are parsed out of the
 * markdown on every run and EXECUTED, in order, from the repository root.
 * Nothing about the commands is duplicated here: if the spec's commands stop
 * working — a renamed source path, a stale dist layout, a TypeScript option
 * that now collides with tsconfig.json — this file goes red instead of the spec
 * silently rotting.
 *
 * The ONE deliberate deviation is where the Compile step's OUTPUT goes: the
 * spec's `npm run build` is executed with `--outDir <scratch>` appended (npm
 * forwards everything after `--` to `tsc`), and the Run step reads the artifact
 * out of that same scratch dir. QA-SPECLANG-009, and the reason is not
 * cosmetic:
 *
 *   `npm run build` writes 406 files into the repo's shared dist/ by opening
 *   each one `O_WRONLY|O_CREAT|O_TRUNC` and then writing it in place (straced
 *   on TypeScript 7; no temp-file-and-rename). A reader that opens one of
 *   those files inside the truncate/write window gets an empty or half-written
 *   module. This file used to run that build MID-RUN, while vitest was running
 *   the other test files in parallel — a dozen of them spawn `bin/speclang` or
 *   `require` dist/ directly — so a full `npm test` could fail with EOF/torn
 *   reads that no individual test had caused. Redirecting the output to a
 *   scratch dir this file owns removes the shared write entirely; the compile
 *   itself (same tsconfig, same rootDir, same type checking, same exit status)
 *   is unchanged, and the last test below asserts the repo's dist/ is
 *   byte-for-byte untouched by the run.
 *
 * WHAT THIS PROVES
 *   step 1 (Generate) exits 0 and the spec still yields exactly one code block,
 *   step 2 (Compile)  exits 0 and emits the example into this test's scratch dir,
 *   step 3 (Run)      exits 0,
 *   step 4 (Verify)   step 3's stdout equals the string step 4 promises,
 *   plus: the spec's own `@block::hello/function` code is the code shipped at
 *   src/examples/hello-world.ts, so the artifact steps 2-4 compile cannot drift
 *   away from the spec that describes it.
 *
 * WHAT THIS DOES NOT PROVE — that the SpecLang cascade wrote that artifact
 * (it is committed; step 1 only re-extracts the block with --dry-run), that
 * `npm run build` is correct beyond compiling this example (its dist/ output is
 * covered by `pretest`, which runs before any test does), or that any other
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

/** The spec's Compile step, verbatim — the command whose output we redirect. */
const COMPILE_COMMAND = "npm run build";
/** The spec's Run step, verbatim — it reads the compiled artifact from dist/. */
const RUN_COMMAND = "node dist/src/examples/hello-world.js";
/** Where the compiled example lands inside the scratch outDir (rootDir "."). */
const COMPILED_ARTIFACT_REL = "src/examples/hello-world.js";
/** Sub-directory of the per-run scratch dir that receives tsc's output. */
const SCRATCH_OUT_SUBDIR = "build";
/** The repo's shared build tree — the one this test must never write to. */
const SHARED_DIST = path.join(REPO_ROOT, "dist");

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

/** POSIX single-quote a path so a scratch dir with spaces still works. */
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/**
 * The scratch output directory, applied per spec command. Keyed by the spec's
 * command VERBATIM, so a spec edit that changes either command stops being
 * redirected here and is caught by "the Compile and Run steps are the commands
 * this file redirects" below instead of quietly rebuilding the shared dist/.
 */
const SCRATCH_REDIRECTS: Record<string, (outDir: string) => string> = {
  [COMPILE_COMMAND]: (outDir) =>
    `${COMPILE_COMMAND} -- --outDir ${shellQuote(outDir)}`,
  [RUN_COMMAND]: (outDir) =>
    `node ${shellQuote(path.join(outDir, COMPILED_ARTIFACT_REL))}`,
};

interface PlannedStep {
  step: VerificationStep;
  /** What is actually executed — the spec's command, or its scratch redirect. */
  command: string;
}

/**
 * Turn one spec step into the command this test executes: the spec's line
 * verbatim, except for the two commands that touch the build output, which are
 * pointed at the scratch dir this file owns (see the file header).
 */
function planStep(step: VerificationStep, scratchOutDir: string): PlannedStep {
  const redirect = SCRATCH_REDIRECTS[step.body];
  return { step, command: redirect ? redirect(scratchOutDir) : step.body };
}

/**
 * Fingerprint of the repo's shared dist/: every file's size, mtime and inode.
 * `npm run build` truncates and rewrites files in place, so ANY file it
 * rewrites shows up here (a new mtime, usually a new inode as well). An absent
 * dist/ (plain `vitest run` with no `pretest` build) is its own one-line
 * signature, so "was absent, still absent" is a pass and "was absent, now
 * populated" is a fail.
 */
function distSignature(): string[] {
  if (!fs.existsSync(SHARED_DIST)) return ["dist: absent"];
  const signature: string[] = [];
  const walk = (dir: string): void => {
    const entries = fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (entry.isFile()) {
        const stat = fs.statSync(entryPath);
        signature.push(
          `${path.relative(SHARED_DIST, entryPath)} size=${stat.size} ` +
            `mtime=${stat.mtimeMs} inode=${stat.ino}`
        );
      }
    }
  };
  walk(SHARED_DIST);
  return signature;
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

describe("flagship example spec: Verification Steps run in order", () => {
  let markdown = "";
  let steps: VerificationStep[] = [];
  let tmpDir = "";
  let scratchOutDir = "";
  let distBefore: string[] = [];
  const planned: PlannedStep[] = [];
  const outputs: RunResult[] = [];

  beforeAll(() => {
    markdown = fs.readFileSync(SPEC_PATH, "utf8");
    steps = parseVerificationSteps(markdown);
    tmpDir = fs.mkdtempSync(path.join(REPO_ROOT, ".tmp", "example-verify-"));
    scratchOutDir = path.join(tmpDir, SCRATCH_OUT_SUBDIR);
    // Captured BEFORE any spec step runs, so the last test below can prove the
    // Compile step wrote nothing into the repo's shared dist/.
    distBefore = distSignature();
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

  it("the Compile and Run steps are the commands this file redirects", () => {
    // The redirect table is keyed by the spec's command text. If the spec
    // renames or re-shapes either build-output command, this test is the
    // place to say so — the alternative is silently executing an
    // un-redirected `npm run build` and rebuilding the shared dist/ mid-run.
    expect(
      steps[1].body,
      `Compile step is not the command this file knows how to redirect ` +
        `(${COMPILE_COMMAND}); update SCRATCH_REDIRECTS and this expectation together`
    ).toBe(COMPILE_COMMAND);
    expect(
      steps[2].body,
      `Run step is not the command this file knows how to redirect ` +
        `(${RUN_COMMAND}); update SCRATCH_REDIRECTS and this expectation together`
    ).toBe(RUN_COMMAND);
  });

  it("runs steps 1-3 in order, each exiting 0", () => {
    // Step 4 is the assertion, not a command: running it is the next test.
    for (const step of steps.slice(0, 3)) {
      const plan = planStep(step, scratchOutDir);
      planned.push(plan);
      const result = runSpecCommand(plan.command, tmpDir);
      outputs.push(result);
      expect(
        result.status,
        `step ${step.n} (${step.label}) failed with exit ${result.status}: ${plan.command}\n` +
          `(spec line: ${step.body})\n` +
          `--- stderr ---\n${result.stderr}\n--- stdout ---\n${result.stdout}`
      ).toBe(0);
    }
  }, 300_000);

  it("compiled into this test's own outDir, not the repo's shared dist/", () => {
    expect(
      planned[1]?.command,
      "the Compile step must send tsc's output to the scratch outDir, " +
        "otherwise it rebuilds the dist/ that parallel test files read"
    ).toContain(scratchOutDir);
    expect(
      fs.existsSync(path.join(scratchOutDir, COMPILED_ARTIFACT_REL)),
      `the redirected Compile step did not emit ${COMPILED_ARTIFACT_REL} ` +
        `into ${scratchOutDir} — the Run step would then be reading a stale ` +
        `or missing artifact`
    ).toBe(true);
    expect(
      distSignature(),
      `the repo's shared dist/ changed during this test: the Compile step ` +
        `rebuilt the tree that other test files read concurrently (torn reads / ` +
        `EOF). It must write only to its own outDir (${scratchOutDir}).`
    ).toEqual(distBefore);
  });

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
