"use strict";
// Generated from specs/directory-structure.dir/creation.spec.md
// DO NOT EDIT MANUALLY
// Source: @block:dir/refs, @block:dir/sqlite, @block:dir/flattening, @block:dir/creation, @block:dir/comparison, @block:dir/gitignore, @block:dir/code-location, @block:dir/non-spec
Object.defineProperty(exports, "__esModule", { value: true });
exports.GIT_IGNORE_RULES = exports.SQLITE_TREE_QUERIES = void 0;
exports.createSpec = createSpec;
const path_1 = require("path");
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
/**
 * Create a new spec file following directory patterns
 */
async function createSpec(options) {
    const { parent, name, kind, content = '' } = options;
    // Determine parent type (file or directory)
    const isParentFile = parent.endsWith('.spec.md') || parent.endsWith('.spec.yaml') || parent.endsWith('.scl');
    const isParentDir = parent.endsWith('.dir/') || parent.endsWith('.dir');
    let specPath;
    if (isParentFile) {
        // If parent is a file, create corresponding .dir/ directory if not exists
        const parentDir = parent.replace(/\.spec\.[^.]+$/, '.dir');
        if (!(0, fs_1.existsSync)(parentDir)) {
            await (0, promises_1.mkdir)(parentDir, { recursive: true });
        }
        // Determine appropriate file extension based on kind
        const extension = getExtensionForKind(kind);
        specPath = (0, path_1.join)(parentDir, `${name}.spec.${extension}`);
    }
    else if (isParentDir) {
        // If parent is a directory, create spec within it
        const extension = getExtensionForKind(kind);
        specPath = (0, path_1.join)(parent, `${name}.spec.${extension}`);
    }
    else {
        throw new Error(`Invalid parent path: ${parent}. Must be a spec file or .dir directory.`);
    }
    // Create spec file
    const specContent = content || generateDefaultContent(name, kind);
    await (0, promises_1.writeFile)(specPath, specContent, 'utf-8');
    // If spec requires sub-directory, create .dir/ subdirectory
    if (shouldCreateSubDirectory(kind)) {
        const subDir = specPath.replace(/\.spec\.[^.]+$/, '.dir');
        if (!(0, fs_1.existsSync)(subDir)) {
            await (0, promises_1.mkdir)(subDir, { recursive: true });
        }
    }
    return specPath;
}
function getExtensionForKind(kind) {
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
function shouldCreateSubDirectory(kind) {
    // Code specs often need sub-directories for implementation
    return kind === 'code';
}
function generateDefaultContent(name, kind) {
    const timestamp = new Date().toISOString();
    return `# speclang-header lines:10
id: "@specs/${name}"
version: 0.1.0
layer: 2
tags: [${kind}]
status: draft

project_level: Alpha
agent_support: agent_assisted
short: ${name} ${kind}
---

# ${name}

Generated on ${timestamp}
`;
}
/**
 * SQLite tree queries for directory structure
 */
exports.SQLITE_TREE_QUERIES = {
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
 * Git ignore rules for spec directories
 */
exports.GIT_IGNORE_RULES = `# Symlinks are OK (they point to specs/)
# Code lives in specs/, symlinks are just for convenience

# Speclang internal
.speclang/

# Keep spec dirs
!*.dir/
!specs/
`;
//# sourceMappingURL=creator.js.map