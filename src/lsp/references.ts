import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface Ref {
  refId: string;
  block: string | null;
  line: number;
  startChar: number;
  endChar: number;
}

const REF_REGEX = /@ref:(\S+)/g;

export function parseReferences(text: string): Ref[] {
  const refs: Ref[] = [];
  const lines = text.split('\n');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    REF_REGEX.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = REF_REGEX.exec(line)) !== null) {
      const fullMatch = match[0];
      const refPart = match[1];

      const hashIndex = refPart.indexOf('#');
      const refId = hashIndex !== -1 ? refPart.substring(0, hashIndex) : refPart;
      const block = hashIndex !== -1 ? refPart.substring(hashIndex + 1) : null;

      refs.push({
        refId,
        block,
        line: lineNum,
        startChar: match.index,
        endChar: match.index + fullMatch.length,
      });
    }
  }

  return refs;
}

export function resolveFileRef(refId: string, workspaceRoot: string): string | null {
  if (refId === 'northstar' || refId === 'project') {
    return null;
  }

  const candidates = [
    join(workspaceRoot, `${refId}.spec.md`),
    join(workspaceRoot, 'specs', `${refId}.spec.md`),
    join(workspaceRoot, 'specs', `${refId}.spec.dir`),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function findBlockInFile(filePath: string, block: string): { line: number; character: number } | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const prefix = `### @block:${block}`;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith(prefix)) {
        const after = line[prefix.length];
        if (after === undefined || after === ' ' || after === '\t') {
          return { line: i, character: 0 };
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function resolveReference(
  target: Ref,
  workspaceRoot: string,
): { filePath: string; line: number; character: number } | null {
  const filePath = resolveFileRef(target.refId, workspaceRoot);
  if (!filePath) return null;

  if (target.block) {
    const blockLocation = findBlockInFile(filePath, target.block);
    if (!blockLocation) return null;
    return { filePath, line: blockLocation.line, character: blockLocation.character };
  }

  return { filePath, line: 0, character: 0 };
}
