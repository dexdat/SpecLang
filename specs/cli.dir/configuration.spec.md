# speclang-header lines:10
id: "@speclang/cli.dir/configuration"
version: 0.1.0
layer: 1
tags: [cli, configuration]
parent: "@ref:speclang/cli"
part: 4/8
short: CLI configuration
---

## Configuration

### @cli/config-file

```speclang
# @block:cli/config-file @kind:entity
.speclangrc:
  name: String
  version: SemVer
  specs_dir: String @default("specs")
  output_dir: String @default("generated")
  targets: String[] @default(["typescript"])
  plugins: PluginConfig[]
  ai: AIConfig?

PluginConfig:
  name: String
  options: Map?

AIConfig:
  provider: String @default("openai")
  model: String @default("gpt-4")
  enabled: Boolean @default(true)
```