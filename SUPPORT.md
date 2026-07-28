# Support

SpecLang is a meta-circular specification-driven compiler — specs are the source
of truth, code is generated.

## Documentation

- [NORTH_STAR.md](docs/NORTH_STAR.md) — Vision and principles
- [README.md](README.md) — Getting started
- [AGENTS.md](AGENTS.md) — Development guide

## Getting Help

- **Issues:** [GitHub Issues](https://github.com/dexdat/SpecLang/issues)
- **Discussions:** [GitHub Discussions](https://github.com/dexdat/SpecLang/discussions)

## Architecture

SpecLang follows a dual-view pattern where spec files (under `specs/`) are
the source of truth and implementation files (under `src/`) are symlinked
or generated from specs. See [AGENTS.md](AGENTS.md) for details.
