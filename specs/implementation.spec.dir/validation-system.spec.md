# speclang-header lines:10
id: "@speclang/implementation.validation-system"
version: 0.1.0
layer: 3
parent: "@ref:speclang/implementation"
imports: ["@speclang/validation", "@speclang/core", "@speclang/sqlite", "@speclang/headers"]
tags: [validation, implementation, typescript, schema, linting]
short: TypeScript validation system for Speclang spec compliance
project_level: Alpha
agent_support: agent_assisted
---

# Validation System Implementation

TypeScript implementation of spec validation system that runs on file save, agent write, and explicit validation commands.

---

## Overview

### @implementation/validation/overview

```speclang
# @block:implementation/validation/overview @kind:note
Validation system ensures all specs comply with Speclang conventions:

- Header format correctness
- ID format compliance
- Reference resolution
- Tag non-empty
- Depth in tree (non-negative integer)
- Import existence
- File naming conventions

Validation runs:
1. On file save (before cascade)
2. On agent write (guard plugin)
3. On explicit /validate command
4. As part of Verifier Agent pipeline

Invalid specs block cascades and notify the agent.
```

---

## Validation Engine

### @implementation/validation/engine

```speclang
# @block:implementation/validation/engine @kind:code
```typescript
import Database = require('better-sqlite3');
import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import * as path from 'path';

export interface ValidationError {
  code: string;
  message: string;
  filePath: string;
  line?: number;
  column?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export class ValidationEngine {
  private db!: InstanceType<typeof Database>;

  constructor(db: InstanceType<typeof Database>) {
    this.db = db;
  }

  async validateSpec(filePath: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // Header validation
      const headerErrors = await this.validateHeader(filePath, lines);
      errors.push(...headerErrors);

      // Parse metadata
      const metadata = await this.extractMetadata(filePath, lines);
      if (metadata) {
        // ID validation
        const idErrors = this.validateId(metadata.id, filePath);
        errors.push(...idErrors);

        // Layer validation
        const layerErrors = this.validateLayer(metadata.layer);
        errors.push(...layerErrors);

        // Tag validation
        const tagErrors = this.validateTags(metadata.tags);
        errors.push(...tagErrors);

        // Reference validation
        const refErrors = await this.validateReferences(metadata.refs, filePath);
        errors.push(...refErrors);

        // Import validation
        const importErrors = await this.validateImports(metadata.imports);
        errors.push(...importErrors);
      }

      // File naming validation
      const namingErrors = this.validateFileName(filePath);
      errors.push(...namingErrors);

      // Block syntax validation
      const blockErrors = this.validateBlockSyntax(content);
      errors.push(...blockErrors);

    } catch (error) {
      errors.push({
        code: 'READ_ERROR',
        message: `Failed to read file: ${(error as Error).message}`,
        filePath
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async validateHeader(filePath: string, lines: string[]): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // Find speclang-header line
    const headerLineIndex = lines.findIndex(line => line.includes('speclang-header'));
    if (headerLineIndex === -1) {
      errors.push({
        code: 'MISSING_HEADER',
        message: 'Missing speclang-header declaration',
        filePath,
        line: 1
      });
      return errors;
    }

    // Check line count format
    const headerLine = lines[headerLineIndex];
    const lineCountMatch = headerLine.match(/lines:\s*(\d+)/);
    if (!lineCountMatch) {
      errors.push({
        code: 'HEADER_LINES_MISSING',
        message: 'Header must declare line count with "lines:N"',
        filePath,
        line: headerLineIndex + 1
      });
    } else {
      const expectedLines = parseInt(lineCountMatch[1]);
      // Check that there are enough lines
      if (lines.length < headerLineIndex + expectedLines) {
        errors.push({
          code: 'HEADER_LINES_MISMATCH',
          message: `Header declares ${expectedLines} lines but file has fewer lines`,
          filePath,
          line: headerLineIndex + 1
        });
      }
      // Check for separator
      const separatorIndex = lines.findIndex((line, idx) => idx >= headerLineIndex && line.trim() === '---');
      if (separatorIndex === -1 || separatorIndex !== headerLineIndex + expectedLines - 1) {
        errors.push({
          code: 'HEADER_SEPARATOR_MISMATCH',
          message: 'Header separator "---" not found at expected line',
          filePath,
          line: headerLineIndex + 1
        });
      }
    }

    return errors;
  }

  private async extractMetadata(filePath: string, lines: string[]): Promise<any> {
    try {
      const headerLineIndex = lines.findIndex(line => line.includes('speclang-header'));
      if (headerLineIndex === -1) return null;

      const headerLine = lines[headerLineIndex];
      const lineCountMatch = headerLine.match(/lines:\s*(\d+)/);
      if (!lineCountMatch) return null;

      const expectedLines = parseInt(lineCountMatch[1]);
      const yamlStart = headerLineIndex + 1;
      const yamlEnd = yamlStart + expectedLines - 2; // exclude header line and separator
      const yamlLines = lines.slice(yamlStart, yamlEnd);
      const yamlText = yamlLines.join('\n');

      return parse(yamlText);
    } catch (error) {
      return null;
    }
  }

  private validateId(id: string, filePath: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!id) {
      errors.push({
        code: 'MISSING_ID',
        message: 'ID field is required',
        filePath
      });
      return errors;
    }

    if (!id.startsWith('@')) {
      errors.push({
        code: 'ID_FORMAT',
        message: 'ID must start with @',
        filePath
      });
    }

    const parts = id.slice(1).split('/');
    if (parts.length < 2) {
      errors.push({
        code: 'ID_FORMAT',
        message: 'ID must follow @domain/path format',
        filePath
      });
    }

    const domain = parts[0];
    if (!/^[a-z0-9-]+$/.test(domain)) {
      errors.push({
        code: 'ID_DOMAIN',
        message: 'Domain must be lowercase with hyphens',
        filePath
      });
    }

    return errors;
  }

  private validateLayer(layer: any): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (layer === undefined || layer === null) {
      errors.push({
        code: 'MISSING_LAYER',
        message: 'Layer field is required',
        filePath: '' // will be filled by caller
      });
      return errors;
    }

    const layerNum = parseInt(layer);
    if (isNaN(layerNum) || layerNum < 0 || layerNum > 100) {
      errors.push({
        code: 'LAYER_RANGE',
        message: 'Layer must be integer 0-100 (depth in tree)',
        filePath: ''
      });
    }

    return errors;
  }

  private validateTags(tags: any): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      errors.push({
        code: 'TAGS_EMPTY',
        message: 'Tags must be non-empty array',
        filePath: ''
      });
      return errors;
    }

    for (const tag of tags) {
      if (typeof tag !== 'string' || tag.trim() === '') {
        errors.push({
          code: 'TAG_FORMAT',
          message: 'Tag must be non-empty string',
          filePath: ''
        });
      }
    }

    return errors;
  }

  private async validateReferences(refs: any[], filePath: string): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    if (!refs || !Array.isArray(refs)) {
      return errors;
    }

    for (const ref of refs) {
      if (typeof ref !== 'string') {
        errors.push({
          code: 'REF_FORMAT',
          message: 'Reference must be string',
          filePath
        });
        continue;
      }

      if (!ref.startsWith('@ref:')) {
        errors.push({
          code: 'REF_PREFIX',
          message: 'Reference must start with @ref:',
          filePath
        });
        continue;
      }

      // Check if referenced spec exists in SQLite
      const refPath = ref.substring(5); // Remove '@ref:'
      const stmtCheckRef = this.db.prepare(`SELECT COUNT(*) as count FROM specs WHERE id = ? OR file_path LIKE ?`);
      const exists = stmtCheckRef.get(refPath, `%${refPath}%`) as { count: number };
      
      if (exists.count === 0) {
        errors.push({
          code: 'REF_NOT_FOUND',
          message: `Referenced spec not found: ${refPath}`,
          filePath
        });
      }
    }

    return errors;
  }

  private async validateImports(imports: any[]): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    if (!imports || !Array.isArray(imports)) {
      return errors;
    }

    for (const imp of imports) {
      if (typeof imp !== 'string') {
        errors.push({
          code: 'IMPORT_FORMAT',
          message: 'Import must be string',
          filePath: ''
        });
        continue;
      }

      // Check if imported spec exists
      const stmtCheckImport = this.db.prepare(`SELECT COUNT(*) as count FROM specs WHERE id = ?`);
      const exists = stmtCheckImport.get(imp) as { count: number };
      
      if (exists.count === 0) {
        errors.push({
          code: 'IMPORT_NOT_FOUND',
          message: `Imported spec not found: ${imp}`,
          filePath: ''
        });
      }
    }

    return errors;
  }

  private validateFileName(filePath: string): ValidationError[] {
    const errors: ValidationError[] = [];
    const fileName = path.basename(filePath);

    // Check extension
    if (!fileName.endsWith('.spec.md') && !fileName.endsWith('.spec.yaml') && !fileName.endsWith('.scl')) {
      // Check for .{ext}.spec pattern
      const extSpecPattern = /\.[a-z]+\.spec$/;
      if (!extSpecPattern.test(fileName)) {
        errors.push({
          code: 'FILE_EXTENSION',
          message: 'File must have .spec.md, .spec.yaml, .scl, or .{ext}.spec extension',
          filePath
        });
      }
    }

    // Check naming conventions
    if (fileName.includes(' ')) {
      errors.push({
        code: 'FILE_NAME_SPACES',
        message: 'File name must not contain spaces',
        filePath
      });
    }

    return errors;
  }

  private validateBlockSyntax(content: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Check for block syntax: '''speclang followed by # @block:
    const blockRegex = /```speclang\n# @block:([^\s]+) @kind:([^\s]+)/g;
    const matches = content.matchAll(blockRegex);
    
    for (const match of matches) {
      const blockId = match[1];
      const kind = match[2];
      
      if (!blockId.match(/^[a-z0-9-]+\/[a-z0-9-]+$/)) {
        errors.push({
          code: 'BLOCK_ID_FORMAT',
          message: `Block ID must follow domain/name format: ${blockId}`,
          filePath: '' // will be filled by caller
        });
      }

      const validKinds = ['note', 'code', 'entity', 'diagram', 'schema', 'api'];
      if (!validKinds.includes(kind)) {
        errors.push({
          code: 'BLOCK_KIND',
          message: `Block kind must be one of: ${validKinds.join(', ')}`,
          filePath: ''
        });
      }
    }

    return errors;
  }
}
```

---

## Validation CLI

### @implementation/validation/cli

```speclang
# @block:implementation/validation/cli @kind:code
```typescript
import { glob } from 'glob';

export async function validateCommand(args: string[]) {
  const db = new Database('.speclang/speclang.db');

  const engine = new ValidationEngine(db);

  const patterns = args.length > 0 ? args : ['specs/**/*.spec.md'];
  const files = (await glob(patterns as string[], { ignore: '**/.backup_spec_files/**' })) as string[];

  let totalErrors = 0;
  let totalFiles = 0;

  for (const file of files) {
    const result = await engine.validateSpec(file);
    totalFiles++;

    if (!result.valid) {
      console.error(`\n❌ ${file}`);
      for (const error of result.errors) {
        console.error(`  ${error.code}: ${error.message}`);
        if (error.line) {
          console.error(`    Line ${error.line}`);
        }
      }
      totalErrors += result.errors.length;
    } else {
      console.log(`✅ ${file}`);
    }
  }

  console.log(`\nValidation complete: ${totalFiles} files, ${totalErrors} errors`);

  if (totalErrors > 0) {
    process.exit(1);
  }
}
```

---

## Integration with OpenCode Plugin

### @implementation/validation/opencode-integration

```speclang
# @block:implementation/validation/opencode-integration @kind:code
```typescript
// Integration with OpenCode plugin guard system
import { writeFile, unlink } from 'fs/promises';

export class ValidationGuard {
  private engine: ValidationEngine;

  constructor(engine: ValidationEngine) {
    this.engine = engine;
  }

  async beforeFileWrite(filePath: string, content: string): Promise<boolean> {
    // Write content to temp file for validation
    const tempPath = `${filePath}.tmp`;
    await writeFile(tempPath, content);

    const result = await this.engine.validateSpec(tempPath);
    await unlink(tempPath);

    if (!result.valid) {
      // Send validation errors to agent
      this.sendValidationErrors(result.errors);
      return false;
    }

    return true;
  }

  private sendValidationErrors(errors: ValidationError[]) {
    // Send errors via MCP or OpenCode event system
    errors.forEach(error => {
      console.error(`Validation error in ${error.filePath}: ${error.message}`);
    });
  }
}
```
