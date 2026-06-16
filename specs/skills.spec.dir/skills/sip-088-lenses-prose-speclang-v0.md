---
name: sip-088-lenses-prose-speclang-v0
title: "SIP 88: Prose Lens"
version: 0.1.0
description: Natural language prose parsing for spec blocks
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 88: Prose Lens

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the Prose Lens—parsing and rendering of natural language content within spec blocks.

### Quick Start

```markdown
### @block::intro @kind:prose

This specification defines the authentication system for the platform.
The system supports multiple authentication methods including email/password,
OAuth, and MFA.

## Features

- Secure password hashing
- JWT token management
- Session handling
```

### When to Read This

- **Documentation**: Explanations and overviews
- **Requirements**: Natural language specs
- **Narratives**: User stories and flows

### Related SIPs

- SIP 35: Lenses System
- SIP 21: Semantic Definitions
- SIP 24: Test Specs

## Abstract

This SIP defines the Prose Lens—the default lens for parsing and rendering natural language content within SpecLang blocks. The lens handles markdown, extracts structure, and supports semantic annotations.

## Motivation

Most content is prose:
- Explanations
- Requirements
- Documentation
- User stories

Prose lens makes natural language machine-readable.

## Rationale

**Why prose lens:**
- Default fallback
- Markdown support
- Semantic extraction
- Structure recognition

## Specification

### Lens Definition

**@lens/definition:**

```yaml
ProseLens:
  name: "prose"
  kind_marker: "@kind:prose"
  detector: "default (fallback)"
  priority: 1
```

### Block Format

**@lens/format:**

```yaml
block:
  id: "@block:intro"
  kind: "prose"
  
  prose_lens:
    content: |
      Natural language content here...
    sections:
      - name: "Introduction"
        level: 1
        content: "..."
    annotations:
      - type: "requirement"
        text: "must support OAuth"
      - type: "note"
        text: "future consideration"
```

### Content Structure

**@lens/structure:**

```typescript
interface ProseBlock {
  kind: 'prose';
  content: string;
  format: 'markdown' | 'plain';
  sections: Section[];
  annotations: Annotation[];
  sentences: Sentence[];
  keywords: string[];
}

interface Section {
  name: string;
  level: number;
  content: string;
  startLine: number;
  endLine: number;
}

interface Annotation {
  type: 'requirement' | 'note' | 'warning' | 'todo' | 'example';
  text: string;
  line: number;
}

interface Sentence {
  text: string;
  type: 'statement' | 'question' | 'command';
  keywords: string[];
  entities: string[];
}
```

### Parsing

**@lens/parsing:**

```typescript
function parseProse(content: string): ProseBlock {
  const sections = extractSections(content);
  const annotations = extractAnnotations(content);
  const sentences = extractSentences(content);
  const keywords = extractKeywords(content);
  
  return {
    kind: 'prose',
    content,
    format: detectFormat(content),
    sections,
    annotations,
    sentences,
    keywords,
  };
}
```

### Section Extraction

**@lens/sections:**

```typescript
function extractSections(content: string): Section[] {
  const lines = content.split('\n');
  const sections: Section[] = [];
  
  let currentSection: Section | null = null;
  let sectionStart = 0;
  
  const headingPattern = /^(#{1,6})\s+(.+)$/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(headingPattern);
    
    if (match) {
      if (currentSection) {
        currentSection.endLine = i - 1;
        sections.push(currentSection);
      }
      
      currentSection = {
        name: match[2].trim(),
        level: match[1].length,
        content: '',
        startLine: i,
        endLine: -1,
      };
      sectionStart = i;
    } else if (currentSection) {
      currentSection.content += line + '\n';
    }
  }
  
  if (currentSection) {
    currentSection.endLine = lines.length - 1;
    sections.push(currentSection);
  }
  
  return sections;
}
```

### Annotation Extraction

**@lens/annotations:**

```typescript
function extractAnnotations(content: string): Annotation[] {
  const annotations: Annotation[] = [];
  
  const patterns: Array<{ type: Annotation['type']; regex: RegExp }> = [
    { type: 'requirement', regex: /MUST|shall|required|mandatory/gi },
    { type: 'requirement', regex: /\[REQUIREMENT\]:?\s*(.+)/gi },
    { type: 'note', regex: /\[NOTE\]:?\s*(.+)/gi },
    { type: 'note', regex: /^>\s*(.+)$/gm },
    { type: 'warning', regex: /\[WARNING\]:?\s*(.+)/gi },
    { type: 'warning', regex: /^!WARNING:?\s*(.+)$/gm },
    { type: 'todo', regex: /\[TODO\]:?\s*(.+)/gi },
    { type: 'todo', regex: /TODO:?/gi },
    { type: 'example', regex: /\[EXAMPLE\]:?\s*(.+)/gi },
  ];
  
  for (const { type, regex } of patterns) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      annotations.push({
        type,
        text: match[1] || match[0],
        line: content.slice(0, match.index).split('\n').length,
      });
    }
  }
  
  return annotations;
}
```

### Sentence Extraction

**@lens/sentences:**

```typescript
function extractSentences(content: string): Sentence[] {
  const sentences: Sentence[] = [];
  
  const text = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '');
  
  const sentencePattern = /[^.!?]+[.!?]+/g;
  let match;
  
  while ((match = sentencePattern.exec(text)) !== null) {
    const text = match[0].trim();
    if (text.length < 3) continue;
    
    sentences.push({
      text,
      type: detectSentenceType(text),
      keywords: extractKeywords(text),
      entities: extractEntities(text),
    });
  }
  
  return sentences;
}

function detectSentenceType(text: string): 'statement' | 'question' | 'command' {
  if (text.trim().endsWith('?')) return 'question';
  if (text.startsWith('Shall') || text.startsWith('Should') || text.startsWith('Must')) return 'command';
  return 'statement';
}
```

### Keyword Extraction

**@lens/keywords:**

```typescript
function extractKeywords(content: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
    'those', 'it', 'its', 'they', 'them', 'their', 'we', 'us', 'our',
  ]);
  
  const words = content
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));
  
  const frequency = new Map<string, number>();
  for (const word of words) {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  }
  
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}
```

### Entity Extraction

**@lens/entities:**

```typescript
function extractEntities(content: string): string[] {
  const entities: string[] = [];
  
  const capitalizedPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  let match;
  
  while ((match = capitalizedPattern.exec(content)) !== null) {
    if (!isCommonWord(match[1])) {
      entities.push(match[1]);
    }
  }
  
  const refPattern = /@ref:(\S+)/g;
  while ((match = refPattern.exec(content)) !== null) {
    entities.push(match[1]);
  }
  
  return [...new Set(entities)];
}

function isCommonWord(word: string): boolean {
  return new Set(['The', 'This', 'That', 'These', 'Those', 'Such', 'Each', 'Every']).has(word);
}
```

### Markdown Detection

**@lens/format:**

```typescript
function detectFormat(content: string): 'markdown' | 'plain' {
  const markdownIndicators = [
    /^#{1,6}\s+/m,
    /\*\*[^*]+\*\*/,
    /\*[^*]+\*/,
    /`[^`]+`/,
    /```[\s\S]*?```/,
    /\[.+\]\(.+\)/,
    /^\s*[-*+]\s+/m,
    /^\s*\d+\.\s+/m,
    /^\s*>/m,
  ];
  
  const score = markdownIndicators.filter(p => p.test(content)).length;
  
  return score >= 2 ? 'markdown' : 'plain';
}
```

### Rendering

**@lens/rendering:**

```typescript
function renderProse(block: ProseBlock): string {
  return block.content;
}

function renderProseWithAnnotations(block: ProseBlock): string {
  let content = block.content;
  
  const annotationStyles: Record<Annotation['type'], (text: string) => string> = {
    requirement: (t) => `**REQUIREMENT:** ${t}`,
    note: (t) => `> **Note:** ${t}`,
    warning: (t) => `> **Warning:** ${t}`,
    todo: (t) => `TODO: ${t}`,
    example: (t) => `**Example:** ${t}`,
  };
  
  for (const annotation of block.annotations) {
    content = annotationStyles[annotation.type](annotation.text) + '\n' + content;
  }
  
  return content;
}
```

### Validation Rules

**@lens/validation:**

```yaml
ValidationRules:
  - name: has_content
    description: "Content must not be empty"
    check: content.trim().length > 0
    
  - name: valid_markdown
    description: "If markdown, must be parseable"
    check: parseMarkdown(content)
    
  - name: no_empty_sections
    description: "Section headers must have content"
    check: all sections have content
    
  - name: valid_annotations
    description: "Annotation markers must be valid"
    check: all annotations parse correctly
```

### AI Behavior

**@lens/ai:**

```yaml
AIBehavior:
  auto_detection:
    - "Detects markdown structure"
    - "Extracts sections"
    - "Finds annotations"
    - "Identifies keywords"
    
  generation:
    - "Generates from bullet points"
    - "Expands outlines"
    - "Adds examples"
    
  transformation:
    - "Converts to/from structured formats"
    - "Adds annotations"
    - "Summarizes content"
    - "Expands abbreviations"
```

## Examples

### Example 1: Feature Description

**@example/feature:**

```markdown
### @block::auth-features @kind:prose

# Authentication System

The authentication system provides secure access to the platform.

## Requirements

[REQUIREMENT]: Must support email/password authentication
[REQUIREMENT]: Must support OAuth 2.0 (Google, GitHub)
[REQUIREMENT]: Must support TOTP-based 2FA
[REQUIREMENT]: Must generate JWT tokens with 1-hour expiry

## Security

- Passwords are hashed using bcrypt with cost factor 12
- JWT tokens include user ID, email, and roles
- Refresh tokens are stored securely in HTTP-only cookies
- Rate limiting prevents brute force attacks

> Note: SMS-based MFA is planned for future release
```

**Parsed:**
```yaml
block:
  id: "@block:auth-features"
  kind: "prose"
  sections:
    - { name: "Authentication System", level: 1 }
    - { name: "Requirements", level: 2 }
    - { name: "Security", level: 2 }
  annotations:
    - { type: "requirement", text: "Must support email/password authentication" }
    - { type: "requirement", text: "Must support OAuth 2.0 (Google, GitHub)" }
    - { type: "requirement", text: "Must support TOTP-based 2FA" }
    - { type: "requirement", text: "Must generate JWT tokens with 1-hour expiry" }
    - { type: "note", text: "SMS-based MFA is planned for future release" }
```

### Example 2: API Documentation

**@example/api:**

```markdown
### @block::api-docs @kind:prose

# User API

## Endpoints

### GET /api/users

Returns a list of all users.

**Authentication:** Required
**Authorization:** Admin only

### POST /api/users

Creates a new user.

[REQUIREMENT]: Email must be unique
[REQUIREMENT]: Password must be at least 8 characters

### Response Format

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user"
}
```
```

### Example 3: User Story

**@example/story:**

```markdown
### @block::user-story @kind:prose

# User Registration Flow

As a new user, I want to create an account so that I can access the platform.

## Acceptance Criteria

- [ ] User can register with email and password
- [ ] User receives confirmation email
- [ ] User can verify email address
- [ ] User can log in after verification

[TODO]: Add social login
[TODO]: Add password strength indicator

> Note: This feature is required for MVP
```

### Example 4: Decision Record

**@example/adr:**

```markdown
### @block::adr-001 @kind:prose

# ADR 001: Use PostgreSQL for Primary Database

## Status

Accepted

## Context

We need a database for storing user data, authentication tokens, and application state.

## Decision

We will use PostgreSQL as the primary database.

## Rationale

- PostgreSQL provides ACID compliance
- PostgreSQL supports JSON columns for flexible schemas
- PostgreSQL has excellent query performance
- PostgreSQL has strong community support

## Consequences

[REQUIREMENT]: Migration scripts must be versioned
[REQUIREMENT]: Connection pooling must be configured
```

## Implementation

### Prose Lens Implementation

```typescript
export class ProseLens implements Lens {
  name = 'prose';
  
  detect(content: string): boolean {
    return true;
  }
  
  parse(content: string): ProseBlock {
    return parseProse(content);
  }
  
  render(block: ProseBlock): string {
    return renderProse(block);
  }
  
  validate(block: ProseBlock): ValidationResult {
    const errors: string[] = [];
    
    if (!block.content.trim()) {
      errors.push('Content is empty');
    }
    
    return { valid: errors.length === 0, errors };
  }
}
```

### Summary Generation

```typescript
function generateSummary(block: ProseBlock): string {
  const sentences = block.sentences.slice(0, 5);
  const keywords = block.keywords.slice(0, 10);
  
  return `Summary: ${sentences.map(s => s.text).join(' ')}
Keywords: ${keywords.join(', ')}`;
}
```

### Structure Extraction

```typescript
function extractStructure(block: ProseBlock): any {
  return {
    headings: block.sections.map(s => ({ level: s.level, title: s.name })),
    requirements: block.annotations.filter(a => a.type === 'requirement').map(a => a.text),
    notes: block.annotations.filter(a => a.type === 'note').map(a => a.text),
    todos: block.annotations.filter(a => a.type === 'todo').map(a => a.text),
  };
}
```

## References

- "@ref:sip-035-lenses
- @ref:sip-021-semantic-definitions
- @ref:sip-024-test-specs
- @ref:speclang/lenses/prose

## Copyright

This document is in the public domain.
