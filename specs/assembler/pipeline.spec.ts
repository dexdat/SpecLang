// @spec: @speclang/assembler/pipeline v1.0.0
// @source: specs/assembler/pipeline.spec.ts.md:63-374
import { ConvergenceEvent, Logger } from './daemon.spec';
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
  private log: Logger;

  constructor(maxAttempts: number = 3) {
    this.maxAttempts = maxAttempts;
    this.log = new Logger('pipeline:stage');
    this.log.info('stage executor initialized', { maxAttempts });
  }

  async executeStages(stages: PipelineStage[]): Promise<{ passed: boolean; results: StageResult[] }> {
    const results: StageResult[] = [];
    this.log.info('executing stages', { stageCount: stages.length, stageNames: stages.map(s => s.name) });

    for (const stage of stages) {
      this.log.info('starting stage', { stage: stage.name });

      const dependenciesMet = (stage.dependsOn || []).every((dep) => {
        const depResult = results.find((r) => r.name === dep);
        return depResult && depResult.passed;
      });

      if (!dependenciesMet && stage.dependsOn?.length) {
        this.log.warn('stage skipped: dependencies not met', {
          stage: stage.name,
          dependsOn: stage.dependsOn,
        });
        results.push({ name: stage.name, passed: false, output: 'Dependencies not met', duration: 0 });
        continue;
      }

      const result = await this.executeWithRetry(stage);
      results.push(result);

      this.log.info('stage completed', {
        stage: stage.name,
        passed: result.passed,
        durationMs: result.duration,
        attemptLabel: result.attempt ? `attempt ${result.attempt}` : 'attempt 1',
      });

      if (!result.passed && !stage.continueOnFailure) {
        this.log.warn('pipeline aborted due to stage failure', { stage: stage.name });
        break;
      }
    }

    const allPassed = results.every((r) => r.passed || r.continueOnFailure);
    this.log.info('pipeline finished', {
      passed: allPassed,
      totalStages: stages.length,
      passedCount: results.filter(r => r.passed).length,
      failedCount: results.filter(r => !r.passed).length,
    });

    return {
      passed: allPassed,
      results,
    };
  }

  private async executeWithRetry(stage: PipelineStage, attempt: number = 1): Promise<StageResult> {
    const start = Date.now();
    this.log.debug('executing command', {
      stage: stage.name,
      command: stage.run,
      attempt,
      maxAttempts: this.maxAttempts,
    });
    try {
      const output = execSync(stage.run, { encoding: 'utf-8', timeout: stage.timeout || 300000 });
      return {
        name: stage.name,
        passed: true,
        output: output.slice(0, 1000),
        duration: Date.now() - start,
        attempt,
      };
    } catch (err: any) {
      if (attempt < this.maxAttempts) {
        this.log.warn('stage failed, retrying', {
          stage: stage.name,
          attempt,
          error: err.message?.slice(0, 200),
          nextAttempt: attempt + 1,
        });
        // Wait briefly before retry
        await new Promise((r) => setTimeout(r, 2000));
        return this.executeWithRetry(stage, attempt + 1);
      }
      this.log.error('stage failed after all retries', {
        stage: stage.name,
        attempts: attempt,
        error: err.message?.slice(0, 500),
      });
      return {
        name: stage.name,
        passed: false,
        output: err.message || String(err),
        duration: Date.now() - start,
        attempt,
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
  attempt?: number;
}

// ---- Git Hook Validator ----

export async function validateSpecHeaders(specsPath: string = '.'): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const log = new Logger('pipeline:validate');
  log.info('validating spec headers', { specsPath });
  const files = await glob('**/*.spec.md', { cwd: specsPath, ignore: ['node_modules/**', '.git/**'] });
  const errors: string[] = [];
  let validCount = 0, errorCount = 0;

  for (const file of files) {
    const content = await fs.readFile(path.join(specsPath, file), 'utf-8');
    const match = content.match(/^---\n(.*?)\n---\n/s);
    if (!match) {
      errors.push(`${file}: No valid YAML front matter`);
      log.warn('no front matter', { file });
      errorCount++;
      continue;
    }
    try {
      const header = yaml.load(match[1]) as Record<string, unknown>;
      if (!header.id) { errors.push(`${file}: Missing required field 'id'`); errorCount++; }
      if (!header.version) { errors.push(`${file}: Missing required field 'version'`); errorCount++; }

      // Code-pair specs need target_lang and owned-by
      if (file.endsWith('.spec.ts.md') || file.match(/\.spec\.\w+\.md/)) {
        if (!header.targetLang) { errors.push(`${file}: Code-pair spec missing 'targetLang'`); errorCount++; }
        if (!header.ownedBy) { errors.push(`${file}: Code-pair spec missing 'ownedBy'`); errorCount++; }
      }
      validCount++;
    } catch (e) {
      errors.push(`${file}: YAML parse error: ${e}`);
      log.error('yaml parse error', { file, error: String(e) });
      errorCount++;
    }
  }

  log.info('validation complete', { validCount, errorCount, total: files.length });
  return { valid: errors.length === 0, errors };
}

// ---- Git Commit ----

export async function gitCommit(cascadeId: string, files?: string[]): Promise<boolean> {
  const log = new Logger('pipeline:git');
  try {
    if (files && files.length > 0) {
      const fileList = files.join(' ');
      log.info('staging files', { count: files.length, files: fileList.slice(0, 200) });
      execSync(`git add ${fileList}`, { encoding: 'utf-8' });
    } else {
      log.info('staging all changes');
      execSync('git add -A', { encoding: 'utf-8' });
    }
    log.info('committing', { cascadeId });
    execSync(`git commit -m "speclang: cascade ${cascadeId}"`, { encoding: 'utf-8' });
    log.info('commit successful', { cascadeId });
    return true;
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    log.warn('git commit failed (may be no changes)', { cascadeId, error: errMsg.slice(0, 200) });
    return false;
  }
}

// ---- Pipeline Runner ----

export class PipelineRunner {
  private executor: StageExecutor;
  private buildYamlPath: string;
  private stagesRun = 0;
  private log: Logger;

  constructor(buildYamlPath: string = 'build.yaml') {
    this.executor = new StageExecutor();
    this.buildYamlPath = buildYamlPath;
    this.log = new Logger('pipeline');
    this.log.info('pipeline runner initialized', { buildYamlPath });
  }

  async onConvergence(event: ConvergenceEvent): Promise<void> {
    this.stagesRun++;
    this.log.info('convergence triggered pipeline', {
      cascadeRun: this.stagesRun,
      queueDepth: event.queueDepth,
      quietPeriodMs: event.quietPeriodMs,
      lastChange: new Date(event.lastChange).toISOString(),
    });

    const config = await loadBuildYaml(this.buildYamlPath);
    if (!config) {
      this.log.info('no build.yaml found, skipping');
      return;
    }

    // Phase 1: Assembler handoff
    this.log.info('assembler phase starting: .spec.{lang}.md -> .spec.{lang}');

    // Phase 2: Execute stages
    const result = await this.executor.executeStages(config.pipeline.on_converge);
    this.log.info('stages execution complete', {
      passed: result.passed,
      stageCount: result.results.length,
    });

    for (const r of result.results) {
      this.log.info('stage result', {
        stage: r.name,
        passed: r.passed,
        durationMs: r.duration,
        outputPreview: r.output?.slice(0, 200),
      });
    }

    if (result.passed && config.pipeline.on_success) {
      this.log.info('running success commands', { count: config.pipeline.on_success.length });
      for (const cmd of config.pipeline.on_success) {
        try {
          this.log.debug('executing success command', { command: cmd });
          execSync(cmd, { encoding: 'utf-8' });
          this.log.info('success command completed', { command: cmd });
        } catch (e) {
          this.log.error('success command failed', {
            command: cmd,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
    }
  }
}

// ---- Git Hook Installation ----

export async function installGitHook(): Promise<void> {
  const log = new Logger('pipeline:hook');
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
  log.info('git hook installed', { path: '.git/hooks/pre-commit' });
}
