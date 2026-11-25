/**
 * DOC-25 gate: the dual-view markdown relative-link rule.
 *
 * SpecLang ships two views of the same documentation pages: the REAL file
 * under `specs/*.spec.dir/` (what the compiler and the spec tree see) and a
 * symlinked view at `docs/<page>.md` or `examples/<page>.md` (what a reader
 * of the top-level docs tree opens). Both views render the same bytes, but a
 * relative link can only resolve from one directory at a time.
 *
 * The convention (DOC-9-R2 / DOC-16-R2, recorded in
 * `docs/specdir-compiled-layer.md`): links in a twinned page are written
 * relative to the page's REAL location, one `../` per real directory level.
 * The symlinked view consequently serves dead links for any link that crosses
 * directory depth — that is the ACCEPTED trade-off, not a defect. Four board
 * rows of dead-link churn (DOC-8, DOC-9, DOC-9-R2, DOC-16-R2) came from
 * exactly this confusion; this gate guards both read bases so the rows stop
 * re-filing.
 *
 * Failure classes (each exits 1):
 *   view-only   the link resolves only from the symlinked view and is dead
 *               at the real location — it violates the real-location rule
 *               (the DOC-9-R2 class: `../` where the real location needs
 *               `../../`).
 *   dead        the link resolves from NEITHER base (the DOC-8/DOC-16-R2
 *               class: a target that does not exist in the tree at all).
 *
 * A link that resolves from the real location only is reported as
 * `real-only` (the accepted trade-off), and one that resolves from both
 * bases as `both`. Pure anchors, absolute paths and URLs are not links this
 * gate can resolve; they are counted as skipped.
 *
 * Usage:
 *   node scripts/audit-dual-view-links.mjs              # audit (exit 1 on violation)
 *   node scripts/audit-dual-view-links.mjs --json       # machine-readable summary
 *   node scripts/audit-dual-view-links.mjs --root DIR   # audit a copy of the tree
 */

import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync } from 'node:fs';
import { dirname, isAbsolute, join, normalize, relative, resolve } from 'node:path';

/** Repo root: this script lives at `scripts/`, so one level up. */
const REPO_ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');

/** Top-level directories that carry the symlinked views of spec-dir pages. */
const VIEW_DIRS = ['docs', 'examples'];

/** Fenced code blocks hold code samples, not links — strip before scanning. */
function stripFenced(source) {
  return source.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, '');
}

/**
 * Relative markdown links in one file: inline `[text](target)` (including
 * images) plus reference definitions `[id]: target`. Titles and
 * angle-bracket targets are tolerated; line numbers are 1-based against the
 * ORIGINAL text so a reported line can be grepped.
 */
export function extractRelativeLinks(source) {
  const out = [];
  const text = stripFenced(source);
  const inline = /\[[^\]]*\]\(\s*(<[^>]*>|[^)\s]*)(?:\s+"[^"]*")?\s*\)/g;
  let m;
  while ((m = inline.exec(text)) !== null) {
    out.push({ target: m[1].replace(/^<|>$/g, ''), line: source.slice(0, m.index).split('\n').length });
  }
  const ref = /^[ \t]*\[[^\]]+\]:[ \t]*(<[^>]*>|[^)\s]+)(?:\s+"[^"]*")?[ \t]*$/gm;
  while ((m = ref.exec(text)) !== null) {
    out.push({ target: m[1].replace(/^<|>$/g, ''), line: source.slice(0, m.index).split('\n').length });
  }
  return out;
}

/** Links this gate cannot resolve against a directory base (not dead, not violations). */
function isSkippable(target) {
  return (
    target === '' ||
    target.startsWith('#') ||
    isAbsolute(target) ||
    /^(https?|mailto|file|ftp|vscode|node):/i.test(target)
  );
}

/** Twinned pages: tracked-view `.md` symlinks under docs/ or examples/ whose
 * target is a real `.md` file under `specs/`. Symlinked directories are not
 * descended into (a view directory is a view, not a spec-dir page). */
export function twinnedPages(root) {
  const pages = [];
  const walk = (rel) => {
    const abs = join(root, rel);
    for (const name of readdirSync(abs).sort()) {
      const child = rel === '' ? name : `${rel}/${name}`;
      const st = lstatSync(join(root, child));
      if (st.isDirectory()) walk(child);
      else if (st.isSymbolicLink() && child.endsWith('.md')) {
        const realRel = normalize(join(dirname(child), readlinkSync(join(root, child))));
        const realPosix = realRel.split('\\').join('/');
        if (
          realPosix.startsWith('specs/') &&
          realPosix.endsWith('.md') &&
          existsSync(join(root, realPosix))
        ) {
          pages.push({ view: child, real: realPosix });
        }
      }
    }
  };
  for (const dir of VIEW_DIRS) {
    if (existsSync(join(root, dir))) walk(dir);
  }
  return pages.sort((a, b) => a.real.localeCompare(b.real) || a.view.localeCompare(b.view));
}

/**
 * Does `target` resolve as a path from the directory `fromDirRel`?
 *
 * A resolution stays inside the repo (escaping above the root is how the
 * view of a deeply-placed real page "resolves" onto the host filesystem —
 * that is dead, not a hit) and must exist on disk. Symlinks are followed:
 * a reader of the view resolves through them.
 */
export function resolvesFromBase(root, fromDirRel, target) {
  const withoutAnchor = target.split('#')[0];
  if (withoutAnchor === '') return true; // pure in-page anchor
  const abs = resolve(root, fromDirRel, withoutAnchor);
  const rel = relative(root, abs);
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) return false;
  try {
    return existsSync(abs);
  } catch {
    return false;
  }
}

/**
 * Classify every relative link of every twinned page against both bases.
 *
 * @param {string} root repo root (or a --root copy) to audit
 * @returns {{pages: number, linksChecked: number, skipped: number, rows: Array, violations: number}}
 */
export function auditDualViewLinks(root) {
  const pages = twinnedPages(root);
  const rows = [];
  let linksChecked = 0;
  let skipped = 0;

  for (const { view, real } of pages) {
    const source = readFileSync(join(root, real), 'utf8');
    const viewDir = dirname(view);
    const realDir = dirname(real);
    for (const { target, line } of extractRelativeLinks(source)) {
      if (isSkippable(target)) {
        skipped += 1;
        continue;
      }
      linksChecked += 1;
      const fromReal = resolvesFromBase(root, realDir, target);
      const fromView = resolvesFromBase(root, viewDir, target);
      const base = fromReal && fromView ? 'both' : fromReal ? 'real-only' : fromView ? 'view-only' : 'dead';
      const ok = base === 'real-only' || base === 'both';
      const detail =
        base === 'both'
          ? `resolves from both bases (${realDir}/ and ${viewDir}/)`
          : base === 'real-only'
            ? `resolves from the real location (${realDir}/) only — dead from the ${viewDir}/ view (accepted trade-off)`
            : base === 'view-only'
              ? `resolves only from the ${viewDir}/ view — dead at the real location (${realDir}/); write the link relative to the real location`
              : `resolves from neither the real location (${realDir}/) nor the view (${viewDir}/)`;
      rows.push({ page: real, view, line, link: target, base, ok, detail });
    }
  }

  const violations = rows.filter((row) => !row.ok).length;
  const noViewsFound = pages.length === 0;
  return {
    pages: pages.length,
    linksChecked,
    skipped,
    rows,
    noViewsFound,
    violations: noViewsFound ? violations + 1 : violations,
  };
}

/** Render the human-readable report: every link, labelled with its base. */
export function formatReport(report) {
  const lines = [];
  if (report.noViewsFound) {
    lines.push(
      'audit-dual-view-links: FAILED — no twinned pages found under docs/ or examples/ ' +
        '(wrong --root, or the symlinked views are missing); a clean run audits a non-empty set',
    );
    return lines.join('\n');
  }
  lines.push(
    `audit-dual-view-links: ${report.pages} twinned pages, ` +
      `${report.linksChecked} relative links checked (${report.skipped} skipped: URL/absolute/anchor)`,
  );
  for (const row of report.rows) {
    const label =
      row.base === 'real-only' ? 'ok real-only' : row.base === 'both' ? 'ok both' : row.base === 'view-only' ? 'VIOLATION view-only' : 'DEAD neither-base';
    lines.push(`  ${label.padEnd(20)} ${row.page}:${row.line}  ${row.link}`);
    lines.push(`      ${row.detail}`);
  }
  const realOnly = report.rows.filter((row) => row.base === 'real-only').length;
  const both = report.rows.filter((row) => row.base === 'both').length;
  const viewOnly = report.rows.filter((row) => row.base === 'view-only').length;
  const dead = report.rows.filter((row) => row.base === 'dead').length;
  lines.push(
    `${report.violations === 0 ? 'ok' : 'FAILED'}: ${realOnly} real-only (accepted trade-off), ` +
      `${both} both, ${viewOnly} view-only violations, ${dead} dead-everywhere`,
  );
  return lines.join('\n');
}

// CLI entry point.
if (process.argv[1] && process.argv[1].endsWith('audit-dual-view-links.mjs')) {
  const args = { json: false, root: REPO_ROOT };
  for (let i = 0; i < process.argv.slice(2).length; i += 1) {
    const arg = process.argv.slice(2)[i];
    if (arg === '--json') args.json = true;
    else if (arg === '--root') {
      args.root = resolve(process.argv.slice(2)[i + 1] ?? REPO_ROOT);
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log('usage: node scripts/audit-dual-view-links.mjs [--json] [--root DIR]');
      process.exit(0);
    } else {
      console.error(`audit-dual-view-links: unknown argument ${arg}`);
      process.exit(2);
    }
  }
  const report = auditDualViewLinks(args.root);
  if (args.json) console.log(JSON.stringify(report, null, 2));
  else console.log(formatReport(report));
  process.exit(report.violations === 0 ? 0 : 1);
}
