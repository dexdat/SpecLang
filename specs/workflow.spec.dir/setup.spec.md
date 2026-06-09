# speclang-header lines:11
id: "@speclang/workflow/setup"
version: 0.1.0
layer: 2
parent: "@speclang/workflow"
part: 1/3
tags: [workflow, setup, installation, start]
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Setup and Installation Workflow
---

# User Workflow

How a user actually uses Speclang from start to finish.

## Overview

```speclang
# @block:workflow/overview @kind:note
The user's experience is simple:

1. Install once (binary + skills)
2. Start daemon
3. Talk to AI in natural language
4. Watch specs cascade into code
5. Review specs, not code
6. Ship

Everything else is automatic.
```

---

## Installation

### @workflow/install

```speclang
# @block:workflow/install @kind:operation
Install Steps:

1. Check system architecture and OS compatibility
2. Download speclangd binary using curl command
3. Verify binary integrity and permissions
4. Download skills pack using speclang skills download
5. Verify skills pack integrity
6. Copy skills to .pi/skills/ directory
7. Copy skills to Cursor directory
8. Copy skills to Claude Code directory
9. Verify installation with speclang --version
10. Verify skills list with speclang skills list
11. Done. No config needed.
```

### @workflow/install-detail

```speclang
# @block:workflow/install-detail @kind:entity
InstallArtifacts:
  binary:
    path: ~/.local/bin/speclangd
    size: ~5MB
    platforms: Linux, macOS, Windows
    
  skills:
    path: ~/.speclang/skills/
    contents:
      - SpecWriter/
      - CodeGen/
      - TestWriter/
      - BackSync/
      - Orchestrator/
    size: ~50KB total
    
  config:
    path: ~/.speclang/config.json
    defaults: auto-generated on first run
```

---

## Starting a Project

### @workflow/start

```speclang
# @block:workflow/start @kind:operation
Start Steps:

1. Create project directory
2. Change to project directory
3. Initialize speclang with speclang init
4. Validate initialization success
5. Start daemon with speclangd start
6. Check daemon logs for errors
7. Verify daemon is running with speclang status
8. Open AI editor with skills loaded
9. Verify skills are loaded in editor
10. Provide build command: "Build [description] using Speclang"
11. Monitor build progress
12. Watch system build itself.
13. Done.
```

### @workflow/init-creates

```speclang
# @block:workflow/init-creates @kind:code
```
my-app/
├── project.scl        # north star (empty, ready for user)
├── specs/             # spec files (empty)
├── tests/             # test specs (empty)
├── generated/         # output code (empty, gitignored)
├── .speclang/         # daemon state
│   ├── config.json
│   └── locks/
├── .speclangrc        # project config
├── build.yaml         # pipeline config (default)
└── .gitignore
```
```