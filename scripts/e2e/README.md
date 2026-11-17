# The seed test — one prompt file, one build

The standing acceptance test for reactive generation: **one seed file in
`specs/` must produce every artifact it asks for**, with no manual driving of
individual artifacts.

## Run it

```bash
export OPENROUTER_API_KEY=...
export SPECLANG_PROVIDER=openrouter SPECLANG_MODEL=meta/muse-ember
./scripts/e2e/seed-to-artifacts.sh
```

Requirements: `npx` (tsx), a provider key, and ~5 minutes.

## What it proves, end to end

1. The daemon's watcher sees the seed file (`*.spec.md` pattern).
2. The router emits an `AgentTask` for it (`TASK ROUTED`).
3. `CascadeCoordinator.watchDaemon()` dispatches a real agent session
   (`speclang agent speclang-spec-writer --trigger <seed content>`).
4. The agent's stdout — which contains every requested artifact, separated by
   section markers — is split by `persistAgentOutput()` and written as
   individual files under `generated/`.
5. The converge pipeline (`build.yaml`) runs after generation.
6. No re-dispatch loop: identical triggers are suppressed in-flight and for a
   10-minute TTL, so the daemon's 30 s reconvergence cannot re-run agents.

Pass criterion: every artifact named in the seed exists with non-empty
content. The script prints per-file word counts.

## Files

- `seed-trilogy.spec.md` — the seed: title, intent, the artifact list it must
  produce, rules, verification. This is the only input.
- `seed-to-artifacts.sh` — harness: scratch project, driver, seed touch,
  polling assertions, log tail on failure.
- `seed-to-artifacts.driver.ts` — daemon + coordinator wiring (the composition
  a host app needs; there is no shipped binary for it yet).

## Extending

Point the seed at different artifacts and re-run — the contract is the seed's
own artifact list. If a run fails, the failure class is named in the log
(`Agent ... FAILED`, `Refusing to write outside project`, missing artifacts),
and the fix belongs in the engine, not the seed.
