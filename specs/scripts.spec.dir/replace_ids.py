# speclang-header lines:3
# target: scripts/replace_ids.py
#!/usr/bin/env python3
import re

with open('specs/mcp/openapi-generation.spec.md', 'r') as f:
    content = f.read()

# Replace @openapi-mcp/ with @speclang/mcp/openapi-generation/
content = re.sub(r'@openapi-mcp/', r'@speclang/mcp/openapi-generation/', content)

# Also replace openapi-mcp/ when preceded by # @block: (already done)
# Ensure block lines are consistent
with open('specs/mcp/openapi-generation.spec.md', 'w') as f:
    f.write(content)

print("Replacement done")