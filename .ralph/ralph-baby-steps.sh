#!/bin/bash
#
# SpecLang Ralph Loop - Baby Steps™ Autonomous Compiler
#
# This script runs an LLM in a loop, treating it as the SpecLang compiler.
# Each iteration reads specs and generates code, building SpecLang from specs.
# Uses Baby Steps™ Methodology for reliable autonomous operation.
#
# Usage:
#   ./ralph.sh                    # Run with defaults (50 iterations)
#   ./ralph.sh 100                # Run 100 iterations
#   ./ralph.sh --tool claude 50   # Use Claude Code, 50 iterations
#   ./ralph.sh --monitor          # Enable cost and progress monitoring
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parse arguments
TOOL="claude"
MAX_ITERATIONS=50
VERBOSE=false
MONITOR=false
BABY_STEPS=true
SEARCH_ENABLED=true
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --tool)
            TOOL="$2"
            shift 2
            ;;
        --tool=*)
            TOOL="${1#*=}"
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -m|--monitor)
            MONITOR=true
            shift
            ;;
        --no-baby-steps)
            BABY_STEPS=false
            shift
            ;;
        --no-search)
            SEARCH_ENABLED=false
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            echo "SpecLang Ralph Loop - Baby Steps™ Autonomous Compiler"
            echo ""
            echo "Usage: $0 [options] [max_iterations]"
            echo ""
            echo "Options:"
            echo "  --tool <amp|claude>    AI tool to use (default: claude)"
            echo "  -v, --verbose          Show more output"
            echo "  -m, --monitor          Enable cost and progress monitoring"
            echo "  --no-baby-steps        Disable Baby Steps methodology"
            echo "  --no-search            Disable search capability"
            echo "  --dry-run              Simulate execution without calling AI"
            echo "  -h, --help             Show this help"
            echo ""
            echo "Example:"
            echo "  $0 100                  # Run 100 iterations with Claude"
            echo "  $0 --tool amp 50        # Run 50 iterations with Amp"
            echo "  $0 --monitor 200        # Run 200 iterations with monitoring"
            exit 0
            ;;
        *)
            if [[ "$1" =~ ^[0-9]+$ ]]; then
                MAX_ITERATIONS="$1"
            fi
            shift
            ;;
    esac
done

# Validate tool
if [[ "$TOOL" != "amp" && "$TOOL" != "claude" ]]; then
    echo -e "${RED}Error: Invalid tool '$TOOL'. Must be 'amp' or 'claude'.${NC}"
    exit 1
fi

# Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
RALPH_DIR="$PROJECT_ROOT/.ralph"
PRD_FILE="$RALPH_DIR/prd.json"
PROGRESS_FILE="$RALPH_DIR/progress.md"
LOG_DIR="$RALPH_DIR/logs"
BACKUP_DIR="$RALPH_DIR/backups"
STATE_DIR="$RALPH_DIR/state"
MONITOR_DIR="$RALPH_DIR/monitor"

# Create directories
mkdir -p "$LOG_DIR" "$BACKUP_DIR" "$STATE_DIR" "$MONITOR_DIR"

# Initialize progress file if missing
if [ ! -f "$PROGRESS_FILE" ]; then
    cat > "$PROGRESS_FILE" << 'EOF'
# SpecLang Bootstrap Progress - Baby Steps™ Methodology

## Meta-Circular Build Log

This file tracks the progress of building SpecLang using SpecLang.
The LLM acts as the compiler, reading specs and generating code.
Using Baby Steps™ Methodology for reliable autonomous operation.

Started: INIT_TIMESTAMP
Methodology: Baby Steps™ (6 unbreakable rules)
Search Enabled: Yes
Completion Promise: SPECLANG-BOOTSTRAP-COMPLETE

---

EOF
    sed -i '' "s/INIT_TIMESTAMP/$(date -Iseconds)/" "$PROGRESS_FILE"
    echo -e "${GREEN}Created progress file: $PROGRESS_FILE${NC}"
fi

# Function to count remaining stories
count_remaining() {
    if [ -f "$PRD_FILE" ]; then
        cat "$PRD_FILE" | jq '[.phases[].stories[] | select(.passes == false)] | length'
    else
        echo "unknown"
    fi
}

# Function to get current story
get_current_story() {
    if [ -f "$PRD_FILE" ]; then
        cat "$PRD_FILE" | jq -r '
            [.phases[].stories[] | select(.passes == false)] | 
            sort_by(.priority) | 
            .[0] | 
            "\(.id): \(.title)"
        '
    else
        echo "No PRD found"
    fi
}

# Function to get story details
get_story_details() {
    if [ -f "$PRD_FILE" ]; then
        cat "$PRD_FILE" | jq -r '
            [.phases[].stories[] | select(.passes == false)] | 
            sort_by(.priority) | 
            .[0] | 
            "Spec: \(.spec)\nOutputs: \(.outputs | join(", "))"
        '
    else
        echo "No PRD found"
    fi
}

# Function to backup PRD and progress
backup_state() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_folder="$BACKUP_DIR/$timestamp"
    mkdir -p "$backup_folder"
    [ -f "$PRD_FILE" ] && cp "$PRD_FILE" "$backup_folder/"
    [ -f "$PROGRESS_FILE" ] && cp "$PROGRESS_FILE" "$backup_folder/"
    echo "$backup_folder"
}

# Function to log iteration
log_iteration() {
    local iteration=$1
    local log_file="$LOG_DIR/iteration_${iteration}.log"
    echo "$(date -Iseconds) - Iteration $iteration started" >> "$log_file"
    echo "$log_file"
}

# Function to monitor cost and progress
monitor_iteration() {
    local iteration=$1
    local story=$2
    local monitor_file="$MONITOR_DIR/iteration_${iteration}.json"
    
    cat > "$monitor_file" << EOF
{
  "iteration": $iteration,
  "timestamp": "$(date -Iseconds)",
  "story": "$story",
  "remaining_stories": $(count_remaining),
  "baby_steps_enabled": $BABY_STEPS,
  "search_enabled": $SEARCH_ENABLED
}
EOF
    
    if [ "$VERBOSE" = true ]; then
        echo -e "${CYAN}Monitoring: Iteration $iteration - $story${NC}"
    fi
}

# Function to check for stuck condition
check_stuck() {
    local iteration=$1
    local current_story=$2
    
    # Check if we've been on the same story for too many iterations
    local stuck_file="$STATE_DIR/stuck_check.json"
    
    if [ ! -f "$stuck_file" ]; then
        echo "{\"last_story\": \"$current_story\", \"iterations_on_story\": 1}" > "$stuck_file"
        return 0
    fi
    
    local last_story=$(cat "$stuck_file" | jq -r '.last_story')
    local iterations_on_story=$(cat "$stuck_file" | jq -r '.iterations_on_story')
    
    if [ "$last_story" = "$current_story" ]; then
        iterations_on_story=$((iterations_on_story + 1))
    else
        iterations_on_story=1
    fi
    
    echo "{\"last_story\": \"$current_story\", \"iterations_on_story\": $iterations_on_story}" > "$stuck_file"
    
    # If stuck on same story for 5+ iterations, warn
    if [ $iterations_on_story -ge 5 ]; then
        echo -e "${YELLOW}⚠️  Stuck detection: On story '$current_story' for $iterations_on_story iterations${NC}"
        
        if [ $iterations_on_story -ge 10 ]; then
            echo -e "${RED}❌ Stuck for too long ($iterations_on_story iterations). Consider breaking story into smaller Baby Steps.${NC}"
            return 1
        fi
    fi
    
    return 0
}

# Check for PRD
if [ ! -f "$PRD_FILE" ]; then
    echo -e "${RED}Error: PRD file not found at $PRD_FILE${NC}"
    echo "Create it with the spec-to-prd tool or manually."
    exit 1
fi

# Show banner
echo ""
echo -e "${PURPLE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║${NC}                                                                      ${PURPLE}║${NC}"
echo -e "${PURPLE}║${NC}   ${CYAN}SpecLang Ralph Loop${NC} - ${YELLOW}Baby Steps™ Autonomous Compiler${NC}           ${PURPLE}║${NC}"
echo -e "${PURPLE}║${NC}                                                                      ${PURPLE}║${NC}"
echo -e "${PURPLE}║${NC}   Using: ${GREEN}$TOOL${NC}                                                       ${PURPLE}║${NC}"
echo -e "${PURPLE}║${NC}   Max Iterations: ${GREEN}$MAX_ITERATIONS${NC}                                              ${PURPLE}║${NC}"
echo -e "${PURPLE}║${NC}   Remaining Stories: ${YELLOW}$(count_remaining)${NC}                                             ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${NC}   Baby Steps™: ${GREEN}$BABY_STEPS${NC}                                                    ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${NC}   Search Enabled: ${GREEN}$SEARCH_ENABLED${NC}                                              ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${NC}   Monitoring: ${GREEN}$MONITOR${NC}                                                        ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${NC}   Dry Run: ${GREEN}$DRY_RUN${NC}                                                          ${PURPLE}║${NC}"
echo -e "${PURPLE}║${NC}                                                                      ${PURPLE}║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Main loop
for i in $(seq 1 $MAX_ITERATIONS); do
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Iteration ${CYAN}$i${NC} of ${CYAN}$MAX_ITERATIONS${NC} ${YELLOW}($TOOL)${NC} - Baby Steps™ ${GREEN}$(date +%H:%M:%S)${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════${NC}"
    
    # Show current story
    CURRENT_STORY=$(get_current_story)
    echo -e "${GREEN}Current Story: ${CYAN}$CURRENT_STORY${NC}"
    
    # Get story details
    STORY_DETAILS=$(get_story_details)
    if [ "$VERBOSE" = true ]; then
        echo -e "${CYAN}Story Details:${NC}"
        echo "$STORY_DETAILS" | while IFS= read -r line; do
            echo -e "  ${YELLOW}$line${NC}"
        done
    fi
    
    echo ""
    
    # Check for stuck condition
    if ! check_stuck "$i" "$CURRENT_STORY"; then
        echo -e "${RED}Stuck condition detected. Consider manual intervention.${NC}"
        echo -e "${YELLOW}You may want to break the story into smaller Baby Steps.${NC}"
        echo ""
    fi
    
    # Backup state before iteration
    BACKUP_PATH=$(backup_state)
    [ "$VERBOSE" = true ] && echo -e "${YELLOW}Backup: $BACKUP_PATH${NC}"
    
    # Log file for this iteration
    LOG_FILE=$(log_iteration $i)
    
    # Monitor if enabled
    if [ "$MONITOR" = true ]; then
        monitor_iteration "$i" "$CURRENT_STORY"
    fi
    
    # Run the AI tool with the appropriate prompt
    echo -e "${CYAN}Starting AI agent with Baby Steps™ Methodology...${NC}"
    echo ""
    
    # Select prompt based on Baby Steps setting
    if [ "$BABY_STEPS" = true ]; then
        PROMPT_FILE="$RALPH_DIR/prompt-baby-steps.md"
    else
        PROMPT_FILE="$RALPH_DIR/prompt.md"
    fi
    
    if [ ! -f "$PROMPT_FILE" ]; then
        echo -e "${RED}Error: Prompt file not found: $PROMPT_FILE${NC}"
        exit 1
    fi
    
    if [ "$DRY_RUN" = true ]; then
        # Dry run mode - simulate AI output
        echo -e "${YELLOW}[DRY RUN] Skipping AI call, simulating output${NC}"
        OUTPUT="[DRY RUN] Simulated AI output for iteration $i
Current story: $CURRENT_STORY
Baby Steps methodology: $BABY_STEPS
Search enabled: $SEARCH_ENABLED
        
This is a dry run. In real execution, the AI would process the prompt and generate code.
        
Simulated output does not contain completion signal."
    else
        # VALIDATION GATE: Check if validation is needed
        if [ -f "$PROJECT_ROOT/.speclang/needs_validation" ]; then
            echo -e "${CYAN}Running validation gate...${NC}"
            
            # Run TypeScript build
            cd "$PROJECT_ROOT"
            if npm run build 2>&1 | tee -a "$LOG_FILE"; then
                echo -e "${GREEN}✓ TypeScript compilation passed${NC}"
            else
                echo -e "${RED}✗ TypeScript compilation FAILED${NC}"
                echo -e "${RED}Please fix errors before continuing${NC}"
                exit 1
            fi
            
            # Run tests
            if npm test 2>&1 | tee -a "$LOG_FILE"; then
                echo -e "${GREEN}✓ Tests passed${NC}"
            else
                echo -e "${RED}✗ Tests FAILED${NC}"
                echo -e "${RED}Please fix errors before continuing${NC}"
                exit 1
            fi
            
            # Check commit format
            if git log -1 --format='%s' | grep -q "speclang: baby-step:"; then
                echo -e "${GREEN}✓ Commit format correct${NC}"
            else
                echo -e "${YELLOW}⚠ Last commit does not follow Baby Steps format${NC}"
            fi
            
            # Clear validation flag
            rm -f "$PROJECT_ROOT/.speclang/needs_validation"
        fi
        
        # Execute AI tool
        OUTPUT=""  # Will be set below
    fi
    
    # Now run the AI (if not dry-run and not just validated)
    if [ "$DRY_RUN" = true ]; then
        : # Already handled above
    elif [[ "$TOOL" == "amp" ]]; then
        # Amp CLI
        OUTPUT=$(cat "$PROMPT_FILE" | amp --dangerously-allow-all 2>&1 | tee /dev/stderr) || true
    else
        # Claude Code
        cd "$PROJECT_ROOT"
        OUTPUT=$(claude --dangerously-skip-permissions --print < "$PROMPT_FILE" 2>&1 | tee /dev/stderr) || true
    fi
    
    # Save output to log
    echo "$OUTPUT" >> "$LOG_FILE"
    
    # Check for completion signal
    if echo "$OUTPUT" | grep -q "SPECLANG-BOOTSTRAP-COMPLETE"; then
        echo ""
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  🎉 SPECLANG BOOTSTRAP COMPLETE! 🎉${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo -e "Completed at iteration ${CYAN}$i${NC} of ${CYAN}$MAX_ITERATIONS${NC}"
        echo -e "Total time: $(date -Iseconds)"
        echo ""
        echo -e "Progress log: ${YELLOW}$PROGRESS_FILE${NC}"
        echo -e "Final PRD: ${YELLOW}$PRD_FILE${NC}"
        echo -e "All logs: ${YELLOW}$LOG_DIR/${NC}"
        echo ""
        
        # Show summary
        REMAINING=$(count_remaining)
        echo -e "Remaining stories: ${GREEN}$REMAINING${NC}"
        
        # Create completion marker
        echo "SPECLANG-BOOTSTRAP-COMPLETE at iteration $i" > "$STATE_DIR/completion.json"
        
        exit 0
    fi
    
    # Show iteration summary
    REMAINING=$(count_remaining)
    echo ""
    echo -e "${YELLOW}───────────────────────────────────────────────────────────────────────${NC}"
    echo -e "Iteration ${CYAN}$i${NC} complete."
    echo -e "Remaining stories: ${YELLOW}$REMAINING${NC}"
    echo -e "Log: ${YELLOW}$LOG_FILE${NC}"
    echo -e "${YELLOW}───────────────────────────────────────────────────────────────────────${NC}"
    
    # Sleep between iterations (prevents rate limiting)
    sleep 3
done

# Reached max iterations
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  Reached max iterations ($MAX_ITERATIONS)${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Remaining stories: ${RED}$(count_remaining)${NC}"
echo -e "Current story: ${CYAN}$(get_current_story)${NC}"
echo ""
echo -e "Run again with more iterations:"
echo -e "  ${GREEN}$0 $((MAX_ITERATIONS + 50))${NC}"
echo ""
echo -e "Or check progress:"
echo -e "  ${YELLOW}cat $PROGRESS_FILE${NC}"
echo -e "  ${YELLOW}ls -la $LOG_DIR/ | tail -10${NC}"
echo ""

exit 1