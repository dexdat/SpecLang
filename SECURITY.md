# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |

## Reporting a Vulnerability

SpecLang is a specification-driven compiler in active development.

To report a security vulnerability, please open an issue on the GitHub repository at
https://github.com/dexdat/SpecLang or contact the maintainer directly.

We aim to acknowledge reports within 48 hours and provide an initial assessment
within 5 business days.

## Security Considerations

SpecLang generates code, executes scripts, and may interact with LLM APIs.
When deploying SpecLang in production environments:

- Review generated code before execution
- Use appropriate API key rotation and least-privilege access
- Run the daemon with minimal filesystem permissions
- Audit cascade output for sensitive data leakage
