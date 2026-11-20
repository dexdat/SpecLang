/**
 * DF-SPECLANG-020: `speclang new` must scaffold a WORKING pipeline config.
 *
 * Before the fix the scaffold shipped package.json, specs/main.spec.md,
 * .speclangrc, scripts/speclang.cjs and README — but no build.yaml. The daemon
 * then converged and had nothing to run:
 *
 *   [Pipeline] No config file found at build.yaml, using defaults
 *   [PipelineExecutor] No pipeline stages configured (build.yaml missing or
 *     empty on_converge) — nothing to run.
 *   [Daemon] Pipeline failed (consecutive failure 1): ...
 *   [Daemon] Cascade NOT complete — pipeline did not succeed.
 *
 * ... so a first save in a brand-new project generated zero files.
 *
 * These tests pin the contract of the emitted config, not its prose:
 *   1. build.yaml exists and loads through the REAL PipelineConfigManager
 *      (a file that only "looks like YAML" would still leave the pipeline
 *      empty — mergeConfig replaces on_converge wholesale).
 *   2. Its schema is the schema this repository's own build.yaml uses, so the
 *      scaffold cannot drift from the template it mirrors.
 *   3. Its stage commands are runnable in a project with no node_modules and
 *      no model access, and running them verbatim turns "append a block to
 *      specs/main.spec.md" into generated code under src/generated — the
 *      behaviour AC-2 judges by executing scripts/speclang.cjs for real.
 *   4. `validate` keeps exiting 0 in the scaffold (SL-GAP-036).
 *   5. `new` stays fast (AC-5) and --bare gets the same pipeline config.
 *
 * The stage commands are executed through /bin/sh exactly the way
 * src/pipeline/stages.ts::runCommand does it (spawn(shell, ['-c', command],
 * { cwd: projectRoot })). `validate` needs the CLI build, so its execution
 * assertion is skipped on a checkout that has not run `npm run build` (npm
 * test does that in `pretest`).
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFileSync } from "child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { parse as parseYaml } from "yaml";
import { PipelineConfigManager } from "../../src/pipeline/config.js";

const REPO_ROOT = process.cwd();
const CLI = join(REPO_ROOT, "bin/speclang");
const REPO_BUILD_YAML = join(REPO_ROOT, "build.yaml");
const CLI_BUILT = existsSync(join(REPO_ROOT, "dist"));

interface Stage {
  name: string;
  run: string;
  depends_on?: string[];
}

interface ParsedPipeline {
  pipeline?: { on_converge?: Stage[]; on_success?: unknown[] };
  [key: string]: unknown;
}

function scaffold(cwd: string, name: string, extra: string[] = []): void {
  execFileSync(
    process.execPath,
    [CLI, "new", name, "--no-git", "--dir", join(cwd, name), ...extra],
    { cwd, encoding: "utf-8" },
  );
}

/** Run a stage command the way PipelineExecutor does: /bin/sh -c in the project root. */
function runStage(projectPath: string, command: string): string {
  return execFileSync("/bin/sh", ["-c", command], {
    cwd: projectPath,
    encoding: "utf-8",
  });
}

describe("new scaffolding -> working pipeline config (DF-SPECLANG-020)", () => {
  let testDir: string;
  let projectPath: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "speclang-new-pipeline-"));
    projectPath = join(testDir, "demo");
    scaffold(testDir, "demo");
  });

  afterEach(() => {
    if (testDir && existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("writes build.yaml into the scaffold", () => {
    const buildYamlPath = join(projectPath, "build.yaml");
    expect(existsSync(buildYamlPath)).toBe(true);
    expect(readFileSync(buildYamlPath, "utf-8").length).toBeGreaterThan(200);
  });

  it("loads as a non-empty pipeline through the real config loader", async () => {
    const manager = new PipelineConfigManager(join(projectPath, "build.yaml"));
    const config = await manager.load();

    const stages = config.pipeline.on_converge;
    expect(Array.isArray(stages)).toBe(true);
    expect(stages.map((stage) => stage.name)).toEqual(["generate", "validate"]);
    for (const stage of stages) {
      expect(typeof stage.run).toBe("string");
      expect(stage.run.trim().length).toBeGreaterThan(0);
      // The scaffold has no node_modules and no model access: every stage must
      // invoke the local shim, never a bare `speclang`, `npm` or `bun`.
      expect(stage.run).toContain("node scripts/speclang.cjs");
    }

    // validate is ordered after generate, so a spec error surfaces on code
    // that was just (re)generated rather than stale output.
    expect(stages.find((stage) => stage.name === "validate")?.depends_on).toEqual([
      "generate",
    ]);

    // A failure must be recorded for an orchestrator, and must NOT roll back:
    // a fresh project may not be a git repository yet.
    expect(config.recovery.on_fail).toHaveLength(1);
    expect(config.pipeline.on_success).toEqual([]);
  });

  it("uses the same build.yaml schema as this repository's own pipeline", () => {
    const repo = parseYaml(readFileSync(REPO_BUILD_YAML, "utf-8")) as ParsedPipeline;
    const scaffolded = parseYaml(
      readFileSync(join(projectPath, "build.yaml"), "utf-8"),
    ) as ParsedPipeline;

    // Same top-level sections: the scaffold mirrors the template it claims to.
    expect(Object.keys(scaffolded).sort()).toEqual(Object.keys(repo).sort());

    // Same stage vocabulary: the scaffold may use a subset of the fields the
    // repo's stages use, never a field name the executor does not understand.
    const repoStageFields = new Set(
      (repo.pipeline?.on_converge ?? []).flatMap((stage) => Object.keys(stage)),
    );
    const scaffoldedStageFields = (scaffolded.pipeline?.on_converge ?? []).flatMap(
      (stage) => Object.keys(stage),
    );
    expect(scaffoldedStageFields.length).toBeGreaterThan(0);
    for (const field of scaffoldedStageFields) {
      expect(
        repoStageFields.has(field),
        `scaffold stage field "${field}" is not used by the repo build.yaml`,
      ).toBe(true);
    }
  });

  it("turns a spec save into generated code when the stages run", () => {
    const buildYaml = parseYaml(
      readFileSync(join(projectPath, "build.yaml"), "utf-8"),
    ) as ParsedPipeline;
    const stages = buildYaml.pipeline?.on_converge ?? [];

    // "First save in a brand-new project": append a block to the starter spec.
    const specPath = join(projectPath, "specs", "main.spec.md");
    const saved = readFileSync(specPath, "utf-8");
    expect(existsSync(join(projectPath, "src", "generated"))).toBe(false);

    execFileSync(
      "/bin/sh",
      [
        "-c",
        `cat >> ${JSON.stringify(specPath)} <<'SPECBLOCK'

## Greeting

### @block::greeting @kind:code
\`\`\`speclang
export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`
SPECBLOCK`,
      ],
      { cwd: projectPath, encoding: "utf-8" },
    );
    expect(readFileSync(specPath, "utf-8").length).toBeGreaterThan(saved.length);

    for (const stage of stages) {
      expect(() => runStage(projectPath, stage.run), `stage ${stage.name} failed`)
        .not.toThrow();
    }

    // At least one generated file exists under the documented output dir, and
    // the block that was just saved is the one that produced it.
    const greetingFile = join(projectPath, "src", "generated", "main.spec-greeting.ts");
    const starterFile = join(projectPath, "src", "generated", "main.spec-main.ts");
    expect(existsSync(greetingFile)).toBe(true);
    expect(existsSync(starterFile)).toBe(true);
    expect(readFileSync(greetingFile, "utf-8")).toContain("export function greet");

    // AC-4: validating the scaffolded project still exits 0 after the save.
    if (!CLI_BUILT) {
      console.warn(
        "[DF-SPECLANG-020] dist/ missing: skipped the `validate` exit-code " +
          "assertion (run `npm run build`, which `npm test` does in pretest).",
      );
      return;
    }
    const validateStage = stages.find((stage) => stage.name === "validate");
    expect(validateStage).toBeDefined();
    expect(() => runStage(projectPath, validateStage!.run)).not.toThrow();
  });

  it("documents the pipeline config and its output dir in the README", () => {
    const readme = readFileSync(join(projectPath, "README.md"), "utf-8");
    expect(readme).toContain("build.yaml");
    expect(readme).toContain("src/generated");
    expect(readme).toContain("npm run start");
  });

  it("scaffolds in under two seconds and still writes the starter spec", () => {
    const started = Date.now();
    scaffold(testDir, "timed");
    const elapsed = Date.now() - started;

    expect(elapsed).toBeLessThan(2000);
    expect(existsSync(join(testDir, "timed", "specs", "main.spec.md"))).toBe(true);
    expect(existsSync(join(testDir, "timed", "build.yaml"))).toBe(true);
  });

  it("gives --bare projects the same pipeline config", () => {
    scaffold(testDir, "bare1", ["--bare"]);
    const barePath = join(testDir, "bare1");

    expect(existsSync(join(barePath, "build.yaml"))).toBe(true);
    const parsed = parseYaml(
      readFileSync(join(barePath, "build.yaml"), "utf-8"),
    ) as ParsedPipeline;
    expect((parsed.pipeline?.on_converge ?? []).map((stage) => stage.name)).toEqual([
      "generate",
      "validate",
    ]);
  });
});
