# SpecLang Ralph Loop - Operational Guide for Autonomous Runs

## Overview

The Ralph Loop enables autonomous multi-day compilation of SpecLang from its own specs using Baby Steps™ Methodology. This guide covers operational best practices for reliable long-term execution.

## Before Starting a Long Run

### 1. Infrastructure Validation
```bash
# Run the validation script
./.ralph/test-infrastructure.sh

# Check for critical dependencies
which jq      # Required for JSON parsing
which claude  # Or amp, depending on your AI tool
```

### 2. Git State
- Ensure you're on the correct branch (`speclang-bootstrap`)
- Commit any outstanding changes
- The loop will make frequent commits, but starting from a clean state is best

### 3. Cost Awareness
- Claude Code: ~$0.10 per 1K tokens (estimate)
- Amp: Pricing varies
- **Estimate**: Each iteration uses ~5-10K tokens (prompt + response)
- **Recommendation**: Start with 10-20 iterations to gauge cost

## Running the Loop

### Short Test Run (Recommended First)
```bash
./.ralph/ralph-baby-steps.sh --dry-run 2          # Test without AI
./.ralph/ralph-baby-steps.sh --tool claude 5     # Small real run
./.ralph/ralph-baby-steps.sh --monitor 10        # With monitoring
```

### Multi-Day Run Configuration
```bash
# Run in background with logging
nohup ./.ralph/ralph-baby-steps.sh --tool claude --monitor 100 > ralph.log 2>&1 &

# Or use tmux/screen for session management
tmux new-session -d -s speclang './.ralph/ralph-baby-steps.sh --tool claude --monitor 200'
```

### Iteration Limits
- **Start small**: 10-20 iterations
- **Medium**: 50-100 iterations  
- **Long run**: 200-500 iterations (monitor cost)
- The loop will stop when `SPECLANG-BOOTSTRAP-COMPLETE` is detected

## Monitoring and Recovery

### Active Monitoring
```bash
# Check progress
tail -f .ralph/progress.md

# Check monitoring data
ls -la .ralph/monitor/
cat .ralph/monitor/iteration_*.json | jq .

# Check logs
tail -f .ralph/logs/iteration_*.log
```

### Stuck Detection
The loop automatically detects if stuck on the same story for 5+ iterations:
- **Warning** at 5 iterations
- **Error** at 10 iterations (suggests manual intervention)

If stuck:
1. Check the story spec for complexity
2. Consider breaking it into smaller Baby Steps manually
3. Update PRD if needed
4. Restart the loop

### Recovery from Interruption
If the loop stops (crash, power outage, etc.):
1. **Check git status**: `git log --oneline -10`
2. **Check PRD**: `cat .ralph/prd.json | jq '[.phases[].stories[] | select(.passes == false)] | length'`
3. **Restart**: Run the loop again - it will continue from the current story

**Note**: If interrupted mid-story, some work may be duplicated. Git commits preserve completed Baby Steps.

## Cost Management

### Estimating Cost
- **Claude Code**: ~$0.10 per 1K tokens
- **Average iteration**: 5K tokens (prompt: 3K, response: 2K)
- **Cost per iteration**: ~$0.50
- **100 iterations**: ~$50
- **500 iterations**: ~$250

### Cost-Saving Tips
1. **Use Baby Steps**: Smaller, focused changes reduce token usage
2. **Limit search usage**: Only search when absolutely necessary
3. **Monitor regularly**: Stop if cost exceeds budget
4. **Consider Amp**: May be more cost-effective for some tasks

## Search Integration

### When Search is Available
- The prompt includes search guidelines
- Use for unfamiliar concepts, implementation details, best practices
- Cite sources in documentation

### When Search is Not Available
- Use internal knowledge
- Make reasonable assumptions
- Document assumptions clearly
- Add `@todo` comments for verification later

## Backup and Rollback

### Automatic Backups
- Each iteration creates a backup in `.ralph/backups/`
- Includes PRD and progress file
- Timestamp format: `YYYYMMDD_HHMMSS`

### Manual Rollback
```bash
# Find backup
ls -la .ralph/backups/

# Restore PRD
cp .ralph/backups/20250223_050123/prd.json .ralph/

# Restore progress
cp .ralph/backups/20250223_050123/progress.md .ralph/

# Git rollback if needed
git reset --hard <commit-hash>
```

## Completion Detection

The loop stops when:
1. All stories have `passes: true` in PRD
2. AI outputs `SPECLANG-BOOTSTRAP-COMPLETE`
3. Max iterations reached

### Manual Completion Check
```bash
# Check remaining stories
cat .ralph/prd.json | jq '[.phases[].stories[] | select(.passes == false)] | length'

# If 0, system is complete
echo "SPECLANG-BOOTSTRAP-COMPLETE"
```

## Troubleshooting

### Common Issues

1. **AI tool not found**: Install Claude Code or Amp
2. **jq not found**: `brew install jq` (macOS) or `apt-get install jq` (Linux)
3. **Permission errors**: `chmod +x .ralph/ralph-baby-steps.sh`
4. **JSON parsing errors**: Check PRD file syntax
5. **Stuck loop**: Manual intervention required

### Getting Help
- Check logs in `.ralph/logs/`
- Review monitoring data in `.ralph/monitor/`
- Examine git history: `git log --oneline -20`

## Best Practices Summary

1. **Start small**: 10-20 iterations first
2. **Use monitoring**: `--monitor` flag
3. **Baby Steps**: Let the methodology guide the AI
4. **Regular checks**: Monitor progress every few hours
5. **Cost awareness**: Estimate and track expenses
6. **Git hygiene**: The loop commits frequently, but review changes
7. **Recovery ready**: Know how to restore from backups

## Next Steps After Completion

When `SPECLANG-BOOTSTRAP-COMPLETE` is reached:
1. Verify all tests pass: `npm test`
2. Build the system: `npm run build`
3. Test the CLI: `./bin/speclang --help`
4. Create release package
5. Document the bootstrap process

---

*Last updated: $(date -Iseconds)*
*Baby Steps™ Methodology: The process is the product*