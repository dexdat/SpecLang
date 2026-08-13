/**
 * SPECLANG-GENERATED: MCP bin-path regression test
 * Source: @speclang/mcp
 *
 * SL-GAP-033: `./bin/speclang mcp start` died with MODULE_NOT_FOUND because
 * bin/speclang required dist/src/mcp/index.js, which tsc never emitted
 * (src/mcp/** was excluded and the symlinked sources only compile from their
 * realpath specs/mcp.spec.dir/src/). This test drives the REAL bin entrypoint
 * over stdio with the official MCP SDK client and requires a full
 * initialize + tools/list round-trip.
 *
 * The bin requires compiled output (dist/), so the suite is skipped when
 * `npm run build` has not run yet (plain `npm test` before a build).
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const binPath = path.join(repoRoot, "bin", "speclang");
const distMcpEntry = path.join(
  repoRoot,
  "dist",
  "specs",
  "mcp.spec.dir",
  "src",
  "index.js"
);

const distBuilt = fs.existsSync(distMcpEntry);

// The MCP SDK ships dual ESM/CJS builds; resolve the CJS entry like the
// server-side code does, so this test runs under vitest's node environment.
const sdkPkg = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, "node_modules", "@modelcontextprotocol", "sdk", "package.json"),
    "utf8"
  )
);
const sdkCjsBase = path.join(repoRoot, "node_modules", "@modelcontextprotocol", "sdk", sdkPkg.exports["./client"].require.replace(/^\.\//, "").replace(/\/index\.js$/, ""));

describe.skipIf(!distBuilt)("MCP bin path (SL-GAP-033)", () => {
  it("spawns ./bin/speclang mcp start and answers initialize + tools/list over stdio", async () => {
    const { Client } = await import(path.join(sdkCjsBase, "index.js"));
    const { StdioClientTransport } = await import(path.join(sdkCjsBase, "stdio.js"));

    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "speclang-mcp-bin-test-"));
    const stderrLog = path.join(workDir, "server-stderr.log");
    const errFd = fs.openSync(stderrLog, "w");

    const transport = new StdioClientTransport({
      command: binPath,
      args: ["mcp", "start", "-d", workDir],
      stderr: errFd,
    });
    const client = new Client({ name: "speclang-bin-test", version: "1.0.0" });

    try {
      await client.connect(transport);
      const tools = await client.listTools();
      expect(tools.tools.length).toBeGreaterThan(0);
      const names = tools.tools.map((t) => t.name);
      expect(names).toContain("speclang_search");
      expect(names).toContain("speclang_get_spec");
      await client.close();
    } finally {
      fs.closeSync(errFd);
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  }, 60000);
});
