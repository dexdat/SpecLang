#!/usr/bin/env node
/**
 * generate the migration SQL module from the shipped .sql files (DF-SPECLANG-017)
 *
 * `specs/sqlite.spec.dir/src/migrations/*.sql` are the source of truth for the schema
 * upgrades. This script parses them and rewrites the GEN-MIGRATIONS block inside
 * `specs/sqlite.spec.dir/src/migrations.ts` (symlinked from src/db/migrations.ts), so the
 * SQL the runtime executes is DERIVED from the shipped files instead of hand-copied.
 *
 * The output is a compiled-in TypeScript module on purpose: the published tarball ships
 * dist/ only, so the runtime must never read a .sql file from disk.
 *
 * Usage:
 *   node scripts/gen-migrations.mjs            # regenerate the block in place
 *   node scripts/gen-migrations.mjs --check    # exit 0 when in sync, 1 on drift, 2 on error
 *   node scripts/gen-migrations.mjs --help
 *
 * Properties:
 *   - deterministic: same .sql inputs -> byte-identical output (file list is sorted, no
 *     cwd, timestamps, versions or absolute paths leak into the rendered text)
 *   - statement-aware: comments and string literals are respected, and a CREATE TRIGGER
 *     body (which contains ';' before its terminating END;) stays one statement
 *   - index statements carry their table/columns so the module can keep creating them
 *     through the guarded createIndexIfColumns() helper for pre-existing databases
 *
 * Exit codes: 0 success/in-sync, 1 drift (--check), 2 error (bad usage or broken input).
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SQL_DIR = join(REPO_ROOT, 'specs', 'sqlite.spec.dir', 'src', 'migrations');
const TARGET_TS = join(REPO_ROOT, 'specs', 'sqlite.spec.dir', 'src', 'migrations.ts');

const MARKER_BEGIN = '/* >>> GEN-MIGRATIONS:BEGIN';
const MARKER_END = '/* <<< GEN-MIGRATIONS:END */';

const USAGE = `Usage: node scripts/gen-migrations.mjs [--check]

  (no flag)   rewrite the GEN-MIGRATIONS block in ${relative(REPO_ROOT, TARGET_TS)}
  --check     regenerate in memory; exit 0 when on-disk == regenerated, 1 on drift
  --help      this text

Source of truth: ${relative(REPO_ROOT, SQL_DIR)}/*.sql`;

/* ------------------------------------------------------------------ *
 * SQL parsing (comments, quotes, trigger bodies)
 * ------------------------------------------------------------------ */

/** Drop `-- line` and `/* block *\/` comments that are outside string literals. */
function stripComments(source) {
  let out = '';
  let i = 0;
  let quote = null;
  while (i < source.length) {
    const ch = source[i];
    if (quote) {
      out += ch;
      if (ch === quote) {
        if (source[i + 1] === quote) {
          out += source[i + 1];
          i += 2;
          continue;
        }
        quote = null;
      }
      i += 1;
      continue;
    }
    if (ch === '-' && source[i + 1] === '-') {
      while (i < source.length && source[i] !== '\n') i += 1;
      continue;
    }
    if (ch === '/' && source[i + 1] === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      out += ch;
      i += 1;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

const TRIGGER_START = /^CREATE\s+(?:TEMP(?:ORARY)?\s+)?TRIGGER\b/i;

/** True when the statement accumulated so far is a trigger whose body has not closed yet. */
function triggerBodyOpen(statement) {
  if (!TRIGGER_START.test(statement.trim())) return false;
  const tail = statement.replace(/;\s*$/, '').trimEnd();
  // A trigger statement ends with the keyword END (optionally followed by ';').
  return !/(?:^|[^\w$])END$/i.test(tail);
}

/** Split a SQL file into individual statements, keeping trigger bodies intact. */
function splitStatements(rawSource) {
  const source = stripComments(rawSource);
  const statements = [];
  let buf = '';
  let i = 0;
  let quote = null;
  while (i < source.length) {
    const ch = source[i];
    if (quote) {
      buf += ch;
      if (ch === quote) {
        if (source[i + 1] === quote) {
          buf += source[i + 1];
          i += 2;
          continue;
        }
        quote = null;
      }
      i += 1;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      buf += ch;
      i += 1;
      continue;
    }
    buf += ch;
    i += 1;
    if (ch !== ';') continue;
    if (triggerBodyOpen(buf)) continue;
    statements.push(buf);
    buf = '';
  }
  if (buf.trim()) statements.push(buf);

  return statements
    .map((statement) => dedent(statement))
    .filter((statement) => statement.length > 0 && statement !== ';')
    .map((statement) => (statement.endsWith(';') ? statement : `${statement};`));
}

/** Strip a common indentation prefix and trailing whitespace, keeping internal layout. */
function dedent(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n').map((line) => line.replace(/\s+$/, ''));
  while (lines.length > 0 && lines[0].trim() === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
  const indents = lines
    .filter((line) => line.trim() !== '')
    .slice(1)
    .map((line) => line.match(/^[ \t]*/)[0].length);
  const common = indents.length > 0 ? Math.min(...indents) : 0;
  return lines
    .map((line, index) => (index === 0 || line.trim() === '' ? line.trimStart() : line.slice(common)))
    .join('\n')
    .trim();
}

const INDEX_START = /^CREATE\s+(?:UNIQUE\s+)?INDEX\b/i;
const INDEX_RE =
  /^CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)\s+ON\s+([^\s(]+)\s*\(([\s\S]*)\)\s*$/i;

const unquoteIdent = (ident) => ident.replace(/^[`"[]/, '').replace(/[`"\]]$/, '');

/** `CREATE INDEX ... ON t(a DESC, b)` -> { name, table, columns: ['a', 'b'] } */
function parseIndex(sql) {
  const match = sql.replace(/;\s*$/, '').match(INDEX_RE);
  if (!match) return null;
  const columns = match[3]
    .split(',')
    .map((part) => part.trim().split(/\s+/)[0])
    .filter((part) => part.length > 0)
    .map((part) => unquoteIdent(part.split('(')[0].trim()))
    .filter((part) => part.length > 0);
  if (columns.length === 0) return null;
  return { name: unquoteIdent(match[1]), table: unquoteIdent(match[2]), columns };
}

function classify(sql) {
  if (/^CREATE\s+VIRTUAL\s+TABLE\b/i.test(sql)) return 'virtual_table';
  if (/^CREATE\s+(?:TEMP\s+|TEMPORARY\s+)?TABLE\b/i.test(sql)) return 'table';
  if (INDEX_START.test(sql)) return 'index';
  if (TRIGGER_START.test(sql)) return 'trigger';
  if (/^ALTER\s+TABLE\b/i.test(sql)) return 'alter';
  return 'other';
}

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

/** Escape statement text for a TS template literal. */
function asTemplateLiteral(sql) {
  return sql.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function describeFile(file) {
  const raw = readFileSync(join(SQL_DIR, file), 'utf8');
  const statements = splitStatements(raw).map((sql) => {
    const kind = classify(sql);
    if (kind === 'index') {
      const index = parseIndex(sql);
      if (!index) {
        throw new Error(
          `gen-migrations: cannot parse index statement in ${file}: ${sql.split('\n')[0]}`
        );
      }
      return { kind, sql, index };
    }
    if (kind === 'trigger' && !/(?:^|[^\w$])END$/i.test(sql.replace(/;\s*$/, '').trimEnd())) {
      throw new Error(`gen-migrations: unterminated trigger statement in ${file}`);
    }
    return { kind, sql };
  });
  return { file, statements };
}

function renderStatementBlock(statement) {
  const lines = [
    '    {',
    `      kind: '${statement.kind}',`,
    `      sql: \`${asTemplateLiteral(statement.sql)}\`,`,
  ];
  if (statement.index) {
    lines.push(
      `      index: { name: '${statement.index.name}', table: '${statement.index.table}', ` +
        `columns: [${statement.index.columns.map((column) => `'${column}'`).join(', ')}] },`
    );
  }
  lines.push('    },');
  return lines.join('\n');
}

function renderFileBlock({ file, statements }) {
  return [`  '${file}': [`, ...statements.map(renderStatementBlock), '  ],'].join('\n');
}

function renderRegion(files) {
  const total = files.reduce((count, entry) => count + entry.statements.length, 0);
  const body = [
    `${MARKER_BEGIN} — generated by scripts/gen-migrations.mjs from`,
    ' * specs/sqlite.spec.dir/src/migrations/*.sql. Do not edit by hand:',
    ' * `npm run gen:migrations` rewrites this block and `npm run gen:migrations -- --check`',
    ' * fails when it has drifted. */',
    `// ${files.length} SQL files, ${total} statements.`,
    "type GeneratedStatementKind = 'table' | 'virtual_table' | 'index' | 'trigger' | 'alter' | 'other';",
    '',
    '/** Table/columns an index covers, so a pre-existing database can be guarded. */',
    'interface GeneratedIndexRef {',
    '  name: string;',
    '  table: string;',
    '  columns: string[];',
    '}',
    '',
    'interface GeneratedStatement {',
    '  kind: GeneratedStatementKind;',
    '  sql: string;',
    '  index?: GeneratedIndexRef;',
    '}',
    '',
    '/** file name -> statements, in file order. Consumed by applySqlFile() below. */',
    'const GENERATED_SQL: Record<string, GeneratedStatement[]> = {',
    ...files.map(renderFileBlock),
    '};',
    MARKER_END,
  ];
  return body.join('\n');
}

/** Replace the marker region of `text` with `region`. */
function spliceRegion(text, region) {
  const begin = text.indexOf(MARKER_BEGIN);
  const end = text.indexOf(MARKER_END);
  if (begin === -1 || end === -1 || end < begin) {
    throw new Error(
      `gen-migrations: markers "${MARKER_BEGIN}" / "${MARKER_END}" are missing (or out of order) in ${relative(REPO_ROOT, TARGET_TS)}`
    );
  }
  if (text.indexOf(MARKER_BEGIN, begin + 1) !== -1 || text.indexOf(MARKER_END, end + 1) !== -1) {
    throw new Error('gen-migrations: markers appear more than once in the target module');
  }
  return text.slice(0, begin) + region + text.slice(end + MARKER_END.length);
}

/* ------------------------------------------------------------------ *
 * Drift report
 * ------------------------------------------------------------------ */

function driftReport(onDisk, regenerated, files) {
  const diskLines = onDisk.split('\n');
  const newLines = regenerated.split('\n');

  // Line-level diff (LCS) so only the changed hunks are printed.
  const n = diskLines.length;
  const m = newLines.length;
  const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      lcs[i][j] =
        diskLines[i] === newLines[j]
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (diskLines[i] === newLines[j]) {
      ops.push([' ', diskLines[i]]);
      i += 1;
      j += 1;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      ops.push(['-', diskLines[i]]);
      i += 1;
    } else {
      ops.push(['+', newLines[j]]);
      j += 1;
    }
  }
  while (i < n) ops.push(['-', diskLines[i++]]);
  while (j < m) ops.push(['+', newLines[j++]]);

  const changed = ops.filter(([sign]) => sign !== ' ').length;
  const hunk = [];
  let budget = 40;
  let lastPrinted = -1;
  for (let k = 0; k < ops.length && budget > 0; k += 1) {
    if (ops[k][0] === ' ') continue;
    const start = Math.max(0, k - 2);
    if (start > lastPrinted + 1 && lastPrinted >= 0) hunk.push([' ', '…']);
    for (let x = Math.max(start, lastPrinted + 1); x < ops.length && x <= k + 2 && budget > 0; x += 1) {
      hunk.push(ops[x]);
      lastPrinted = x;
      budget -= 1;
    }
  }

  const stale = files.filter((entry) => !onDisk.includes(renderFileBlock(entry))).map((entry) => entry.file);

  return [
    `DRIFT: ${relative(REPO_ROOT, TARGET_TS)} does not match what the .sql files generate.`,
    stale.length > 0
      ? `  stale or missing file block(s): ${stale.join(', ')}`
      : '  stale or missing file block(s): (none — drift is in the generated preamble or the counts)',
    `  ${changed} line(s) differ` + (changed > 40 ? ' (first 40 shown)' : ''),
    '',
    ...hunk.map(([sign, line]) => `${sign} ${line}`),
    '',
    'Fix: the .sql files are the source of truth — edit them, then run `npm run gen:migrations`.',
  ].join('\n');
}

/** Warn (non-fatal) about a shipped .sql file the module never applies. */
function unwiredFiles(files, text) {
  const begin = text.indexOf(MARKER_BEGIN);
  const end = text.indexOf(MARKER_END);
  const handWritten = end > begin ? text.slice(0, begin) + text.slice(end) : text;
  return files
    .map((entry) => entry.file)
    .filter((file) => !handWritten.includes(`'${file}'`));
}

/* ------------------------------------------------------------------ *
 * main
 * ------------------------------------------------------------------ */

function main(argv) {
  const args = argv.slice(2);
  const check = args.includes('--check');
  const unknown = args.filter((arg) => arg !== '--check' && arg !== '--help');
  if (args.includes('--help')) {
    console.log(USAGE);
    return 0;
  }
  if (unknown.length > 0) {
    console.error(`gen-migrations: unknown argument(s): ${unknown.join(' ')}\n\n${USAGE}`);
    return 2;
  }

  const fileNames = readdirSync(SQL_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b, 'en'));
  if (fileNames.length === 0) {
    console.error(`gen-migrations: no .sql files in ${relative(REPO_ROOT, SQL_DIR)}`);
    return 2;
  }

  const files = fileNames.map(describeFile);
  const region = renderRegion(files);
  const onDisk = readFileSync(TARGET_TS, 'utf8');
  const regenerated = spliceRegion(onDisk, region);

  for (const unwired of unwiredFiles(files, onDisk)) {
    console.error(
      `gen-migrations: WARNING ${unwired} is generated into the block but no migration calls ` +
        `applySqlFile(db, '${unwired}') — it will not be applied.`
    );
  }
  for (const orphan of (onDisk.match(/applySqlFile\(db, '([^']+\.sql)'/g) ?? [])
    .map((call) => call.replace(/^applySqlFile\(db, '/, '').replace(/'$/, ''))
    .filter((file) => !fileNames.includes(file))) {
    console.error(
      `gen-migrations: WARNING migrations.ts applies '${orphan}' but that file does not exist in ` +
        `${relative(REPO_ROOT, SQL_DIR)}.`
    );
  }

  if (check) {
    if (onDisk === regenerated) {
      const total = files.reduce((count, entry) => count + entry.statements.length, 0);
      console.log(
        `gen-migrations: in sync — ${files.length} SQL files, ${total} statements ` +
          `(${relative(REPO_ROOT, TARGET_TS)}).`
      );
      return 0;
    }
    console.error(driftReport(onDisk, regenerated, files));
    return 1;
  }

  if (onDisk === regenerated) {
    console.log(`gen-migrations: already up to date (${files.length} SQL files) — no change.`);
    return 0;
  }
  writeFileSync(TARGET_TS, regenerated, 'utf8');
  const total = files.reduce((count, entry) => count + entry.statements.length, 0);
  console.log(
    `gen-migrations: wrote ${relative(REPO_ROOT, TARGET_TS)} — ${files.length} SQL files, ` +
      `${total} statements.`
  );
  return 0;
}

process.exitCode = main(process.argv);
