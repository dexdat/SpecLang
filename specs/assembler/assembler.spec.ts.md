---
id: "@speclang/assembler/assembler"
version: 1.0.0
layer: 2
target_lang: ts
output: .speclang/assembler.spec.ts
owned-by: assembler
model_pool: code-gen
max_concurrent: 1
seed: false
tags: [assembler, core, codegen, extract]
short: "Core assembler engine — reads .spec.{lang}.md and writes .spec.{lang}"
depends_on:
  - "@ref:specs/core"
status: draft
---

# Assembler Engine

## Overview

The core assembler engine reads `.spec.{lang}.md` files and produces `.spec.{lang}` source code files. During bootstrap, the code is extracted by hand. After bootstrap, SpecLang uses this module to regenerate its own framework.

### Architecture

```
.spec.ts.md file
       |
       v
+------------------+
| Header Parser    |  Extract front matter: target_lang, output, owned-by
+------------------+
       |
       v
+------------------+
| Ref Resolver     |  Resolve @ref: links, read referenced specs
+------------------+
       |
       v
+------------------+
| Context Builder  |  Gather folder context, sibling specs, dependency tree
+------------------+
       |
       v
+------------------+
| Code Extractor   |  Extract code from ## Implementation blocks
| (bootstrap)      |  OR call LLM to assemble from full spec context (self-host)
+------------------+
       |
       v
.spec.{lang} file
```

## Implementation

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

// ---- Types ----

export interface AssemblerInput {
  specPath: string;
  outputPath: string;
  targetLang: string;
  header: Record<string, unknown>;
  body: string;
  refs: SpecContext[];
}

export interface SpecContext {
  id: string;
  path: string;
  header: Record<string, unknown>;
  body: string;
}

export interface AssemblerOutput {
  success: boolean;
  outputPath?: string;
  warnings: string[];
  errors: string[];
}

// ---- Header Parser ----

export function parseSpecFile(content: string): { header: Record<string, unknown>; body: string } | null {
  const match = content.match(/^---\n(.*?)\n---\n(.*)$/s);
  if (!match) return null;
  try {
    const header = yaml.load(match[1]) as Record<string, unknown>;
    return { header, body: match[2].trim() };
  } catch {
    return null;
  }
}

// ---- Reference Extractor ----

export function extractRefs(body: string): string[] {
  const refs: string[] = [];
  const pattern = /@ref:([^\s)}]+)/g;
  let match;
  while ((match = pattern.exec(body)) !== null) {
    refs.push(match[1]);
  }
  return refs;
}

// ---- Context Builder ----

export async function resolveRefs(
  refs: string[],
  basePath: string
): Promise<SpecContext[]> {
  const contexts: SpecContext[] = [];
  for (const ref of refs) {
    try {
      const refPath = path.resolve(basePath, ref.replace(/^specs\//, ''));
      const content = await fs.readFile(refPath, 'utf-8');
      const parsed = parseSpecFile(content);
      if (parsed) {
        contexts.push({
          id: (parsed.header.id as string) || ref,
          path: refPath,
          header: parsed.header,
          body: parsed.body,
        });
      }
    } catch {
      // Ref not resolvable — skip
    }
  }
  return contexts;
}

// ---- Folder Context ----

export function getFolderContext(specPath: string): {
  folder: string;
  siblings: string[];
  depth: number;
} {
  const folder = path.dirname(specPath);
  const depth = folder.split(path.sep).length;
  return { folder, siblings: [], depth };
}

// ---- Code Extractor (Bootstrap Mode) ----

export function extractImplementationBlocks(body: string, targetLang: string): string {
  // Find ## Implementation and ## @block: sections, extract code fences for the target language
  const blocks: string[] = [];

  // Match both ## Implementation and ## @block:<name> section headers
  const sectionPattern = /^##\s+(?:Implementation|@block:\s*(\S+))\s*\r?\n([\s\S]*?)(?=^\s*##\s+(?:\w|@block)|(?![\s\S]))/gm;

  let match: RegExpExecArray | null;
  while ((match = sectionPattern.exec(body)) !== null) {
    const blockName = match[1] || null; // null for ## Implementation sections without a name
    const section = match[2];

    // Extract code blocks with matching language
    const tryLang = (lang: string): boolean => {
      const escapedLang = lang.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const codePattern = new RegExp(`\`\`\`${escapedLang}\n([\\s\\S]*?)\`\`\``, 'g');
      let codeMatch: RegExpExecArray | null;
      let found = false;
      while ((codeMatch = codePattern.exec(section)) !== null) {
        let code = codeMatch[1].trim();
        // Prepend block traceability comment for named @block: sections
        if (blockName) {
          code = `// @block: ${blockName}\n${code}`;
        }
        blocks.push(code);
        found = true;
      }
      return found;
    };

    // Try all aliases for the target language
    const aliases: Record<string, string[]> = {
      ts: ['typescript', 'ts'],
      go: ['go'],
      py: ['python', 'py'],
      rs: ['rust', 'rs'],
      js: ['javascript', 'js'],
    };
    const langsToTry = aliases[targetLang] || [targetLang];
    for (const lang of langsToTry) {
      if (tryLang(lang)) break;
    }
  }

  return blocks.join('\n\n');
}

// ---- Main Assembler ----

export class Assembler {
  async assemble(specPath: string): Promise<AssemblerOutput> {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Read spec file
      const content = await fs.readFile(specPath, 'utf-8');
      const parsed = parseSpecFile(content);

      if (!parsed) {
        return { success: false, warnings, errors: [`Invalid spec format: ${specPath}`] };
      }

      const { header, body } = parsed;

      // Validate required fields
      const targetLang = (header.targetLang || header.target_lang || '') as string;
      const outputPath = header.output as string;

      if (!targetLang) {
        errors.push('Missing target_lang in header');
      }
      if (!outputPath) {
        errors.push('Missing output in header');
      }
      if (errors.length > 0) {
        return { success: false, warnings, errors };
      }

      // Resolve refs
      const refs = extractRefs(body);
      const refContexts = await resolveRefs(refs, path.dirname(specPath));

      // Get folder context
      const folderContext = getFolderContext(specPath);

      // Extract code (bootstrap mode — simple extraction)
      const code = extractImplementationBlocks(body, targetLang);

      // Ensure output directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      // Write output
      await fs.writeFile(outputPath, code, 'utf-8');

      warnings.push(`Assembled ${specPath} -> ${outputPath} (${refContexts.length} refs resolved)`);

      return { success: true, outputPath, warnings, errors };
    } catch (err: any) {
      return { success: false, warnings, errors: [err.message] };
    }
  }

  async assembleAll(globs: string[] = ['specs/**/*.spec.ts.md']): Promise<AssemblerOutput[]> {
    const { glob: fastGlob } = await import('fast-glob');
    const files = await fastGlob(globs, { ignore: ['node_modules/**', '.git/**'] });
    const results: AssemblerOutput[] = [];
    for (const file of files) {
      const result = await this.assemble(file);
      results.push(result);
    }
    return results;
  }
}

// ---- CLI Entry ----

if (require.main === module) {
  const assembler = new Assembler();
  const target = process.argv[2];

  if (target) {
    assembler.assemble(target).then((r) => {
      console.log(r.success ? '✅' : '❌', r.outputPath || target);
      r.warnings.forEach((w) => console.log('  ⚠', w));
      r.errors.forEach((e) => console.log('  ❌', e));
    });
  } else {
    assembler.assembleAll().then((results) => {
      console.log(`Assembled ${results.filter((r) => r.success).length}/${results.length} files`);
    });
  }
}
```

## Verification

```bash
# Test the assembler on its own spec (bootstrap moment)
npx tsx .speclang/assembler.spec.ts specs/assembler/assembler.spec.ts.md
# Should produce .speclang/assembler.spec.ts

# Test assembly of all code-pair specs
npx tsx .speclang/assembler.spec.ts
```
