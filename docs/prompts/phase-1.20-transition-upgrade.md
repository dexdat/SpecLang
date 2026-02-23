# Bootstrap Phase 1.20: Transition - Upgrade Workflows

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.20 of the bootstrap process.

**Prerequisites**: 
- Phase 1.18 (Agent-Autonomous Support) complete
- Phase 1.19 (Behavior Matrix) complete

## Your Task
Implement upgrade workflows - procedures for moving specs from lower to higher maturity levels (e.g., agent_assisted to agent_autonomous).

## Read These Specs First
1. `specs/agent-support-levels.spec.md` - Agent support modes
2. `specs/project-maturity.spec.md` - Maturity levels
3. `specs/transition-protocols.spec.md` - Transition specifications

## What to Build

### Files to Create
```
src/transition/
├── upgrade/
│   ├── index.ts              # Upgrade exports
│   ├── planner.ts            # Upgrade planning
│   ├── checklist.ts          # Upgrade checklist
│   ├── validator.ts          # Upgrade validation
│   ├── executor.ts           # Upgrade execution
│   └── rollback.ts           # Upgrade rollback
```

### Requirements

#### 1. Upgrade Planning (planner.ts)
```typescript
type UpgradeType = 
  | 'human_to_assisted'
  | 'assisted_to_autonomous'
  | 'poc_to_mvp'
  | 'mvp_to_production'
  | 'level_grade';

interface UpgradePlan {
  id: string;
  type: UpgradeType;
  from: {
    agentSupport: AgentSupportLevel;
    projectLevel: ProjectLevel;
  };
  to: {
    agentSupport: AgentSupportLevel;
    projectLevel: ProjectLevel;
  };
  steps: UpgradeStep[];
  requirements: UpgradeRequirement[];
  risks: UpgradeRisk[];
  estimatedDuration: number;
}

interface UpgradeStep {
  id: string;
  name: string;
  description: string;
  required: boolean;
  automated: boolean;
  completed: boolean;
}

interface UpgradeRequirement {
  id: string;
  name: string;
  description: string;
  met: boolean;
  evidence?: string;
}

interface UpgradeRisk {
  level: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
}

class UpgradePlanner {
  private upgradePaths: Map<UpgradeType, UpgradePath>;

  constructor() {
    this.upgradePaths = new Map();
    this.initializePaths();
  }

  async planUpgrade(
    spec: ParsedSpec,
    targetAgentSupport: AgentSupportLevel,
    targetProjectLevel?: ProjectLevel
  ): Promise<UpgradePlan> {
    const currentAgentSupport = spec.metadata.agent_support as AgentSupportLevel;
    const currentProjectLevel = spec.metadata.project_level as ProjectLevel;

    const upgradeType = this.determineUpgradeType(
      currentAgentSupport,
      targetAgentSupport,
      currentProjectLevel,
      targetProjectLevel
    );

    const path = this.upgradePaths.get(upgradeType);
    if (!path) {
      throw new Error(`No upgrade path defined for ${upgradeType}`);
    }

    const plan: UpgradePlan = {
      id: generateId(),
      type: upgradeType,
      from: { agentSupport: currentAgentSupport, projectLevel: currentProjectLevel },
      to: { 
        agentSupport: targetAgentSupport, 
        projectLevel: targetProjectLevel || currentProjectLevel 
      },
      steps: this.generateSteps(path),
      requirements: await this.checkRequirements(path, spec),
      risks: this.assessRisks(path, spec),
      estimatedDuration: this.calculateDuration(path)
    };

    return plan;
  }

  private determineUpgradeType(
    fromAgentSupport: AgentSupportLevel,
    toAgentSupport: AgentSupportLevel,
    fromProjectLevel: ProjectLevel,
    toProjectLevel?: ProjectLevel
  ): UpgradeType {
    if (toProjectLevel && toProjectLevel !== fromProjectLevel) {
      if (fromProjectLevel === 'POC' && toProjectLevel === 'MVP') {
        return 'poc_to_mvp';
      }
      if (fromProjectLevel === 'MVP' && 
          ['Beta', 'Production'].includes(toProjectLevel)) {
        return 'mvp_to_production';
      }
    }

    if (fromAgentSupport === 'human_only' && toAgentSupport === 'agent_assisted') {
      return 'human_to_assisted';
    }
    if (fromAgentSupport === 'agent_assisted' && toAgentSupport === 'agent_autonomous') {
      return 'assisted_to_autonomous';
    }

    return 'level_grade';
  }

  private generateSteps(path: UpgradePath): UpgradeStep[] {
    return path.steps.map((step, index) => ({
      id: `step-${index + 1}`,
      name: step.name,
      description: step.description,
      required: step.required,
      automated: step.automated,
      completed: false
    }));
  }

  private async checkRequirements(
    path: UpgradePath,
    spec: ParsedSpec
  ): Promise<UpgradeRequirement[]> {
    const requirements: UpgradeRequirement[] = [];

    for (const req of path.requirements) {
      const met = await this.verifyRequirement(req, spec);
      requirements.push({
        id: req.id,
        name: req.name,
        description: req.description,
        met,
        evidence: met ? 'Verified automatically' : 'Not yet verified'
      });
    }

    return requirements;
  }

  private assessRisks(path: UpgradePath, spec: ParsedSpec): UpgradeRisk[] {
    const risks: UpgradeRisk[] = [];

    for (const risk of path.risks) {
      risks.push({
        level: risk.level,
        description: risk.description,
        mitigation: risk.mitigation
      });
    }

    return risks;
  }

  private calculateDuration(path: UpgradePath): number {
    return path.steps.reduce((total, step) => {
      return total + (step.estimatedMinutes || 30);
    }, 0);
  }

  private initializePaths(): void {
    this.upgradePaths.set('assisted_to_autonomous', {
      steps: [
        { name: 'Validate completeness', description: 'Ensure spec meets autonomous requirements', required: true, automated: true, estimatedMinutes: 5 },
        { name: 'Check test coverage', description: 'Verify adequate test coverage', required: true, automated: true, estimatedMinutes: 10 },
        { name: 'Review security', description: 'Security review for autonomous execution', required: true, automated: false, estimatedMinutes: 60 },
        { name: 'Verify rollback', description: 'Confirm rollback procedures work', required: true, automated: true, estimatedMinutes: 15 },
        { name: 'Run validation', description: 'Run full validation suite', required: true, automated: true, estimatedMinutes: 30 },
        { name: 'Human review', description: 'Final human review of upgrade', required: true, automated: false, estimatedMinutes: 30 }
      ],
      requirements: [
        { id: 'req-1', name: 'Completeness', description: 'Spec must be complete', validator: 'validateCompleteness' },
        { id: 'req-2', name: 'No ambiguity', description: 'No ambiguous content', validator: 'validateAmbiguity' },
        { id: 'req-3', name: 'Tests pass', description: 'All tests must pass', validator: 'validateTests' },
        { id: 'req-4', name: 'Coverage', description: 'Test coverage > 80%', validator: 'validateCoverage' }
      ],
      risks: [
        { level: 'medium', description: 'Autonomous execution may cause unexpected changes', mitigation: 'Auto-rollback enabled' },
        { level: 'low', description: 'Tests may not cover all edge cases', mitigation: 'Human review required' }
      ]
    });

    this.upgradePaths.set('human_to_assisted', {
      steps: [
        { name: 'Identify repeatable patterns', description: 'Find patterns suitable for assistance', required: true, automated: true, estimatedMinutes: 15 },
        { name: 'Configure suggestions', description: 'Set up suggestion engine', required: true, automated: true, estimatedMinutes: 10 },
        { name: 'Define checkpoints', description: 'Set up human confirmation checkpoints', required: true, automated: true, estimatedMinutes: 10 },
        { name: 'Test workflow', description: 'Test human-agent workflow', required: true, automated: false, estimatedMinutes: 30 }
      ],
      requirements: [
        { id: 'req-1', name: 'Patterns identified', description: 'Repeatable patterns must exist', validator: 'findPatterns' },
        { id: 'req-2', name: 'Checkpoints defined', description: 'Checkpoints must be defined', validator: 'validateCheckpoints' }
      ],
      risks: [
        { level: 'low', description: 'Insufficient patterns for assistance', mitigation: 'Add more patterns' }
      ]
    });
  }
}
```

#### 2. Upgrade Checklist (checklist.ts)
```typescript
interface UpgradeChecklist {
  planId: string;
  items: ChecklistItem[];
  completedAt?: Date;
}

interface ChecklistItem {
  id: string;
  stepId: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedBy?: string;
  completedAt?: Date;
  notes?: string;
}

class UpgradeChecklist {
  private checklists: Map<string, UpgradeChecklist>;

  constructor() {
    this.checklists = new Map();
  }

  async createChecklist(plan: UpgradePlan): Promise<UpgradeChecklist> {
    const checklist: UpgradeChecklist = {
      planId: plan.id,
      items: plan.steps.map(step => ({
        id: generateId(),
        stepId: step.id,
        name: step.name,
        description: step.description,
        status: 'pending'
      }))
    };

    this.checklists.set(checklist.planId, checklist);
    return checklist;
  }

  async updateItem(
    checklistId: string,
    itemId: string,
    status: ChecklistItem['status'],
    completedBy?: string,
    notes?: string
  ): Promise<ChecklistItem> {
    const checklist = this.checklists.get(checklistId);
    if (!checklist) {
      throw new Error('Checklist not found');
    }

    const item = checklist.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    item.status = status;
    if (completedBy) {
      item.completedBy = completedBy;
    }
    if (notes) {
      item.notes = notes;
    }
    if (status === 'completed') {
      item.completedAt = new Date();
    }

    // Check if all required items completed
    const requiredItems = checklist.items.filter(i => 
      i.status === 'completed' || i.status === 'skipped'
    );
    if (requiredItems.length === checklist.items.filter(i => 
      checklist.items.find(ci => ci.stepId === i.stepId && i.required)
    ).length) {
      checklist.completedAt = new Date();
    }

    return item;
  }

  async getChecklist(checklistId: string): Promise<UpgradeChecklist | null> {
    return this.checklists.get(checklistId) || null;
  }

  async getProgress(checklistId: string): Promise<ChecklistProgress> {
    const checklist = this.checklists.get(checklistId);
    if (!checklist) {
      throw new Error('Checklist not found');
    }

    const total = checklist.items.length;
    const completed = checklist.items.filter(i => i.status === 'completed').length;
    const skipped = checklist.items.filter(i => i.status === 'skipped').length;
    const pending = checklist.items.filter(i => i.status === 'pending').length;

    return {
      total,
      completed,
      skipped,
      pending,
      percentage: ((completed + skipped) / total) * 100,
      isComplete: checklist.completedAt !== undefined
    };
  }
}
```

#### 3. Upgrade Validation (validator.ts)
```typescript
class UpgradeValidator {
  private validator: SpecValidator;

  constructor() {
    this.validator = new SpecValidator();
  }

  async validateUpgrade(
    spec: ParsedSpec,
    targetAgentSupport: AgentSupportLevel
  ): Promise<UpgradeValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const checks: UpgradeCheck[] = [];

    // Check completeness for autonomous
    if (targetAgentSupport === 'agent_autonomous') {
      const completenessCheck = await this.validateCompleteness(spec);
      checks.push(completenessCheck);
      
      if (!completenessCheck.passed) {
        errors.push(...completenessCheck.errors);
      }
      warnings.push(...completenessCheck.warnings);
    }

    // Check ambiguity
    const ambiguityCheck = await this.validateAmbiguity(spec);
    checks.push(ambiguityCheck);
    
    if (!ambiguityCheck.passed) {
      errors.push(...ambiguityCheck.errors);
    }

    // Check references
    const referenceCheck = await this.validateReferences(spec);
    checks.push(referenceCheck);
    
    if (!referenceCheck.passed) {
      errors.push(...referenceCheck.errors);
    }

    // Check required fields
    const fieldsCheck = await this.validateRequiredFields(spec, targetAgentSupport);
    checks.push(fieldsCheck);
    
    if (!fieldsCheck.passed) {
      errors.push(...fieldsCheck.errors);
    }

    return {
      canUpgrade: errors.length === 0,
      errors,
      warnings,
      checks
    };
  }

  private async validateCompleteness(spec: ParsedSpec): Promise<UpgradeCheck> {
    const result = await this.validator.validateCompleteness(spec);
    
    return {
      name: 'Completeness Check',
      description: 'Verify spec is complete for autonomous operation',
      passed: result.valid,
      errors: result.errors,
      warnings: result.warnings
    };
  }

  private async validateAmbiguity(spec: ParsedSpec): Promise<UpgradeCheck> {
    const result = await this.validator.validateAmbiguity(spec);
    
    return {
      name: 'Ambiguity Check',
      description: 'Ensure no ambiguous content',
      passed: result.valid,
      errors: result.errors,
      warnings: result.warnings
    };
  }

  private async validateReferences(spec: ParsedSpec): Promise<UpgradeCheck> {
    const result = await this.validator.validateReferences(spec);
    
    return {
      name: 'Reference Check',
      description: 'Validate all @ref: references resolve',
      passed: result.valid,
      errors: result.errors,
      warnings: result.warnings
    };
  }

  private async validateRequiredFields(
    spec: ParsedSpec,
    targetAgentSupport: AgentSupportLevel
  ): Promise<UpgradeCheck> {
    const requiredFields = this.getRequiredFields(targetAgentSupport);
    const missing: string[] = [];

    for (const field of requiredFields) {
      if (!spec.metadata[field]) {
        missing.push(field);
      }
    }

    return {
      name: 'Required Fields',
      description: 'Check required metadata fields',
      passed: missing.length === 0,
      errors: missing.map(f => `Missing required field: ${f}`),
      warnings: []
    };
  }

  private getRequiredFields(agentSupport: AgentSupportLevel): string[] {
    const base = ['id', 'version', 'project_level', 'agent_support'];
    
    if (agentSupport === 'agent_autonomous') {
      return [...base, 'tags', 'short'];
    }
    
    return base;
  }
}
```

#### 4. Upgrade Execution (executor.ts)
```typescript
class UpgradeExecutor {
  private checklist: UpgradeChecklist;
  private validator: UpgradeValidator;
  private notifier: UpgradeNotifier;

  constructor() {
    this.checklist = new UpgradeChecklist();
    this.validator = new UpgradeValidator();
    this.notifier = new UpgradeNotifier();
  }

  async executeUpgrade(
    spec: ParsedSpec,
    targetAgentSupport: AgentSupportLevel,
    targetProjectLevel?: ProjectLevel
  ): Promise<UpgradeResult> {
    const plan = await new UpgradePlanner().planUpgrade(
      spec,
      targetAgentSupport,
      targetProjectLevel
    );

    // Pre-upgrade validation
    const validation = await this.validator.validateUpgrade(spec, targetAgentSupport);
    if (!validation.canUpgrade) {
      return {
        success: false,
        planId: plan.id,
        errors: validation.errors,
        warnings: validation.warnings,
        completedStep: null
      };
    }

    // Create checklist
    const checklist = await this.checklist.createChecklist(plan);

    // Execute steps
    for (const item of checklist.items) {
      if (item.status === 'skipped') continue;

      await this.checklist.updateItem(checklist.id, item.id, 'in_progress');

      try {
        if (item.automated) {
          await this.executeAutomatedStep(item, spec);
        } else {
          await this.executeManualStep(item, spec);
        }

        await this.checklist.updateItem(checklist.id, item.id, 'completed', 'system');
        
        // Notify progress
        await this.notifier.notifyProgress(checklist.id, item.name);

      } catch (error) {
        if (this.isBlockingError(error)) {
          await this.checklist.updateItem(checklist.id, item.id, 'pending', undefined, error.message);
          return {
            success: false,
            planId: plan.id,
            errors: [error.message],
            warnings: validation.warnings,
            completedStep: item.name
          };
        } else {
          await this.checklist.updateItem(checklist.id, item.id, 'completed', 'system', error.message);
        }
      }
    }

    // Update spec metadata
    const upgradedSpec = await this.applyUpgrade(spec, targetAgentSupport, targetProjectLevel);

    return {
      success: true,
      planId: plan.id,
      spec: upgradedSpec,
      warnings: validation.warnings,
      completedStep: null
    };
  }

  private async executeAutomatedStep(item: ChecklistItem, spec: ParsedSpec): Promise<void> {
    switch (item.name) {
      case 'Validate completeness':
        await this.validator.validateCompleteness(spec);
        break;
      case 'Check test coverage':
        await this.checkTestCoverage(spec);
        break;
      case 'Run validation':
        await this.runValidation(spec);
        break;
      default:
        // Generic automated step
        break;
    }
  }

  private async executeManualStep(item: ChecklistItem, spec: ParsedSpec): Promise<void> {
    // Request human input for manual steps
    await this.notifier.requestManualAction(item, spec);
  }

  private async applyUpgrade(
    spec: ParsedSpec,
    targetAgentSupport: AgentSupportLevel,
    targetProjectLevel?: ProjectLevel
  ): Promise<ParsedSpec> {
    return {
      ...spec,
      metadata: {
        ...spec.metadata,
        agent_support: targetAgentSupport,
        ...(targetProjectLevel && { project_level: targetProjectLevel }),
        previous_agent_support: spec.metadata.agent_support,
        upgraded_at: new Date().toISOString()
      }
    };
  }

  private isBlockingError(error: any): boolean {
    return error.blocking === true;
  }
}
```

#### 5. Upgrade Rollback (rollback.ts)
```typescript
interface UpgradeSnapshot {
  id: string;
  specId: string;
  metadata: SpecMetadata;
  createdAt: Date;
}

class UpgradeRollback {
  private snapshots: Map<string, UpgradeSnapshot[]>;

  constructor() {
    this.snapshots = new Map();
  }

  async createSnapshot(spec: ParsedSpec): Promise<UpgradeSnapshot> {
    const snapshot: UpgradeSnapshot = {
      id: generateId(),
      specId: spec.metadata.id,
      metadata: { ...spec.metadata },
      createdAt: new Date()
    };

    const specSnapshots = this.snapshots.get(spec.metadata.id) || [];
    specSnapshots.push(snapshot);
    this.snapshots.set(spec.metadata.id, specSnapshots);

    return snapshot;
  }

  async rollback(
    specId: string,
    snapshotId?: string
  ): Promise<ParsedSpec> {
    const snapshots = this.snapshots.get(specId);
    if (!snapshots || snapshots.length === 0) {
      throw new Error('No snapshots found for rollback');
    }

    const snapshot = snapshotId 
      ? snapshots.find(s => s.id === snapshotId)
      : snapshots[snapshots.length - 1];

    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    return {
      id: specId,
      metadata: snapshot.metadata,
      content: []
    };
  }

  async getSnapshots(specId: string): Promise<UpgradeSnapshot[]> {
    return this.snapshots.get(specId) || [];
  }
}
```

## Test Cases
1. Upgrade plan generated for each transition type
2. Checklist created with correct items
3. Validation catches incomplete specs
4. Automated steps execute correctly
5. Manual steps request human input
6. Rollback restores previous state
7. Snapshots created before upgrade
8. Notifications sent on progress
9. Errors block progression when critical
10. Warnings allow continuation

## CLI Commands
```bash
# Plan upgrade
speclang upgrade --plan specs/auth.spec.md --to agent_autonomous

# Execute upgrade
speclang upgrade --execute specs/auth.spec.md --to agent_autonomous

# View checklist
speclang upgrade --checklist plan-123

# Complete checklist item
speclang upgrade --complete item-456 --user john

# Rollback
speclang upgrade --rollback specs/auth.spec.md

# View snapshots
speclang upgrade --snapshots specs/auth.spec.md
```

## Validation
```bash
bun test tests/transition/upgrade/
```

## Output Format
After completing, output:
1. Upgrade planning
2. Upgrade checklist
3. Upgrade validation
4. Upgrade execution
5. Upgrade rollback
6. Test results
