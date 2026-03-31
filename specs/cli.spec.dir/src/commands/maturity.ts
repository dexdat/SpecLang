/**
 * SPECLANG-GENERATED: Maturity command
 * Source: specs/maturity.spec.dir
 */

import { readFileSync } from 'fs';
import { parseSpecContent } from '../../../parser.spec.dir/src/header';
import { validateMaturity } from '../../../maturity.spec.dir/src/validation';
import { getLevelDefinition, getAllLevels, MATURITY_LEVELS } from '../../../maturity.spec.dir/src/levels';
import { getSpecsDir } from '../utils.js';

export interface MaturityOptions {
  spec?: string;
  level?: string;
  json?: boolean;
  verbose?: boolean;
}

/**
 * Get all spec files in the specs directory
 */
function getSpecFiles(specsDir: string): string[] {
  const { globSync } = require('glob') as typeof import('glob');
  return globSync('**/*.spec.md', { cwd: specsDir })
    .map((f: string) => `${specsDir}/${f}`);
}

/**
 * Show maturity level information
 */
export async function maturityCommand(options: MaturityOptions): Promise<void> {
  // If no spec provided, show all levels
  if (!options.spec) {
    if (options.json) {
      const levels = getAllLevels();
      console.log(JSON.stringify({
        levels: levels.map(l => {
          const def = getLevelDefinition(l);
          return {
            name: l,
            description: def?.description || '',
            criteria: def?.criteria || {},
            agentBehavior: def?.agentBehavior || {},
            requiredFields: def?.requiredFields || [],
          };
        }),
      }, null, 2));
    } else {
      console.log('\n=== Project Maturity Levels ===\n');
      
      const levels: Array<{ name: string; desc: string }> = [
        { name: 'POC', desc: 'Proof of Concept - Experimental, minimal validation' },
        { name: 'MVP', desc: 'Minimum Viable Product - Core functionality validated' },
        { name: 'Alpha', desc: 'Internal Testing - Incomplete features, internal use' },
        { name: 'Beta', desc: 'External Testing - Feature complete, stability focus' },
        { name: 'Production', desc: 'Stable Production - Production-ready, supported' },
        { name: 'Startup', desc: 'Small Team Scale - Rapid iteration, limited resources' },
        { name: 'SMB', desc: 'Small/Medium Business - Established processes, moderate scale' },
        { name: 'MSB', desc: 'Medium/Large Business - Complex integration, compliance focus' },
        { name: 'Enterprise', desc: 'Maximum Scale - Strict governance, high availability' },
      ];
      
      levels.forEach(l => {
        console.log(`  ${l.name.padEnd(12)} ${l.desc}`);
      });
      
      console.log('\nUsage: speclang maturity <spec-path>');
      console.log('Example: speclang maturity specs/auth.spec.md');
    }
    return;
  }
  
  // Validate a specific spec
  const specsDir = getSpecsDir();
  const specPath = options.spec.startsWith(specsDir) 
    ? options.spec 
    : `${specsDir}/${options.spec}`;
  
  try {
    const content = readFileSync(specPath, 'utf-8');
    const parsed = parseSpecContent(content, specPath);
    
    const result = validateMaturity(parsed as any);
    
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`\n=== Maturity Validation: ${parsed.metadata?.id || specPath} ===\n`);
      console.log(`Level: ${result.level}`);
      console.log(`Valid: ${result.valid ? '✅ Yes' : '❌ No'}`);
      
      if (result.violations.length > 0) {
        console.log('\n❌ Violations:');
        result.violations.forEach(v => {
          console.log(`  - ${v}`);
        });
      }
      
      if (result.suggestions.length > 0) {
        console.log('\n💡 Suggestions:');
        result.suggestions.forEach(s => {
          console.log(`  - ${s}`);
        });
      }
      
      if (options.verbose) {
        const levelDef = getLevelDefinition(result.level);
        console.log(`\n📋 Level Description:`);
        console.log(`  ${levelDef?.description || 'N/A'}`);
        
        console.log(`\n📋 Criteria for ${result.level}:`);
        console.log(`  Documentation: ${levelDef?.criteria?.documentation || 'N/A'}`);
        console.log(`  Testing: ${levelDef?.criteria?.testing || 'N/A'}`);
        console.log(`  Deployment: ${levelDef?.criteria?.deployment || 'N/A'}`);
        console.log(`  Stability: ${levelDef?.criteria?.stability || 'N/A'}`);
        console.log(`  Agent Behavior: ${levelDef?.agentBehavior?.mode || 'N/A'}`);
        console.log(`  Human Oversight: ${levelDef?.agentBehavior?.humanOversight || 'N/A'}`);
        console.log(`  Required Fields: ${levelDef?.requiredFields?.join(', ') || 'N/A'}`);
        console.log(`  Recommended Tests: ${levelDef?.recommendedTests?.join(', ') || 'N/A'}`);
      }
      
      if (!result.valid) {
        process.exit(1);
      }
    }
  } catch (error: any) {
    if (options.json) {
      console.log(JSON.stringify({ error: error.message }, null, 2));
    } else {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

export default maturityCommand;
