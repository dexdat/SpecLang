#!/usr/bin/env node
"use strict";

/**
 * SpecLang's ts-node launcher: the `ts-node` bin of this repository.
 *
 * Why this file exists
 * --------------------
 * ts-node drives TypeScript through the *classic JavaScript compiler API*
 * (`ts.sys`, `ts.findConfigFile`, `ts.readConfigFile`, `ts.transpileModule`, …).
 * This project's compiler is the TypeScript 7 native build, whose npm package
 * no longer exposes that API: `require("typescript")` resolves to
 * `typescript/lib/version.cjs`, which exports only `version` and
 * `versionMajorMinor`. ts-node therefore dies before it can read even the
 * compiler options:
 *
 *   TypeError: Cannot read properties of undefined (reading 'fileExists')
 *     at readConfig (.../ts-node/dist/configuration.js:91)
 *
 * The repository already installs a side-by-side classic-API compiler for
 * tooling that predates TypeScript 7: the `typescript-eslint-ts` npm alias
 * (typescript@6.0.3 — see `devDependencies` in package.json and
 * `scripts/lint/ts6-resolution.cjs`, which redirects the same way for ESLint).
 *
 * ts-node resolves its compiler ONCE, up front, before any tsconfig.json is
 * read (`configuration.js:findAndReadConfig` loads the compiler, then calls
 * `readConfig`, whose first statement is the crashing destructure). A
 * `ts-node` block in tsconfig.json cannot rescue that first load — the crash
 * happens while looking for the config file. Setting the documented
 * `TS_NODE_COMPILER` environment variable before the real CLI starts is what
 * makes the bare `npx ts-node <file>` command work.
 *
 * The tsconfig.json `ts-node` block carries the matching compiler name plus
 * `compilerOptions.types: ["node"]` (ts-node does not get the project's
 * ambient @types for free, so examples using `console` / `require` fail
 * without it).
 *
 * Everything else — argv, cwd, tsconfig discovery, exit codes, stdout/stderr —
 * is delegated unchanged to the real ts-node CLI. An explicit
 * `TS_NODE_COMPILER` in the caller's environment still wins.
 *
 * `npm install` / `npm ci` point node_modules/.bin/ts-node at this file via
 * scripts/postinstall-ts-node.sh (npm links the bin at ../ts-node/dist/bin.js,
 * which is the crashing entry point).
 */

const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const COMPILER_ALIAS = "typescript-eslint-ts";

process.env.TS_NODE_COMPILER = process.env.TS_NODE_COMPILER || COMPILER_ALIAS;

function fail(message) {
  process.stderr.write(`ts-node(launcher): ${message}\n`);
  process.exit(1);
}

let cliPath;
try {
  cliPath = require.resolve("ts-node/dist/bin.js", { paths: [PROJECT_ROOT] });
} catch {
  fail(
    "the ts-node CLI is not installed under node_modules.\n" +
      '  expected dependency: "ts-node": "^10.9.2" (devDependencies)\n' +
      "  remedy: npm install --no-audit --no-fund",
  );
}

// Fail with a remedy instead of letting ts-node die on an unresolvable
// compiler name: the alias is the only classic-API TypeScript in this tree.
try {
  require.resolve(COMPILER_ALIAS, { paths: [PROJECT_ROOT] });
} catch {
  fail(
    `the classic-API TypeScript alias "${COMPILER_ALIAS}" is not installed.\n` +
      '  expected dependency: "typescript-eslint-ts": "npm:typescript@6.0.3" (devDependencies)\n' +
      "  remedy: npm install --no-audit --no-fund",
  );
}

require(cliPath).main();
