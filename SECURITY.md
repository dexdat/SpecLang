# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in SpecLang, please report it privately.

**Do not open a public issue.** Instead, email the maintainers directly.

We take all security reports seriously and will respond within 48 hours.

## Scope

SpecLang is a specification-driven code generation system. Security concerns include:

- **Prompt injection**: Malicious spec content that could cause unintended code generation
- **API key exposure**: The `.env` file and `DEEPSEEK_API_KEY` / `OPENAI_API_KEY` environment variables
- **File system access**: The daemon (`speclangd`) watches directories and agents write files
- **Dependency vulnerabilities**: npm packages used by the system

## Best Practices

1. **Never commit `.env` files** — the `.gitignore` already excludes them
2. **Review generated code** before deploying — specs are reviewed, generated code is trusted but should still be verified
3. **Run `npm audit`** regularly to check for dependency vulnerabilities
4. **Use API keys with minimal permissions** — only the keys needed for code generation

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ Active |
| < 1.0   | ❌ Pre-release |
