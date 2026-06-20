# speclang-header lines:8
id: "@bugs/cli-missing-generate-command"
version: 1.0.0
layer: 5
tags: [bug, cli, commands]
short: CLI is missing the generate command that exists in specs
status: open
---

# Bug: CLI Missing Generate Command

## Problem

The `generate` command exists in `specs/cli.spec.dir/src/index.ts` but is NOT available in `bin/speclang`.

Users cannot generate code from specs using the CLI.

## Reproduction

```bash
./bin/speclang generate --help
# Error: unknown command 'generate'
```

## Root Cause

There are TWO CLI implementations:
1. `bin/speclang` - Basic commands (start, cascade, validate, bootstrap)
2. `specs/cli.spec.dir/src/index.ts` - Extended commands including generate

They are not synchronized.

## Expected Behavior

```bash
./bin/speclang generate --target typescript --output-dir src/generated
# Should generate code from specs
```

## Fix Required

Add generate command to `bin/speclang`:

```javascript
program
  .command('generate')
  .description('Generate code from specs')
  .option('--target <type>', 'Target language', 'typescript')
  .option('--output-dir <dir>', 'Output directory', 'src/generated')
  .option('--dry-run', 'Show what would be generated')
  .action(async (options) => {
    const { generateFromSpecs } = require('../dist/src/codegen/index.js');
    await generateFromSpecs(options);
  });
```

## Files to Modify

- [ ] bin/speclang - Add generate command
- [ ] Ensure dist/src/codegen/index.js has generateFromSpecs function
- [ ] Add tests for generate command

## Test

```bash
./bin/speclang generate --target typescript specs/greeting.spec.md
# Should generate src/generated/greeting.ts
```

## Related

- Cascade command exists but doesn't expose code generation directly
- Users expect to generate code after cascade triggers
