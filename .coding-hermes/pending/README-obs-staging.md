# Staged: OBS-1..OBS-6 (card t_d686a429)

Staged by the speclang COS card manager on 2026-11-18T00:0xZ (pass evidence:
DuckBrain `cos` `/per-project/speclang/2026-11-18`).

WHY STAGED, NOT APPENDED: the board was NOT writer-quiet at pass time — a live wave
(README-9/22/23/25 + QA-SPECLANG-010-R2 dispatched 18:47 EST) plus a tier-2
`gitreins task complete` were running in this checkout, and a sibling lane was closing
rows from the twin checkout `/home/kara/SpecLang`. This is the second consecutive pass
that OBS filing was held for that reason; the rows are therefore pre-built and
gate-verified so the next quiet window is a single append, not a re-derivation.

All six criteria PASS `acceptance_gate.py` (checked with the gate's own `check()`,
not by eye) against this repo's tracked-file set.

APPEND (only when `pgrep -cf 'hermes.*chat -q'` is 0 AND the board mtime is >10 min old):

    cat .coding-hermes/pending/obs-series-rows.jsonl >> .coding-hermes/board/tasks.jsonl
    python3 ~/.hermes/scripts/acceptance_gate.py audit .   # expect 6 fewer failures
    git add .coding-hermes/board/tasks.jsonl && git commit -m "chore(board): file OBS-1..OBS-6 ..."

THEN, in the same window: replace the `Foreman rows intended but UNFILED` line in card
t_d686a429 with a real citation line:
`Foreman rows cited: OBS-1, OBS-2, OBS-3, OBS-4, OBS-5, OBS-6.` and delete the
`[hold 2026-11-18]` note, because the initiative then has dispatchable work.

FILED 2026-11-18 by tick speclang-foreman-2026-11-18-00-54-47: rows appended to board tasks.jsonl (gate audit: 6/6 OBS rows pass). Card citation line NOT edited — kanban card t_d686a429 update deferred to COS lane.
