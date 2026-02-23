#!/usr/bin/env python3
"""
Generate basic _index.md files for .dir directories that don't have one.
"""

import os
import sys
from pathlib import Path

def main():
    root = Path("specs")
    dirs = list(root.glob("*.dir"))
    created = 0
    for d in dirs:
        index_file = d / "_index.md"
        if index_file.exists():
            continue
        
        # Determine directory name without .dir suffix
        dir_name = d.name
        base_name = dir_name[:-4]  # remove .dir
        # Read existing spec files in directory
        spec_files = list(d.glob("*.spec.md")) + list(d.glob("*.spec.yaml")) + list(d.glob("*.scl"))
        subdirs = [x for x in d.iterdir() if x.is_dir()]
        
        # Create header
        lines = [
            f"# speclang-header lines:20",
            f"id: \"@speclang/{base_name}/index\"",
            f"version: 1.0.0",
            f"layer: 1",
            f"project_level: Alpha",
            f"agent_support: agent_autonomous",
            f"tags: [index, {base_name}, directory]",
            f"short: \"{base_name.title()} Directory Index\"",
            f"status: active",
            f"---",
            f"",
            f"# {base_name.title()} Directory Index",
            f"",
            f"**Directory:** `{d}/`  ",
            f"**Purpose:** Contains {base_name} sub-specs.",
            f"",
        ]
        
        if spec_files:
            lines.append("## Spec Files")
            lines.append("")
            for sf in sorted(spec_files):
                rel = sf.relative_to(d)
                lines.append(f"- `{rel.name}`")
            lines.append("")
        
        if subdirs:
            lines.append("## Subdirectories")
            lines.append("")
            for sd in sorted(subdirs):
                rel = sd.relative_to(d)
                lines.append(f"- `{rel.name}/`")
            lines.append("")
        
        lines.append("## Notes")
        lines.append("")
        lines.append("- This index is auto-generated. Update manually as needed.")
        
        content = "\n".join(lines)
        index_file.write_text(content)
        print(f"Created {index_file}")
        created += 1
    
    print(f"Created {created} index files.")
    
if __name__ == "__main__":
    main()