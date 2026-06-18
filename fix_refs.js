#!/usr/bin/env node
/**
 * Fix reference fields (depends_on, children, parent items) that lack @ref: prefix.
 */
const fs = require('fs');
const { globSync } = require('glob');

const specFiles = globSync('specs/**/*.spec.md', { nodir: true })
  .concat(globSync('specs/**/*.scl', { nodir: true }));

function fixRefField(filepath) {
  let content = fs.readFileSync(filepath, 'utf-8');
  let original = content;
  const lines = content.split('\n');

  // Find header section boundaries
  const headerIdx = lines.findIndex(l => l.trim().startsWith('# speclang-header'));
  if (headerIdx === -1) return false;

  const sepIdx = lines.findIndex((l, i) => i > headerIdx && l.trim() === '---');
  if (sepIdx === -1) return false;

  const headerLines = lines.slice(headerIdx, sepIdx);
  let changed = false;

  // Track which line has depends_on: or children: or refs:
  const refFields = ['depends_on', 'children', 'refs'];
  let isInList = false;
  let listField = '';

  const newHeader = headerLines.map(line => {
    // Check for list item lines that need @ref: prefix
    const trimmed = line.trim();
    const indent = line.match(/^(\s*)/)[1];

    // Check if this line starts a new ref field
    for (const field of refFields) {
      if (trimmed === `${field}:` || trimmed.startsWith(`${field}: `)) {
        isInList = true;
        listField = field;
      }
    }

    // Fix list item without @ref: prefix
    // Pattern:   - "@speclang/..."  ->   - "@ref:speclang/..."
    // Pattern:   - "@ref:@speclang/..."  ->   - "@ref:speclang/..."
    const itemMatch = trimmed.match(/^-\s+"@(?!ref:)([^"]+)"$/);
    if (itemMatch) {
      const refPath = itemMatch[1];
      const fixed = `${indent}- "@ref:${refPath}"`;
      changed = true;
      return fixed;
    }

    // Fix @ref:@speclang pattern (double @ref)
    const doubleRefMatch = trimmed.match(/^-\s+"@ref:@(speclang\/[^"]+)"$/);
    if (doubleRefMatch) {
      const refPath = doubleRefMatch[1];
      const fixed = `${indent}- "@ref:${refPath}"`;
      changed = true;
      return fixed;
    }

    // Reset list tracking on blank line or non-list line
    if (!trimmed.startsWith('- ') && !trimmed.startsWith('#')) {
      isInList = false;
    }

    // Fix @ref:@speclang in children/parent values that are inline
    // Pattern: children: ["@speclang/..."]
    for (const field of refFields) {
      const inlineMatch = trimmed.match(new RegExp(`^(${field}:\\s*\\[)"@(?!ref:)([^"]+)"(.*)$`));
      if (inlineMatch) {
        const fixed = `${inlineMatch[1]}${inlineMatch[2].replace(/^@speclang/, '"@ref:speclang')}${inlineMatch[3]}`;
        changed = true;
        return fixed;
      }
    }

    // Fix inline array items: children: ["@speclang/A", "@speclang/B"]
    const inlineArrayMatch = trimmed.match(/^(\s*(?:depends_on|children|refs):\s*\[)(.+)\]$/);
    if (inlineArrayMatch) {
      const prefix = inlineArrayMatch[1];
      const itemsStr = inlineArrayMatch[2];
      const items = itemsStr.split(',').map(s => s.trim());
      const fixedItems = items.map(item => {
        const m = item.match(/^"@(?!ref:)(.+)"$/);
        if (m) return `"@ref:${m[1]}"`;
        const m2 = item.match(/^"@ref:@(.+)"$/);
        if (m2) return `"@ref:${m2[1]}"`;
        return item;
      });
      const fixed = `${prefix}${fixedItems.join(', ')}]`;
      changed = true;
      return fixed;
    }

    return line;
  });

  if (!changed) return false;

  const newLines = [...newHeader, ...lines.slice(sepIdx)];
  fs.writeFileSync(filepath, newLines.join('\n'), 'utf-8');
  return true;
}

let fixed = 0;
for (const f of specFiles) {
  try {
    if (fixRefField(f)) {
      console.log(`FIXED: ${f}`);
      fixed++;
    }
  } catch (e) {
    console.error(`ERROR: ${f}: ${e.message}`);
  }
}
console.log(`Fixed: ${fixed}`);
