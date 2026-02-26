// Generated from specs/directory-structure.dir/creation.spec.md
// DO NOT EDIT MANUALLY
// Source: @block:dir/refs, @block:dir/sqlite, @block:dir/flattening, @block:dir/creation, @block:dir/comparison, @block:dir/gitignore, @block:dir/code-location, @block:dir/non-spec

import { join, dirname, basename } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

export interface ReferencePattern {
  child_to_parent: string[];
  parent_to_children: string[];
  example_header: string;
}

export interface FlatteningStrategy {
  purpose: string;
  approach: string[];
  benefits: string[];
}

export type SpecKind = 'entity' | 'operation' | 'code' | 'note' | 'table';

export interface CreateSpecOptions {
  parent: string;
  name: string;
  kind: SpecKind;
  content?: string;
}

/**
export async function createSpec(options: CreateSpecOptions): Promise<string> {
  const { parent, name, kind, content = '' } = options;
  
  // Determine parent type (file or directory)
  const isParentFile = parent.endsWith('.spec.md') || parent.endsWith('.spec.yaml') || parent.endsWith('.scl');
  const isParentDir = parent.endsWith('.dir/') || parent.endsWith('.dir');
  
  let specPath: string;
  
  if (isParentFile) {
    // If parent is a file, create corresponding .dir/ directory if not exists
    const parentDir = parent.replace(/\.spec\.[^.]+$/, '.dir');
    if (!existsSync(parentDir)) {
      await mkdir(parentDir, { recursive: true });
    }
    
    // Determine appropriate file extension based on kind
    const extension = getExtensionForKind(kind);
    specPath = join(parentDir, `${name}.spec.${extension}`);
  } else if (isParentDir) {
    // If parent is a directory, create spec within it
    const extension = getExtensionForKind(kind);
    specPath = join(parent, `${name}.spec.${extension}`);
  } else {
    throw new Error(`Invalid parent path: ${parent}. Must be a spec file or .dir directory.`);
  }
  
  // Create spec file
  const specContent = content || generateDefaultContent(name, kind);
  await writeFile(specPath, specContent, 'utf-8');
  
  // If spec requires sub-directory, create .dir/ subdirectory
  if (shouldCreateSubDirectory(kind)) {
    const subDir = specPath.replace(/\.spec\.[^.]+$/, '.dir');
    if (!existsSync(subDir)) {
      await mkdir(subDir, { recursive: true });
    }
  }
  
  return specPath;
}

function getExtensionForKind(kind: SpecKind): string {
  switch (kind) {
    case 'entity':
    case 'operation':
      return 'yaml';
    case 'code':
      return 'ts';
    case 'note':
      return 'md';
    case 'table':
      return 'md';
    default:
      return 'md';
  }
}

function shouldCreateSubDirectory(kind: SpecKind): boolean {
  // Code specs often need sub-directories for implementation
  return kind === 'code';
}

function generateDefaultContent(name: string, kind: SpecKind): string {
  const timestamp = new Date().toISOString();
id: "@specs/${name}"
version: 0.1.0
layer: 2
tags: [${kind}]
status: draft

project_level: Alpha
agent_support: agent_assisted
short: ${name} ${kind}
---


Generated on ${timestamp}
`;
}

/**

export const SQLITE_TREE_QUERIES = {
  getChildren: `SELECT path FROM specs WHERE depends_on LIKE '%@ref:specs/auth%';`,
  getFullTree: `WITH RECURSIVE tree AS (
  SELECT path, id, 0 as depth FROM specs WHERE path = 'specs/auth.spec.md'
  UNION ALL
  SELECT s.path, s.id, t.depth + 1
  FROM specs s, tree t
  WHERE s.depends_on LIKE '%' || t.id || '%'
)
SELECT * FROM tree ORDER BY depth;`,
  getParent: `SELECT * FROM specs WHERE id = (SELECT parent_id FROM specs WHERE path = 'specs/auth.dir/entities.scl');`,
};

/**

export const GIT_IGNORE_RULES = `# Symlinks are OK (they point to specs/)

.speclang/

!*.dir/
!specs/
`;