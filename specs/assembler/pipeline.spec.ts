import { ConvergenceEvent } from './daemon.spec';
import { execSync, exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { glob } from 'fast-glob';

// ---- Types ----

interface PipelineStage {
  name: string;
  run: string;
  dependsOn?: string[];
  condition?: string;
  timeout?: number;
  continueOnFailure?: boolean;
}

interface BuildYaml {
  pipeline: {
    on_converge: PipelineStage[];
    on_success?: string[];
  };
  recovery?: {
    max_attempts: number;
    on_fail?: string[];
  };
}

// ---- Build.yaml Parser ----

export async function loadBuildYaml(filePath: string = 'build.yaml'): Promise<BuildYaml | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return yaml.load(content) as BuildYaml;
  } catch {
    return null;
  }
}

// ---- Stage Executor ----

export class StageExecutor {
  private maxAttempts: number;

  constructor(maxAttempts: number = 3) {
    this.maxAttempts = maxAttempts;
  }

  async executeStages(stages: PipelineStage[]): Promise<{ passed: boolean; results: StageResult[] }> {
    const results: StageResult[] = [];

    for (const stage of stages) {
      const dependenciesMet = (stage.dependsOn || []).every((dep) => {
        const depResult = results.find((r) => r.name === dep);
        return depResult && depResult.passed;
      });

      if (!dependenciesMet && stage.dependsOn?.length) {
        results.push({ name: stage.name, passed: false, output: 'Dependencies not met', duration: 0 });
        continue;
      }

      const result = await this.executeWithRetry(stage);
      results.push(result);

      if (!result.passed && !stage.continueOnFailure) {
        break;
      }
    }

    return {
      passed: results.every((r) => r.passed || r.continueOnFailure),
      results,
    };
  }

  private async executeWithRetry(stage: PipelineStage, attempt: number = 1): Promise<StageResult> {
    const start = Date.now();
    try {
      const output = execSync(stage.run, { encoding: 'utf-8', timeout: stage.timeout || 300000 });
      return {
        name: stage.name,
        passed: true,
        output: output.slice(0, 1000),
        duration: Date.now() - start,
      };
    } catch (err: any) {
      if (attempt < this.maxAttempts) {
        // Wait briefly before retry
        await new Promise((r) => setTimeout(r, 2000));
        return this.executeWithRetry(stage, attempt + 1);
      }
      return {
        name: stage.name,
        passed: false,
        output: err.message || String(err),
        duration: Date.now() - start,
      };
    }
  }
}

interface StageResult {
  name: string;
  passed: boolean;
  output: string;
  duration: number;
  continueOnFailure?: boolean;
}

// ---- Git Hook Validator ----

export async function validateSpecHeaders(specsPath: string = '.'): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const files = await glob('**/*.spec.md', { cwd: specsPath, ignore: ['node_modules/**', '.git/**'] });
  const errors: string[] = [];

  for (const file of files) {
    const content = await fs.readFile(path.join(specsPath, file), 'utf-8');
    const match = content.match(/^---\n(.*?)\n---\n/s);
    if (!match) {
      errors.push(`${file}: No valid YAML front matter`);
      continue;
    }
    try {
      const header = yaml.load(match[1]) as Record<string, unknown>;
      if (!header.id) errors.push(`${file}: Missing required field 'id'`);
      if (!header.version) errors.push(`${file}: Missing required field 'version'`);

      // Code-pair specs need target_lang and owned-by
      if (file.endsWith('.spec.ts.md') || file.match(/\.spec\.\w+\.md/)) {
        if (!header.targetLang) errors.push(`${file}: Code-pair spec missing 'targetLang'`);
        if (!header.ownedBy) errors.push(`${file}: Code-pair spec missing 'ownedBy'`);
      }
    } catch (e) {
      errors.push(`${file}: YAML parse error: ${e}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---- Git Commit ----

export async function gitCommit(cascadeId: string, files?: string[]): Promise<boolean> {
  try {
    if (files && files.length > 0) {
      execSync(`git add ${files.join(' ')}`, { encoding: 'utf-8' });
    } else {
      execSync('git add -A', { encoding: 'utf-8' });
    }
    execSync(`git commit -m "speclang: cascade ${cascadeId}"`, { encoding: 'utf-8' });
    return true;
  } catch {
    return false;
  }
}

// ---- Pipeline Runner ----

export class PipelineRunner {
  private executor: StageExecutor;
  private buildYamlPath: string;

  constructor(buildYamlPath: string = 'build.yaml') {
    this.executor = new StageExecutor();
    this.buildYamlPath = buildYamlPath;
  }

  async onConvergence(event: ConvergenceEvent): Promise<void> {
    console.log(`[pipeline] Convergence: ${event.queueDepth} items`);

    const config = await loadBuildYaml(this.buildYamlPath);
    if (!config) {
      console.log('[pipeline] No build.yaml found, skipping');
      return;
    }

    // Phase 1: Assembler handoff
    console.log('[pipeline] Assembler phase: .spec.{lang}.md -> .spec.{lang}');
    // (Assembler integration will go here)

    // Phase 2: Execute stages
    const result = await this.executor.executeStages(config.pipeline.on_converge);
    console.log(`[pipeline] Stages ${result.passed ? 'PASSED' : 'FAILED'}`);

    for (const r of result.results) {
      console.log(`  ${r.name}: ${r.passed ? '✅' : '❌'} (${r.duration}ms)`);
    }

    if (result.passed && config.pipeline.on_success) {
      for (const cmd of config.pipeline.on_success) {
        try {
          execSync(cmd, { encoding: 'utf-8' });
        } catch (e) {
          console.error(`[pipeline] Success command failed: ${cmd}`);
        }
      }
    }
  }
}

// ---- Git Hook Installation ----

export async function installGitHook(): Promise<void> {
  const hookContent = `#!/bin/sh
# SpecLang pre-commit hook — validates spec headers
npx tsx -e "
const { validateSpecHeaders } = require('./.speclang/pipeline.spec');
validateSpecHeaders().then((r) => {
  if (!r.valid) {
    console.error('ERROR: Pre-commit hook rejected');
    r.errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }
}).catch(() => process.exit(1));
"`;

  await fs.writeFile('.git/hooks/pre-commit', hookContent, { mode: 0o755 });
  console.log('[pipeline] Git hook installed');
}
