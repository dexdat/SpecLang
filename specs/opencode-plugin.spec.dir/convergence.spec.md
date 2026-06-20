# speclang-header lines:10
id: "@speclang/opencode-plugin.spec.dir/convergence"
version: 0.1.0
layer: 5
imports: ["@speclang/opencode-plugin.spec.dir/architecture", "@speclang/cascade"]
tags: [opencode, plugin, convergence, pipeline]
short: Convergence detection for OpenCode Speclang plugin
project_level: Alpha
agent_support: agent_assisted
---
# Convergence Detection

## Purpose

Monitors quiet period (no changes for 30s), triggers pipeline (`generate_index.py`, validation).

## Detection Algorithm

```speclang
# @block:opencode-plugin/convergence/detector @kind:code
```typescript
const QUIET_PERIOD = 30 * 1000; // 30 seconds

async function checkConvergence(): Promise<boolean> {
  const lastEdit = await getLastEditTime(db);
  const quiet = Date.now() - lastEdit > QUIET_PERIOD;
  
  if (quiet && await allAgentsIdle()) {
    return true;
  }
  return false;
}
```
```

## Pipeline Execution

When convergence detected:

1. Run `python3 generate_index.py` to update spec index
2. Run validation tools (`validate_refs.py`, `validate_autonomous.py`)
3. Reset cascade depth counter
4. Log convergence event

```speclang
# @block:opencode-plugin/convergence/pipeline @kind:code
```typescript
async function runPipeline(): Promise<void> {
  console.log('Cascade converged – running pipeline...');
  
  // Update index
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  await execAsync('python3 generate_index.py');
  await execAsync('python3 validate_refs.py');
  await execAsync('python3 validate_autonomous.py --project');
  
  // Reset depth counter
  await db.run(`UPDATE cascades SET status = 'converged', converged_at = ? WHERE status = 'active'`, [Date.now()]);
  
  console.log('Pipeline complete. Ready for next cascade.');
}
```
```

## References

- "@ref:speclang/cascade (cascade concepts)"
- @ref:speclang/validation-tool (validation tools)