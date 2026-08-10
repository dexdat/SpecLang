/**
 * Unit tests for the cascade parseSpec fence-state machine (SL-GAP-016).
 *
 * Regression coverage for the bug where a later PLAIN ``` fence (e.g. an
 * "Expected Output" example section) re-opened the code-block state after a
 * real block closed, clobbering block.language and appending non-code text
 * to block.code — which made generateCode skip the block entirely
 * ("No TypeScript code blocks found" with 0 files generated).
 */
import { describe, test, expect } from "vitest";
import { parseSpec } from "../../src/cascade/index.js";

describe("parseSpec fence-state machine", () => {
  test("keeps language and code intact when a later plain ``` section follows", () => {
    const content = [
      "### @block::hello/function @kind:code",
      "```typescript",
      "export function helloWorld(name: string): string {",
      "  return `Hello, ${name}!`;",
      "}",
      "```",
      "",
      "## Expected Output",
      "",
      "```",
      "Hello, SpecLang!",
      "```",
    ].join("\n");

    const spec = parseSpec(content);

    expect(spec.blocks).toHaveLength(1);
    expect(spec.blocks[0].name).toBe("hello/function");
    expect(spec.blocks[0].kind).toBe("code");
    expect(spec.blocks[0].language).toBe("typescript");
    expect(spec.blocks[0].code).toContain("export function helloWorld");
    expect(spec.blocks[0].code).not.toContain("Hello, SpecLang!");
  });

  test("ignores a plain ``` fence when not inside a code block", () => {
    const content = [
      "## Expected Output",
      "```",
      "Hello!",
      "```",
      "## Next Section",
      "plain text",
    ].join("\n");

    const spec = parseSpec(content);

    expect(spec.blocks).toHaveLength(0);
  });

  test("a heading while inside a code block closes it (defensive)", () => {
    const content = [
      "### @block::foo/bar @kind:code",
      "```typescript",
      "export const x = 1;",
      "## Next Section",
      "text that must not be captured",
    ].join("\n");

    const spec = parseSpec(content);

    expect(spec.blocks).toHaveLength(1);
    expect(spec.blocks[0].language).toBe("typescript");
    expect(spec.blocks[0].code).toContain("export const x = 1;");
    expect(spec.blocks[0].code).not.toContain("Next Section");
  });

  test("single-hash lines inside a code block are code, not headings", () => {
    // Python comment `# comment` at column 0 must NOT close the block.
    const content = [
      "### @block::script/main @kind:code",
      "```python",
      "# this is a comment",
      "def main():",
      '    print("hi")',
      "```",
      "## Expected Output",
      "```",
      "hi",
      "```",
    ].join("\n");

    const spec = parseSpec(content);

    expect(spec.blocks).toHaveLength(1);
    expect(spec.blocks[0].language).toBe("python");
    expect(spec.blocks[0].code).toContain("# this is a comment");
    expect(spec.blocks[0].code).toContain("def main():");
    expect(spec.blocks[0].code).not.toContain("Expected Output");
    expect(spec.blocks[0].code).toContain('print("hi")');
    expect(spec.blocks[0].code).not.toMatch(/\nhi\n/);
  });

  test("`# @kind:code` marker inside a ```speclang fence is not a heading", () => {
    const content = [
      "### @block::demo/fn @kind:code",
      "```speclang",
      "# @kind:code",
      "export function demo(): void {}",
      "```",
    ].join("\n");

    const spec = parseSpec(content);

    expect(spec.blocks).toHaveLength(1);
    expect(spec.blocks[0].language).toBe("speclang");
    expect(spec.blocks[0].code).toContain("# @kind:code");
    expect(spec.blocks[0].code).toContain("export function demo(): void {}");
  });

  test("still captures multiple language-tagged blocks in one spec", () => {
    const content = [
      "### @block::first/fn @kind:code",
      "```typescript",
      "export function first(): void {}",
      "```",
      "### @block::second/fn @kind:code",
      "```typescript",
      "export function second(): void {}",
      "```",
    ].join("\n");

    const spec = parseSpec(content);

    expect(spec.blocks).toHaveLength(2);
    expect(spec.blocks[0].language).toBe("typescript");
    expect(spec.blocks[1].language).toBe("typescript");
    expect(spec.blocks[0].code).toContain("first");
    expect(spec.blocks[1].code).toContain("second");
  });

  test("captures the repo's hello-world Mini Cascade spec verbatim", () => {
    const { readFileSync } = require("fs");
    const { join } = require("path");
    const content = readFileSync(
      join(process.cwd(), "specs/examples.spec.dir/hello-world.spec.md"),
      "utf-8",
    );

    const spec = parseSpec(content);

    expect(spec.blocks).toHaveLength(1);
    expect(spec.blocks[0].name).toBe("hello/function");
    expect(spec.blocks[0].kind).toBe("code");
    expect(spec.blocks[0].language).toBe("typescript");
    expect(spec.blocks[0].code).toContain("Hello, ${name}!");
  });
});
