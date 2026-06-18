#!/usr/bin/env node
/**
 * Fix common spec header validation issues.
 */
const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const specFiles = globSync('specs/**/*.spec.md', { nodir: true })
  .concat(globSync('specs/**/*.scl', { nodir: true }));

const UNKNOWN_FIELDS = new Set(['imports', 'siblings', 'target_lang']);

function fixFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf-8');
  const original = content;
  const lines = content.split('\n');

  const headerIdx = lines.findIndex(l => l.trim().startsWith('# speclang-header'));

  if (headerIdx === -1) {
    return addMissingHeader(filepath, content, lines);
  }

  const sepIdx = lines.findIndex((l, i) => i > headerIdx && l.trim() === '---');
  if (sepIdx === -1) return false;

  // Work on header section
  const headerLines = lines.slice(headerIdx, sepIdx + 1);
  let changed = false;

  // Fix pattern A: parent: ""@ref:X"extra: value
  const newHeader = headerLines.map(line => {
    const m = line.match(/^(\s*)parent:\s*""@ref:([^"]+)"(.+)$/);
    if (m) {
      changed = true;
      return `${m[1]}parent: "@ref:${m[2]}"\n${m[1]}${m[3].trim()}`;
    }
    return line;
  });

  // Fix pattern B: children with multiple items on one line
  const newHeader2 = newHeader.flatMap(line => {
    const stripped = line.trim();
    if (stripped.startsWith('- "') && stripped.includes('"  - "')) {
      const items = stripped.split(/\s{2,}-\s{2,}"?/).filter(Boolean).map(s => s.replace(/^"|"$/g, '').trim());
      const indent = line.match(/^(\s*)/)[1];
      changed = true;
      return items.map(item => {
        item = item.replace(/@ref:@ref:/g, '@ref:');
        if (!item.startsWith('@ref:')) item = `@ref:${item}`;
        return `${indent}- "${item}"`;
      });
    }
    return [line];
  });

  // Fix pattern C: unquoted @ref
  const newHeader3 = newHeader2.map(line => {
    const m = line.match(/^(\s*parent:\s*)@ref:([^\s"\'#,]+)/);
    if (m && !line.includes('"')) {
      changed = true;
      return `${m[1]}"@ref:${m[2]}"`;
    }
    return line;
  });

  // Fix @ref:@ref: duplicates, layer: "X"
  const newHeader4 = newHeader3.map(line => {
    let l = line;
    if (l.includes('@ref:@ref:')) { l = l.replace(/@ref:@ref:/g, '@ref:'); changed = true; }
    const ml = l.match(/^(\s*layer:\s*)"(\d+)"$/);
    if (ml) { l = `${ml[1]}${ml[2]}`; changed = true; }
    return l;
  });

  // Remove unknown fields
  const newHeader5 = newHeader4.filter(line => {
    const stripped = line.trim();
    const fieldName = stripped.split(':')[0].trim();
    if (UNKNOWN_FIELDS.has(fieldName)) { changed = true; return false; }
    return true;
  });

  // Rebuild
  const newLines = [...lines.slice(0, headerIdx), ...newHeader5, ...lines.slice(sepIdx + 1)];
  let newContent = newLines.join('\n');
  newContent = updateLinesCount(newContent);

  if (newContent !== original) {
    fs.writeFileSync(filepath, newContent, 'utf-8');
    return true;
  }
  return changed;
}

function addMissingHeader(filepath, content, lines) {
  // Files that start with --- and have a YAML header
  if (lines[0].trim() !== '---') return false;

  const metadata = {};
  let headerEnd = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { headerEnd = i + 1; break; }
    const idx = lines[i].indexOf(':');
    if (idx > 0) {
      const key = lines[i].slice(0, idx).trim();
      const val = lines[i].slice(idx + 1).trim();
      metadata[key] = val;
    }
  }
  if (headerEnd === -1) return false;

  // Derive id
  let relpath = path.relative('specs', filepath).replace(/\.spec\.md$/, '').replace(/\.scl$/, '');
  const specId = `@specs/${relpath}`;

  const parts = [];
  // Placeholder for header line
  parts.push('# speclang-header');
  parts.push(`id: "${specId}"`);
  parts.push(`version: ${metadata.version || '0.1.0'}`);
  parts.push(`layer: ${metadata.layer || 5}`);
  parts.push(`project_level: ${metadata.project_level || 'Alpha'}`);
  parts.push(`agent_support: ${metadata.agent_support || 'agent_assisted'}`);
  if (metadata.tags) parts.push(`tags: ${metadata.tags}`);
  parts.push(`short: ${metadata.short || `"${relpath.split('/').pop()} spec"`}`);
  if (metadata.status) parts.push(`status: ${metadata.status}`);
  if (metadata.target) parts.push(`target: ${metadata.target}`);

  const headerLine = `# speclang-header lines:${parts.length + 1}`;
  parts[0] = headerLine;
  const newHeader = parts.join('\n') + '\n---';

  const afterHeader = lines.slice(headerEnd).join('\n');
  let newContent = newHeader + '\n' + afterHeader;
  
  // Remove target_lang lines
  newContent = newContent.split('\n').filter(l => {
    const fn = l.split(':')[0].trim();
    return !UNKNOWN_FIELDS.has(fn);
  }).join('\n');

  newContent = updateLinesCount(newContent);
  fs.writeFileSync(filepath, newContent, 'utf-8');
  return true;
}

function updateLinesCount(content) {
  return content.replace(/^# speclang-header(?: lines:\d+)?/m, (match, offset) => {
    const lines = content.slice(offset).split('\n');
    let count = 0;
    for (const line of lines) {
      count++;
      if (line.trim() === '---') break;
    }
    return `# speclang-header lines:${count}`;
  });
}

let fixed = 0, failed = 0;
for (const f of specFiles) {
  try {
    if (fixFile(f)) { fixed++; }
  } catch (e) {
    console.error(`ERROR: ${f}: ${e.message}`);
    failed++;
  }
}
console.log(`Fixed: ${fixed}, Failed: ${failed}, Total: ${specFiles.length}`);
