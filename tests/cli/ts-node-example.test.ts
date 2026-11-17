/**
 * DF-SPECLANG-2: `npx ts-node examples/hello-world/index.ts` must run.
 *
 * The project compiles with TypeScript 7, whose npm package ships no classic
 * JavaScript compiler API (`require("typescript")` resolves to
 * `typescript/lib/version.cjs`, which exports only version metadata). ts-node
 * drives exactly that API, so the plain bin dies before it can read
 * tsconfig.json:
 *
 *   TypeError: Cannot read properties of undefined (reading 'fileExists')
 *     at readConfig (.../ts-node/dist/configuration.js:91)
 *
 * scripts/ts-node-classic.cjs routes the CLI at the classic-API compiler this
 * repo already installs for its tooling (`typescript-eslint-ts`, an npm alias
 * of typescript@6.0.3), and scripts/postinstall-ts-node.sh points
 * node_modules/.bin/ts-node at that launcher.
 *
 * The behaviour test drives the launcher directly, so it is independent of
 * install state. The route test pins the mechanism that makes the *bare*
 * `npx ts-node …` command work after `npm install`.
 */
import { describe, it, expect } from "vitest";
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const EXAMPLE = "examples/hello-world/index.ts";
const EXPECTED_OUTPUT = "Hello, World!";
const LAUNCHER = path.join(REPO_ROOT, "scripts", "ts-node-classic.cjs");
const BIN_LINK = path.join(REPO_ROOT, "node_modules", ".bin", "ts-node");
const EXPECTED_LINK_TARGET = "../../scripts/ts-node-classic.cjs";
const RUN_TIMEOUT_MS = 180_000;

interface RunResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

/** Run the launcher on the example with no ts-node env hints from the caller. */
function runLauncher(args: string[]): RunResult {
  const env: NodeJS.ProcessEnv = { ...process.env };
  // The launcher is what must select the classic-API compiler; a TS_NODE_COMPILER
  // inherited from the outer environment would make this test pass for free.
  delete env.TS_NODE_COMPILER;
  const result = spawnSync(process.execPath, [LAUNCHER, ...args], {
    cwd: REPO_ROOT,
    encoding: "utf-8",
    timeout: RUN_TIMEOUT_MS,
    env,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

describe("ts-node example command (DF-SPECLANG-2)", () => {
  it(
    "runs the hello-world example and prints its output",
    () => {
      const run = runLauncher([EXAMPLE]);
      const combined = `${run.stdout}${run.stderr}`;

      expect(run.status, `combined output:\n${combined}`).toBe(0);
      expect(run.stdout).toContain(EXPECTED_OUTPUT);
      // The old failure mode, asserted directly: the launcher must never hand
      // the CLI a compiler without the classic API.
      expect(combined).not.toContain("TypeError");
      expect(combined).not.toContain("fileExists");
    },
    RUN_TIMEOUT_MS,
  );

  it("keeps tsconfig wired to the classic-API compiler and Node ambient types", () => {
    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, "tsconfig.json"), "utf-8"),
    ) as {
      "ts-node"?: { compiler?: string; compilerOptions?: { types?: string[] } };
    };
    const tsNode = tsconfig["ts-node"];

    expect(tsNode, 'tsconfig.json is missing the "ts-node" block').toBeTruthy();
    expect(tsNode?.compiler).toBe("typescript-eslint-ts");
    // ts-node does not inherit the project's ambient @types, so examples using
    // `console` / `require` fail with TS2584 / TS2591 without this entry.
    expect(tsNode?.compilerOptions?.types).toEqual(["node"]);
  });

  it("routes node_modules/.bin/ts-node at the launcher (postinstall ran)", () => {
    const isLinked = fs.existsSync(BIN_LINK) && fs.lstatSync(BIN_LINK).isSymbolicLink();
    const target = isLinked ? fs.readlinkSync(BIN_LINK) : null;

    expect(
      target,
      "scripts/postinstall-ts-node.sh has not been run in this tree — the bare " +
        "`npx ts-node` command still resolves npm's default bin and crashes.\n" +
        "  remedy: npm install  (or: bash scripts/postinstall-ts-node.sh)",
    ).toBe(EXPECTED_LINK_TARGET);
  });
});
