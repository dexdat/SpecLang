# speclang-header lines:11
id: "@speclang/mcp-openapi-generation-tests"
version: 0.1.0
layer: 5
imports: ["@speclang/mcp/openapi-generation", "@speclang/test-specs"]
tags: [mcp, openapi, tests, acceptance]
short: Acceptance tests for OpenAPI-MCP generator integration
status: draft
project_level: Alpha
agent_support: agent_assisted
---
# OpenAPI-MCP Generator Acceptance Tests

Natural language test specifications for the OpenAPI-MCP generator integration.

## Test Suite: Generate MCP Server from OpenAPI Spec

### @test:openapi-generation/basic-generation

```speclang
# @block:openapi-generation/basic-generation @kind:acceptance
Given: a valid OpenAPI specification file `petstore.yaml`
  And: the openapi-mcp-generator CLI is installed
  And: the output directory `generated/mcp/petstore` does not exist

When: I run `speclang mcp generate-openapi -i petstore.yaml -o generated/mcp/petstore`

Then: a new directory `generated/mcp/petstore` should be created
  And: the directory should contain a `package.json` file
  And: the directory should contain a `src/index.ts` file
  And: the generated code should be valid TypeScript
  And: the generated server should support stdio transport by default
```

### @test:openapi-generation/web-transport

```speclang
# @block:openapi-generation/web-transport @kind:acceptance
Given: a valid OpenAPI specification file `weather.yaml`
  And: the openapi-mcp-generator CLI is installed

When: I run `speclang mcp generate-openapi -i weather.yaml -o generated/mcp/weather --transport=web --port=3001`

Then: the generated server should be configured for web transport
  And: the generated `src/index.ts` should import Hono or express
  And: the generated server should listen on port 3001
  And: a test client HTML file should be present in `public/`
```

### @test:openapi-generation/register-tools

```speclang
# @block:openapi-generation/register-tools @kind:acceptance
Given: a valid OpenAPI specification file `api.yaml`
  And: the SpecLang MCP server is running
  And: no tools from `api.yaml` are currently registered

When: I run `speclang mcp generate-openapi -i api.yaml -o generated/mcp/api --register`

Then: the generated MCP server should be created
  And: all tools from the OpenAPI spec should be registered with the SpecLang MCP server
  And: I should be able to call those tools via MCP protocol
  And: the tools should proxy requests to the actual API
```

### @test:openapi-generation/force-overwrite

```speclang
# @block:openapi-generation/force-overwrite @kind:acceptance
Given: an existing generated MCP server at `generated/mcp/existing`
  And: a modified OpenAPI specification file `api-v2.yaml`

When: I run `speclang mcp generate-openapi -i api-v2.yaml -o generated/mcp/existing --force`

Then: the existing directory should be overwritten
  And: the new generated server should reflect changes from `api-v2.yaml`
```

### @test:openapi-generation/invalid-spec

```speclang
# @block:openapi-generation/invalid-spec @kind:acceptance
Given: an invalid OpenAPI specification file `invalid.yaml`
  And: the openapi-mcp-generator CLI is installed

When: I attempt to run `speclang mcp generate-openapi -i invalid.yaml -o generated/mcp/invalid`

Then: the command should fail with a descriptive error message
  And: no directory should be created at `generated/mcp/invalid`
  And: the error should indicate the validation problem
```

### @test:openapi-generation/missing-input

```speclang
# @block:openapi-generation/missing-input @kind:acceptance
Given: no input file specified

When: I run `speclang mcp generate-openapi -o generated/mcp/test`

Then: the command should fail with a usage error
  And: it should indicate that --input is required
```

### @test:openapi-generation/auto-register-config

```speclang
# @block:openapi-generation/auto-register-config @kind:acceptance
Given: a configuration file `.speclang/openapi-mcp.yaml` with:
  ```yaml
  servers:
    - name: petstore
      spec: ./api/petstore.yaml
      output: petstore
      transport: stdio
      auto_register: true
      watch: true
  ```
  And: the SpecLang MCP server is running

When: the file `api/petstore.yaml` is modified

Then: the cascade should detect the change
  And: automatically regenerate the MCP server
  And: re-register the updated tools
  And: the updated tools should be available within 30 seconds
```

## Test Implementation Notes

```speclang
# @block:openapi-generation/test-impl @kind:note
Test Implementation:

- These acceptance tests should be converted to executable tests by the test generator.
- For each `@kind:acceptance` block, generate:
  - A Jest/Mocha test file
  - Setup/teardown for temporary directories
  - Mocking of external dependencies (openapi-mcp-generator CLI)
  - Assertions against file system and MCP server state
- Tests should run in isolated environments to avoid side effects.
```

## References

- "@ref:speclang/mcp-openapi-generation"
- "@ref:speclang/test-specs"
- "@ref:speclang/mcp-openapi-generation-cli"
