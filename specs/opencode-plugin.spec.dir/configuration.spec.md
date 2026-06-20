# speclang-header lines:9
id: "@speclang/opencode-plugin.spec.dir/configuration"
version: 0.1.0
layer: 5
tags: [opencode, plugin, configuration, settings]
short: Configuration and tools for OpenCode Speclang plugin
project_level: Alpha
agent_support: agent_assisted
---
# Configuration

## Plugin Configuration

Configuration options for the Speclang OpenCode plugin:

```speclang
# @block:opencode-plugin/configuration/options @kind:code
```typescript
interface PluginConfig {
  specDir: string; // default: 'specs/'
  quietPeriodMs: number; // default: 30000
  ownershipTimeoutMs: number; // default: 300000
  mcpServerCommand: string; // default: 'speclang-mcp-server'
  gitEnabled: boolean; // default: true
  autoCommit: boolean; // default: true
  validationOnConvergence: boolean; // default: true
}
```
```

## Tools Provided

The plugin provides these OpenCode tools:

- `speclang_index`: Query spec index
- `speclang_validate`: Validate spec references
- `speclang_generate`: Trigger code generation
- `speclang_status`: Show cascade status

## Tool Definitions

```speclang
# @block:opencode-plugin/configuration/tools @kind:code
```typescript
// Example tool definition
tools.define('speclang_index', {
  description: 'Query the spec index',
  parameters: {
    query: { type: 'string', description: 'SQL query' }
  },
  handler: async ({ query }) => {
    return await speclangQuery(query);
  }
});
```
```

## References

- "@ref:speclang/opencode-plugin.spec.dir/tools (detailed tool definitions)"