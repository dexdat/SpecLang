# speclang-header lines:11
id: "@speclang/core/skills"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [core]
short: Skills pack for AI editor integration
parent: "@ref:speclang/core"
part: 5/6
---

## Skills Pack

### @speclang/skills

```speclang
# @block:speclang/skills @kind:entity
SkillsPack:
  description: "AI editor skills for Speclang"
  
  structure:
    speclang-skills/
      SpecWriter/
        SKILL.md
        prompts/
      CodeGen/
        SKILL.md
        prompts/
      TestWriter/
        SKILL.md
        prompts/
      Orchestrator/
        SKILL.md
        prompts/
  
  usage:
    - download to ~/.speclang/skills/
    - point editor to skills folder
    - editor loads skills automatically
```