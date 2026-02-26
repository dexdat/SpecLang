---
name: sip-033-workflow-speclang-v0
title: "SIP 33: User Workflow"
version: 0.1.0
description: Daily workflows and CLI commands for SpecLang users
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 33: User Workflow

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the User Workflow—how users actually use SpecLang from start to finish.

### Quick Start

Daily workflow:
1. **Conversation**: Talk to agent about what you want
2. **Review**: Agent shows changes, you approve
3. **Commands**: CLI for status, history, rollback
4. **Iteration**: Continue conversation for refinements

### When to Read This

- **Getting started**: First time using SpecLang
- **Daily usage**: Common patterns and commands
- **Troubleshooting**: When things go wrong

### Related SIPs

- SIP 6: Agent Protocol
- SIP 10: Daemon
- SIP 25: Skills
- SIP 28: Cascade Protocol

## Abstract

This SIP defines the User Workflow—practical guidance for how users interact with SpecLang. The workflow is conversation-driven: users talk to agents, agents make changes, users review and approve. CLI commands provide status, history, and rollback capabilities.

## Motivation

Users need clear guidance on:
- How to start a SpecLang project
- How daily work flows
- What commands are available
- How to troubleshoot issues

This SIP consolidates workflow guidance into one reference.

## Rationale

**Conversation-driven workflow:**

1. **Natural**: Talk, don't type commands
2. **Iterative**: Refine through dialogue
3. **Visible**: Review before committing
4. **Recoverable**: Easy rollback

## Specification

### Setup Workflow

```yaml
Setup:
  installation:
    step_1: "Install Speclang plugin"
    step_2: "Configure .speclang/config.yaml"
    step_3: "Initialize database: speclang init"
    
  new_project:
    step_1: "Create project.scl (north star)"
    step_2: "Run @speclang-orchestrator"
    step_3: "Review generated specs"
    step_4: "Iterate until satisfied"
    
  existing_project:
    step_1: "Copy specs/ folder (if exists)"
    step_2: "Run speclang rebuild"
    step_3: "Review restored project"
```

### Daily Workflow

```yaml
DailyWorkflow:
  start_session:
    action: "Open conversation with agent"
    example: "I want to add user authentication"
    
  agent_response:
    action: "Agent proposes changes"
    shows:
      - "What specs will be created/modified"
      - "What code will be generated"
      - "What tests will be added"
      
  user_review:
    action: "Review proposed changes"
    options:
      - "approve: proceed with changes"
      - "modify: request adjustments"
      - "reject: cancel operation"
      
  agent_execution:
    action: "Agent makes changes"
    commits: "Per-file commits"
    shows: "Summary of changes"
    
  iteration:
    action: "Continue conversation"
    example: "Now add rate limiting to login"
```

### CLI Commands

```yaml
CLICommands:
  project_management:
    speclang_init:
      description: "Initialize Speclang in current directory"
      creates: [".speclang/", "specs/"]
      
    speclang_rebuild:
      description: "Rebuild project from specs/"
      params: ["--clean"]
      
    speclang_status:
      description: "Show current state"
      shows: ["cascade status", "pending changes", "sessions"]
      
  file_operations:
    speclang_create:
      description: "Create new spec"
      params: ["<path>", "--from-template"]
      
    speclang_validate:
      description: "Validate all specs"
      checks: ["headers", "references", "completeness"]
      
  history:
    speclang_history:
      description: "Show file history"
      params: ["<file>", "--limit N"]
      
    speclang_blame:
      description: "Show line authorship"
      params: ["<file>"]
      
    speclang_rollback:
      description: "Rollback changes"
      params: ["<file>", "<commit>", "--cascade"]
      
  utility:
    speclang_index:
      description: "Regenerate index"
      creates: ["_index.json", "SQLite entries"]
      
    speclang_graph:
      description: "Show dependency graph"
      params: ["<spec>", "--format mermaid"]
```

### Common Patterns

```yaml
CommonPatterns:
  adding_feature:
    conversation:
      - "I need to add password reset"
      - "Agent creates auth.spec.dir/password-reset.spec.yaml"
      - "Agent generates code"
      - "Agent creates tests"
      - "User reviews and approves"
      
  fixing_bug:
    conversation:
      - "Login is failing with wrong error message"
      - "Agent reads auth.spec.dir/login.spec.yaml"
      - "Agent identifies issue in spec"
      - "Agent updates spec and regenerates"
      - "User confirms fix works"
      
  refactoring:
    conversation:
      - "Auth module is too big, split it"
      - "Agent analyzes auth.spec.md"
      - "Agent proposes split plan"
      - "User approves plan"
      - "Agent creates auth.spec.dir/ sub-specs"
      - "Agent updates references"
      
  documentation:
    conversation:
      - "Generate API docs from specs"
      - "Agent reads all endpoint specs"
      - "Agent generates OpenAPI spec"
      - "Agent generates markdown docs"
      - "User reviews output"
```

### Review Process

```yaml
ReviewProcess:
  before_changes:
    agent_shows:
      - "Files to be created"
      - "Files to be modified"
      - "Files to be deleted"
      - "Estimated changes"
      
  user_decision:
    approve:
      action: "Proceed with changes"
      shortcut: "y, yes, go"
      
    modify:
      action: "Request adjustments"
      example: "Actually, use bcrypt instead of argon2"
      
    reject:
      action: "Cancel operation"
      shortcut: "n, no, cancel"
      
    detail:
      action: "See more details"
      example: "Show me the full diff first"
      
  after_changes:
    agent_shows:
      - "Summary of changes"
      - "Commits created"
      - "Test results"
      - "Next steps"
```

### Troubleshooting

```yaml
Troubleshooting:
  broken_references:
    symptom: "validate_refs.py fails"
    causes:
      - "Referenced spec doesn't exist"
      - "Typo in @ref path"
      - "Spec moved without updating refs"
    fixes:
      - "Create missing spec"
      - "Fix typo in reference"
      - "Run speclang update-refs"
      
  cascade_stuck:
    symptom: "Cascade won't converge"
    causes:
      - "Circular dependency"
      - "Agent keeps making changes"
      - "Depth limit reached"
    fixes:
      - "Check dependency graph"
      - "Manual intervention"
      - "Increase depth limit"
      
  code_not_compiling:
    symptom: "Generated code has errors"
    causes:
      - "Spec is incomplete"
      - "Template is wrong"
      - "Missing dependency"
    fixes:
      - "Review spec completeness"
      - "Update code template"
      - "Add missing dependency"
      
  tests_failing:
    symptom: "Tests fail after generation"
    causes:
      - "Spec doesn't match implementation"
      - "Test spec is wrong"
      - "Missing test setup"
    fixes:
      - "Review spec vs code"
      - "Update test spec"
      - "Add test fixtures"
```

### Team Workflow

```yaml
TeamWorkflow:
  collaboration:
    git_branches:
      main: "Converged, tested specs"
      feature/*: "Active development"
      
    code_review:
      process:
        - "Author runs cascade"
        - "Author creates PR"
        - "Reviewer checks specs"
        - "Reviewer checks generated code"
        - "Approval or feedback"
        
    merging:
      rule: "Only converged branches"
      process:
        - "All tests pass"
        - "All refs valid"
        - "Code compiles"
        - "Merge to main"
        
  shared_specs:
    ownership:
      - "specs/ is shared truth"
      - "Changes via conversation"
      - "Commits track who changed what"
      
  sync:
    daily:
      - "git pull"
      - "speclang rebuild (if needed)"
      - "Continue work"
```

## Examples

### Example 1: Adding a Feature

```yaml
user: "I need to add password reset to the auth system"

agent:
  analysis:
    - "Found auth.spec.md at level 1"
    - "Need to create password-reset sub-spec"
    - "Will generate handler code"
    - "Will create tests"
    
  proposal: |
    I'll add password reset by:
    1. Creating specs/auth.spec.dir/password-reset.spec.yaml
    2. Generating src/auth/password-reset.go
    3. Creating tests/auth/password-reset.test.spec.scl
    
    Files affected:
    + specs/auth.spec.dir/password-reset.spec.yaml
    + src/auth/password-reset.go
    + tests/auth/password-reset.test.spec.scl
    
    Proceed?

user: "Yes"

agent:
  execution:
    - "Created specs/auth.spec.dir/password-reset.spec.yaml"
    - "Generated src/auth/password-reset.go"
    - "Created tests/auth/password-reset.test.spec.scl"
    
  result: |
    ✓ Password reset added
    ✓ 3 commits created
    ✓ Tests passing
    
    Commits:
    a1b2c3d speclang: created password-reset spec
    e4f5g6h speclang: generated password-reset handler
    i7j8k9l speclang: added password-reset tests
```

### Example 2: Debugging

```yaml
user: "Login is returning wrong error codes"

agent:
  investigation:
    - "Reading specs/auth.spec.dir/login.spec.yaml"
    - "Checking generated code"
    - "Found issue: spec says 401, code returns 400"
    
  proposal: |
    Found the issue:
    
    In specs/auth.spec.dir/login.spec.yaml:
      errors.invalid_credentials: "401 Unauthorized"
    
    In generated code:
      return 400 BadRequest
    
    I'll fix by regenerating from the spec.
    Proceed?

user: "Yes"

agent:
  execution:
    - "Regenerated src/auth/login.go"
    - "Commit: f7g8h9i"
    
  result: |
    ✓ Fixed error code mismatch
    ✓ Code now returns 401 for invalid credentials
```

### Example 3: Rollback

```yaml
user: "The last change broke something, rollback"

agent:
  check:
    - "Last commit: f7g8h9i"
    - "Files: src/auth/login.go"
    - "Message: speclang: fixed error code mismatch"
    
  options: |
    Rollback options:
    1. Rollback just src/auth/login.go (HEAD~1)
    2. Revert commit f7g8h9i entirely
    3. Cascade rollback (all recent changes)
    
    Which?

user: "1"

agent:
  execution:
    - "git checkout HEAD~1 -- src/auth/login.go"
    
  result: |
    ✓ Rolled back src/auth/login.go
    ✓ Previous version restored
    ✓ Ready to retry fix
```

## Implementation

```python
class UserWorkflow:
    def __init__(self, agent: Agent, git: GitClient, cli: CLI):
        self.agent = agent
        self.git = git
        self.cli = cli
        
    def start_conversation(self, user_input: str) -> str:
        analysis = self.agent.analyze(user_input)
        proposal = self.agent.propose(analysis)
        return proposal
        
    def review_and_approve(self, proposal: dict, user_response: str) -> dict:
        if user_response.lower() in ["y", "yes", "go"]:
            return self.agent.execute(proposal)
        elif user_response.lower() in ["n", "no", "cancel"]:
            return {"status": "cancelled"}
        else:
            return self.agent.modify(proposal, user_response)
            
    def rollback(self, option: str, target: str = None) -> dict:
        if option == "file":
            return self.git.checkout_file(target, "HEAD~1")
        elif option == "commit":
            return self.git.revert(target)
        elif option == "cascade":
            return self.git.reset_hard(target)
```

## References

- @ref:speclang/workflow
- @ref:speclang/daemon
- @ref:speclang/skills
- SIP 6: Agent Protocol
- SIP 10: Daemon
- SIP 25: Skills

## Copyright

This document is in the public domain.
