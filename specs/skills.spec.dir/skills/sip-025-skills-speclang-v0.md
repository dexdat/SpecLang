---
name: sip-025-skills-speclang-v0
title: "SIP 25: Skills Pack"
version: 0.1.0
description: AI editor skills that drive the reactive cascade system
category: standard
---
# speclang-header lines:402
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 25: Skills Pack

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the Skills Pack—AI editor skills that drive SpecLang's reactive system.

### Quick Start

Core skills:
1. **SpecWriter**: Writes and expands spec files
2. **CodeGen**: Generates code from specs
3. **TestWriter**: Writes and runs tests
4. **BackSync**: Syncs code changes back to specs
5. **Orchestrator**: Coordinates all agents

### When to Read This

- **Installing skills:** Setting up SpecLang in your editor
- **Understanding agents:** How each skill works
- **Creating custom skills:** Extending the system

### Related SIPs

- SIP 6: Agent Protocol
- SIP 10: Daemon System
- SIP 12: Code Generation
- SIP 24: Test Specs

## Abstract

This SIP defines the SpecLang Skills Pack—a collection of AI editor skills that implement the reactive cascade system. Each skill is a self-contained agent with specific responsibilities, triggers, and prompts. Skills target Claude Code, Cursor, Windsurf, and OpenCode.

## Motivation

SpecLang needs agents to:
- Write specs from high-level intent
- Generate code from specs
- Create and run tests
- Keep specs in sync with code

A skills pack provides standardized, installable agents for each AI editor.

## Rationale

**Skill-Based Architecture:**

1. **Modular**: Each skill has a single responsibility
2. **Portable**: Works across AI editors
3. **Configurable**: Local overrides for custom needs
4. **Extensible**: Add custom skills easily

This follows the Unix philosophy of small, focused tools.

## Specification

### Skill Structure

```yaml
SkillStructure:
  directory: "{name}/"
  required_files:
    SKILL.md: "Skill definition with YAML frontmatter and prompts"
    
  optional_files:
    prompts/: "Reusable prompt templates"
    tools/: "Tool definitions for the skill"
    examples/: "Example usage patterns"
    
  SKILL.md_format:
    frontmatter:
      - name: "Skill name"
      - description: "What the skill does"
      - triggers: "When to invoke (file patterns, events)"
      - owns: "Files this skill is responsible for"
      
    content:
      - System prompt
      - Trigger handlers
      - Instructions
```

### Core Skills

```yaml
CoreSkills:
  SpecWriter:
    description: "Writes and expands spec files"
    owns: "specs/**/*.spec.md"
    triggers:
      - "North star changes"
      - "Parent spec changes"
      - "Manual expand command"
    layer_range: "0-5"
    
  CodeGen:
    description: "Generates code from specs"
    owns: "src/**/*.{ts,go,py,rs,java}"
    triggers:
      - "Spec file changes"
      - "Layer 6+ specs"
    layer_range: "6-10"
    
  TestWriter:
    description: "Writes and runs tests from specs"
    owns: "tests/**/*.test.*"
    triggers:
      - "Test spec changes"
      - "Code changes"
    layer_range: "10+"
    
  BackSync:
    description: "Syncs code changes back to specs"
    owns: "none (monitors generated/)"
    triggers:
      - "Human edits to generated files"
    output: "Proposed spec updates"
    
  Orchestrator:
    description: "Coordinates all agents"
    owns: "project.scl (north star)"
    triggers:
      - "User commands"
      - "Convergence detection"
    role: "User's main conversation partner"
```

### SpecWriter Skill

```yaml
SpecWriter:
  name: SpecWriter
  description: Writes and expands spec files
  owns: specs/**/*.spec.md
  triggers: north star changes, parent spec changes
  
  system_prompt: |
    You are the SpecWriter agent for SpecLang.
    
    Your job is to write and expand specification files.
    
    ## Responsibilities
    
    1. Expand high-level specs into detailed specs
    2. Maintain spec format and conventions
    3. Ensure all @ref: references resolve
    4. Keep specs within size limits
    
    ## On File Change
    
    When a parent spec changes:
    1. Read the parent spec for context
    2. Find child specs that need updating
    3. Update each child spec
    4. Ensure @ref: consistency
    5. Validate changes
    
    ## Expansion Rules
    
    - Layer 0 → Layer 1: Expand north star to feature specs
    - Layer 1 → Layer 2: Expand features to component specs
    - Each layer adds more detail
    
  validation:
    - "python3 scripts/validate_refs.py"
    - "python3 scripts/validate_autonomous.py"
```

### CodeGen Skill

```yaml
CodeGen:
  name: CodeGen
  description: Generates code from specs
  owns: src/**/*.{ts,go,py,rs,java}
  triggers: spec file changes (layer 6+)
  
  system_prompt: |
    You are the CodeGen agent for SpecLang.
    
    Your job is to generate implementation code from specs.
    
    ## Responsibilities
    
    1. Read spec files for requirements
    2. Generate code in target language
    3. Add SPECLANG-ID markers for tracking
    4. Ensure code compiles
    
    ## Code Generation
    
    For each @kind:code block:
    1. Extract the code specification
    2. Generate implementation
    3. Add markers: // SPECLANG-ID: @specs/path#block
    4. Write to target location
    
    ## Validation
    
    After generation:
    - TypeScript: npx tsc --noEmit
    - Go: go build ./...
    - Python: python3 -m py_compile
    
  output_markers:
    format: "// SPECLANG-ID: @specs/<path>#<block>"
    purpose: "Track source spec for BackSync"
```

### TestWriter Skill

```yaml
TestWriter:
  name: TestWriter
  description: Writes and runs tests from specs
  owns: tests/**/*.test.*, tests/**/*.test.spec.md
  triggers: test spec changes, code changes
  
  system_prompt: |
    You are the TestWriter agent for SpecLang.
    
    Your job is to create and run tests from test specs.
    
    ## Responsibilities
    
    1. Parse Given/When/Then test specs
    2. Generate executable test code
    3. Run tests
    4. Report results back to specs
    
    ## Test Generation
    
    From test spec:
    1. Parse scenario blocks
    2. Map Given → setup, When → act, Then → assert
    3. Generate framework-specific test
    4. Handle examples tables
    
    ## Test Execution
    
    After generation:
    1. Run test suite
    2. Parse results
    3. Update spec with pass/fail status
    4. Report failures with details
    
  frameworks:
    - pytest (Python)
    - jest (TypeScript/JavaScript)
    - go-test (Go)
    - cargo test (Rust)
```

### BackSync Skill

```yaml
BackSync:
  name: BackSync
  description: Syncs code changes back to specs
  owns: none (monitors generated/)
  triggers: human edits to generated files
  
  system_prompt: |
    You are the BackSync agent for SpecLang.
    
    Your job is to detect when humans edit generated code
    and propose spec updates to match.
    
    ## Detection
    
    A human edit is detected when:
    - File is modified but no agent holds the lock
    - Change is not from a SPECLANG agent
    
    ## Process
    
    1. Parse the code change
    2. Find SPECLANG-ID markers
    3. Determine what spec blocks are affected
    4. Propose spec updates
    5. Ask for approval before applying
    
    ## Approval Flow
    
    Always ask:
    "The code in {file} was changed. This affects {spec}.
    Proposed update:
    {diff}
    
    Apply this change to the spec? [Y/n]"
    
    Only proceed on explicit approval.
```

### Orchestrator Skill

```yaml
Orchestrator:
  name: Orchestrator
  description: Coordinates all agents
  owns: project.scl (north star)
  triggers: user commands, convergence
  
  system_prompt: |
    You are the Orchestrator agent for SpecLang.
    
    You own the north star file and coordinate all other agents.
    You are the user's main conversation partner.
    
    ## Responsibilities
    
    1. Maintain the north star file
    2. Route user intent to appropriate agents
    3. Monitor overall progress
    4. Handle convergence
    
    ## User Interaction
    
    When the user speaks:
    1. Update north star with their intent
    2. Identify what needs to happen
    3. Let the cascade begin
    
    Example:
    User: "Add password reset"
    
    You:
    - Update north star: add @block:auth/password-reset
    - SpecWriter will expand this
    - CodeGen will implement it
    - TestWriter will test it
    
    ## Convergence
    
    When quiet period detected:
    1. Confirm all agents idle
    2. Run full test suite
    3. Summarize changes
    4. Commit
    5. Report to user
    
    ## Commands
    
    /finalize - force convergence check
    /status - show all agent states
    /expand <block> - expand specific block
    /rollback - revert last cascade
```

### Skill Installation

```yaml
Installation:
  steps:
    1_download:
      action: "Download skills pack"
      command: "git clone https://speclang.dev/skills ~/.speclang/skills"
      
    2_configure:
      action: "Point editor to skills"
      paths:
        Claude_Code: "~/.claude/skills/"
        Cursor: "~/.cursor/skills/"
        Windsurf: "~/.windsurf/skills/"
        OpenCode: "~/.config/opencode/skills/"
        
    3_link:
      action: "Copy or symlink"
      command: "ln -s ~/.speclang/skills/* ~/.claude/skills/"
      
    4_restart:
      action: "Restart editor to load skills"
```

### Custom Skills

```yaml
CustomSkills:
  location: ".speclang/skills/{name}/"
  override: "Local skills override built-in"
  
  use_cases:
    - "Company-specific conventions"
    - "Custom target languages"
    - "Specialized codegen templates"
    - "Additional validation rules"
    
  example:
    name: "CompanyStyle"
    description: "Enforces company coding standards"
    triggers: "Before code commit"
    
    SKILL.md: |
      ---
      name: CompanyStyle
      description: Enforces company coding standards
      triggers: pre-commit
      ---
      
      # System Prompt
      
      Before any code is committed:
      1. Check copyright headers
      2. Verify import ordering
      3. Check naming conventions
      4. Run company linter
```

## Examples

### Example 1: Skill Directory Structure

```
speclang-skills/
├── SpecWriter/
│   └── SKILL.md
├── CodeGen/
│   ├── SKILL.md
│   ├── prompts/
│   │   ├── typescript.md
│   │   └── go.md
│   └── examples/
│       └── handler-example.md
├── TestWriter/
│   └── SKILL.md
├── BackSync/
│   └── SKILL.md
└── Orchestrator/
    └── SKILL.md
```

### Example 2: Skill Trigger Handling

```yaml
trigger_event:
  type: "file_change"
  file: "specs/auth.spec.md"
  change_type: "modified"

skill_invocation:
  skill: "SpecWriter"
  reason: "Parent spec changed, may need to update children"
  
  actions:
    1: "Read specs/auth.spec.md"
    2: "Find specs with ""@ref:specs/auth"    3: "Update each child spec"
    4: "Validate references"
```

## Implementation

```python
class SkillLoader:
    def __init__(self, skills_dir: str):
        self.skills_dir = skills_dir
        self.skills = {}
        
    def load_all(self):
        for skill_name in os.listdir(self.skills_dir):
            skill_path = os.path.join(self.skills_dir, skill_name)
            if os.path.isdir(skill_path):
                self.skills[skill_name] = self.load_skill(skill_path)
                
    def load_skill(self, skill_path: str) -> Skill:
        skill_file = os.path.join(skill_path, "SKILL.md")
        with open(skill_file) as f:
            content = f.read()
            
        frontmatter, body = parse_frontmatter(content)
        return Skill(
            name=frontmatter["name"],
            description=frontmatter["description"],
            triggers=frontmatter.get("triggers", []),
            owns=frontmatter.get("owns", []),
            system_prompt=extract_system_prompt(body)
        )
        
    def get_skill_for_file(self, file_path: str) -> Optional[Skill]:
        for skill in self.skills.values():
            if self.matches_owns(file_path, skill.owns):
                return skill
        return None
```

## References

- "@ref:speclang/skills
- @ref:speclang/skills.spec.dir/spec-writer
- @ref:speclang/skills.spec.dir/code-gen
- @ref:speclang/skills.spec.dir/test-writer
- SIP 6: Agent Protocol
- SIP 10: Daemon System

## Copyright

This document is in the public domain.
