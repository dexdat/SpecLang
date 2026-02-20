# AGENTS.md - SpecLang Development Guide

**Goal**: Specs should have enough depth to be used by autonomous agents totally.

## Autonomous Agent Readiness

### Project Maturity Levels
SpecLang supports flags for different project maturity levels:
- **POC** (Proof of Concept): Experimental, minimal validation
- **MVP** (Minimum Viable Product): Core functionality validated
- **Alpha**: Internal testing, incomplete features
- **Beta**: External testing, feature complete
- **Production**: Stable, production-ready
- **Startup**: Small team, rapid iteration
- **SMB** (Small/Medium Business): Established processes, moderate scale
- **MSB** (Medium/Large Business): Complex integration, compliance focus
- **Enterprise**: Maximum scale, strict governance

### Spec Depth Requirements
For autonomous agent operation, specs must:
1. Use `agent_support: agent_autonomous` in headers
2. Include comprehensive references (`@ref:`) to all dependencies
3. Provide explicit step-by-step descriptions where needed
4. Resolve all ambiguities through validation rules
5. Maintain consistent `layer` values (0-10 abstraction scale)

### Header Fields for Autonomous Operation
```yaml
# speclang-header lines:12
id: @specs/example
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [example, autonomous]
short: Brief description
---
```

### Validation and Semantic Definitions

Based on adversarial feedback, to truly achieve autonomous agent operation:

1. **Validation Rules**: Tools must check that specs labeled `agent_autonomous` contain sufficient detail:
   - All operations have step-by-step descriptions
   - All references (`@ref:`) resolve to existing blocks
   - No ambiguous natural language remains
   - All required fields are present

2. **Semantic Definitions**: Clear definitions for each value:
   - `project_level`: Specific criteria for each maturity level
   - `layer`: Concrete mapping (0=north star, 1=feature, 2=component, etc.)
   - `agent_support`: Behavioral expectations for each level

3. **Agent Behavior Matrix**: Explicit rules for how agents adjust behavior based on metadata:
   - `POC` + `human_only`: Require human confirmation for each step
   - `Production` + `agent_autonomous`: Full autonomous generation and deployment
   - Mixed maturity levels: Handle dependencies appropriately

4. **Transition Workflows**: Procedures for moving specs between maturity levels:
   - Checklist for upgrading from `agent_assisted` to `agent_autonomous`
   - Required reviews, tests, and completeness checks
   - Automated validation before allowing transitions

5. **Safety Nets**: Mechanisms to detect mislabeled specs:
   - Automated analysis of spec completeness
   - Peer-review hooks for critical changes
   - Fallback to human review when confidence is low

## Build & Development Commands

### Python Scripts (Tooling)
```bash
# Run Python scripts directly
python3 generate_index.py          # Generate spec index
python3 rename_spec_files.py        # Rename spec files per conventions

# Make scripts executable
chmod +x generate_index.py rename_spec_files.py

# Validate specs (syntax check)
python3 -c "import yaml; yaml.safe_load(open('specs/headers.spec'))"
```

### Testing
```bash
# Run Python script tests (when implemented)
python3 -m pytest tests/ -v                    # Run all tests
python3 -m pytest tests/test_parser.py -v    # Single test file
python3 -m pytest tests/test_parser.py::test_header_parsing -v  # Single test

# Manual spec validation
grep -r "speclang-header" specs/ --include="*.spec" | wc -l  # Count valid headers
```

### Linting & Formatting
```bash
# Python code style
black generate_index.py rename_spec_files.py   # Format Python
flake8 generate_index.py                     # Lint Python
mypy generate_index.py                       # Type check

# YAML validation
yamllint specs/*.spec                         # Validate YAML in specs

# Trailing whitespace cleanup
find specs -name "*.spec" -exec sed -i '' 's/[[:space:]]*$//' {} \;
```

## Code Style Guidelines

### Python Code (Tooling Scripts)

**Imports:**
```python
# Standard library first
import os
import json
import re
from datetime import datetime

# Third party second
import yaml

# Local imports last
from speclang_parser import parse_header
```

**Formatting:**
- Use 4 spaces (no tabs)
- Max line length: 100 characters
- Use double quotes for strings
- Trailing commas in multi-line collections

**Naming:**
```python
# Functions: snake_case
def parse_header(filepath):
def extract_metadata(content):

# Variables: snake_case
header_lines = 12
metadata = {}

# Constants: UPPER_SNAKE_CASE
MAX_HEADER_LINES = 100
DEFAULT_VERSION = "0.1.0"

# Classes: PascalCase
class SpecParser:
class HeaderValidator:
```

**Types:**
```python
from typing import Dict, List, Optional, Tuple

def parse_header(filepath: str) -> Tuple[int, Dict]:
    """Parse header and return line count and metadata."""
    pass
```

**Error Handling:**
```python
try:
    metadata = yaml.safe_load(yaml_text)
except yaml.YAMLError as e:
    print(f"Error parsing YAML in {filepath}: {e}")
    return 0, {}
```

### Spec Files (.spec)

**Header Format:**
```yaml
# Line 1: Comment or blank
# Line 2: "# speclang-header lines:N"
# Lines 3-N: YAML metadata

# speclang-header lines:12
id: @specs/example
version: 1.0.0
tags: [example, docs]
short: Brief description
---
```

**Naming Conventions:**
- File names: `{name}.spec` (lowercase, hyphen-separated)
- SIP skills: `sip-XXX-name-speclang-vN.md`
- IDs: `@domain/path` (lowercase, forward slashes)
- Block IDs: `#block-name` (lowercase, hyphen-separated)

**Content Structure:**
```markdown
# Title

## Section 1

### @block:id @kind:type
Content here...

## Section 2
...
```

**References:**
```markdown
@ref:specs/auth#login              # Block reference
@ref:specs/auth/entities           # File reference
@ref:northstar                     # Project reference
```

## Project Structure

```
specs/                    # Core specifications
├── *.spec               # Specification files
└── implementation/      # Implementation notes

.opencode/               # OpenCode configuration
├── skills/             # SIPs and agent skills
├── agents/             # Agent definitions
├── commands/           # CLI commands
└── tools/              # MCP tools

*.py                     # Python tooling scripts
```

## Development Workflow

1. **Edit specs** in `specs/` directory
2. **Run indexer** to update `_index.json`: `python3 generate_index.py`
3. **Validate headers** in all spec files
4. **Commit per spec** with descriptive message
5. **Update SIPs** in `.opencode/skills/` if needed

## Testing Philosophy

Since SpecLang is self-specifying:
- Specs are the test cases
- Parser should validate spec format
- Implementation follows specs
- When in doubt, check the specs/

## Common Tasks

```bash
# Find all spec files
find specs -name "*.spec" -type f

# Count lines in specs
wc -l specs/*.spec

# Search for TODO in specs
grep -r "TODO" specs/ --include="*.spec"

# Validate all headers have line count
grep -L "speclang-header" specs/*.spec
```

## Notes

- This is a meta-project defining SpecLang itself
- Specs are the source of truth
- Python scripts are tooling only
- Follow existing spec patterns when adding new specs
- Keep AGENTS.md updated as project evolves