# Bootstrap Phase 0.4: User Workflow

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.4 of the bootstrap process.

**Prerequisites**: 
- Phase 0.1 (SQLite Database) complete
- Phase 0.2 (Header Parser) complete
- Phase 0.3 (Indexer) complete

## Your Task
Implement the user-facing workflow system including CLI commands, guides, and daily use patterns that make Speclang easy to use.

## Read These Specs First
1. `specs/workflow.spec.md` - Main workflow overview
2. `specs/workflow.spec.dir/setup.spec.md` - Installation and project start
3. `specs/workflow.spec.dir/daily-use.spec.md` - Conversation, review, commands
4. `specs/workflow.spec.dir/examples.spec.md` - File flow and troubleshooting

## What to Build

### Files to Create
```
src/workflow/
├── cli.ts              # CLI commands (init, status, etc.)
├── setup.ts            # Installation and project initialization
├── conversation.ts     # Natural language command parser
├── review.ts           # Spec review utilities
└── commands.ts         # /finalize, /pause, /resume, etc.

docs/
├── getting-started.md  # User guide
└── daily-workflow.md   # Daily use patterns

tests/
└── workflow.test.ts    # Workflow tests
```

### Requirements

#### 1. CLI Commands
```bash
speclang init              # Create project structure
speclang init --mode=light # Light mode (default)
speclang init --mode=enterprise  # Enterprise mode
speclang status            # Show daemon and cascade state
speclang skills download   # Download skills pack
speclang skills list       # List installed skills
speclang --version         # Version info
```

#### 2. Project Initialization (from setup.spec.md)
Creates:
```
my-app/
├── project.scl        # north star (empty, ready for user)
├── specs/             # spec files (empty)
├── tests/             # test specs (empty)
├── generated/         # output code (gitignored)
├── .speclang/         # daemon state
│   ├── config.json
│   └── locks/
├── .speclangrc        # project config
├── build.yaml         # pipeline config (default)
└── .gitignore
```

#### 3. Natural Language Commands
```typescript
// Parse user intent from conversation
parseCommand(input: string): Command {
  // "Build a Go API with auth" → start feature
  // "Add password reset" → extend existing
  // "Use PostgreSQL instead of SQLite" → modify config
  // "Show me what changed" → review diff
}
```

#### 4. North Star Commands (typed in project.scl)
- `/finalize` → force convergence + commit
- `/pause` → pause cascade
- `/resume` → resume cascade
- `/status` → show cascade state
- `/rollback` → undo last changes
- `/build` → run pipeline manually

#### 5. Review Utilities
```typescript
// What changed since last convergence
getChanges(): {
  specs_modified: SpecChange[];
  code_generated: FileChange[];
  tests_added: FileChange[];
}

// Show spec diff for review
showSpecDiff(specId: string): string;
```

#### 6. Daily Workflow Support
Morning:
- Check daemon status
- Review north star

Development:
- Track cascade progress
- Auto-test integration

Review:
- Show daily changes
- Approve or adjust

End of day:
- Finalize and commit

### Code Quality
- CLI using `commander` or similar
- All commands typed with JSDoc
- Handle errors with helpful messages
- Reference spec blocks in comments

## Validation
```bash
bun test tests/workflow.test.ts
speclang init --dry-run
speclang status
```

## Output Format
After completing, output:
1. List of files created
2. Test results
3. Any deviations from the spec (with justification)
