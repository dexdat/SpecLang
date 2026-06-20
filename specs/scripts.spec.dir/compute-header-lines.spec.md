# speclang-header lines:11
id: "@speclang/scripts.compute-header-lines"
version: 0.1.0
layer: 2
tags: [scripts, headers]
parent: "@ref:speclang/scripts"
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Compute Header Lines Script
target: scripts/compute_header_lines.py
---

# Compute Header Lines Script

Script that computes and updates the `lines:` field in SpecLang specification headers.

## Overview

```speclang
# @block:overview @kind:note
The compute-header-lines script calculates the number of lines in the YAML
frontmatter header of a spec file and updates the speclang-header comment
to reflect the accurate count.
```

## Purpose

```speclang
# @block:purpose @kind:note
The speclang-header comment format is:
  # speclang-header lines:N

Where N must equal the exact number of lines in the YAML frontmatter (not
including the opening --- separators). This script:
1. Parses the YAML frontmatter
2. Counts the lines accurately
3. Updates the header comment with correct count
4. Validates existing line counts
```

## Header Format

```speclang
# @block:header-format @kind:note
Correct format:
  # speclang-header lines:15
  id: "@specs/example"
version: 1.0.0
  layer: 5
  tags: [example]
  short: Example spec
  ---
  
The "lines:15" indicates there are 15 lines of YAML (not counting ---).
```

## Implementation

```speclang
# @block:implementation @kind:function
def compute_header_lines(spec_path: str, dry_run: bool = False) -> dict:
    """
    Compute and update header line count in a spec file.
    
    Args:
        spec_path: Path to the spec file
        dry_run: If True, only report current count without modifying
    
    Returns:
        Dict with current_count, computed_count, and modified flag
    """
```

## Algorithm

```speclang
# @block:algorithm @kind:note
1. Read the spec file
2. Find the speclang-header comment line
3. Extract current line count from header
4. Parse YAML frontmatter (between first --- separators)
5. Count actual lines in frontmatter
6. Compare computed vs current count
7. If different and not dry_run, update header
8. Return comparison results
```

## Edge Cases

```speclang
# @block:edge-cases @kind:note
- Empty frontmatter: Should have lines:0
- Multi-line values: Count each line in value
- Nested YAML: Count all nested lines
- Comments in YAML: Should not be counted
- No header: Report as missing header
- Malformed YAML: Report as parse error
```

## Usage

```speclang
# @block:usage @kind:note
# Check line count for a single spec
python3 scripts/compute_header_lines.py specs/my-spec.spec.md

# Fix line counts (update header)
python3 scripts/compute_header_lines.py specs/my-spec.spec.md --fix

# Check all specs in directory
python3 scripts/compute_header_lines.py specs/ --recursive

# Find specs with incorrect counts
python3 scripts/compute_header_lines.py specs/ --find-errors
```

## Output Format

```speclang
# @block:output @kind:note
Example output:
  specs/my-spec.spec.md: lines=12 (correct)
  specs/other.spec.md: lines=10 (incorrect, should be 11)
  
Summary:
  Total: 427 specs
  Correct: 412
  Incorrect: 15
  Fixed: 0 (dry run)
```

## Related Specs

```speclang
# @block:refs @kind:note
- @ref:speclang/headers - Full header specification
- @ref:speclang/scripts.add-missing-fields - Add missing header fields
- @ref:speclang/scripts.fix-headers - General header fixing
```
