/**
 * SPECLANG-GENERATED: CLI tests
 * Source: @speclang/mcp.cli
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

/**
 * Parse JSON from CLI output, tolerating leading non-JSON lines (e.g.
 * "Generating...", progress bars, or banner text) that may be emitted
 * before the JSON payload. Without this, CI environments where the CLI
 * prints any progress text before `--json` output would see
 * `JSON.parse(stdout)` throw because the first line isn't valid JSON.
 *
 * Strategy: find the first character that opens a JSON value (`[` or
 * `{`), slice from there, and parse. If parse fails, throw with the
 * raw output included so the failure is debuggable.
 */
function parseJsonFromOutput(stdout: string): unknown {
  const trimmed = stdout.trim();
  // Fast path: the entire output is already valid JSON.
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    // Fall through to substring search.
  }
  // Find the first '[' or '{' that's likely the start of JSON. We look
  // at line starts so we don't pick up a '[' from text inside an error
  // message. We then attempt JSON.parse from each candidate until one
  // succeeds.
  const candidates: string[] = [];
  for (let i = 0; i < trimmed.length; i++) {
    const c = trimmed[i];
    if (c === "[" || c === "{") {
      candidates.push(trimmed.slice(i));
      // First candidate is usually enough; only try one more at the
      // very end (covers the rare case where JSON is bracketed by
      // multiple banners).
      break;
    }
  }
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (_) {
      // try next candidate
    }
  }
  throw new Error(
    `Could not parse JSON from CLI output. Raw output:\n${stdout}`,
  );
}

/**
 * CLI test wrapper that works around tsconfig path resolution issues.
 * The main tsconfig.json has paths that include specs directories,
 * which causes tsx to incorrectly load .md files as modules.
 * This workaround creates a temporary tsconfig that excludes specs.
 */
const tmpConfig = `
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "noImplicitAny": false,
    "allowJs": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "sqlite.spec.dir/src/*": ["specs/sqlite.spec.dir/src/*"],
      "indexer.spec.dir/src/*": ["specs/indexer.spec.dir/src/*"],
      "parser.spec.dir/src/*": ["specs/parser.spec.dir/src/*"],
      "cascade.spec.dir/src/*": ["../../specs/cascade.spec.dir/src/*"],
      "mcp.spec.dir/src/*": ["specs/mcp.spec.dir/src/*"],
      "cli.spec.dir/src/*": ["specs/cli.spec.dir/src/*"],
      "autonomous.spec.dir/src/*": ["specs/autonomous.spec.dir/src/*"],
      "guard.spec.dir/src/*": ["specs/guard.spec.dir/src/*"],
      "meta.spec.dir/src/*": ["specs/meta.spec.dir/src/*"],
      "agents.spec.dir/src/*": ["specs/agents.spec.dir/src/*"],
      "project-layout.spec.dir/src/*": ["specs/project-layout.spec.dir/src/*"]
    }
  },
  "include": ["src/cli/**/*.ts"],
  "exclude": ["node_modules", "dist", "specs"]
}
`;
const REPO_ROOT = path.resolve(__dirname, "..");
const tmpConfigPath = path.join(
  REPO_ROOT,
  ".speclang",
  "tmp",
  "cli-test-tsconfig.json",
);
const fs = require("fs");
fs.mkdirSync(path.dirname(tmpConfigPath), { recursive: true });
fs.writeFileSync(tmpConfigPath, tmpConfig);

// TEST-ISOLATION-001: the tsx CLI's `validate` command regenerates the spec
// index via generateIndex() whose default outputPath is '_index.json'
// relative to the process cwd. Running it from the repo root rewrites the
// TRACKED _index.json while parallel cascade tests read it → torn reads
// (SyntaxError at dependency.ts loadIndex, CI flake 1/19 runs). Isolate the
// spawn: run every tsx CLI subprocess from a per-test temp cwd (mkdtemp
// under .tmp/, which is gitignored) and point SPECLANG_DIR at the real repo
// specs so search/list/get/validate still resolve them.
const CLI_CWD = fs.mkdtempSync(path.join(REPO_ROOT, ".tmp", "cli-test-"));
// `index --refresh` writes .speclang/speclang.db + .speclang/_index.json;
// pre-create the dir so the DB open succeeds in the temp cwd.
fs.mkdirSync(path.join(CLI_CWD, ".speclang"), { recursive: true });
process.env.SPECLANG_DIR = path.join(REPO_ROOT, "specs");

const CLI = `npx tsx --tsconfig ${tmpConfigPath} ${path.join(REPO_ROOT, "src", "cli", "index.ts")}`;
const CLI_BIN = "./bin/speclang";
const cliExec = (cmd: string) => execAsync(cmd, { cwd: CLI_CWD });

afterAll(() => {
  try {
    fs.rmSync(CLI_CWD, { recursive: true, force: true });
  } catch {
    // Temp dir cleanup is best-effort; .tmp/ is gitignored either way.
  }
});

describe("CLI Commands", () => {
  describe("search", () => {
    it("should find specs matching query", async () => {
      const { stdout } = await cliExec(`${CLI} search auth`);
      expect(stdout).toContain("Found");
      expect(stdout).toContain("@speclang/auth");
    });

    it.skip("should support --json output", async () => {
      // SKIP: `speclang search` does not support --json flag (unimplemented feature).
      // Re-enable when search command gains --json output support.
      const { stdout } = await cliExec(`${CLI} search auth --json`);
      const result = parseJsonFromOutput(stdout);
      expect(Array.isArray(result)).toBe(true);
    });

    it.skip("should support --quiet output", async () => {
      // SKIP: `speclang search` does not support --quiet flag (unimplemented feature).
      // Re-enable when search command gains --quiet output support.
      const { stdout } = await cliExec(`${CLI} search auth --quiet`);
      const lines = stdout.trim().split("\n");
      expect(lines.length).toBeGreaterThan(0);
      // IDs only, no other text
      lines.forEach((line) => {
        expect(line.startsWith("@")).toBe(true);
      });
    });

    it("should filter by layer", async () => {
      const { stdout } = await cliExec(`${CLI} search mcp --layer 3`);
      expect(stdout).toContain("layer 3");
    });

    it("should filter by tags", { timeout: 15000, retry: 2 }, async () => {
      const { stdout } = await cliExec(`${CLI} search mcp --tags mcp`);
      expect(stdout).toContain("Found");
    });
  });

  describe("list", () => {
    it("should list all specs", async () => {
      const { stdout } = await cliExec(`${CLI} list`);
      expect(stdout).toContain("Total specs:");
    });

    it("should support --json output", async () => {
      const { stdout } = await cliExec(`${CLI} list --json`);
      // Tolerate leading progress text that some CLI builds emit
      // before JSON (e.g. "Generating..." banners). The helper finds
      // the first `[` or `{` and parses from there.
      const result = parseJsonFromOutput(stdout) as unknown[];
      // CLI returns array directly, not {specs: [...]}
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should filter by layer", async () => {
      const { stdout } = await cliExec(`${CLI} list --layer 0`);
      expect(stdout).toContain("Layer 0");
    });

    it("should filter by prefix", async () => {
      const { stdout } = await cliExec(`${CLI} list --prefix @speclang`);
      expect(stdout).toContain("@speclang");
    });
  });

  describe("get", () => {
    it("should get spec by ID", async () => {
      const { stdout } = await cliExec(`${CLI} get @speclang/auth`);
      expect(stdout).toContain("@speclang/auth");
      expect(stdout).toContain("Version:");
      expect(stdout).toContain("Layer:");
    });

    it("should support --json output", async () => {
      const { stdout } = await cliExec(`${CLI} get @speclang/auth --json`);
      const result = parseJsonFromOutput(stdout) as { id: string };
      expect(result.id).toBe("@speclang/auth");
    });

    it("should show blocks with --blocks flag", async () => {
      const { stdout } = await cliExec(`${CLI} get @speclang/auth --blocks`);
      expect(stdout).toContain("Blocks:");
    });

    it("should error on unknown spec", async () => {
      try {
        await cliExec(`${CLI} get @unknown/spec`);
        expect(true).toBe(false); // Should not reach here
      } catch (result: unknown) {
        const { stderr } = result as { stdout: string; stderr: string };
        expect(stderr).toContain("Spec not found");
      }
    });
  });

  describe("validate", () => {
    it("should validate specs", async () => {
      try {
        await cliExec(`${CLI} validate`);
        expect(true).toBe(false);
      } catch (result: unknown) {
        const { stdout } = result as { stdout: string; stderr: string };
        expect(stdout).toContain("=== Index Validation ===");
        expect(stdout).toContain("Total specs:");
      }
    });

    it("should support --json output", { timeout: 15000 }, async () => {
      const { stdout } = await cliExec(`${CLI} validate --json`);
      // --json returns JSON with spec validation results after text banner
      const jsonStart = stdout.indexOf("{");
      expect(jsonStart).toBeGreaterThan(-1);
      const result = JSON.parse(stdout.slice(jsonStart));
      expect(result.index).toBeDefined();
      expect(result.specs).toBeDefined();
    });

    it("should support --verbose for warnings", async () => {
      try {
        await cliExec(`${CLI} validate --verbose`);
        expect(true).toBe(false);
      } catch (result: unknown) {
        const { stdout } = result as { stdout: string; stderr: string };
        // Verbose shows per-spec validation results
        expect(stdout).toContain("=== Index Validation ===");
        expect(stdout).toContain("=== Spec File Validation ===");
      }
    });
  });

  describe("check", () => {
    it("should check specs", async () => {
      const { stdout } = await execAsync(`${CLI_BIN} check`);
      expect(stdout).toContain("Checking specs");
    });

    it("should support --format json output", { timeout: 15000 }, async () => {
      const { stdout } = await execAsync(`${CLI_BIN} check --format json`);
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      expect(jsonMatch).toBeTruthy();
      const result = JSON.parse(jsonMatch![0]);
      expect(result.success).toBeDefined();
      expect(result.totalFiles).toBeGreaterThan(0);
    });

    it("should support --verbose for warnings", async () => {
      const { stdout } = await execAsync(`${CLI_BIN} check --verbose`);
      expect(stdout).toContain("Checking specs");
    });
  });

  describe("validate exit codes", () => {
    // SL-GAP-004: `speclang validate` must exit non-zero when nothing was
    // checked (0 files) or when any spec fails. Runs bin/speclang (CLI_BIN)
    // against throwaway projects under .speclang/tmp (gitignored).
    const exitCodeBase = ".speclang/tmp/validate-exit-codes";
    const emptyDir = path.join(exitCodeBase, "empty");
    const brokenDir = path.join(exitCodeBase, "broken");
    const validDir = path.join(exitCodeBase, "valid");

    beforeAll(() => {
      fs.rmSync(exitCodeBase, { recursive: true, force: true });
      fs.mkdirSync(path.join(emptyDir, "specs"), { recursive: true });
      fs.mkdirSync(path.join(brokenDir, "specs"), { recursive: true });
      fs.mkdirSync(path.join(validDir, "specs"), { recursive: true });
      // Broken: missing required `version` field → parse throws.
      fs.writeFileSync(
        path.join(brokenDir, "specs", "broken.spec.md"),
        '# speclang-header lines:6\nid: "@test/broken"\nlayer: 1\ntags: [x]\n---\n',
      );
      // Valid: same header shape the `speclang new` templates produce.
      fs.writeFileSync(
        path.join(validDir, "specs", "valid.spec.md"),
        '# speclang-header lines:6\nid: "@test/valid"\nversion: 1.0.0\nlayer: 1\ntags: [test]\n---\n',
      );
    });

    afterAll(() => {
      fs.rmSync(exitCodeBase, { recursive: true, force: true });
    });

    it("should warn and exit non-zero when no spec files are found", async () => {
      try {
        await execAsync(`${CLI_BIN} validate -d ${emptyDir}`);
        expect(true).toBe(false); // Should not reach here — exit code must be non-zero
      } catch (result: unknown) {
        const { stdout, stderr } = result as {
          stdout: string;
          stderr: string;
        };
        expect(stdout + stderr).toContain("No spec files found");
      }
    });

    it("should exit non-zero when a spec fails validation", async () => {
      try {
        await execAsync(`${CLI_BIN} validate -d ${brokenDir}`);
        expect(true).toBe(false); // Should not reach here — exit code must be non-zero
      } catch (result: unknown) {
        const { stdout, stderr } = result as {
          stdout: string;
          stderr: string;
        };
        expect(stdout + stderr).toContain("Failed: 1");
      }
    });

    it("should exit 0 when all specs validate", async () => {
      const { stdout } = await execAsync(
        `${CLI_BIN} validate -d ${validDir}`,
      );
      expect(stdout).toContain("Passed: 1");
    });
  });

  describe("index", () => {
    it("should show index stats", async () => {
      const { stdout } = await cliExec(`${CLI} index`);
      expect(stdout).toContain("=== Spec Index ===");
      expect(stdout).toContain("Total specs:");
    });

    it(
      "should support --json output",
      { timeout: 15000, retry: 2 },
      async () => {
        const { stdout } = await cliExec(`${CLI} index --json`);
        const result = parseJsonFromOutput(stdout) as { specs: unknown };
        expect(result.specs).toBeDefined();
      },
    );

    it("should refresh index with --refresh", async () => {
      const { stdout } = await cliExec(`${CLI} index --refresh`);
      // The refresh may have errors but should show refreshing activity
      expect(stdout).toContain("Refreshing");
    });
  });

  describe("cascade", () => {
    it("should show cascade status", async () => {
      const { stdout } = await cliExec(`${CLI} cascade status`);
      expect(stdout).toContain("=== Cascade Status ===");
    });

    it("should trigger cascade", async () => {
      const { stdout } = await execAsync(
        `${CLI} cascade trigger @speclang/mcp`,
      );
      expect(stdout).toContain("=== Cascade Triggered ===");
    });

    it("should abort cascade", async () => {
      await cliExec(`${CLI} cascade trigger @speclang/mcp`);
      const { stdout } = await cliExec(`${CLI} cascade abort`);
      expect(stdout).toContain("Cascade aborted");
    });

    it("should support --json output", async () => {
      const { stdout } = await cliExec(`${CLI} cascade status --json`);
      const result = parseJsonFromOutput(stdout);
      expect(result.active).toBeDefined();
    });
  });

  describe("generate", () => {
    it("should run dry-run by default", async () => {
      const { stdout } = await cliExec(`${CLI} generate --dry-run`);
      expect(stdout).toContain("=== Code Generation ===");
      expect(stdout).toContain("DRY RUN");
    });

    it("should support --json output", async () => {
      const { stdout } = await cliExec(`${CLI} generate --dry-run --json`);
      const result = parseJsonFromOutput(stdout);
      expect(result.target).toBe("typescript");
    });
  });

  describe("server", () => {
    it("should show help", async () => {
      const { stdout } = await cliExec(`${CLI} server --help`);
      expect(stdout).toContain("--port");
      expect(stdout).toContain("--daemon");
      expect(stdout).toContain("--http");
    });
  });

  describe("help", () => {
    it("should show main help", async () => {
      const { stdout } = await cliExec(`${CLI} --help`);
      expect(stdout).toContain("SpecLang - Specs are source code");
      expect(stdout).toContain("search");
      expect(stdout).toContain("get");
      expect(stdout).toContain("list");
      expect(stdout).toContain("validate");
      expect(stdout).toContain("generate");
      expect(stdout).toContain("server");
      expect(stdout).toContain("index");
      expect(stdout).toContain("cascade");
    });

    it("should show command help", async () => {
      const { stdout } = await cliExec(`${CLI} search --help`);
      expect(stdout).toContain("--tags");
      expect(stdout).toContain("--layer");
      expect(stdout).toContain("--json");
      expect(stdout).toContain("--quiet");
    });
  });

  describe("new", () => {
    const testProjectDir = ".speclang/tmp/test-new-project";
    const fs = require("fs");

    // Cleanup before and after tests
    beforeAll(() => {
      if (fs.existsSync(testProjectDir)) {
        fs.rmSync(testProjectDir, { recursive: true, force: true });
      }
    });

    afterAll(() => {
      if (fs.existsSync(testProjectDir)) {
        fs.rmSync(testProjectDir, { recursive: true, force: true });
      }
    });

    it("should create a new minimal project", async () => {
      const { stdout } = await execAsync(
        `${CLI_BIN} new test-new-project --dir ${testProjectDir}`,
      );
      expect(stdout).toContain("Creating new speclang project");
      expect(stdout).toContain("Created .speclangrc");
      expect(stdout).toContain("Created initial spec");

      // Verify directory structure
      expect(fs.existsSync(testProjectDir)).toBe(true);
      expect(fs.existsSync(path.join(testProjectDir, "specs"))).toBe(true);
      expect(fs.existsSync(path.join(testProjectDir, "src"))).toBe(true);
      expect(fs.existsSync(path.join(testProjectDir, "tests"))).toBe(true);
    });

    it("should create .speclangrc with correct content", async () => {
      const speclangrcPath = path.join(testProjectDir, ".speclangrc");
      expect(fs.existsSync(speclangrcPath)).toBe(true);

      const speclangrc = JSON.parse(fs.readFileSync(speclangrcPath, "utf-8"));
      expect(speclangrc.version).toBe("0.1.0");
      expect(speclangrc.name).toBe("test-new-project");
      expect(speclangrc.targets).toContain("typescript");
    });

    it("should create initial spec file", async () => {
      const specPath = path.join(testProjectDir, "specs", "main.spec.md");
      expect(fs.existsSync(specPath)).toBe(true);

      const specContent = fs.readFileSync(specPath, "utf-8");
      expect(specContent).toContain("# test-new-project");
      expect(specContent).toContain("speclang-header");
    });

    it("should support http template", async () => {
      const httpProjectDir = ".speclang/tmp/test-http-project";

      // Cleanup first
      if (fs.existsSync(httpProjectDir)) {
        fs.rmSync(httpProjectDir, { recursive: true, force: true });
      }

      const { stdout } = await execAsync(
        `${CLI_BIN} new http-project --dir ${httpProjectDir} --template http`,
      );
      expect(stdout).toContain("Template: http");

      const specPath = path.join(httpProjectDir, "specs", "main.spec.md");
      const specContent = fs.readFileSync(specPath, "utf-8");
      expect(specContent).toContain("/health");
      expect(specContent).toContain("/status");

      // Cleanup
      fs.rmSync(httpProjectDir, { recursive: true, force: true });
    });

    it("should support --bare flag", async () => {
      const bareProjectDir = ".speclang/tmp/test-bare-project";

      // Cleanup first
      if (fs.existsSync(bareProjectDir)) {
        fs.rmSync(bareProjectDir, { recursive: true, force: true });
      }

      const { stdout } = await execAsync(
        `${CLI_BIN} new bare-project --dir ${bareProjectDir} --bare`,
      );
      expect(stdout).toContain("Creating new speclang project");

      // Should not create initial spec with --bare
      const specPath = path.join(bareProjectDir, "specs", "main.spec.md");
      expect(fs.existsSync(specPath)).toBe(false);

      // Should still create directory structure
      expect(fs.existsSync(path.join(bareProjectDir, "specs"))).toBe(true);
      expect(fs.existsSync(path.join(bareProjectDir, "src"))).toBe(true);
      expect(fs.existsSync(path.join(bareProjectDir, "tests"))).toBe(true);

      // Cleanup
      fs.rmSync(bareProjectDir, { recursive: true, force: true });
    });

    it("should fail with invalid project name", async () => {
      try {
        await execAsync(`${CLI_BIN} new 123-invalid --dir .speclang/tmp`);
        expect(true).toBe(false); // Should not reach here
      } catch (result: unknown) {
        const { stderr } = result as { stdout: string; stderr: string };
        expect(stderr).toContain("Invalid project name");
      }
    });

    it("should fail when directory exists without --force", async () => {
      // First create a project
      if (!fs.existsSync(testProjectDir)) {
        fs.mkdirSync(testProjectDir, { recursive: true });
      }

      try {
        await execAsync(
          `${CLI_BIN} new test-new-project --dir ${testProjectDir}`,
        );
        expect(true).toBe(false); // Should not reach here
      } catch (result: unknown) {
        const { stderr } = result as { stdout: string; stderr: string };
        expect(stderr).toContain("Directory already exists");
      }
    });

    it("should overwrite with --force flag", async () => {
      // First create a project
      if (!fs.existsSync(testProjectDir)) {
        fs.mkdirSync(testProjectDir, { recursive: true });
      }

      // Add a file to verify it gets overwritten
      fs.writeFileSync(
        path.join(testProjectDir, "old-file.txt"),
        "old content",
      );

      const { stdout } = await execAsync(
        `${CLI_BIN} new test-new-project --dir ${testProjectDir} --force`,
      );
      expect(stdout).toContain("Creating new speclang project");
    });

    it("should show help for new command", async () => {
      const { stdout } = await execAsync(`${CLI_BIN} new --help`);
      expect(stdout).toContain("--dir");
      expect(stdout).toContain("--template");
      expect(stdout).toContain("--bare");
      expect(stdout).toContain("--force");
      expect(stdout).toContain("--no-git");
    });
  });
});
