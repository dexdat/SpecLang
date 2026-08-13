/**
 * SPECLANG-GENERATED: Library parseSpec → validate composition test
 * Source: @speclang/validation
 *
 * SL-GAP-034: the library-exported parseSpec (cascade) kept YAML scalar
 * quotes on header values, so `parseSpec(content).id` returned
 * `"@speclang/examples/hello-world"` (with literal quotes) and the idRule
 * rejected it ('ID must start with @'). Nothing fed parseSpec output into
 * validate, so the incompatibility was never caught.
 *
 * This test composes the two documented library functions exactly as a
 * consumer would (per docs/API_REFERENCE.md §1.3).
 */

import { describe, it, expect } from "vitest";
import { parseSpec } from "../../src/cascade/index.js";
// NOTE: import validate from the engine module (the exact function the
// library index re-exports) rather than ../../src/validation/index.js —
// validation/cli.ts imports '../parser/header' which only resolves from the
// src/ symlink identity, not the specs/ realpath identity (pre-existing
// dual-view quirk, unrelated to SL-GAP-034). The dist barrel is verified
// end-to-end by the built-package smoke test.
import { validate } from "../../src/validation/engine.js";

const DOUBLE_QUOTED_SPEC = `# speclang-header lines:5
id: "@speclang/examples/hello-world"
version: 1.0.0
layer: 1
short: Test
---
### @block::hello-function @kind:code
\`\`\`ts
export function hello() { return 'hello'; }
\`\`\`
`;

const SINGLE_QUOTED_SPEC = `# speclang-header lines:5
id: '@speclang/examples/hello-world'
version: 1.0.0
layer: 1
short: Test
---
### @block::hello-function @kind:code
\`\`\`ts
export function hello() { return 'hello'; }
\`\`\`
`;

describe("parseSpec → validate composition (SL-GAP-034)", () => {
  it("parseSpec returns id without surrounding quotes for double-quoted YAML scalars", () => {
    const parsed = parseSpec(DOUBLE_QUOTED_SPEC);
    expect(parsed.id).toBe("@speclang/examples/hello-world");
  });

  it("parseSpec returns id without surrounding quotes for single-quoted YAML scalars", () => {
    const parsed = parseSpec(SINGLE_QUOTED_SPEC);
    expect(parsed.id).toBe("@speclang/examples/hello-world");
  });

  it("validate passes on a ParsedSpec built from parseSpec output (quoted-id spec)", async () => {
    const content = DOUBLE_QUOTED_SPEC;
    const parsed = parseSpec(content);

    const report = await validate({
      filepath: "specs/examples.spec.dir/hello-world.spec.md",
      headerLines: 5,
      metadata: {
        id: parsed.id,
        version: parsed.version,
        layer: 1,
      },
      content,
    });

    expect(report.passed).toBe(true);
    expect(report.errors).toEqual([]);
  });
});
