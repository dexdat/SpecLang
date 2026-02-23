# speclang-header lines:12
id: "@speclang/workflow/daily-use"
version: 0.1.0
layer: 2
parent: "@speclang/workflow"
part: 2/3
tags: [workflow, daily, conversation, review, commands]
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Daily Usage Workflow
---

## The Conversation

### @workflow/conversation

```speclang
# @block:workflow/conversation @kind:entity
UserConversation:
  location: AI editor (OpenCode, Cursor, etc.)
  partner: Orchestrator agent (via skills)
  
  what_user_says:
    - "Build a Go API with auth"
    - "Add password reset"
    - "Use PostgreSQL instead of SQLite"
    - "Make it faster"
    - "Add rate limiting"
    
  what_ai_does:
    - Updates north star file
    - Triggers cascade
    - Expands specs
    - Generates code
    - Runs tests
    
  what_user_sees:
    - File changes in editor
    - Cascade log in terminal
    - Test results
    - Final generated code
```

### @workflow/conversation-example

```speclang
# @block:workflow/conversation-example @kind:code
```markdown
User: Build a Go REST API for a todo app with auth

AI: I'll create the north star file and start the cascade.
    [Writes to project.scl]
    [Cascade begins...]
    
    Created specs:
    - specs/auth.scl
    - specs/todos.scl
    - specs/api.scl
    
    Generated code:
    - generated/go/main.go
    - generated/go/auth/login.go
    - generated/go/todos/handler.go
    
    Tests:
    - tests/auth.test.spec.scl → auth_test.go
    - tests/todos.test.spec.scl → todos_test.go
    
    Running tests... ✓ All 12 tests passed
    
    Converged. Ready for next instruction.

User: Add rate limiting to the API

AI: I'll add rate limiting to the auth module.
    [Updates specs/auth.scl]
    [Cascade continues...]
    
    Updated:
    - specs/auth.scl (added rate-limit policy)
    - generated/go/auth/middleware.go (new)
    
    Tests: +3 new tests, all passing
    
    Converged.
```
```

---

## What User Reviews

### @workflow/review

```speclang
# @block:workflow/review @kind:entity
UserReviews:
  what_to_review:
    - project.scl (north star)
    - specs/core/*.scl (level 0 specs)
    - Any spec the user wants to understand
    
  what_NOT_to_review:
    - generated/**/* (machine code)
    - specs/expanded/**/* (AI-generated details)
    - tests/*.test.spec.scl (AI-generated tests)
    
  philosophy:
    - Review intent, not implementation
    - Specs are the source of truth
    - Generated code is like compiled output
```

### @workflow/review-commands

```speclang
# @block:workflow/review-commands @kind:code
```markdown
User: Show me what changed

AI: Changes since last convergence:
    
    Specs modified:
    - specs/auth.scl (+15 lines)
      Added: @block:auth/rate-limit
    
    Code generated:
    - generated/go/auth/middleware.go (new)
    - generated/go/auth/login.go (+8 lines)
    
    Tests added:
    - tests/auth/rate-limit.test.spec.scl (new)

User: Show me the auth spec

AI: [Displays specs/auth.scl content]
    
    Want me to explain any part?

User: Why did we add rate limiting?

AI: You asked to "Add rate limiting to the API".
    I added a policy to auth.scl that limits requests
    per IP to 100/minute.
```
```

---

## Commands

### @workflow/commands

```speclang
# @block:workflow/commands @kind:entity
UserCommands:
  spoken_to_ai:
    "Build [feature]"      → start new feature
    "Add [capability]"     → extend existing
    "Change [setting]"     → modify config
    "Fix [issue]"          → address problem
    "Explain [block]"      → understand spec
    
  typed_in_north_star:
    /finalize              → force convergence + commit
    /pause                 → pause cascade
    /resume                → resume cascade
    /status                → show cascade state
    /rollback              → undo last changes
    /build                 → run pipeline manually
```

---

## Daily Workflow

### @workflow/daily

```speclang
# @block:workflow/daily @kind:note
Typical day with Speclang:

Morning:
1. Open project, daemon running
2. "Show me what we're building"
3. Review north star, maybe tweak

Development:
4. "Add [feature]"
5. Watch cascade
6. Review generated specs (optional)
7. Tests pass automatically

Review:
8. "What changed today?"
9. Review spec diff
10. Approve or adjust

End of day:
11. /finalize
12. Commit pushed
13. Done
```