import json
import re

# Load index
with open('_index.json', 'r') as f:
    data = json.load(f)

specs = data.get('specs', {})
spec_ids = set(specs.keys())
print(f"Total spec entries: {len(spec_ids)}")

# Prompts mapping (manually compiled)
prompt_specs = {
    'phase-0.1-sqlite.md': {'@speclang/sqlite', '@speclang/sqlite/schema'},
    'phase-0.2-parser.md': {'@speclang/headers', '@speclang/spec-format', '@speclang/file-naming'},
    'phase-0.3-indexer.md': {'@speclang/project-layout', '@speclang/headers', '@speclang/scripts.generate-index.py'},
    'phase-1.1-daemon.md': {'@speclang/daemon', '@speclang/daemon/architecture', '@speclang/daemon/events', '@speclang/daemon/routing', '@speclang/daemon/convergence'},
    'phase-1.2-agents.md': {'@speclang/agent-protocol', '@speclang/tools', '@speclang/cascade'},
    'phase-2.1-mcp-server.md': {'@speclang/mcp', '@speclang/mcp/overview', '@speclang/mcp/architecture', '@speclang/mcp/tools/*'},
    'phase-2.2-mcp-cli.md': {'@speclang/mcp.cli', '@speclang/mcp'},
    'phase-3.1-codegen.md': {'@speclang/compiler', '@speclang/stdlib', '@speclang/lenses', '@codegen/typescript', '@codegen/go'},
    'phase-4.1-pipeline.md': {'@speclang/pipeline', '@speclang/recovery', '@speclang/cascade'},
    'phase-4.2-guard.md': {'@speclang/agent-protocol', '@speclang/agent-protocol/ownership', '@speclang/git-history'},
    'phase-5.1-self-specifying.md': {'@speclang/bootstrap', '@speclang/speclang', '@speclang/tutorial', '@specs/examples/hello-world'},
    'phase-5.2-autonomous-test.md': {'@speclang/bootstrap', '@speclang/autonomous-validation'},
}

# Flatten all referenced spec IDs
referenced = set()
for prompt, ids in prompt_specs.items():
    for spec_id in ids:
        # handle wildcard
        if spec_id.endswith('/*'):
            prefix = spec_id[:-2]
            matched = [id for id in spec_ids if id.startswith(prefix)]
            referenced.update(matched)
        else:
            referenced.add(spec_id)

print(f"Referenced spec IDs: {len(referenced)}")
print(f"Missing spec IDs: {len(spec_ids - referenced)}")

# Categorize missing specs by layer and priority
missing = spec_ids - referenced
missing_details = []
for spec_id in missing:
    spec = specs.get(spec_id)
    if spec:
        layer = spec.get('layer', -1)
        tags = spec.get('tags', [])
        missing_details.append({
            'id': spec_id,
            'layer': layer,
            'tags': tags,
            'short': spec.get('short', ''),
        })

# Sort by layer (0 highest priority)
missing_details.sort(key=lambda x: x['layer'])

print("\nMissing specs by layer:")
for detail in missing_details:
    print(f"Layer {detail['layer']}: {detail['id']} - {detail['short']}")

# Write to file
with open('missing_specs.txt', 'w') as f:
    f.write("Missing spec coverage:\n")
    for detail in missing_details:
        f.write(f"{detail['id']} (layer {detail['layer']}) - {detail['short']}\n")

print("\nWritten to missing_specs.txt")