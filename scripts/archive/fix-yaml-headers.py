#!/usr/bin/env python3
"""Fix corrupted YAML headers in SpecLang spec files.

Handles:
1. Multiple list items on one line (children/depends_on/imports/siblings)
2. Missing closing quotes on list items
3. Double @ref: prefixes
4. --- terminator jammed into last content line
5. Missing short/layer fields for agent_autonomous specs
6. Malformed parent field quoting
"""

import os
import re
import sys
from pathlib import Path

SPECS_DIR = Path("/home/kara/SpecLang/specs")
DRY_RUN = "--dry-run" in sys.argv

# Fields that can have YAML list values
LIST_FIELDS = {"children", "depends_on", "imports", "siblings", "tags"}


def fix_header(filepath: Path) -> tuple[list[str], bool]:
    """Fix YAML header corruption. Returns (changes, was_modified)."""
    content = filepath.read_text()
    original = content
    lines = content.split('\n')
    changes = []

    # Find header boundaries
    if not lines or not lines[0].startswith('# speclang-header'):
        return changes, False

    # Find --- terminator
    terminator_idx = None
    for i in range(1, min(len(lines), 50)):
        # Check if line IS exactly --- or starts with --- (jammed case)
        stripped = lines[i].strip()
        if stripped == '---':
            terminator_idx = i
            break
        # Handle jammed --- on end of line
        if '---' in lines[i] and not lines[i].startswith('#'):
            # Check if the --- is at the end of a content line
            if re.search(r'---\s*$', lines[i]) and not stripped.startswith('- '):
                terminator_idx = i
                break

    if terminator_idx is None:
        return changes, False

    header_lines = lines[1:terminator_idx]  # Exclude # speclang-header and ---
    post_header = lines[terminator_idx:]     # From --- onwards

    new_header_lines = []
    in_list_field = None

    for line in header_lines:
        stripped = line.strip()
        if not stripped:
            new_header_lines.append(line)
            continue

        # Check if this line starts a list field
        list_match = re.match(r'^(\w[\w_]*):\s*(.*)', stripped)
        if list_match:
            field_name = list_match.group(1)
            field_value = list_match.group(2)

            if field_name in LIST_FIELDS:
                in_list_field = field_name

                if field_value.startswith('['):
                    # Flow-style list: tags: [a, b, c] — keep as-is
                    new_header_lines.append(line)
                    in_list_field = None
                    continue

                if field_value == '':
                    # Empty field value, list items follow on next lines
                    new_header_lines.append(line)
                    continue

                # Single list item on the field line
                if field_value.startswith('- '):
                    # Already a list item
                    new_header_lines.append(line)
                    continue
                else:
                    # Value on same line as field — treat as first list item
                    indent = ' ' * (len(line) - len(line.lstrip()))
                    new_header_lines.append(f"{indent}{field_name}:")
                    new_header_lines.append(f"{indent}  {field_value}")
                    continue

            elif field_name == 'parent':
                # Fix parent: ""@ref:... -> parent: "@ref:..."
                if field_value.startswith('""'):
                    field_value = field_value[1:]  # Remove one leading "
                new_header_lines.append(f"{line[:line.index(field_name)]}{field_name}: {field_value}")
                in_list_field = None
                continue

            elif field_name == 'short':
                # Fix unquoted short values that contain special chars
                if not field_value.startswith('"') and ('@' in field_value or ':' in field_value or '#' in field_value):
                    field_value = f'"{field_value}"'
                new_header_lines.append(f"{line[:line.index(field_name)]}{field_name}: {field_value}")
                in_list_field = None
                continue

            else:
                in_list_field = None
                new_header_lines.append(line)
                continue

        # Check if this is a list item under a list field
        if stripped.startswith('- '):
            item_content = stripped[2:].strip()  # Content after "- "

            # Split multiple items on one line
            # Pattern: - "item1  - "item2  - item3
            items_on_line = re.split(r'\s{2,}-\s+', item_content)
            if len(items_on_line) > 1:
                # Multiple items on one line — split them
                indent = ' ' * (len(line) - len(line.lstrip()))
                for item in items_on_line:
                    fixed_item = fix_list_item(item)
                    new_header_lines.append(f"{indent}  - {fixed_item}")
                changes.append(f"  Split {len(items_on_line)} items on one line")
                continue
            else:
                # Single item — fix it
                fixed = fix_list_item(item_content)
                indent = ' ' * (len(line) - len(line.lstrip()))
                new_header_lines.append(f"{indent}  - {fixed}")
                continue

        # Check for jammed ---
        if '---' in stripped and not stripped.startswith('- '):
            # Terminator jammed into this line
            before_terminator = re.sub(r'\s*---\s*$', '', stripped)
            if before_terminator and before_terminator != stripped:
                new_header_lines.append(f"{line[:line.index(stripped)]}{before_terminator}")
                # We'll handle the --- in post_header
                continue

        # Check for multiple key:value pairs on one line
        # Pattern: key1: val1  key2: val2
        multi_key = re.findall(r'\b(\w[\w_]*):\s*("[^"]*"|\S+)', stripped)
        if len(multi_key) > 1 and in_list_field is None:
            # Split into separate lines
            indent = ' ' * (len(line) - len(line.lstrip()))
            for key, val in multi_key:
                new_header_lines.append(f"{indent}{key}: {val}")
            changes.append(f"  Split {len(multi_key)} key:value pairs on one line")
            continue

        # Regular line
        new_header_lines.append(line)

    # Reconstruct: fix the terminator line
    # If terminator was jammed on previous line
    new_post_header = []
    for i, line in enumerate(post_header):
        if i == 0 and line.strip() == '---':
            new_post_header.append('---')
        elif i == 0:
            # Terminator might be jammed
            cleaned = re.sub(r'\s*---\s*', '', line)
            if cleaned != line:
                # --- was jammed in; put it on its own line
                new_post_header.append('---')
                if cleaned:
                    new_post_header.append(cleaned if cleaned else '')
            else:
                new_post_header.append(line)
        else:
            new_post_header.append(line)

    # Build the full new content
    new_lines = [lines[0]] + new_header_lines + new_post_header

    # Fix lines:N count
    header_end_in_new = None
    for i, line in enumerate(new_lines[1:50], 1):
        if line.strip() == '---':
            header_end_in_new = i
            break

    if header_end_in_new:
        old_count = int(re.match(r'# speclang-header lines:(\d+)', new_lines[0]).group(1))
        actual_count = header_end_in_new + 1  # +1 for the # speclang-header line itself
        if old_count != actual_count:
            new_lines[0] = f'# speclang-header lines:{actual_count}'
            changes.append(f"  Fixed lines:{old_count} -> lines:{actual_count}")

    new_content = '\n'.join(new_lines)

    # --- Add missing fields for agent_autonomous ---
    header_block = '\n'.join(new_lines[:header_end_in_new + 1]) if header_end_in_new else new_content
    if 'agent_support: agent_autonomous' in header_block or "agent_support: agent_autonomous" in header_block:
        if 'short:' not in header_block:
            # Try to find a descriptive title from the first heading
            title_match = re.search(r'^#+\s+(.+)$', new_content, re.MULTILINE)
            if title_match:
                short_desc = title_match.group(1).strip()[:80].replace('"', '').replace("'", "")
            else:
                short_desc = filepath.stem.replace('.spec', '').replace('-', ' ').replace('_', ' ')[:80]

            # Insert short before first field after project_level or version
            insert_line = None
            for i, line in enumerate(new_lines):
                if re.match(r'^(project_level|version|layer):', line.strip()):
                    insert_line = i + 1
            if insert_line is None:
                insert_line = 2  # After id line

            new_lines.insert(insert_line, f'short: "{short_desc}"')
            changes.append(f"  Added short: {short_desc}")
            header_end_in_new += 1  # shift

        if 'layer:' not in header_block:
            # Insert layer after short
            insert_line = None
            for i, line in enumerate(new_lines):
                if re.match(r'^short:', line.strip()):
                    insert_line = i + 1
            if insert_line is None:
                insert_line = 3

            new_lines.insert(insert_line, 'layer: 5')
            changes.append(f"  Added layer: 5")
            header_end_in_new += 1

        # Fix lines:N count again if we added fields
        if header_end_in_new:
            old_count = int(re.match(r'# speclang-header lines:(\d+)', new_lines[0]).group(1))
            actual_count = header_end_in_new + 1
            if old_count != actual_count:
                new_lines[0] = f'# speclang-header lines:{actual_count}'

    new_content = '\n'.join(new_lines)

    if new_content != original:
        if not DRY_RUN:
            filepath.write_text(new_content)
        return changes, True

    return changes, False


def fix_list_item(item: str) -> str:
    """Fix a single YAML list item value."""
    item = item.strip()

    # Remove leading/trailing quotes for processing
    if item.startswith('"') and item.endswith('"'):
        quoted = True
        inner = item[1:-1]
    elif item.startswith('"'):
        quoted = True
        inner = item[1:]
    else:
        quoted = False
        inner = item

    # Fix double @ref:
    inner = re.sub(r'@ref:@ref:', '@ref:', inner)

    # Fix trailing ) from markdown @ref:foo/bar)
    inner = re.sub(r'(@ref:[a-zA-Z0-9_\-/.#]+)\)', r'\1', inner)

    # Fix trailing " that's actually unmatched
    inner = inner.rstrip('"')

    # Strip trailing ---
    inner = re.sub(r'\s*---\s*$', '', inner)

    # Strip trailing short: or other key: from jammed content
    inner = re.sub(r'\s+\w[\w_]*:\s*"[^"]*"$', '', inner)
    inner = re.sub(r'\s+\w[\w_]*:\s*\S+$', '', inner)

    # Re-quote if needed
    if '@' in inner or ':' in inner or '#' in inner or ' ' in inner:
        return f'"{inner}"'
    elif quoted:
        return f'"{inner}"'
    else:
        return inner


def main():
    fixed_count = 0
    total_changes = 0
    for root, dirs, files in os.walk(SPECS_DIR):
        for fname in sorted(files):
            if fname.endswith('.md') or fname.endswith('.scl'):
                filepath = Path(root) / fname
                changes, modified = fix_header(filepath)
                if modified:
                    fixed_count += 1
                    total_changes += len(changes)
                    rel = filepath.relative_to(SPECS_DIR)
                    print(f"✓ {rel}")
                    for c in changes:
                        print(c)

    print(f"\n--- Summary ---")
    print(f"Files fixed: {fixed_count}")
    print(f"Individual changes: {total_changes}")
    if DRY_RUN:
        print("DRY RUN — no files modified.")


if __name__ == "__main__":
    main()
