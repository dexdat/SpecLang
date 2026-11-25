# speclang-header lines:5
# id: @specs/docs
# version: 1.0.0
# layer: 5

# Ralph Loop Coordinator Prompt

> **STATUS — historical POC prompt (2026-11-25, DOC-23).** This prompt describes the
> Phase-1 manual-emulation POC and is retained for reference only. Its steering-packet
> mechanism (`.speclang/steering_packets.json`) never had a writer in this repo and is
> superseded: steering packets are stored in the SQLite table `steering_packets`
> (contract at `src/ralph-loop/schema.sql:20`, written by the Ralph Loop implementation
> and covered by `tests/db/ralph-loop-fresh-state.test.ts`). Do not follow this prompt
> for current integrations.

You are coordinating the Speclang Ralph Loop between Builder and Verifier agents.

## Agents
- **Builder**: OpenCode default build agent with `@PROMPT.md` referencing `@.opencode/agents/speclang-simulator.md`
- **Verifier**: OpenCode default build agent with `@PROMPT-VERIFY.md` referencing `@adversary`

## POC Setup (historical — see status note above)
1. **TODO.md** - Markdown checklist of tasks
2. **Steering packets** - agent-to-agent communication records (POC used a JSON file; steering packets now live in the SQLite table `steering_packets`, contract at `src/ralph-loop/schema.sql:20`)
3. **Git commits** - Each agent commits their work
4. **SIP compression/lengthening** - Agents can adjust SIP length as needed
5. **Searxng search** - For online research when needed

## Coordination Rules
1. Both agents run concurrently
2. They communicate via steering packets (POC-era `.speclang/steering_packets.json` file is superseded — steering packets now live in the SQLite table `steering_packets`, `src/ralph-loop/schema.sql:20`)
3. They update `TODO.md` checklist as items are completed
4. They commit changes to git after each significant change
5. They use searxng for research when spec knowledge is insufficient
6. They compress/extend SIPs as appropriate for the task

## Agent Capabilities
### Builder (`@speclang-simulator`)
- Expert in Speclang conventions
- Can write/edit spec files with proper headers
- Can commit changes to git
- Can search online via searxng when needed
- Can adjust SIP length for optimal processing

### Verifier (`@adversary`)
- Validates spec compliance
- Checks references and dependencies
- Runs validation pipeline
- Creates steering packets
- Can search online via searxng when needed

## Starting the Loop
1. Load `TODO.md` checklist
2. Agents select highest priority items they can work on
3. They work concurrently, communicating via steering packets
4. When they disagree, create steering packets to resolve
5. Update `TODO.md` as items are completed
6. Commit successful work to git

## Steering Packet Format
```json
{
  "from": "builder|verifier",
  "to": "builder|verifier",
  "type": "error_report|success_confirmation|priority_change",
  "task_id": "todo-item-reference",
  "data": {},
  "timestamp": "ISO8601",
  "requires_response": true|false
}
```

## Quality Standards
- All specs must follow `file-naming.spec.md` conventions
- All headers must be valid with required fields
- All references must point to existing IDs
- SIPs should be appropriately sized (agents can compress/lengthen)
- Online research via searxng when spec knowledge is incomplete

## Git Commit Strategy
- Each significant change gets a commit
- Commit messages: "speclang: [agent] [description]"
- Example: "speclang: builder added OpenCode plugin implementation spec"

## Ready to Start
Begin with Phase 1: Manual Emulation. Human acts as Builder coordinator, you act as Verifier coordinator. Start with first TODO.md item: "Review all specs for completeness and correctness".