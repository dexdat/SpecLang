import * as fs from 'fs';
import * as path from 'path';

export interface Reference {
  fullMatch: string;
  refId: string;
  block?: string;
  line: number;
  startChar: number;
  endChar: number;
}

export interface ResolvedLocation {
  filePath: string;
  line: number;
  character: number;
}

const REF_REGEX = /@ref:([a-zA-Z0-9_\-/.]+)(?:#([a-zA-Z0-9_\-]+))?/g;

const SHORT_NAMES: Record<string, string> = {
  northstar: 'docs/NORTH_STAR.md',
};

let cachedIndex: Record<string, string> | null = null;
let cachedWorkspaceRoot: string | null = null;

function loadIndexFromFile(workspaceRoot: string): Record<string, string> | null {
  const indexPath = path.join(workspaceRoot, '_index.json');
  try {
    const content = fs.readFileSync(indexPath, 'utf-8');
    const data = JSON.parse(content);
    const specs = data.specs || {};
    const result: Record<string, string> = {};
    for (const [key, entry] of Object.entries(specs)) {
      result[key] = (entry as { file: string }).file;
    }
    return result;
  } catch {
    return null;
  }
}

function getIndex(workspaceRoot: string): Record<string, string> | null {
  if (cachedWorkspaceRoot !== workspaceRoot) {
    cachedIndex = null;
    cachedWorkspaceRoot = null;
  }
  if (cachedIndex === null) {
    cachedIndex = loadIndexFromFile(workspaceRoot);
    cachedWorkspaceRoot = workspaceRoot;
  }
  return cachedIndex;
}

export function parseReferences(text: string): Reference[] {
  const refs: Reference[] = [];
  const lines = text.split('\n');
  const lineOffsets: number[] = [0];
  for (let i = 0; i < lines.length; i++) {
    lineOffsets.push(lineOffsets[i] + lines[i].length + 1);
  }

  REF_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = REF_REGEX.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = matchStart + match[0].length;
    const refId = match[1];
    const block = match[2] || undefined;

    let line = 0;
    for (let i = 0; i < lineOffsets.length - 1; i++) {
      if (matchStart >= lineOffsets[i] && matchStart < lineOffsets[i + 1]) {
        line = i;
        break;
      }
    }
    const startChar = matchStart - lineOffsets[line];
    const endChar = matchEnd - lineOffsets[line];

    refs.push({ fullMatch: match[0], refId, block, line, startChar, endChar });
  }

  return refs;
}

export function resolveFileRef(refId: string, workspaceRoot: string): string | null {
  if (SHORT_NAMES[refId]) {
    const candidate = path.join(workspaceRoot, SHORT_NAMES[refId]);
    try {
      if (fs.existsSync(candidate)) return path.resolve(candidate);
    } catch {
      // ignore
    }
  }

  const candidates = [
    path.join(workspaceRoot, `${refId}.spec.md`),
    path.join(workspaceRoot, refId, 'index.spec.md'),
    path.join(workspaceRoot, refId),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return path.resolve(candidate);
      }
    } catch {
      // ignore
    }
  }

  const index = getIndex(workspaceRoot);
  if (index) {
    const withAt = `@${refId}`;
    if (index[withAt]) return path.resolve(path.join(workspaceRoot, index[withAt]));
    if (index[refId]) return path.resolve(path.join(workspaceRoot, index[refId]));
  }

  return null;
}

export function findBlockInFile(filePath: string, blockName: string): { line: number; character: number } | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const escapedBlockName = blockName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const blockRegex = new RegExp(`@block:${escapedBlockName}(?:\\s|$)`);

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(blockRegex);
      if (match) {
        return { line: i, character: match.index ?? lines[i].indexOf(`@block:${blockName}`) };
      }
    }
  } catch {
    // ignore
  }

  return null;
}

export function resolveReference(ref: Reference, workspaceRoot: string): ResolvedLocation | null {
  const filePath = resolveFileRef(ref.refId, workspaceRoot);
  if (!filePath) return null;

  if (ref.block) {
    const blockLocation = findBlockInFile(filePath, ref.block);
    if (blockLocation) {
      return { filePath, line: blockLocation.line, character: blockLocation.character };
    }
  }

  return { filePath, line: 0, character: 0 };
}

/** @internal exported for testing only */
export function _resetCache(): void {
  cachedIndex = null;
  cachedWorkspaceRoot = null;
}
