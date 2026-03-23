---
name: sip-079-cli-init-speclang-v0
title: "SIP 79: CLI Init Command"
version: 0.1.0
description: Project initialization and scaffolding with speclang init
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 79: CLI Init Command

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the `speclang init` command for project initialization.

### Quick Start

```bash
# Initialize in current directory
speclang init

# Create new project
speclang init my-project

# Use template
speclang init my-api --template=api
```

### Key Features

| Feature | Description |
|---------|-------------|
| Scaffolding | Creates initial structure |
| Templates | Pre-configured starters |
| Git Init | Optional repository setup |
| Interactive | Guided setup wizard |

### When to Read This

- **New Project:** Starting fresh
- **Templates:** Using starters
- **Scaffolding:** Understanding structure

### Related SIPs

- SIP 37: CLI
- SIP 64: CLI Commands
- SIP 42: Project Layout

## Abstract

This SIP defines the `speclang init` command that scaffolds new Speclang projects with proper directory structure, configuration files, and initial specifications.

## Motivation

Users need:
- Quick project setup
- Best practices defaults
- Template options
- Guided initialization

## Rationale

**Scaffolding Benefits:**
- Consistent structure
- Working examples
- Best practices
- Reduced setup time

**Template System:**
- Pre-configured for use cases
- Copy and customize
- Community contributions

## Specification

### Command Signature

**@cli/init:**

```bash
speclang init [path] [options]

Arguments:
  path         Target directory (default: current)

Options:
  --template   Starter template (default: minimal)
  --name       Project name (default: directory name)
  --author     Author name
  --license    License type (default: MIT)
  --git        Initialize git repo (default: true)
  --install    Install dependencies (default: true)
  --force      Overwrite existing files
  --interactive  Guided setup wizard

Aliases:
  speclang new
  speclang create
```

### Templates

**@init/templates:**

| Template | Description |
|----------|-------------|
| minimal | Basic structure, no examples |
| library | Reusable library/package |
| api | REST API with endpoints |
| webapp | Full-stack web app |
| cli | CLI tool |
| microservice | Microservice with grpc |
| monorepo | Multi-package workspace |

**Template Selection:**
```bash
speclang init --template=api
speclang init --template=webapp --name=my-saas
```

### Directory Structure

**@init/structure:**

```
<project>/
├── specs/
│   ├── index.spec.md          # Index spec
│   ├── entities/              # Data entities
│   ├── features/              # Features
│   └── _index.json            # Generated index
├── .speclang/
│   └── cache/                 # Local cache
├── generated/                 # Generated code
├── .speclangrc                # Configuration
├── .gitignore
└── README.md
```

### Generated Files

**@init/files:**

#### .speclangrc

```yaml
name: my-project
version: 0.1.0
specs_dir: specs
output_dir: generated
targets:
  - typescript

config:
  split:
    max_tokens: 10000
    strategy: smart
  cascade:
    quiet_period: 30
```

#### specs/index.spec.md

```markdown
# speclang-header lines:6
id: @specs/index
version: 0.1.0
layer: 0
tags: [index, root]
short: Project root spec
---

# My Project

Welcome to your Speclang project.

## Overview

Define your specifications here.

## @entities

Root entity definitions.

## @features

Feature specifications.
```

#### .gitignore

```
.speclang/
generated/
*.log
.env
node_modules/
```

### Interactive Mode

**@init/interactive:**

```bash
speclang init --interactive

? Project name: (my-project)
? Description: A Speclang project
? Author: Your Name
? License: (MIT)
? Template: (Use arrow keys)
  ❯ minimal
    api
    webapp
    cli
    microservice
? Targets: (Press space to select)
  ◉ typescript
  ◉ go
  ◉ python
  ◉ rust
? Initialize git? (Y/n)
? Install dependencies? (Y/n)
```

### Template Registry

**@init/registry:**

```yaml
templates:
  minimal:
    source: builtin
    files:
      - specs/index.spec.md
      - .speclangrc
      - .gitignore
      - README.md

  api:
    source: builtin
    files:
      - specs/index.spec.md
      - specs/entities/user.spec.md
      - specs/entities/request.spec.md
      - specs/features/auth.spec.md
      - specs/features/crud.spec.md
      - .speclangrc
      - .gitignore
      - README.md

  webapp:
    extends: api
    files:
      - specs/features/ui.spec.md
      - specs/features/routes.spec.md
      - specs/entities/session.spec.md

  cli:
    source: builtin
    files:
      - specs/index.spec.md
      - specs/features/commands.spec.md
      - specs/entities/config.spec.md
      - .speclangrc
      - .gitignore
      - README.md
```

### Remote Templates

**@init/remote:**

```bash
# From GitHub
speclang init --template=github:user/speclang-template-api

# From URL
speclang init --template=https://example.com/templates/api.tar.gz

# From local path
speclang init --template=~/my-templates/custom
```

### Force Mode

**@init/force:**

```bash
# Overwrite existing
speclang init --force

# Preserves:
# - .git/
# - node_modules/
# - Any untracked changes
```

## Implementation

### Command Handler

```typescript
import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';

interface InitOptions {
  template: string;
  name?: string;
  author?: string;
  license: string;
  git: boolean;
  install: boolean;
  force: boolean;
  interactive: boolean;
}

export async function initCommand(targetPath: string, options: InitOptions) {
  if (options.interactive) {
    options = await runInteractiveWizard(options);
  }

  const projectPath = path.resolve(targetPath || '.');
  const projectName = options.name || path.basename(projectPath);

  if (fs.existsSync(projectPath) && !options.force) {
    throw new Error(`Directory exists: ${projectPath}. Use --force to overwrite.`);
  }

  const template = await loadTemplate(options.template);
  await scaffoldProject(projectPath, {
    name: projectName,
    template,
    ...options,
  });

  if (options.git) {
    await initGit(projectPath);
  }

  console.log(`Initialized Speclang project in ${projectPath}`);
}
```

### Template Loader

```typescript
async function loadTemplate(name: string): Promise<Template> {
  if (name.startsWith('github:')) {
    return loadFromGitHub(name.slice(7));
  }
  if (name.startsWith('http')) {
    return loadFromUrl(name);
  }
  if (fs.existsSync(name)) {
    return loadFromLocal(name);
  }
  return loadBuiltin(name);
}

async function loadBuiltin(name: string): Promise<Template> {
  const templatePath = path.join(__dirname, 'templates', name);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Unknown template: ${name}`);
  }
  return {
    name,
    files: await fs.readJson(path.join(templatePath, 'manifest.json')),
    source: templatePath,
  };
}
```

### Scaffolding

```typescript
async function scaffoldProject(
  projectPath: string,
  config: ScaffoldConfig
) {
  await fs.ensureDir(projectPath);

  for (const file of config.template.files) {
    const sourcePath = path.join(config.template.source, file.src);
    const targetPath = path.join(projectPath, file.dest);

    await fs.ensureDir(path.dirname(targetPath));

    let content = await fs.readFile(sourcePath, 'utf-8');

    content = content
      .replace(/{{name}}/g, config.name)
      .replace(/{{author}}/g, config.author || 'Anonymous')
      .replace(/{{license}}/g, config.license)
      .replace(/{{year}}/g, new Date().getFullYear().toString());

    await fs.writeFile(targetPath, content);
  }
}
```

### Interactive Wizard

```typescript
import inquirer from 'inquirer';

async function runInteractiveWizard(options: InitOptions): Promise<InitOptions> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: options.name,
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author:',
      default: options.author,
    },
    {
      type: 'list',
      name: 'template',
      message: 'Template:',
      choices: ['minimal', 'api', 'webapp', 'cli', 'microservice'],
      default: options.template,
    },
    {
      type: 'checkbox',
      name: 'targets',
      message: 'Targets:',
      choices: ['typescript', 'go', 'python', 'rust'],
      default: ['typescript'],
    },
    {
      type: 'confirm',
      name: 'git',
      message: 'Initialize git?',
      default: true,
    },
  ]);

  return { ...options, ...answers };
}
```

### Git Init

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function initGit(projectPath: string) {
  try {
    await execAsync('git init', { cwd: projectPath });
    await execAsync('git add .', { cwd: projectPath });
    await execAsync('git commit -m "Initial commit"', { cwd: projectPath });
  } catch (error) {
    console.warn('Git initialization failed:', error);
  }
}
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Directory exists (use --force) |
| 3 | Invalid template |
| 4 | Write permission denied |

## Examples

### Basic Init

```bash
$ speclang init my-app
Creating my-app/
  specs/index.spec.md
  .speclangrc
  .gitignore
  README.md
Initialized git repository
Done!
```

### API Template

```bash
$ speclang init my-api --template=api
Creating my-api/
  specs/index.spec.md
  specs/entities/user.spec.md
  specs/entities/request.spec.md
  specs/features/auth.spec.md
  specs/features/crud.spec.md
  .speclangrc
  .gitignore
  README.md
Done!
```

### Interactive Mode

```bash
$ speclang init --interactive
? Project name: my-saas
? Description: A SaaS application
? Author: John Doe
? Template: webapp
? Targets: typescript, go
? Initialize git? Yes
Creating my-saas/...
Done!
```

## References

- "@ref:sip-037-cli
- @ref:sip-064-cli-commands
- @ref:sip-042-project-layout
- @ref:sip-083-configuration-files

## Copyright

This document is in the public domain.
