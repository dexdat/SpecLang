# speclang-header lines:9
id: "@speclang/opencode-plugin.spec.dir/tools"
version: 0.1.0
layer: 5
imports: ["@speclang/opencode-plugin.spec.dir/configuration", "@speclang/mcp"]
tags: [opencode, plugin, tools]
short: Tools provided by OpenCode Speclang plugin
project_level: Alpha
agent_support: agent_assisted
---
# Tools Provided by Plugin

## Tool List

1. `speclang_index` – Query spec index with SQL
2. `speclang_validate` – Validate spec references and autonomous readiness
3. `speclang_generate` – Trigger code generation for a spec
4. `speclang_status` – Show cascade status and depth
5. `speclang_ownership` – Show ownership locks
6. `speclang_convergence` – Force convergence check

## Tool Definitions

### speclang_index

```speclang
# @block:opencode-plugin/tools/index @kind:code
```typescript
tools.define('speclang_index', {
  description: 'Query the spec index with SQL',
  parameters: {
    sql: { type: 'string', description: 'SQL query (SELECT only)' },
    params: { type: 'array', optional: true, description: 'Query parameters' }
  },
  handler: async ({ sql, params = [] }) => {
    return await speclangQuery(sql, params);
  }
});
```
```

### speclang_validate

```speclang
# @block:opencode-plugin/tools/validate @kind:code
```typescript
tools.define('speclang_validate', {
  description: 'Validate spec references and autonomous readiness',
  parameters: {
    specId: { type: 'string', optional: true, description: 'Specific spec ID to validate' }
  },
  handler: async ({ specId }) => {
    if (specId) {
      await execAsync(`python3 validate_autonomous.py --file ${specId}`);
    } else {
      await execAsync('python3 validate_autonomous.py --project');
    }
    return { status: 'validation completed' };
  }
});
```
```

## References

- "@ref:speclang/mcp (MCP tool pattern)"
- @ref:speclang/opencode-plugin.spec.dir/mcp-client (for query/execute)