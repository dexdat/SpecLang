"use strict";

/**
 * Lint-time TypeScript resolution shim.
 *
 * `npm run build` uses the TypeScript 7 compiler (`typescript@^7.0.2`), but
 * typescript-eslint 8.x refuses to load against TS >= 7 at module load:
 *
 *   Error: typescript-eslint does not support TS 7.0.
 *       at node_modules/typescript-eslint/dist/index.js:52
 *
 * typescript-eslint 8.x declares `typescript >=4.8.4 <6.1.0` as a PEER
 * dependency, so npm `overrides` cannot redirect it (overrides only rewrite
 * regular dependencies) and there is no newer typescript-eslint release that
 * accepts TS 7 (checked: 8.73.0, the current latest, still throws).
 *
 * The supported escape hatch is the documented side-by-side setup: run the
 * lint toolchain against the TS 6 API. The project already carries that
 * compiler as the npm alias devDependency
 * `"typescript-eslint-ts": "npm:typescript@6.0.3"`.
 *
 * This shim installs the missing piece — a scoped module resolution: any
 * `require("typescript")` issued from *inside the lint toolchain* resolves to
 * the alias, while every other consumer in the process (and `tsc` itself, which
 * is a separate `npm run`) keeps the root TS 7 install. It is loaded with
 * `node --require` (see the `lint` script in package.json), so it applies to
 * ESLint's own config loader and to the parser/plugin packages it pulls in.
 *
 * Deliberately NOT a copy into node_modules: an install-time copy is the
 * fragile shape that broke before (npm prunes/skips it, and the gate then dies
 * on a machine whose node_modules was provisioned any way other than a full
 * `npm install`), whereas a declared dependency + a resolver hook is
 * reproducible from package.json alone.
 */

const path = require("path");
const Module = require("module");

const PKG_ROOT = path.resolve(__dirname, "..", "..");

// Packages that must see the TS 6 API. Only these are redirected: the root
// `typescript` (TS 7) stays untouched for anything outside the lint toolchain.
const LINT_TOOLCHAIN_DIRS = [
  path.join(PKG_ROOT, "node_modules", "typescript-eslint") + path.sep,
  path.join(PKG_ROOT, "node_modules", "@typescript-eslint") + path.sep,
  path.join(PKG_ROOT, "node_modules", "ts-api-utils") + path.sep,
];

let ts6Entry;
try {
  ts6Entry = require.resolve("typescript-eslint-ts", { paths: [PKG_ROOT] });
} catch (err) {
  // Fail loudly instead of letting typescript-eslint die with its generic
  // "unsupported TS 7" message: the remedy here is a plain dependency install.
  process.stderr.write(
    "lint(ts6-resolution): the TypeScript 6 alias is not installed.\n" +
      "  expected dependency: \"typescript-eslint-ts\": \"npm:typescript@6.0.3\" (devDependencies)\n" +
      "  remedy: npm install --no-audit --no-fund\n",
  );
  process.exit(1);
}

const isLintToolchainFile = (filename) =>
  typeof filename === "string" &&
  LINT_TOOLCHAIN_DIRS.some((dir) => filename.startsWith(dir));

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request === "typescript" && parent && isLintToolchainFile(parent.filename)) {
    return ts6Entry;
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
