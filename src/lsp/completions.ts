import * as fs from 'fs';
import * as path from 'path';
import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';

import { resolveFileRef } from './references.js';

const SHORT_NAMES: Record<string, string> = {
  northstar: 'docs/NORTH_STAR.md',
};

function walkSpecFiles(dir: string, workspaceRoot: string): string[] {
  const results: string[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkSpecFiles(fullPath, workspaceRoot));
    } else if (entry.name.endsWith('.spec.md') || entry.name.endsWith('.scl')) {
      results.push(path.relative(workspaceRoot, fullPath));
    }
  }
  return results;
}

function relPathToRefId(relPath: string): string {
  return relPath.replace(/\.spec\.md$/, '').replace(/\.scl$/, '');
}

function getIndexRefIds(workspaceRoot: string): string[] {
  const indexPath = path.join(workspaceRoot, '_index.json');
  try {
    const content = fs.readFileSync(indexPath, 'utf-8');
    const data = JSON.parse(content);
    const specs = data.specs || {};
    return Object.keys(specs).map((key) => key.replace(/^@/, ''));
  } catch {
    return [];
  }
}

export function getSpecCompletions(workspaceRoot: string): CompletionItem[] {
  const seen = new Set<string>();
  const items: CompletionItem[] = [];

  for (const name of Object.keys(SHORT_NAMES)) {
    if (!seen.has(name)) {
      seen.add(name);
      items.push({
        label: name,
        kind: CompletionItemKind.Reference,
        detail: `${name} (short name)`,
      });
    }
  }

  const specsDir = path.join(workspaceRoot, 'specs');
  const filePaths = walkSpecFiles(specsDir, workspaceRoot);
  for (const filePath of filePaths) {
    const refId = relPathToRefId(filePath);
    if (!seen.has(refId)) {
      seen.add(refId);
      items.push({
        label: refId,
        kind: CompletionItemKind.Reference,
        detail: filePath,
      });
    }
  }

  const indexIds = getIndexRefIds(workspaceRoot);
  for (const id of indexIds) {
    if (!seen.has(id)) {
      seen.add(id);
      items.push({
        label: id,
        kind: CompletionItemKind.Reference,
        detail: id,
      });
    }
  }

  items.sort((a, b) => a.label.localeCompare(b.label));
  return items;
}

export function getBlockCompletions(specFilePath: string): CompletionItem[] {
  try {
    const content = fs.readFileSync(specFilePath, 'utf-8');
    const lines = content.split('\n');
    const blockRegex = /###\s+@block:([a-zA-Z0-9_:/\-.]+)/;
    const seen = new Set<string>();
    const items: CompletionItem[] = [];

    for (const line of lines) {
      const match = line.match(blockRegex);
      if (match) {
        const blockName = match[1];
        if (!seen.has(blockName)) {
          seen.add(blockName);
          items.push({
            label: blockName,
            kind: CompletionItemKind.Struct,
            detail: `@block:${blockName}`,
          });
        }
      }
    }

    return items;
  } catch {
    return [];
  }
}

export type CompletionContext =
  | { type: 'spec'; partialId: string }
  | { type: 'block'; specId: string; partialBlock: string }
  | { type: 'ref-prefix' }
  | { type: 'none' };

export function detectCompletionContext(textBeforeCursor: string): CompletionContext {
  const hashMatch = textBeforeCursor.match(
    /@ref:([a-zA-Z0-9_\-/.]+)#([a-zA-Z0-9_\-/]*)$/
  );
  if (hashMatch) {
    return { type: 'block', specId: hashMatch[1], partialBlock: hashMatch[2] || '' };
  }

  const refMatch = textBeforeCursor.match(/@ref:([a-zA-Z0-9_\-/.]*)$/);
  if (refMatch) {
    return { type: 'spec', partialId: refMatch[1] || '' };
  }

  if (/@re?f?:?$/.test(textBeforeCursor)) {
    return { type: 'ref-prefix' };
  }

  return { type: 'none' };
}
