#!/bin/bash
#
# SpecLang Ralph Loop - Meta-Circular Spec Compiler
#
# This script runs an LLM in a loop, treating it as the SpecLang compiler.
# Each iteration reads specs and generates code, building SpecLang from specs.
#
# Usage:
#   ./ralph.sh                    # Run with defaults (10 iterations)
#   ./ralph.sh 50                 # Run 50 iterations
#   ./ralph.sh --tool claude 20   # Use Claude Code, 20 iterations
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
MAX_ITERATIONS=10
VERBOSE=false

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
        -h|--help)
            echo "SpecLang Ralph Loop - Meta-Circular Spec Compiler"
            echo ""
            echo "Usage: $0 [options] [max_iterations]"
            echo ""
            echo "Options:"
            echo "  --tool <amp|claude>  AI tool to use (default: claude)"
            echo "  -v, --verbose        Show more output"
            echo "  -h, --help           Show this help"
            echo ""
            echo "Example:"
            echo "  $0 50                 # Run 50 iterations with Claude"
            echo "  $0 --tool amp 20      # Run 20 iterations with Amp"
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

# Create directories
mkdir -p "$LOG_DIR" "$BACKUP_DIR"

# Initialize progress file if missing
if [ ! -f "$PROGRESS_FILE" ]; then
    cat > "$PROGRESS_FILE" << 'EOF'
# SpecLang Bootstrap Progress

## Meta-Circular Build Log

This file tracks the progress of building SpecLang using SpecLang.
The LLM acts as the compiler, reading specs and generating code.

Started: INIT_TIMESTAMP

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

# Check for PRD
if [ ! -f "$PRD_FILE" ]; then
    echo -e "${RED}Error: PRD file not found at $PRD_FILE${NC}"
    echo "Create it with the spec-to-prd tool or manually."
    exit 1
fi

# Show banner
echo ""
echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║${NC}                                                              ${PURPLE}║${NC}"
echo -e "${PURPLE}║${NC}   ${CYAN}SpecLang Ralph Loop${NC} - ${YELLOW}Meta-Circular Spec Compiler${NC}      ${PURPLE}║${NC}"
echo -e "${PURPLE}║${NC}                                                              ${PURPLE}║${NC}"
echo -e "${PURPLE}║${NC}   Using: ${GREEN}$TOOL${NC}                                               ${PURPLE}║${NC}"
echo -e "${PURPLE}║${NC}   Max Iterations: ${GREEN}$MAX_ITERATIONS${NC}                                      ${PURPLE}║${NC}"
echo -e "${PURPLE}║${NC}   Remaining Stories: ${YELLOW}$(count_remaining)${NC}                                   ${PURPLE}║${NC}"
echo -e "${PURPLE}║${NC}                                                              ${PURPLE}║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Main loop
for i in $(seq 1 $MAX_ITERATIONS); do
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Iteration ${CYAN}$i${NC} of ${CYAN}$MAX_ITERATIONS${NC} ${YELLOW}($TOOL)${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    
    # Show current story
    CURRENT_STORY=$(get_current_story)
    echo -e "${GREEN}Current Story: ${CYAN}$CURRENT_STORY${NC}"
    echo ""
    
    # Backup state before iteration
    BACKUP_PATH=$(backup_state)
    [ "$VERBOSE" = true ] && echo -e "${YELLOW}Backup: $BACKUP_PATH${NC}"
    
    # Log file for this iteration
    LOG_FILE=$(log_iteration $i)
    
    # Run the AI tool with the ralph prompt
    echo -e "${CYAN}Starting AI agent...${NC}"
    echo ""
    
    if [[ "$TOOL" == "amp" ]]; then
        # Amp CLI
        OUTPUT=$(cat "$RALPH_DIR/prompt.md" | amp --dangerously-allow-all 2>&1 | tee /dev/stderr) || true
    else
        # Claude Code
        cd "$PROJECT_ROOT"
        OUTPUT=$(claude --dangerously-skip-permissions --print < "$RALPH_DIR/prompt.md" 2>&1 | tee /dev/stderr) || true
    fi
    
    # Save output to log
    echo "$OUTPUT" >> "$LOG_FILE"
    
    # Check for completion signal
    if echo "$OUTPUT" | grep -q "SPECLANG-BOOTSTRAP-COMPLETE"; then
        echo ""
        echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  🎉 SPECLANG BOOTSTRAP COMPLETE! 🎉${NC}"
        echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo -e "Completed at iteration ${CYAN}$i${NC} of ${CYAN}$MAX_ITERATIONS${NC}"
        echo ""
        echo -e "Progress log: ${YELLOW}$PROGRESS_FILE${NC}"
        echo -e "Final PRD: ${YELLOW}$PRD_FILE${NC}"
        echo ""
        
        # Show summary
        REMAINING=$(count_remaining)
        echo -e "Remaining stories: ${GREEN}$REMAINING${NC}"
        
        exit 0
    fi
    
    # Show iteration summary
    REMAINING=$(count_remaining)
    echo ""
    echo -e "${YELLOW}─────────────────────────────────────────────────────────────${NC}"
    echo -e "Iteration ${CYAN}$i${NC} complete."
    echo -e "Remaining stories: ${YELLOW}$REMAINING${NC}"
    echo -e "Log: ${YELLOW}$LOG_FILE${NC}"
    echo -e "${YELLOW}─────────────────────────────────────────────────────────────${NC}"
    
    # Check if we're stuck (same story for too long)
    # TODO: Add stuck detection
    
    sleep 2
done

# Reached max iterations
echo ""
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  Reached max iterations ($MAX_ITERATIONS)${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Remaining stories: ${RED}$(count_remaining)${NC}"
echo -e "Current story: ${CYAN}$(get_current_story)${NC}"
echo ""
echo -e "Run again with more iterations:"
echo -e "  ${GREEN}$0 $((MAX_ITERATIONS + 10))${NC}"
echo ""
echo -e "Or check progress:"
echo -e "  ${YELLOW}cat $PROGRESS_FILE${NC}"
echo ""

exit 1
