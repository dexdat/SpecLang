# Decision: the tracked compiled spec-dir layer

**Status:** accepted (QA-SPECLANG-010)
**Scope:** `specs/**/src/**/*.js` and their `.d.ts` / `.map` siblings — the
compiled artifacts committed next to the spec-dir TypeScript sources.
**Enforcement (blocking, in CI):** `tests/specdir-compiled-parity.test.ts`, which
`npm test` runs as a blocking CI step. It exercises both gates: it imports
`compareModules` from `scripts/check-specdir-parity.mjs` for guard-module symbol
parity, and it spawns `scripts/audit-specdir-requires.mjs` and requires
`0 failing, 0 stale baseline entries`. Each gate also has a negative control in
that file (a scratch tree with a dangling require, and a synthetic module that
loses a guard export), so both can be shown to go red.
The two npm scripts (`audit:specdir`, `check:specdir-parity`) are the local and
operator entry points. A dedicated two-step CI job is staged in
`.coding-hermes/pending/ci-specdir-audit-step.patch` — it is not applied because
the fleet push credential cannot write `.github/workflows/**` (INT-CI-1), and the
suite assertion above keeps the protection in place until it can be.

## The problem this decision answers

The `.ts` files under `specs/*.spec.dir/src/` are SpecLang's real source: `src/**`
holds tracked symlinks into them, and `tsconfig.json` maps the
`*.spec.dir/src/*` aliases onto them. Next to those sources the repository also
tracks **446 compiled `.js` files**, produced by compiling the spec-dir modules in
place at some point and committed since.

That layer had drifted, and it is not inert:

- `tests/workflow/conversation.test.ts` imports
  `specs/workflow.spec.dir/src/conversation.js` **at runtime**, so the artifact —
  not the source — is what the suite exercises.
- `specs/sqlite.spec.dir/src/index.ts` installs the state-database corruption
  guard (`STATE_DB_CORRUPT_CODE`, `CorruptStateDatabaseError`,
  `isNotADatabaseError`, `stateDatabaseCorruptionMessage`, `openStateDatabase`,
  `withStateDatabase`) because better-sqlite3 defers reading the file header
  until the first statement. The tracked
  `specs/sqlite.spec.dir/src/index.js` predated that guard entirely — it still
  reached `new Database()` directly. Any consumer following the artifact
  inherited a silent bypass of the guard the source installs.
- 41 relative `require()` calls in the layer point at nothing: paths written for
  the `src/` projection but off by one level for the `specs/` tree, plus
  requires into modules that were never compiled into the layer.

Nothing detected any of this, because nothing compared artifact to source.

## Decision

**The layer is kept — a projection, never a second source of truth — and
regeneration is applied to the modules whose divergence changes behaviour
(guard-bearing modules), not to the tree wholesale.**

1. **The `.ts` source is authoritative.** Nothing writes the compiled artifacts by
   hand. The only sanctioned writer is `npm run regenerate:specdir`
   (`scripts/regenerate-specdir-layer.mjs`), which recompiles a module from its
   source with a throwaway tsconfig that *extends the repo's own*
   `tsconfig.json` (so emit options cannot drift) and writes back only that
   module's `.js` / `.d.ts` / maps.
2. **No guard-bearing artifact may silently disagree with its source.**
   `npm run check:specdir-parity` finds every module whose source exports a
   state-DB opener or corruption diagnostic (`GUARD_SYMBOLS` in
   `scripts/lib/specdir-compiled-layer.mjs`) and requires the compiled artifact to
   export **exactly** the same value symbols. Those modules are regenerated from
   source and the gate is blocking in CI; `tests/specdir-compiled-parity.test.ts`
   pins the same comparison inside the suite and loads the compiled sqlite
   artifact to assert the guard symbols are really there at runtime.
3. **Whole-layer freshness is reported, not gated.** The parity script also
   compares every tracked artifact against a fresh compile, but that number is a
   report (a `--strict-freshness` flag turns it into a gate once the layer is
   clean). Reason, measured at the decision revision (`f1df9435`, 2026-11-20):
   compiling the whole tree at this revision emits
   behavioural changes that the committed artifacts do not have — e.g.
   `specs/parser.spec.dir/src/header.ts` matches `@block::` (double colon) and
   prefixes block ids with `@block::`, while the artifact and the suite use
   `@block:`; regenerating 286 artifacts for a trial run turned 4 pre-existing
   failures into 34 failures across 14 files (parser, codegen, mcp, db, workflow).
   Freshness drift is therefore visible on every CI run but does not decide the
   build; closing it is the follow-up work of fixing the sources first. At
   `c046692b` the parity script reads `freshness (report only): in sync`.
4. **A require that cannot resolve is a recorded decision, not silence.**
   `npm run audit:specdir` resolves every relative `require()` in the layer against
   the tree. Exceptions live in `scripts/specdir-requires-baseline.json`; each
   entry carries a `reason` and a `proof` class that the audit re-verifies on every
   run:
   - `source-only` — the required module exists, but only as `.ts`/`.tsx` (the
     layer's membership is partial; see below).
   - `runtime-projection` — the specifier is written for the `src/` projection of
     the same source and resolves there to a tracked symlink that
     `npm run build` compiles.
   - `missing` — nothing by that name exists in either form; accepted only where
     the artifact has no importer anywhere in the tree.

   An entry whose require starts resolving, or whose proof no longer holds,
   **fails** the audit. The list cannot rot into a blanket exception.

`npm run build`, `npm run lint` and `npm test` are unaffected by the decision:
`tsconfig.json` does not include the layer (except `specs/mcp.spec.dir/src`), so
the artifacts are emitted onto tracked paths, not into `dist/`.

## Markdown relative links in dual-view pages

The spec-dir projection has a second face the compiled layer does not: most
user-facing pages exist twice — as the **real file** under `specs/*.spec.dir/`,
and as a tracked **symlinked view** at `docs/<page>.md` or
`examples/<page>.md` (`docs/layers.md` -> `../specs/docs.spec.dir/layers.md`
is the pattern; 17 such pages at `e168022a`). Both views render the same
bytes, but a relative link resolves from only one directory at a time, so the
two views cannot both be right for the same link text.

**A relative link in a dual-view page is written relative to the page's REAL
location, one `../` per real directory level. The symlinked view consequently
serves dead links for any link that crosses directory depth, and that is the
accepted trade-off — a broken link on the `docs/`-view read of such a page is
this rule working as decided, not a defect.** The convention is named for the
rows that established it: DOC-9 measured the geometry
(`specs/examples.spec.dir/hello-world/README.md` is three levels below the
root, so its cross-references need `../../../`; commit `4455371a`) and
DOC-9-R2 (`ccc4ec3d`) applied the same arithmetic to the parent
`specs/examples.spec.dir/README.md` (`../` -> `../../`); DOC-16-R2
(`65a022f4`) repointed the See Also links of `specs/docs.spec.dir/layers.md`
to `docs/...` forms that resolve from the real location. Note DOC-9's own
fix note first called the parent README "correct at its reachable path"
(view-relative) — DOC-9-R2 explicitly superseded that judgement in favour of
the real-location rule, so the earlier note is history, not guidance.

The two known instances of the accepted trade-off, named so nobody re-files
them as dead-link bugs (DOC-8 and DOC-16 did, correctly, before the rule
existed):

- `docs/layers.md` (real file `specs/docs.spec.dir/layers.md`): its See Also
  links (`docs/MASTER_GUIDE.md`, `docs/CASCADE_DEMO.md`,
  `docs/validation_report.txt`) resolve only from the real location; from the
  `docs/` view they would need `docs/docs/...`, which does not exist.
- `examples/README.md` (real file `specs/examples.spec.dir/README.md`): its
  More Information links (`../../docs/NORTH_STAR.md`, `../../specs/*.spec.md`)
  resolve only from the real location; from the `examples/` view the `../../`
  climbs above the repository root.

Enforcement: `npm run audit:dual-view-links`
(`scripts/audit-dual-view-links.mjs`) walks every twinned page and resolves
every relative link against BOTH bases. It FAILS on a link that resolves only
from the symlinked view (the DOC-9-R2 class — rewrite it real-relative) and on
a link that resolves from neither (the DOC-8/DOC-16-R2 class — the target does
not exist in the tree at all); links that resolve from the real location only
are reported as the accepted class, and links resolving from both bases as
`both`. Like the other spec-dir audits it is a local and operator entry point;
it is not yet wired into the CI suite (the same INT-CI-1 constraint that keeps
`audit:specdir`'s dedicated job staged in `.coding-hermes/pending/`), so
`tests/specdir-compiled-parity.test.ts` does not carry it.

Repair path: edit the link in the TARGET file (the `specs/*.spec.dir/` one —
never through the symlink), keeping one `../` per real directory level, and
re-run the audit. Do not "fix" a real-only link to please the view: that
reverts DOC-9-R2 and trades a correct read for a broken one.

## Alternatives rejected

- **Regenerate the whole layer.** Trial-run at the decision revision
  (`f1df9435`): 286 artifacts rewritten, suite went
  from 4 to 34 failures. The layer's artifacts are the *older, working* compile of
  sources that have since acquired latent bugs; regenerating them wholesale ships
  those bugs. Regeneration stays scoped to guard-bearing modules until the sources
  are repaired.
- **Retire the layer (delete the tracked artifacts).** Rejected at this revision as
  a rewiring project, not a deletion: `tests/workflow/conversation.test.ts` imports
  the artifact path directly, and extensionless `require('./x')` inside the layer
  resolves to `.js` before `.ts`, so consumers currently exercise the projection.
  Retiring it means rewiring those consumers and re-verifying the suite — a
  separate decision with its own evidence.

## What the decision explicitly does not do

- **It does not complete the layer's membership.** Re-censused at `c046692b`
  (2026-11-25): `find specs -path '*.spec.dir/src/*' -name '*.js' ! -type l |
  wc -l` → 446 have a compiled sibling, while the same `find` over `*.ts` and
  `*.tsx` sources returns 1012 + 6 = 1018 — a delta of 572 never-compiled
  sources. A require into a source that was never compiled is
  recorded as `source-only` rather than papered over by inventing a compiled file:
  adding ~572 artifacts is a separate decision with its own review cost. The audit
  keeps that count visible on every run.
- **It does not fix the source-level mistakes it surfaced** (a spec-dir
  `speclangd.ts` importing a `./daemon/` directory that does not exist,
  `specs/parser.spec.dir/src/block-parser.ts` reaching for `src/types/poc` from a
  coordinate where that path is empty, and the `@block::` grammar drift above).
  Both are recorded; deciding what those sources *meant* is a source change, not a
  layer-integrity change.
- **It does not regenerate source maps on every run.** Maps are rewritten by a
  regeneration but excluded from the freshness verdict: tsc's `mappings` encode
  source byte positions, so a comment-only source edit makes them stale without
  making the artifact wrong.

## How to change the layer

```bash
npm run audit:specdir                 # requires resolve (or are recorded)
npm run check:specdir-parity          # guard parity (gate) + whole-layer freshness (report)
npm run regenerate:specdir            # recompile the guard-bearing modules
npm run regenerate:specdir -- --module specs/foo.spec.dir/src/bar.ts
npm run regenerate:specdir -- --all-stale   # every stale module (only with the sources fixed)
```

Never edit a compiled `.js` under `specs/` by hand: the freshness report will name
it, and the edit disappears the next time anyone regenerates. Edit the `.ts`, then
regenerate.

## Evidence at the time of this decision

The decision's evidence was first captured at `f1df9435` (2026-11-20). The
counts below were re-measured at `c046692b` (2026-11-25, the last refresh of
this document), because the layer-touching commits after the decision —
`a77fd8e6` (two missing layer modules + the `@block:` prefix correction),
`0a2fa214` (QA-SPECLANG-010 regenerate pass), `62a69bc2` (INT-CI-3 repair:
daemon layer modules, baseline restructure) — moved them.

- `npm run audit:specdir` — `audit-specdir-requires: 446 compiled spec-dir modules, 600 relative requires`; `ok: 559 resolve in the spec-dir tree, 41 accepted in scripts/specdir-requires-baseline.json, 0 failing, 0 stale baseline entries`.
- Membership census at this revision: `find specs -path '*.spec.dir/src/*' -name '*.js' ! -type l | wc -l` → 446 compiled `.js` artifacts (443 `.d.ts` siblings track alongside); the same `find` over the `*.ts`/`*.tsx` sources returns 1012 + 6 = 1018; delta = 572 never-compiled sources.
- `npm run check:specdir-parity` — `check-specdir-parity: 1 guard-bearing module(s) (state-DB opener / corruption diagnostic)`, value exports match (`specs/sqlite.spec.dir/src/index.ts`); `freshness (report only): in sync` at `c046692b` — at the decision revision the freshness report read stale for the remaining artifacts (see §3).
- Drift removed: `specs/sqlite.spec.dir/src/index.js`, `.d.ts` and both maps were
  regenerated from source, so the artifact now carries the corruption guard it
  lacked (`openStateDatabase`, `withStateDatabase`, `CorruptStateDatabaseError`,
  `stateDatabaseCorruptionMessage`, `STATE_DB_CORRUPT_CODE`).
- Both gates proved they can fail: the audit exits 1 on a scratch tree whose
  compiled module requires a missing file, and on a tracked artifact whose require
  was pointed at a nonexistent module (run by hand during this work:
  `specs/cli.spec.dir/src/list.js` → `1 failing`, exit 1); the parity comparison
  returns the missing symbol list for a source whose guard exports are absent from
  the artifact (`compareModules` negative control in the test file).
