# SpecLang Governance

## Project Ownership

SpecLang is a meta-circular specification-driven compiler. The specs in `specs/` are the source of truth; the code in `src/` is generated from specs.

Maintainer: Alexis Okuwa (wojonstech@gmail.com)

## Decision Making

This project follows a **Benevolent Dictator for Life (BDFL)** model. Alexis Okuwa has final authority on all decisions regarding the project's direction, architecture, and scope.

## Contributions

1. All contributions must align with the dual-view pattern: specs first, then implementation
2. Every change must pass the validation gate: `npm run build && npm test`
3. Commits to non-trivial code paths require GitReins Tier 1 + Tier 2 evaluation
4. The Baby Steps methodology applies: smallest possible meaningful change, one at a time

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Versioning

SpecLang follows Semantic Versioning. The version is defined in `package.json` and the spec header format in `specs/headers.spec.md`.
