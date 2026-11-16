#!/usr/bin/env python3
"""Provenance repair for DF-SPECLANG-6/7/8.

The earlier 05:02:33 fire appended three task rows to tasks.jsonl WITHOUT
their paired task_created events and without created_at. This script:
  1. stamps created_at on those three rows (only when it is null),
  2. appends one task_created event per row, ids continuing past the file max.

Every other line is preserved byte-for-byte (only the three matched rows are
re-serialized, and they were written compact anyway).
"""
import json
import sys

board = sys.argv[1]
stamp = sys.argv[2]
ids = ["DF-SPECLANG-6", "DF-SPECLANG-7", "DF-SPECLANG-8"]

tasks_path = f"{board}/tasks.jsonl"
events_path = f"{board}/events.jsonl"

with open(tasks_path, encoding="utf-8") as fh:
    lines = fh.read().split("\n")

touched = []
out = []
for line in lines:
    if not line.strip():
        out.append(line)
        continue
    try:
        row = json.loads(line)
    except Exception:
        out.append(line)
        continue
    if row.get("id") in ids and not row.get("created_at"):
        row["created_at"] = stamp
        detail = row.get("detail")
        if isinstance(detail, dict):
            meta = detail.get("metadata")
            if isinstance(meta, dict):
                meta["provenance"] = "created_at stamped during provenance repair (row write was unpaired)"
        out.append(json.dumps(row, separators=(",", ":"), ensure_ascii=False, sort_keys=True))
        touched.append(row["id"])
    else:
        out.append(line)

with open(tasks_path, "w", encoding="utf-8") as fh:
    fh.write("\n".join(out))

with open(events_path, encoding="utf-8") as fh:
    ev_lines = [l for l in fh.read().split("\n") if l.strip()]
max_id = max(json.loads(l)["id"] for l in ev_lines)

new_events = []
for offset, tid in enumerate(ids, start=1):
    new_events.append({
        "id": max_id + offset,
        "timestamp": stamp,
        "event_type": "task_created",
        "task_id": tid,
        "actor": "dogfood",
        "tick_number": None,
        "detail": json.dumps({
            "id": tid,
            "status": "pending",
            "provenance": "backfilled: row was appended without a paired task_created event (tick speclang-dogfood-2026-11-16-05-02-33); paired by the same tick's repair",
        }, separators=(",", ":")),
    })

with open(events_path, "a", encoding="utf-8") as fh:
    for ev in new_events:
        fh.write(json.dumps(ev, separators=(",", ":"), ensure_ascii=False) + "\n")

print(f"created_at_stamped={','.join(touched) or 'none'}")
print(f"event_ids={','.join(str(e['id']) for e in new_events)}")
print(f"prior_event_max={max_id}")
