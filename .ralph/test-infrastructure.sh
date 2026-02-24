#!/bin/bash
#
# Test Ralph Loop infrastructure without running AI
# Validates that all components are ready for autonomous operation

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Testing Ralph Loop Infrastructure${NC}"
echo "========================================"
echo ""

# Test 1: Check PRD file exists and is valid JSON
echo -e "${YELLOW}Test 1: PRD file${NC}"
if [ -f ".ralph/prd.json" ]; then
    echo -e "  ${GREEN}✓ PRD file exists${NC}"
    
    if jq . ".ralph/prd.json" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓ PRD is valid JSON${NC}"
        
        # Count remaining stories
        REMAINING=$(jq '[.phases[].stories[] | select(.passes == false)] | length' ".ralph/prd.json")
        echo -e "  ${GREEN}✓ Remaining stories: $REMAINING${NC}"
        
        # Get current story
        CURRENT_STORY=$(jq -r '[.phases[].stories[] | select(.passes == false)] | .[0] | "\(.id): \(.title)"' ".ralph/prd.json")
        if [ "$CURRENT_STORY" != "null: null" ] && [ "$CURRENT_STORY" != "null" ]; then
            echo -e "  ${GREEN}✓ Current story: $CURRENT_STORY${NC}"
        else
            echo -e "  ${RED}✗ No current story found (all stories may be complete)${NC}"
        fi
    else
        echo -e "  ${RED}✗ PRD is not valid JSON${NC}"
        exit 1
    fi
else
    echo -e "  ${RED}✗ PRD file not found${NC}"
    exit 1
fi

echo ""

# Test 2: Check prompt files
echo -e "${YELLOW}Test 2: Prompt files${NC}"
if [ -f ".ralph/prompt-baby-steps.md" ]; then
    echo -e "  ${GREEN}✓ Baby Steps prompt file exists${NC}"
    PROMPT_LINES=$(wc -l < ".ralph/prompt-baby-steps.md")
    echo -e "  ${GREEN}✓ Prompt lines: $PROMPT_LINES${NC}"
    
    # Check for search integration mention
    if grep -q "SEARCH CAPABILITY" ".ralph/prompt-baby-steps.md"; then
        echo -e "  ${GREEN}✓ Search integration mentioned in prompt${NC}"
    else
        echo -e "  ${YELLOW}⚠ Search integration not found in prompt${NC}"
    fi
    
    # Check for Baby Steps methodology
    if grep -q "Baby Steps™" ".ralph/prompt-baby-steps.md"; then
        echo -e "  ${GREEN}✓ Baby Steps methodology included${NC}"
    else
        echo -e "  ${RED}✗ Baby Steps methodology missing${NC}"
    fi
else
    echo -e "  ${RED}✗ Baby Steps prompt file not found${NC}"
    exit 1
fi

echo ""

# Test 3: Check Ralph Loop script
echo -e "${YELLOW}Test 3: Ralph Loop script${NC}"
if [ -f ".ralph/ralph-baby-steps.sh" ]; then
    echo -e "  ${GREEN}✓ Ralph Loop script exists${NC}"
    
    # Check if executable
    if [ -x ".ralph/ralph-baby-steps.sh" ]; then
        echo -e "  ${GREEN}✓ Script is executable${NC}"
    else
        echo -e "  ${YELLOW}⚠ Script is not executable, fixing...${NC}"
        chmod +x ".ralph/ralph-baby-steps.sh"
    fi
    
    # Check for key functions
    for FUNCTION in "count_remaining" "get_current_story" "backup_state" "check_stuck"; do
        if grep -q "function $FUNCTION" ".ralph/ralph-baby-steps.sh"; then
            echo -e "  ${GREEN}✓ Function $FUNCTION exists${NC}"
        else
            echo -e "  ${YELLOW}⚠ Function $FUNCTION not found${NC}"
        fi
    done
    
    # Check for monitoring
    if grep -q "monitor_iteration" ".ralph/ralph-baby-steps.sh"; then
        echo -e "  ${GREEN}✓ Monitoring function exists${NC}"
    else
        echo -e "  ${YELLOW}⚠ Monitoring function missing${NC}"
    fi
else
    echo -e "  ${RED}✗ Ralph Loop script not found${NC}"
    exit 1
fi

echo ""

# Test 4: Check directories
echo -e "${YELLOW}Test 4: Required directories${NC}"
for DIR in "logs" "backups" "state" "monitor"; do
    if [ -d ".ralph/$DIR" ]; then
        echo -e "  ${GREEN}✓ Directory .ralph/$DIR exists${NC}"
    else
        echo -e "  ${YELLOW}⚠ Directory .ralph/$DIR missing, creating...${NC}"
        mkdir -p ".ralph/$DIR"
    fi
done

echo ""

# Test 5: Check progress file
echo -e "${YELLOW}Test 5: Progress tracking${NC}"
if [ -f ".ralph/progress.md" ]; then
    echo -e "  ${GREEN}✓ Progress file exists${NC}"
    PROGRESS_LINES=$(wc -l < ".ralph/progress.md")
    echo -e "  ${GREEN}✓ Progress lines: $PROGRESS_LINES${NC}"
else
    echo -e "  ${YELLOW}⚠ Progress file missing, creating...${NC}"
    cat > ".ralph/progress.md" << 'EOF'
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
    sed -i '' "s/INIT_TIMESTAMP/$(date -Iseconds)/" ".ralph/progress.md"
    echo -e "  ${GREEN}✓ Created progress file${NC}"
fi

echo ""

# Test 6: Check for jq dependency
echo -e "${YELLOW}Test 6: Dependencies${NC}"
if command -v jq >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓ jq is installed${NC}"
else
    echo -e "  ${RED}✗ jq is not installed${NC}"
    echo -e "  ${YELLOW}Install with: brew install jq (macOS) or apt-get install jq (Linux)${NC}"
    exit 1
fi

if command -v tee >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓ tee is installed${NC}"
else
    echo -e "  ${RED}✗ tee is not installed${NC}"
    exit 1
fi

echo ""

# Summary
echo -e "${BLUE}Infrastructure Test Summary${NC}"
echo "=============================="
echo -e "${GREEN}All critical infrastructure checks passed.${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Run a dry test: ${YELLOW}./.ralph/ralph-baby-steps.sh --tool amp 1${NC}"
echo -e "  2. Check monitoring: ${YELLOW}ls -la .ralph/monitor/${NC}"
echo -e "  3. Review progress: ${YELLOW}cat .ralph/progress.md${NC}"
echo ""
echo -e "For autonomous operation:"
echo -e "  - Set up AI tool (Claude Code or Amp)"
echo -e "  - Configure search integration"
echo -e "  - Start with small iteration limit (e.g., 10)"
echo ""

exit 0