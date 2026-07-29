/**
 * Tests for the workflow conversation handlers.
 *
 * Source of truth: specs/workflow.spec.dir/src/conversation.ts
 * Runtime under test:  specs/workflow.spec.dir/src/conversation.js
 *
 * Covers the two handlers that were TODO stubs until PITFALL-WORKFLOW-001:
 *   - handleModifyConfig (via executeParsedCommand → modify_config)
 *   - handleFixIssue     (via executeParsedCommand → fix_issue)
 *
 * We drive them through the exported executeParsedCommand so we exercise the
 * real dispatch path the CLI uses, and we build a throwaway project tree in
 * os.tmpdir() (redirected to project-local .tmp/ by the vitest setup) so the
 * tests never touch the real repo.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

import { executeParsedCommand } from "../../specs/workflow.spec.dir/src/conversation.js";

// executeParsedCommand takes a ParsedCommand; the internal handler functions
// are not exported, so we construct the minimal command shape the dispatcher
// needs. intent + entities + rawInput are the only fields it destructures.
function cmd(intent: string, entities: string[], rawInput: string) {
  return { intent, confidence: 1, entities, rawInput } as any;
}

describe("workflow/conversation — handleModifyConfig", () => {
  let project: string;

  beforeEach(() => {
    project = fs.mkdtempSync(path.join(os.tmpdir(), "speclang-cfg-"));
  });
  afterEach(() => {
    fs.rmSync(project, { recursive: true, force: true });
  });

  it("returns an error when .speclangrc does not exist", async () => {
    const out = await executeParsedCommand(
      cmd("modify_config", ["postgres"], "use postgres"),
      project,
    );
    expect(out).toContain(".speclangrc not found");
  });

  it("switches the db setting to postgresql (normalised alias)", async () => {
    const cfgPath = path.join(project, ".speclangrc");
    fs.writeFileSync(
      cfgPath,
      JSON.stringify({ db: "sqlite", port: 3000 }, null, 2),
    );
    const out = await executeParsedCommand(
      cmd("modify_config", ["postgres"], "use postgres"),
      project,
    );
    expect(out).toContain("db → postgresql");
    const updated = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));
    expect(updated.db).toBe("postgresql");
    // Unrelated keys must survive.
    expect(updated.port).toBe(3000);
  });

  it("switches the db setting to sqlite", async () => {
    const cfgPath = path.join(project, ".speclangrc");
    fs.writeFileSync(cfgPath, JSON.stringify({ db: "postgresql" }, null, 2));
    const out = await executeParsedCommand(
      cmd("modify_config", ["sqlite"], "switch to sqlite"),
      project,
    );
    expect(out).toContain("db → sqlite");
    expect(JSON.parse(fs.readFileSync(cfgPath, "utf-8")).db).toBe("sqlite");
  });

  it("applies a key=value override and coerces numeric values", async () => {
    const cfgPath = path.join(project, ".speclangrc");
    fs.writeFileSync(cfgPath, JSON.stringify({ port: 3000 }, null, 2));
    const out = await executeParsedCommand(
      cmd("modify_config", ["port=5432"], "port=5432"),
      project,
    );
    expect(out).toContain("port → 5432");
    const updated = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));
    expect(updated.port).toBe(5432);
    expect(typeof updated.port).toBe("number");
  });

  it("keeps string values as strings in key=value overrides", async () => {
    const cfgPath = path.join(project, ".speclangrc");
    fs.writeFileSync(cfgPath, JSON.stringify({}, null, 2));
    await executeParsedCommand(
      cmd("modify_config", ["host=localhost"], "host=localhost"),
      project,
    );
    const updated = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));
    expect(updated.host).toBe("localhost");
  });

  it("reports unrecognized entities and applies the ones it understands", async () => {
    const cfgPath = path.join(project, ".speclangrc");
    fs.writeFileSync(cfgPath, JSON.stringify({}, null, 2));
    const out = await executeParsedCommand(
      cmd("modify_config", ["postgres", "banana"], "use postgres banana"),
      project,
    );
    expect(out).toContain("db → postgresql");
    expect(out).toContain("banana");
    // The config file is still written with the recognised change.
    expect(JSON.parse(fs.readFileSync(cfgPath, "utf-8")).db).toBe("postgresql");
  });

  it("returns guidance when no entities are recognised", async () => {
    fs.writeFileSync(
      path.join(project, ".speclangrc"),
      JSON.stringify({}, null, 2),
    );
    const out = await executeParsedCommand(
      cmd("modify_config", ["banana"], "use banana"),
      project,
    );
    expect(out).toMatch(/didn't recognise/i);
    // File must NOT have been modified.
    expect(
      fs.readFileSync(path.join(project, ".speclangrc"), "utf-8").trim(),
    ).toBe("{}");
  });

  it("refuses to clobber a malformed .speclangrc", async () => {
    const cfgPath = path.join(project, ".speclangrc");
    const broken = "{ not valid json";
    fs.writeFileSync(cfgPath, broken);
    const out = await executeParsedCommand(
      cmd("modify_config", ["postgres"], "use postgres"),
      project,
    );
    expect(out).toContain("not valid JSON");
    // The broken file is left untouched.
    expect(fs.readFileSync(cfgPath, "utf-8")).toBe(broken);
  });

  it("handles multiple db entities in one command", async () => {
    const cfgPath = path.join(project, ".speclangrc");
    fs.writeFileSync(cfgPath, JSON.stringify({ db: "sqlite" }, null, 2));
    // Last db entity wins, matching iteration order.
    await executeParsedCommand(
      cmd("modify_config", ["sqlite", "mysql"], "use sqlite mysql"),
      project,
    );
    expect(JSON.parse(fs.readFileSync(cfgPath, "utf-8")).db).toBe("mysql");
  });
});

describe("workflow/conversation — handleFixIssue", () => {
  let project: string;

  beforeEach(() => {
    project = fs.mkdtempSync(path.join(os.tmpdir(), "speclang-fix-"));
  });
  afterEach(() => {
    fs.rmSync(project, { recursive: true, force: true });
  });

  it("asks for clarification when no entities are given", async () => {
    const out = await executeParsedCommand(
      cmd("fix_issue", [], "fix it"),
      project,
    );
    expect(out).toMatch(/which area/i);
  });

  it("reports when no matching spec exists", async () => {
    fs.mkdirSync(path.join(project, "specs"), { recursive: true });
    const out = await executeParsedCommand(
      cmd("fix_issue", ["nonexistent"], "fix nonexistent bug"),
      project,
    );
    expect(out).toContain("couldn't find a spec");
  });

  it("finds a matching spec and quotes the implicated section", async () => {
    const specsDir = path.join(project, "specs");
    fs.mkdirSync(specsDir, { recursive: true });
    // Filename contains "auth" so pickSpecByName matches on that token.
    fs.writeFileSync(
      path.join(specsDir, "auth.spec.md"),
      [
        "# speclang-header lines:1",
        "---",
        "",
        "# Auth",
        "",
        "## Login",
        "",
        "Users log in with a password.",
        "",
        "## Logout",
        "",
        "Endpoint: POST /logout.",
      ].join("\n"),
    );

    // Entity "auth" matches the filename; the body of the "Login" section
    // mentions "login", so that heading should be surfaced as implicated.
    const out = await executeParsedCommand(
      cmd("fix_issue", ["auth", "login"], "fix the auth login bug"),
      project,
    );
    expect(out).toContain("Relevant spec:");
    expect(out).toContain("auth.spec.md");
    expect(out).toContain("Login");
    // The "Logout" heading body never mentions auth or login, so it must not
    // be reported as implicated.
    expect(out).not.toMatch(/Logout/);
    expect(out).toContain("Reported issue:");
  });

  it("still returns the spec path when no section body mentions the entity", async () => {
    const specsDir = path.join(project, "specs");
    fs.mkdirSync(specsDir, { recursive: true });
    // Filename matches "auth" but the heading/body deliberately avoid the
    // token, so no section should be reported as implicated.
    fs.writeFileSync(
      path.join(specsDir, "auth.spec.md"),
      ["# Overview", "", "Nothing relevant here."].join("\n"),
    );
    const out = await executeParsedCommand(
      cmd("fix_issue", ["auth"], "fix auth"),
      project,
    );
    expect(out).toContain("Relevant spec:");
    expect(out).toContain("No section headings mention");
  });
});

// Sanity check that the hand-maintained conversation.js actually loads as a
// module — guards against a syntactic regression in a file that tsc does not
// compile (it's outside tsconfig's include glob).
describe("workflow/conversation — module integrity", () => {
  it("imports without throwing and exposes executeParsedCommand", async () => {
    const mod =
      await import("../../specs/workflow.spec.dir/src/conversation.js");
    expect(typeof mod.executeParsedCommand).toBe("function");
    expect(typeof mod.parseCommand).toBe("function");
  });
});
