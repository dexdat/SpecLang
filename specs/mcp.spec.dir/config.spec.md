# speclang-header lines:9
id: "@specs/mcp/config"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
target: src/mcp/config.ts
tags: [mcp, config, env, cli]
short: MCP server configuration loading
---

# MCP Server Configuration

Configuration loading from defaults, options, and environment variables.

## Functions

### loadConfig(options?)

Loads configuration with priority: env vars > options > defaults.

### loadConfigFromFile(path)

Loads JSON config file.

### validateConfig(config)

Validates configuration.

### getArg, getArgInt, getArgBool

CLI argument parsing helpers.
