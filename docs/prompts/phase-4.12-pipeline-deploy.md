# Bootstrap Phase 4.12: Pipeline Deploy Stages

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 4.12 of the bootstrap process.

**Prerequisites**: 
- Phase 4.1-4.11 (Pipeline system) complete
- Build and test stages implemented

## Your Task
Implement the deploy stage system for the pipeline. Deploy stages publish packages, deploy to environments, and manage releases.

## Read These Specs First
1. `specs/pipeline.spec.md` - Pipeline overview
2. `specs/stages.spec.md` - Stage definitions
3. `specs/deployment.spec.md` - Deployment specifications

## What to Build

### Files to Create
```
src/pipeline/stages/
├── deploy/
│   ├── index.ts           # Deploy stage exports
│   ├── types.ts           # Deploy stage types
│   ├── publisher.ts       # Package publishing
│   ├── environments.ts    # Environment deployment
│   ├── registry.ts        # Registry management
│   ├── rollback.ts        # Rollback handling
│   └── strategies.ts      # Deploy strategies

tests/pipeline/
└── deploy.test.ts
```

### Requirements

#### 1. Deploy Stage Types

```typescript
// src/pipeline/stages/deploy/types.ts

export interface DeployStageConfig {
  name: string;
  type: DeployType;
  target: string;
  options?: DeployOptions;
  artifacts?: string[];
  depends_on?: string[];
  rollback?: RollbackConfig;
}

export type DeployType = 
  | 'npm'
  | 'docker'
  | 'cloud'
  | 'static'
  | 'serverless'
  | 'kubernetes';

export interface DeployOptions {
  registry?: string;
  tag?: string;
  access?: 'public' | 'private';
  dryRun?: boolean;
  force?: boolean;
  timeout?: number;
  environment?: Record<string, string>;
  secrets?: string[];
}

export interface RollbackConfig {
  enabled: boolean;
  onFailure?: 'auto' | 'manual';
  maxAttempts?: number;
  keepVersions?: number;
}

export interface DeployResult {
  stage: string;
  status: 'success' | 'failed' | 'skipped';
  deployedTo?: string;
  deployedAt?: Date;
  version?: string;
  url?: string;
  artifacts?: DeployedArtifact[];
  duration: number;
  error?: string;
}

export interface DeployedArtifact {
  name: string;
  version: string;
  url: string;
  platform?: string;
  arch?: string;
}

export interface Environment {
  name: string;
  type: 'development' | 'staging' | 'production';
  region?: string;
  url: string;
  variables: Record<string, string>;
  secrets: string[];
}
```

#### 2. Package Publisher

```typescript
// src/pipeline/stages/deploy/publisher.ts

import { DeployStageConfig, DeployResult, DeployedArtifact } from './types';
import { exec } from '../../utils/exec';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export class PackagePublisher {
  async execute(config: DeployStageConfig): Promise<DeployResult> {
    const start = Date.now();
    
    if (config.options?.dryRun) {
      return this.dryRun(config, start);
    }
    
    const artifacts = config.artifacts || ['dist'];
    
    switch (config.type) {
      case 'npm':
        return this.publishNpm(config, artifacts, start);
      case 'docker':
        return this.publishDocker(config, artifacts, start);
      default:
        return this.publishStatic(config, artifacts, start);
    }
  }
  
  private async dryRun(config: DeployStageConfig, start: number): Promise<DeployResult> {
    return {
      stage: config.name,
      status: 'success',
      deployedTo: config.target,
      duration: Date.now() - start,
    };
  }
  
  private async publishNpm(
    config: DeployStageConfig, 
    artifacts: string[],
    start: number
  ): Promise<DeployResult> {
    const pkgPath = join(process.cwd(), 'package.json');
    
    if (!existsSync(pkgPath)) {
      return {
        stage: config.name,
        status: 'failed',
        duration: Date.now() - start,
        error: 'package.json not found',
      };
    }
    
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const version = pkg.version;
    const tag = config.options?.tag || 'latest';
    const registry = config.options?.registry || 'https://registry.npmjs.org';
    
    try {
      await this.loginNpm(registry);
      await this.publishPackage(artifacts[0], registry, tag);
      
      const artifactUrl = `${registry}/${pkg.name}`;
      
      return {
        stage: config.name,
        status: 'success',
        deployedTo: config.target,
        deployedAt: new Date(),
        version,
        url: artifactUrl,
        artifacts: [{
          name: pkg.name,
          version,
          url: artifactUrl,
        }],
        duration: Date.now() - start,
      };
    } catch (error) {
      return {
        stage: config.name,
        status: 'failed',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  private async loginNpm(registry: string): Promise<void> {
    const token = process.env.NPM_TOKEN;
    if (!token) {
      throw new Error('NPM_TOKEN not set');
    }
    
    const rcPath = join(process.cwd(), '.npmrc');
    await exec(`echo "//${registry}:_authToken=${token}" >> ${rcPath}`);
  }
  
  private async publishPackage(path: string, registry: string, tag: string): Promise<void> {
    await exec(`npm publish ${path} --registry ${registry} --tag ${tag}`);
  }
  
  private async publishDocker(
    config: DeployStageConfig,
    artifacts: string[],
    start: number
  ): Promise<DeployResult> {
    const image = config.target;
    const tag = config.options?.tag || 'latest';
    
    try {
      await exec(`docker build -t ${image}:${tag} ${artifacts[0]}`);
      
      if (!config.options?.dryRun) {
        await exec(`docker push ${image}:${tag}`);
      }
      
      return {
        stage: config.name,
        status: 'success',
        deployedTo: config.target,
        deployedAt: new Date(),
        version: tag,
        url: `docker://${image}:${tag}`,
        artifacts: [{
          name: image,
          version: tag,
          url: `docker://${image}:${tag}`,
        }],
        duration: Date.now() - start,
      };
    } catch (error) {
      return {
        stage: config.name,
        status: 'failed',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  private async publishStatic(
    config: DeployStageConfig,
    artifacts: string[],
    start: number
  ): Promise<DeployResult> {
    try {
      await this.deployStatic(config.target, artifacts[0]);
      
      return {
        stage: config.name,
        status: 'success',
        deployedTo: config.target,
        deployedAt: new Date(),
        url: config.target,
        duration: Date.now() - start,
      };
    } catch (error) {
      return {
        stage: config.name,
        status: 'failed',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  private async deployStatic(target: string, source: string): Promise<void> {
    if (target.startsWith('s3://')) {
      await this.deployS3(target, source);
    } else if (target.startsWith('gh-pages://')) {
      await this.deployGitHubPages(target, source);
    } else if (target.startsWith('vercel://')) {
      await this.deployVercel(target, source);
    }
  }
  
  private async deployS3(bucket: string, source: string): Promise<void> {
    const bucketPath = bucket.replace('s3://', '');
    await exec(`aws s3 sync ${source} s3://${bucketPath} --delete`);
  }
  
  private async deployGitHubPages(repo: string, source: string): Promise<void> {
    const token = process.env.GITHUB_TOKEN;
    await exec(`GITHUB_TOKEN=${token} npx gh-pages -d ${source} -r ${repo}`);
  }
  
  private async deployVercel(project: string, source: string): Promise<void> {
    await exec(`vercel deploy --prod --cwd=${source} ${project}`);
  }
}
```

#### 3. Environment Deployment

```typescript
// src/pipeline/stages/deploy/environments.ts

import { Environment, DeployStageConfig, DeployResult } from './types';
import { exec } from '../../utils/exec';

export class EnvironmentDeployer {
  private environments: Map<string, Environment> = new Map();
  
  register(env: Environment): void {
    this.environments.set(env.name, env);
  }
  
  async deploy(config: DeployStageConfig): Promise<DeployResult> {
    const env = this.environments.get(config.target);
    
    if (!env) {
      return {
        stage: config.name,
        status: 'failed',
        error: `Environment not found: ${config.target}`,
      };
    }
    
    const start = Date.now();
    
    try {
      await this.setEnvironmentVariables(env);
      await this.deployToEnvironment(env, config);
      
      return {
        stage: config.name,
        status: 'success',
        deployedTo: env.name,
        deployedAt: new Date(),
        url: env.url,
        duration: Date.now() - start,
      };
    } catch (error) {
      return {
        stage: config.name,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - start,
      };
    }
  }
  
  private async setEnvironmentVariables(env: Environment): Promise<void> {
    for (const [key, value] of Object.entries(env.variables)) {
      process.env[key] = value;
    }
  }
  
  private async deployToEnvironment(env: Environment, config: DeployStageConfig): Promise<void> {
    switch (env.type) {
      case 'production':
        await this.deployProduction(env, config);
        break;
      case 'staging':
        await this.deployStaging(env, config);
        break;
      case 'development':
        await this.deployDevelopment(env, config);
        break;
    }
  }
  
  private async deployProduction(env: Environment, config: DeployStageConfig): Promise<void> {
    await this.verifyProductionReadiness();
    await this.deployWithStrategy(env, config);
  }
  
  private async deployStaging(env: Environment, config: DeployStageConfig): Promise<void> {
    await this.deployWithStrategy(env, config);
  }
  
  private async deployDevelopment(env: Environment, config: DeployStageConfig): Promise<void> {
    await this.deployWithStrategy(env, config);
  }
  
  private async verifyProductionReadiness(): Promise<void> {
    const checks = [
      'npm run test',
      'npm run build',
    ];
    
    for (const check of checks) {
      try {
        await exec(check);
      } catch {
        throw new Error('Production readiness check failed');
      }
    }
  }
  
  private async deployWithStrategy(env: Environment, config: DeployStageConfig): Promise<void> {
    const artifacts = config.artifacts || ['dist'];
    
    await exec(`npx vercel deploy --prebuilt --cwd=${artifacts[0]} --yes`);
  }
}
```

#### 4. Rollback Handler

```typescript
// src/pipeline/stages/deploy/rollback.ts

import { DeployResult, RollbackConfig } from './types';
import { exec } from '../../utils/exec';

export class RollbackHandler {
  private history: DeployRecord[] = [];
  
  async record(result: DeployResult): Promise<void> {
    this.history.push({
      ...result,
      timestamp: new Date(),
    });
    
    if (this.history.length > 100) {
      this.history.shift();
    }
  }
  
  async rollback(config: RollbackConfig): Promise<DeployResult> {
    const lastDeployment = this.findLastSuccessful();
    
    if (!lastDeployment) {
      throw new Error('No deployment to rollback to');
    }
    
    const start = Date.now();
    
    try {
      switch (lastDeployment.stage) {
        case 'npm':
          await this.rollbackNpm(lastDeployment);
          break;
        case 'docker':
          await this.rollbackDocker(lastDeployment);
          break;
        default:
          await this.rollbackGeneric(lastDeployment);
      }
      
      return {
        stage: 'rollback',
        status: 'success',
        deployedTo: lastDeployment.deployedTo,
        deployedAt: new Date(),
        duration: Date.now() - start,
      };
    } catch (error) {
      return {
        stage: 'rollback',
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - start,
      };
    }
  }
  
  private findLastSuccessful(): DeployRecord | undefined {
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i].status === 'success') {
        return this.history[i];
      }
    }
    return undefined;
  }
  
  private async rollbackNpm(deployment: DeployRecord): Promise<void> {
    const version = deployment.version;
    const tag = deployment.stage;
    
    await exec(`npm dist-tag add ${deployment.deployedTo}@${version} ${tag}`);
  }
  
  private async rollbackDocker(deployment: DeployRecord): Promise<void> {
    const url = deployment.url;
    const currentTag = url.split(':').pop();
    
    await exec(`docker tag ${deployment.deployedTo}:previous ${deployment.deployedTo}:${currentTag}`);
    await exec(`docker push ${deployment.deployedTo}:${currentTag}`);
  }
  
  private async rollbackGeneric(deployment: DeployRecord): Promise<void> {
    await exec(`git revert HEAD --no-commit`);
    await exec(`git commit -m "rollback: revert to ${deployment.deployedAt}"`);
  }
}

interface DeployRecord extends DeployResult {
  timestamp: Date;
}
```

#### 5. Deploy Configuration

```yaml
# deploy.yaml (extends pipeline config)

stages:
  - name: publish-npm
    type: npm
    target: registry.npmjs.org
    options:
      tag: latest
      access: public
    artifacts: [dist]
    depends_on: [test]
    rollback:
      enabled: true
      maxAttempts: 3

  - name: deploy-staging
    type: static
    target: vercel://my-app-staging
    options:
      environment:
        NODE_ENV: staging
    depends_on: [publish-npm]

  - name: deploy-production
    type: static
    target: vercel://my-app
    options:
      environment:
        NODE_ENV: production
    depends_on: [deploy-staging]
    rollback:
      enabled: true
      onFailure: auto
```

#### 6. CLI Commands

```bash
# Deploy to default target
speclang pipeline deploy

# Deploy to specific environment
speclang pipeline deploy --env production

# Deploy with dry run
speclang pipeline deploy --dry-run

# Deploy specific type
speclang pipeline deploy --type npm

# Rollback last deployment
speclang pipeline deploy --rollback

# View deployment history
speclang pipeline deploy --history
```

## Test Cases
1. NPM package publishes correctly
2. Docker image builds and pushes
3. Static deployment works
4. Environment variables set
5. Rollback restores previous version
6. Dry run shows what would deploy
7. Deployment history recorded
8. Secrets handled securely

## Validation
```bash
bun test tests/pipeline/deploy.test.ts
speclang pipeline deploy --dry-run
```

## Output Format
After completing, output:
1. Deploy stage types defined
2. Package publisher implemented
3. Environment deployer working
4. Rollback handler implemented
5. Test results
