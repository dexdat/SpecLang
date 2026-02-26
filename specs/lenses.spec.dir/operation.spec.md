# speclang-header lines:12
id: "@speclang/lenses/operation"
parent: "@ref:specs/lenses"
short: "API operation documentation lens"
project_level: Alpha
agent_support: agent_autonomous
tags: [lenses, api, operations, documentation]
version: 0.1.0
layer: 4
---

# Operation Lens

Documents API operations from spec blocks.

## Operation Extraction

### @lenses/operation/extraction

Extracts API operations from specs.

**Operation Sources:**
- @block:operation definitions
- HTTP method specifications
- gRPC service definitions
- GraphQL resolvers

## OpenAPI Generation

### @lenses/operation/openapi

Generates OpenAPI/Swagger specifications.

**Features:**
- Path parameters
- Query parameters
- Request/response schemas
- Authentication requirements
- Error responses

## API Documentation

### @lenses/operation/docs

Generates human-readable API docs.

**Output:**
- Interactive documentation
- Code examples
- Try-it functionality
