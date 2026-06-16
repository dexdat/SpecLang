#!/usr/bin/env bun

/**
 * Automation script for processing SpecLang bootstrap phases.
 * This script reads prompt files and generates task commands for delegation.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface PhaseInfo {
  number: string;  // e.g., "0.21"
  file: string;    // e.g., "phase-0.21-ui-interactions.md"
  title: string;   // First line after "# "
  prerequisites: string[];
}

async function readPhaseInfo(filePath: string): Promise<PhaseInfo | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Extract title (first line after "# ")
    const titleLine = lines.find(line => line.startsWith('# '));
    if (!titleLine) return null;
    const title = titleLine.substring(2).trim();
    
    // Extract prerequisites
    const prerequisites: string[] = [];
    let inPrerequisites = false;
    for (const line of lines) {
      if (line.includes('**Prerequisites**:')) {
        inPrerequisites = true;
        continue;
      }
      if (inPrerequisites && line.trim() === '') {
        inPrerequisites = false;
      }
      if (inPrerequisites && line.includes('- Phase')) {
        // Extract phase numbers like "0.1-0.20"
        const match = line.match(/Phase\s+([\d\.\-]+)/);
        if (match) {
          prerequisites.push(match[1]);
        }
      }
    }
    
    // Extract phase number from filename
    const filename = path.basename(filePath);
    const phaseMatch = filename.match(/phase-(\d+\.\d+)-/);
    if (!phaseMatch) return null;
    
    return {
      number: phaseMatch[1],
      file: filename,
      title,
      prerequisites
    };
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

async function main() {
  const promptsDir = path.join(__dirname, 'docs/prompts');
  const files = await fs.readdir(promptsDir);
  
  // Filter for phase files
  const phaseFiles = files.filter(f => f.startsWith('phase-') && f.endsWith('.md'));
  
  // Sort by phase number
  phaseFiles.sort((a, b) => {
    const aMatch = a.match(/phase-(\d+\.\d+)-/);
    const bMatch = b.match(/phase-(\d+\.\d+)-/);
    if (!aMatch || !bMatch) return 0;
    
    const aNum = parseFloat(aMatch[1]);
    const bNum = parseFloat(bMatch[1]);
    return aNum - bNum;
  });
  
  console.log(`Found ${phaseFiles.length} phase files`);
  
  // Read all phase info
  const phases: PhaseInfo[] = [];
  for (const file of phaseFiles) {
    const phase = await readPhaseInfo(path.join(promptsDir, file));
    if (phase) {
      phases.push(phase);
    }
  }
  
  // Filter for Phase 0 only (0.1 - 0.32)
  const phase0Phases = phases.filter(p => p.number.startsWith('0.'));
  
  console.log(`\nPhase 0 phases (${phase0Phases.length}):`);
  for (const phase of phase0Phases) {
    console.log(`  ${phase.number}: ${phase.title}`);
    if (phase.prerequisites.length > 0) {
      console.log(`    Prerequisites: ${phase.prerequisites.join(', ')}`);
    }
  }
  
  // Generate task commands
  console.log('\n\n=== TASK COMMANDS ===\n');
  
  for (const phase of phase0Phases) {
    const phaseNum = phase.number;
    const phaseName = phase.file.replace('.md', '');
    const description = phase.title;
    
    console.log(`// Phase ${phaseNum}: ${description}`);
    console.log(`@task({
  description: "Delegate Phase ${phaseNum} to code-gen",
  prompt: \`You are the speclang-code-gen agent. I need you to implement Phase ${phaseNum}: ${description}.
  
## Context
We are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase ${phaseNum} of the bootstrap process.

## Prerequisites
${phase.prerequisites.map(p => `- ${p}`).join('\\n')}

## Your Task
Implement ${description.toLowerCase()}.

## Read These Specs First
1. Check the prompt file for specific spec references.

## What to Build
Check the prompt file for file structure.

## Requirements
Follow the detailed implementation in \`docs/prompts/${phase.file}\`. The file contains complete code for all required components.

## Validation
After completing, run appropriate tests.

## Output Format
After completing, output implementation summary.

## Important
- Generate working, compilable TypeScript code
- Include proper imports and exports
- Follow TypeScript best practices
- Add SPECLANG-GENERATED header comments
- Ensure all tests pass

Start by reading the spec files and the prompt file, then implement.\`,
  subagent_type: "speclang-code-gen"
})`);
    console.log('\n');
  }
}

if (import.meta.main) {
  main().catch(console.error);
}