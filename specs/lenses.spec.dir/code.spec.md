# speclang-header lines:11
id: "@speclang/lenses/code"
version: 0.1.0
layer: 4
project_level: Alpha
agent_support: agent_autonomous
tags: [lenses, code, syntax-highlighting]
short: "Code block extraction and formatting lens"
target: src/lenses/code-lens.ts
status: draft
---

# Code Lens

Extracts and formats code blocks from specs.

## Input Format (Spec Blocks)

### @lenses/code/input-format

Code lens accepts spec blocks with `@kind:code` marker. The language is inferred from the code fence language identifier or from the block metadata.

**Input examples:**

```speclang
### @block::login-function @kind:code

```typescript
function login(email: string, password: string): Token {
  const user = db.findUser(email);
  if (!user) throw new Error("User not found");
  return generateToken(user);
}
```
```

**Language detection:**
- Code fence language identifier (` ```typescript`)
- Block metadata (`language: typescript`)
- File extension inference (`.ts` → TypeScript)
- Content heuristics (keywords, syntax)

## Output Format (Formatted Code)

### @lenses/code/output-format

Generates formatted code with proper indentation and language tagging.

**Output examples:**

```typescript
function login(email: string, password: string): Token {
  const user = db.findUser(email);
  if (!user) throw new Error("User not found");
  return generateToken(user);
}
```

**Features:**
- Syntax highlighting via language tags
- Indentation preservation
- Line number support
- Collapsible sections for large code blocks
- Copy-to-clipboard functionality

## Supported Languages

### @lenses/code/languages

**Primary languages (full syntax support):**
- TypeScript / JavaScript
- Python
- Go
- Rust
- Java
- C#

**Secondary languages (basic highlighting):**
- SQL
- YAML
- JSON
- XML
- HTML/CSS
- Bash/Shell
- Dockerfile
- GraphQL

**Pseudocode support:**
- `pseudocode` language tag for algorithm descriptions
- Natural language code blocks

## Code Extraction

### @lenses/code/extraction

Extracts code blocks from spec markdown with accurate language detection.

**Extraction process:**
1. Detect code fences (` ```language`)
2. Parse language identifier
3. Extract content between fences
4. Normalize indentation
5. Preserve leading/trailing whitespace as needed
6. Capture metadata (line numbers, source location)

**Edge cases:**
- Nested code blocks (not supported)
- Mixed language blocks (first language wins)
- Missing language identifier (default to `text`)
- Empty code blocks (preserve as empty)

## Language Detection

### @lenses/code/language-detection

Multiple strategies for language identification.

**Detection priority:**
1. Explicit language tag in code fence (` ```typescript`)
2. Block metadata (`language: typescript`)
3. File extension inference (`.ts` → TypeScript)
4. Content heuristics (`import` → JavaScript/TypeScript, `def` → Python)
5. Default fallback (`text`)

**Heuristic patterns:**
- TypeScript: `import`, `export`, `interface`, `type`
- Python: `def`, `class`, `import`, `from`
- Go: `package`, `import`, `func`, `struct`
- Rust: `use`, `fn`, `struct`, `impl`
- Java: `public class`, `import`, `@Override`

## Validation Rules

### @lenses/code/validation

Validates extracted code blocks for basic correctness.

**Syntax validation:**
- Balanced braces (`{`, `}`)
- Balanced parentheses (`(`, `)`)
- Balanced brackets (`[`, `]`)
- String quote matching (`"`, `'`, `` ` ``)

**Language-specific validation:**
- TypeScript: Type syntax validation (basic)
- Python: Indentation consistency
- Go: Package declaration presence
- SQL: Basic keyword validation

**Import/require resolution:**
- Check import paths exist (optional)
- Validate module names
- Warn about missing dependencies

## Examples

### @lenses/code/examples

**Example 1: TypeScript function**

```speclang
### @block::auth-service @kind:code

```typescript
import { User, Token } from './auth';

export async function authenticate(email: string, password: string): Promise<Token> {
  const user = await db.users.findOne({ email });
  if (!user) throw new AuthError('User not found');
  
  const valid = await bcrypt.compare(password, user.hash);
  if (!valid) throw new AuthError('Invalid password');
  
  return jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
}
```
```

**Example 2: Python class**

```speclang
### @block::data-model @kind:code

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class User:
    id: str
    email: str
    name: str
    role: str = "user"
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
        }
```
```

**Example 3: Go handler**

```speclang
### @block::http-handler @kind:code

```go
package handler

import (
    "context"
    "net/http"
)

type Handler struct {
    db *Database
}

func NewHandler(db *Database) *Handler {
    return &Handler{db: db}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    // implementation
}
```
```

## Implementation Notes

### @lenses/code/implementation

The code lens implementation should:

1. **Detection:** Identify `@kind:code` blocks and code fences
2. **Parsing:** Extract language and content with precise boundaries
3. **Normalization:** Preserve essential whitespace while removing extraneous
4. **Validation:** Perform basic syntax checks
5. **Rendering:** Format code with proper indentation and language tags

**Integration:** The lens integrates with the existing lens registry and supports all standard lens operations (parse, render, validate).

**Testing:** Each language should have test coverage for extraction, detection, and validation.

**Performance:** Code lens should handle large code blocks efficiently (10k+ lines).
