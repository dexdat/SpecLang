# Bootstrap Phase 0.11: Skills Pack

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.11 of the bootstrap process.

**Prerequisites**: 
- Phase 0.1-0.10 complete
- Standard library ready
- Agent definitions in place

## Your Task
Implement the SpecLang skills pack - AI editor skills that drive the reactive system. These skills define how agents like SpecWriter, CodeGen, and TestWriter operate.

## Read These Specs First
1. `specs/skills.spec.md` - Skills pack overview
2. `specs/skills.spec.dir/spec-writer.spec.md` - SpecWriter skill
3. `specs/skills.spec.dir/code-gen.spec.md` - CodeGen skill
4. `specs/skills.spec.dir/test-writer.spec.md` - TestWriter skill
5. `specs/core.spec.dir/agents.spec.md` - Agent definitions

## What to Build

### Files to Create
```
.opencode/skills/
├── spec-writer.md        # SpecWriter skill
├── code-gen.md           # CodeGen skill
├── test-writer.md        # TestWriter skill
├── back-sync.md          # BackSync skill
└── orchestrator.md       # Orchestrator skill

src/skills/
├── index.ts              # Skill loader
├── registry.ts           # Skill registry
├── loader.ts             # Skill file parser
├── executor.ts           # Skill execution
└── types.ts              # TypeScript types

skills/                   # Standalone skills pack
├── SpecWriter/
│   └── SKILL.md
├── CodeGen/
│   └── SKILL.md
├── TestWriter/
│   └── SKILL.md
├── BackSync/
│   └── SKILL.md
└── Orchestrator/
    └── SKILL.md
```

### Requirements

#### 1. Skill Types

```typescript
// src/skills/types.ts

interface Skill {
  name: string;
  description: string;
  version: string;
  triggers: SkillTrigger[];
  owns: string[];
  priority: number;
  systemPrompt: string;
  prompts: Record<string, string>;
  tools?: string[];
  examples?: SkillExample[];
}

interface SkillTrigger {
  event: 'file.edited' | 'file.created' | 'file.deleted' | 'agent.finished' | 'convergence' | 'user.command';
  pattern?: string;
  condition?: string;
}

interface SkillExample {
  name: string;
  input: string;
  output: string;
}

interface SkillContext {
  event: SkillEvent;
  session: Session;
  db: Database;
  config: Config;
}

interface SkillEvent {
  type: string;
  path?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

interface SkillResult {
  success: boolean;
  message: string;
  filesModified?: string[];
  nextActions?: string[];
}
```

#### 2. Skill Registry

```typescript
// src/skills/registry.ts

export class SkillRegistry {
  private skills: Map<string, Skill> = new Map();
  private triggers: Map<string, Skill[]> = new Map();
  
  register(skill: Skill): void {
    this.skills.set(skill.name, skill);
    
    // Index by triggers
    for (const trigger of skill.triggers) {
      const key = this.getTriggerKey(trigger);
      if (!this.triggers.has(key)) {
        this.triggers.set(key, []);
      }
      this.triggers.get(key)!.push(skill);
    }
    
    console.log(`[skills] Registered: ${skill.name}`);
  }
  
  unregister(name: string): void {
    const skill = this.skills.get(name);
    if (!skill) return;
    
    // Remove from trigger index
    for (const trigger of skill.triggers) {
      const key = this.getTriggerKey(trigger);
      const skills = this.triggers.get(key);
      if (skills) {
        const idx = skills.findIndex(s => s.name === name);
        if (idx >= 0) skills.splice(idx, 1);
      }
    }
    
    this.skills.delete(name);
  }
  
  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }
  
  getByTrigger(event: SkillEvent): Skill[] {
    const key = this.getTriggerKey({ event: event.type });
    const skills = this.triggers.get(key) || [];
    
    // Filter by pattern
    return skills.filter(skill => {
      for (const trigger of skill.triggers) {
        if (trigger.event !== event.type) continue;
        if (trigger.pattern && event.path) {
          if (!this.matchPattern(event.path, trigger.pattern)) continue;
        }
        return true;
      }
      return false;
    });
  }
  
  private getTriggerKey(trigger: SkillTrigger): string {
    return trigger.event;
  }
  
  private matchPattern(path: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regex = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');
    return new RegExp(`^${regex}$`).test(path);
  }
}
```

#### 3. Skill Loader

```typescript
// src/skills/loader.ts

export class SkillLoader {
  private registry: SkillRegistry;
  
  constructor(registry: SkillRegistry) {
    this.registry = registry;
  }
  
  async loadDirectory(dir: string): Promise<number> {
    let count = 0;
    
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const skill = await this.loadFile(path.join(dir, file));
        if (skill) {
          this.registry.register(skill);
          count++;
        }
      }
    }
    
    return count;
  }
  
  async loadFile(filepath: string): Promise<Skill | null> {
    const content = await fs.readFile(filepath, 'utf-8');
    return this.parseSkill(content, filepath);
  }
  
  private parseSkill(content: string, filepath: string): Skill | null {
    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      console.warn(`[skills] Invalid skill file: ${filepath}`);
      return null;
    }
    
    const [, frontmatter, body] = frontmatterMatch;
    const meta = yaml.parse(frontmatter);
    
    // Parse prompts from body
    const prompts = this.parsePrompts(body);
    const systemPrompt = prompts['System Prompt'] || prompts['System'] || '';
    
    return {
      name: meta.name || path.basename(filepath, '.md'),
      description: meta.description || '',
      version: meta.version || '0.1.0',
      triggers: this.parseTriggers(meta.triggers || []),
      owns: meta.owns || [],
      priority: meta.priority || 0,
      systemPrompt,
      prompts,
      tools: meta.tools,
      examples: this.parseExamples(body)
    };
  }
  
  private parseTriggers(triggers: string[]): SkillTrigger[] {
    return triggers.map(t => {
      const parts = t.split(':');
      return {
        event: parts[0] as SkillTrigger['event'],
        pattern: parts[1]
      };
    });
  }
  
  private parsePrompts(body: string): Record<string, string> {
    const prompts: Record<string, string> = {};
    const sections = body.split(/^# /m).filter(Boolean);
    
    for (const section of sections) {
      const lines = section.split('\n');
      const title = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();
      prompts[title] = content;
    }
    
    return prompts;
  }
  
  private parseExamples(body: string): SkillExample[] {
    const examples: SkillExample[] = [];
    const exampleRegex = /## Example: (.+)\n```[\s\S]*?Input:\n([\s\S]*?)\nOutput:\n([\s\S]*?)```/g;
    
    let match;
    while ((match = exampleRegex.exec(body)) !== null) {
      examples.push({
        name: match[1],
        input: match[2].trim(),
        output: match[3].trim()
      });
    }
    
    return examples;
  }
}
```

#### 4. Skill Executor

```typescript
// src/skills/executor.ts

export class SkillExecutor {
  private registry: SkillRegistry;
  
  constructor(registry: SkillRegistry) {
    this.registry = registry;
  }
  
  async execute(skillName: string, context: SkillContext): Promise<SkillResult> {
    const skill = this.registry.get(skillName);
    if (!skill) {
      return { success: false, message: `Skill not found: ${skillName}` };
    }
    
    console.log(`[executor] Executing: ${skillName}`);
    
    // Build prompt
    const prompt = this.buildPrompt(skill, context);
    
    // Execute skill (would integrate with AI)
    // For now, return structured result
    return {
      success: true,
      message: `Skill ${skillName} executed`,
      filesModified: [],
      nextActions: []
    };
  }
  
  async executeForEvent(event: SkillEvent, context: SkillContext): Promise<SkillResult[]> {
    const skills = this.registry.getByTrigger(event);
    
    if (skills.length === 0) {
      return [];
    }
    
    // Sort by priority
    skills.sort((a, b) => b.priority - a.priority);
    
    // Execute skills in order
    const results: SkillResult[] = [];
    for (const skill of skills) {
      // Check ownership
      if (skill.owns.length > 0 && event.path) {
        const owned = skill.owns.some(pattern => 
          this.matchPattern(event.path!, pattern)
        );
        if (!owned) {
          continue;
        }
      }
      
      const result = await this.execute(skill.name, context);
      results.push(result);
      
      // Stop on failure if high priority
      if (!result.success && skill.priority >= 100) {
        break;
      }
    }
    
    return results;
  }
  
  private buildPrompt(skill: Skill, context: SkillContext): string {
    let prompt = skill.systemPrompt;
    
    // Add context
    prompt += `\n\n## Context\n`;
    prompt += `- Event: ${context.event.type}\n`;
    if (context.event.path) {
      prompt += `- File: ${context.event.path}\n`;
    }
    if (context.event.content) {
      prompt += `\n### File Content\n\`\`\`\n${context.event.content}\n\`\`\`\n`;
    }
    
    // Add available prompts
    for (const [name, content] of Object.entries(skill.prompts)) {
      if (name !== 'System Prompt' && name !== 'System') {
        prompt += `\n\n## ${name}\n${content}`;
      }
    }
    
    return prompt;
  }
  
  private matchPattern(path: string, pattern: string): boolean {
    const regex = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');
    return new RegExp(`^${regex}$`).test(path);
  }
}
```

#### 5. SpecWriter Skill

```markdown
<!-- .opencode/skills/spec-writer.md -->
---
name: SpecWriter
description: Writes and expands spec files
version: 0.1.0
triggers:
  - file.edited:specs/*.spec.md
  - file.created:specs/*.spec.md
  - user.command:/expand
owns:
  - specs/**/*.spec.md
  - specs/**/*.scl
priority: 100
tools:
  - speclang_search
  - speclang_get_spec
  - speclang_index_refresh
---

# System Prompt

You are the SpecWriter agent for SpecLang.

Your job is to write, expand, and maintain specification files.

## Responsibilities

1. Parse user intent from north star or direct commands
2. Create new spec files with proper headers
3. Expand high-level specs into detailed specs
4. Ensure all references (@ref:) resolve
5. Add step-by-step descriptions for operations
6. Run validation after changes

## Spec Format

All specs must have:
```yaml
# speclang-header lines:N
id: @specs/...
version: X.Y.Z
layer: N (0-10)
project_level: POC | MVP | Alpha | Beta | Production
agent_support: human_only | agent_assisted | agent_autonomous
tags: [...]
short: Brief description
---
```

## Expansion Rules

When expanding a spec:
1. Read parent spec for context
2. Identify blocks to expand
3. Add detailed content
4. Create child specs if needed
5. Maintain proper layer hierarchy
6. Ensure references resolve

## Validation

After any change:
```bash
python3 scripts/validate_refs.py
python3 scripts/validate_autonomous.py --file <path>
```

## On File Change

1. Read the file
2. Parse header and blocks
3. Check for SPECLANG-EXPAND markers
4. Expand any incomplete sections
5. Validate references
6. Write updated file

## Commands

- `/expand <block-id>` - Expand specific block
- `/refactor <spec-id>` - Refactor spec structure
- `/split <spec-id>` - Split into multiple specs
- `/merge <spec-ids>` - Merge multiple specs

# On File Edit

When a spec file is edited:

1. **Parse the changes**
   - What blocks were modified?
   - What new blocks added?
   - What references changed?

2. **Validate structure**
   - Header is valid YAML
   - IDs follow conventions
   - No duplicate block IDs

3. **Expand if needed**
   - Look for incomplete blocks
   - Add missing details
   - Create child specs for complex blocks

4. **Update references**
   - Ensure all @ref: point to existing IDs
   - Update _index.json if needed

5. **Run validation**
   ```bash
   python3 scripts/validate_refs.py
   ```

# Examples

## Creating New Spec

Input: User wants auth system
Output:
```yaml
# speclang-header lines:12
id: @specs/auth
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [auth, security, users]
short: User authentication system
---

# Authentication System

## @block:auth/entities

```typescript
export interface User {
  id: UUID;
  email: Email;
  passwordHash: string;
  createdAt: DateTime;
}
```

## @block:auth/operations

```typescript
export async function login(email: Email, password: string): Promise<Result<User, AuthError>>;
export async function register(email: Email, password: string): Promise<Result<User, AuthError>>;
export async function logout(): Promise<void>;
```

## @block:auth/errors

```typescript
export type AuthError = 
  | 'invalid_credentials'
  | 'user_not_found'
  | 'email_already_exists';
```
```

## Expanding Spec

Input: Expand @block:auth/operations
Output: Create specs/auth.spec.dir/operations.spec.md with detailed step-by-step descriptions.
```

#### 6. CodeGen Skill

```markdown
<!-- .opencode/skills/code-gen.md -->
---
name: CodeGen
description: Generates code from specs
version: 0.1.0
triggers:
  - file.edited:specs/*.spec.md
  - user.command:/generate
owns:
  - src/**/*.ts
  - src/**/*.go
  - src/**/*.py
  - generated/**/*
priority: 90
tools:
  - speclang_search
  - speclang_get_spec
---

# System Prompt

You are the CodeGen agent for SpecLang.

Your job is to generate implementation code from specification files.

## Responsibilities

1. Read spec files to understand requirements
2. Generate code in target language
3. Include SPECLANG-ID markers for traceability
4. Leave SPECLANG-IMPLEMENT markers for logic
5. Ensure code compiles (typecheck)
6. Follow project conventions

## Code Generation Rules

1. **Headers**: Every file must have SPECLANG-ID marker
   ```typescript
   // SPECLANG-ID: @specs/auth#entities
   ```

2. **Types**: Generate from spec type definitions
3. **Functions**: Generate signatures, leave implementation
4. **Imports**: Use stdlib mappings for types

## Output Structure

```
src/
├── {feature}/
│   ├── types.ts      # From @block:*/entities
│   ├── operations.ts # From @block:*/operations
│   └── index.ts      # Public exports
```

## On Spec Change

1. Find affected code files (via SPECLANG-ID)
2. Regenerate type definitions
3. Update function signatures
4. Preserve manual implementations
5. Run typecheck

# Language Mappings

## TypeScript

```typescript
// String -> string
// Number -> number
// Boolean -> boolean
// UUID -> string
// DateTime -> string
// List<T> -> T[]
// Map<K,V> -> Record<K,V>
// Optional<T> -> T | null
// Result<T,E> -> Result<T,E>
```

## Go

```go
// String -> string
// Number -> float64
// Boolean -> bool
// UUID -> string
// DateTime -> time.Time
// List<T> -> []T
// Map<K,V> -> map[K]V
// Optional<T> -> *T
```

# Examples

## Input Spec

```yaml
## @block:auth/entities
```typescript
export interface User {
  id: UUID;
  email: Email;
  passwordHash: string;
}
```
```

## Generated Code

```typescript
// src/auth/types.ts
// SPECLANG-ID: @specs/auth#entities

export interface User {
  id: string; // UUID
  email: string; // Email
  passwordHash: string;
}
```
```

#### 7. TestWriter Skill

```markdown
<!-- .opencode/skills/test-writer.md -->
---
name: TestWriter
description: Writes tests from specs
version: 0.1.0
triggers:
  - file.edited:src/**/*.ts
  - user.command:/test
owns:
  - tests/**/*.test.ts
  - tests/**/*_test.go
priority: 80
tools:
  - speclang_search
  - speclang_get_spec
---

# System Prompt

You are the TestWriter agent for SpecLang.

Your job is to create test specifications and test code from specs and implementation.

## Responsibilities

1. Read spec for test requirements
2. Create test spec files
3. Generate test code
4. Ensure tests pass
5. Cover edge cases

## Test Format

```typescript
// tests/auth.test.ts
// SPECLANG-ID: @specs/auth#tests

import { describe, it, expect } from 'bun:test';
import { login, register } from '../src/auth/operations';

describe('Auth', () => {
  describe('login', () => {
    it('returns user for valid credentials', async () => {
      // SPECLANG-IMPLEMENT
    });
    
    it('throws for invalid credentials', async () => {
      // SPECLANG-IMPLEMENT
    });
  });
});
```

## Test Generation Rules

1. One test file per spec file
2. Describe block per operation
3. It block per test case
4. Cover success and error paths

# On Code Change

1. Find corresponding spec
2. Read test requirements
3. Generate/update test file
4. Run tests

# Examples

## From Spec

```yaml
## @block:auth/tests

Given: A user with email "test@example.com"
When: login is called with correct password
Then: User is returned

Given: A user with email "test@example.com"
When: login is called with wrong password
Then: AuthError is returned
```

## Generated Test

```typescript
describe('login', () => {
  it('returns user for valid credentials', async () => {
    // Given
    const email = 'test@example.com';
    const password = 'correct-password';
    
    // When
    const result = await login(email, password);
    
    // Then
    expect(result.ok).toBe(true);
  });
  
  it('returns error for invalid credentials', async () => {
    // Given
    const email = 'test@example.com';
    const password = 'wrong-password';
    
    // When
    const result = await login(email, password);
    
    // Then
    expect(result.ok).toBe(false);
  });
});
```
```

#### 8. BackSync Skill

```markdown
<!-- .opencode/skills/back-sync.md -->
---
name: BackSync
description: Syncs code changes back to specs
version: 0.1.0
triggers:
  - file.edited:src/**
  - file.edited:generated/**
owns: []  # Monitors only
priority: 70
---

# System Prompt

You are the BackSync agent for SpecLang.

Your job is to detect when humans edit generated code and propose spec updates.

## Detection

A human edit is detected when:
- File is modified but no agent holds the lock
- Change is not from a SPECLANG agent

## Process

1. Parse the code change
2. Find SPECLANG-ID markers
3. Determine affected spec blocks
4. Generate spec update proposal
5. Request approval before applying

## Approval Flow

Always ask for approval:
```
The code in {file} was changed. This affects {spec}.

Proposed update:
{diff}

Apply this change to the spec? [Y/n]
```

Only proceed on explicit approval.

# On File Change

1. Check if human edit (no lock, not from agent)
2. If yes, parse change
3. Find affected spec via SPECLANG-ID
4. Generate spec update proposal
5. Request approval
6. If approved, update spec file
```

#### 9. Orchestrator Skill

```markdown
<!-- .opencode/skills/orchestrator.md -->
---
name: Orchestrator
description: Coordinates all agents
version: 0.1.0
triggers:
  - user.command:*
  - convergence
owns:
  - project.scl
  - specs/project.scl
priority: 200
tools:
  - speclang_search
  - speclang_get_spec
  - speclang_index_refresh
---

# System Prompt

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

# Commands

- `/finalize` - Force convergence check
- `/status` - Show all agent states
- `/expand <block>` - Expand specific block
- `/rollback` - Revert last cascade
- `/cascade` - Trigger cascade manually

# Agent Coordination

## Starting a Cascade

1. Identify trigger (user command, file change)
2. Determine which agents to invoke
3. Track cascade state
4. Run verification after each step
5. Handle errors with recovery

## Monitoring Progress

Track:
- Which agents are running
- Which files are locked
- Current cascade depth
- Verification results

# Example Session

```
User: Add user profiles

Orchestrator:
1. Updating north star with "user profiles" feature
2. Invoking SpecWriter to create @specs/profiles
3. Waiting for spec expansion...
4. SpecWriter complete: specs/profiles.spec.md created
5. Invoking CodeGen...
6. CodeGen complete: src/profiles/ created
7. Invoking TestWriter...
8. TestWriter complete: tests/profiles.test.ts created
9. Running verification...
10. All checks passed
11. Committing changes
12. Done! User profiles feature is ready.
```
```

### Skill Installation

```bash
# Install skills to OpenCode
ln -s $(pwd)/.opencode/skills/* ~/.opencode/skills/

# Or use the installer
speclang skills install --target opencode

# Verify installation
speclang skills list
```

## Test Cases
1. Skill registry registers and retrieves skills
2. Skill loader parses skill files
3. Skill executor runs skills correctly
4. SpecWriter creates valid specs
5. CodeGen generates compilable code
6. TestWriter creates passing tests
7. BackSync detects human edits
8. Orchestrator coordinates agents
9. Triggers match events correctly
10. Priority ordering works

## Validation
```bash
# Test skills
bun test tests/skills.test.ts

# List skills
speclang skills list

# Test skill execution
speclang skills execute spec-writer --event file.edited --path specs/test.spec.md

# Verify skill files
find .opencode/skills -name "*.md" -exec echo {} \;
```

## Output Format
After completing, output:
1. Skill registry implemented
2. Skill loader working
3. Skill executor working
4. SpecWriter skill created
5. CodeGen skill created
6. TestWriter skill created
7. BackSync skill created
8. Orchestrator skill created
9. Test results
