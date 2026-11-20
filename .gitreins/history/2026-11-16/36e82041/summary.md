# Verdict: DOC-8

**Task:** docs/layers.md ships four dead relative links
**Evaluated:** 2026-11-16T15:13:02.839107
**Result:** ✓ PASS

## Criteria

- ✓ **docs/layers.md:170-173 link only to files that exist in the tracked tree (or are removed/repointed), and doc_link_census.py reports zero dead links for it | proof: python3 /home/kara/.hermes/skills/coding-hermes/coding-hermes-docs/scripts/doc_link_census.py . --exclude ".opencode,.agents,specs,generated,node_modules,.tmp,dist,coverage" reports 0 dead links attributable to docs/layers.md, before/after pasted | failure_condition: census still lists any of the four links as dead**
  - PASS: docs/layers.md:170-173 (symlink -> specs/docs.spec.dir/layers.md) now links MASTER_GUIDE.md, MASTER_GUIDE.md, CASCADE_DEMO.md, validation_report.txt. All three targets exist and are tracked (git ls-files: docs/MASTER_GUIDE.md, docs/CASCADE_DEMO.md, docs/validation_report.txt + specs/docs.spec.dir/docs/*). Census BEFORE (worktree at HEAD~1): "dead relative links: 6", samples include docs/layers.md -> headers.md / spec-format.md / cascade.md / validation.md. Census AFTER (HEAD 56d6ca2c): "dead relative links: 2", only docs/prompts/phase-2.5-mcp-openapi.md remains; zero samples for docs/layers.md. Old targets confirmed genuinely dead: none of headers.md/spec-format.md/cascade.md/validation.md tracked anywhere (git ls-files grep -> "none tracked"). · graded at iteration 93.7 (205,374 in / 2,822 out, 93.7 iterations and 144s into the run) [resolution 0.14; docs/layers.md:170-173, doc_link_census.py, /home/kara/.hermes/skills/coding-hermes/coding-hermes-docs/scripts/doc_link_census.py]

## Pipeline Stages

- ✓ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ✓ tests: Start at  10:07:01
- ✓ **tier2**
  - COMPLETE
  ✓ docs/layers.md:170-173 link only to files that exist in the tracked tree (or are removed/repointed), and doc_link_census.py reports zero dead links for it | proof: python3 /home/kara/.hermes/skills/coding-hermes/coding-hermes-docs/scripts/doc_link_census.py . --exclude ".opencode,.agents,specs,generated,node_modules,.tmp,dist,coverage" reports 0 dead links attributable to docs/layers.md, before/after pasted | failure_condition: census still lists any of the four links as dead: PASS: docs/layers.md:170-173 (symlink -> specs/docs.spec.dir/layers.md) now links MASTER_GUIDE.md, MASTER_GUIDE.md, CASCADE_DEMO.md, validation_report.txt. All three targets exist and are tracked (git ls-files: docs/MASTER_GUIDE.md, docs/CASCADE_DEMO.md, docs/validation_report.txt + specs/docs.spec.dir/docs/*). Census BEFORE (worktree at HEAD~1): "dead relative links: 6", samples include docs/layers.md -> headers.md / spec-format.md / cascade.md / validation.md. Census AFTER (HEAD 56d6ca2c): "dead relative links: 2", only docs/prompts/phase-2.5-mcp-openapi.md remains; zero samples for docs/layers.md. Old targets confirmed genuinely dead: none of headers.md/spec-format.md/cascade.md/validation.md tracked anywhere (git ls-files grep -> "none tracked"). · graded at iteration 93.7 (205,374 in / 2,822 out, 93.7 iterations and 144s into the run) [resolution 0.14; docs/layers.md:170-173, doc_link_census.py, /home/kara/.hermes/skills/coding-hermes/coding-hermes-docs/scripts/doc_link_census.py]
Cap exceeded: Iteration cap (100) reached (100.4 used). Increase max_iterations or split criteria. Partial verdict — all 1 criteria graded and passed.

## Summary

Stage tier1: PASS
    ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ✓ tests: Start at  10:07:01

Stage tier2: PASS
  COMPLETE
  ✓ docs/layers.md:170-173 link only to files that exist in the tracked tree (or are removed/repointed), and doc_link_census.py reports zero dead links for it | proof: python3 /home/kara/.hermes/skills/coding-hermes/coding-hermes-docs/scripts/doc_link_census.py . --exclude ".opencode,.agents,specs,generated,node_modules,.tmp,dist,coverage" reports 0 dead links attributable to docs/layers.md, before/after pasted | failure_condition: census still lists any of the four links as dead: PASS: docs/layers.md:170-173 (symlink -> specs/docs.spec.dir/layers.md) now links MASTER_GUIDE.md, MASTER_GUIDE.md, CASCADE_DEMO.md, validation_report.txt. All three targets exist and are tracked (git ls-files: docs/MASTER_GUIDE.md, docs/CASCADE_DEMO.md, docs/validation_report.txt + specs/docs.spec.dir/docs/*). Census BEFORE (worktree at HEAD~1): "dead relative links: 6", samples include docs/layers.md -> headers.md / spec-format.md / cascade.md / validation.md. Census AFTER (HEAD 56d6ca2c): "dead relative links: 2", only docs/prompts/phase-2.5-mcp-openapi.md remains; zero samples for docs/layers.md. Old targets confirmed genuinely dead: none of headers.md/spec-format.md/cascade.md/validation.md tracked anywhere (git ls-files grep -> "none tracked"). · graded at iteration 93.7 (205,374 in / 2,822 out, 93.7 iterations and 144s into the run) [resolution 0.14; docs/layers.md:170-173, doc_link_census.py, /home/kara/.hermes/skills/coding-hermes/coding-hermes-docs/scripts/doc_link_census.py]
Cap exceeded: Iteration cap (100) reached (100.4 used). Increase max_iterations or split criteria. Partial verdict — all 1 criteria graded and passed.

Overall: PASS ✓
