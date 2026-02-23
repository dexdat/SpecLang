# Bootstrap Phase 1.19: Agent Behavior Matrix

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.19 of the bootstrap process.

**Prerequisites**: 
- Phase 1.17 (Agent-Assisted Support) complete
- Phase 1.18 (Agent-Autonomous Support) complete

## Your Task
Implement the agent behavior matrix - explicit rules for how agents adjust behavior based on metadata (project_level, agent_support, etc.).

## Read These Specs First
1. `specs/agent-support-levels.spec.md` - Agent support modes
2. `specs/project-maturity.spec.md` - Maturity levels
3. `specs/behavior-rules.spec.md` - Behavior specifications

## What to Build

### Files to Create
```
src/agent-behavior/
├── index.ts              # Behavior matrix exports
├── matrix.ts             # Core behavior matrix
├── rules.ts              # Behavior rules engine
├── modifiers.ts          # Metadata-based modifiers
├── constraints.ts        # Constraint application
└── validators.ts         # Behavior validation
```

### Requirements

#### 1. Core Behavior Matrix (matrix.ts)
```typescript
type ProjectLevel = 
  | 'POC'
  | 'MVP'
  | 'Alpha'
  | 'Beta'
  | 'Production'
  | 'Startup'
  | 'SMB'
  | 'MSB'
  | 'Enterprise';

type AgentSupportLevel = 
  | 'human_only'
  | 'agent_assisted'
  | 'agent_autonomous';

type ActionType = 
  | 'generate'
  | 'modify'
  | 'delete'
  | 'deploy'
  | 'test'
  | 'refactor'
  | 'migrate';

interface BehaviorMatrixCell {
  canExecute: boolean;
  requiresConfirmation: boolean;
  requiresApproval: boolean;
  maxAutonomyDepth: number;
  autoRollback: boolean;
  humanReviewRequired: boolean;
  loggingLevel: 'minimal' | 'standard' | 'detailed' | 'full';
}

class BehaviorMatrix {
  private matrix: Map<string, BehaviorMatrixCell>;

  constructor() {
    this.matrix = new Map();
    this.initializeMatrix();
  }

  private initializeMatrix(): void {
    const combinations = this.generateCombinations();
    
    for (const combo of combinations) {
      const key = this.getKey(combo.projectLevel, combo.agentSupport, combo.actionType);
      this.matrix.set(key, this.calculateCell(combo));
    }
  }

  getBehavior(
    projectLevel: ProjectLevel,
    agentSupport: AgentSupportLevel,
    actionType: ActionType,
    context?: ActionContext
  ): BehaviorMatrixCell {
    const key = this.getKey(projectLevel, agentSupport, actionType);
    let cell = this.matrix.get(key);

    if (!cell) {
      cell = this.getDefaultCell(agentSupport);
    }

    // Apply context modifiers
    if (context) {
      cell = this.applyModifiers(cell, projectLevel, agentSupport, context);
    }

    return cell;
  }

  private calculateCell(combo: Combination): BehaviorMatrixCell {
    const { projectLevel, agentSupport, actionType } = combo;

    // Base behavior from agent support level
    let cell = this.getBaseCell(agentSupport);

    // Modify based on project level
    cell = this.applyProjectLevelModifiers(cell, projectLevel, actionType);

    // Apply action-specific constraints
    cell = this.applyActionConstraints(cell, actionType);

    return cell;
  }

  private getBaseCell(agentSupport: AgentSupportLevel): BehaviorMatrixCell {
    switch (agentSupport) {
      case 'human_only':
        return {
          canExecute: false,
          requiresConfirmation: true,
          requiresApproval: true,
          maxAutonomyDepth: 0,
          autoRollback: false,
          humanReviewRequired: true,
          loggingLevel: 'full'
        };
      case 'agent_assisted':
        return {
          canExecute: true,
          requiresConfirmation: true,
          requiresApproval: true,
          maxAutonomyDepth: 3,
          autoRollback: false,
          humanReviewRequired: true,
          loggingLevel: 'detailed'
        };
      case 'agent_autonomous':
        return {
          canExecute: true,
          requiresConfirmation: false,
          requiresApproval: false,
          maxAutonomyDepth: 10,
          autoRollback: true,
          humanReviewRequired: false,
          loggingLevel: 'standard'
        };
    }
  }

  private applyProjectLevelModifiers(
    cell: BehaviorMatrixCell,
    projectLevel: ProjectLevel,
    actionType: ActionType
  ): BehaviorMatrixCell {
    switch (projectLevel) {
      case 'POC':
        return {
          ...cell,
          requiresConfirmation: true,
          requiresApproval: true,
          humanReviewRequired: true,
          loggingLevel: 'full'
        };
      case 'MVP':
        return {
          ...cell,
          requiresConfirmation: true,
          requiresApproval: projectLevel === 'MVP' && actionType === 'deploy',
          loggingLevel: 'detailed'
        };
      case 'Alpha':
        return { ...cell, loggingLevel: 'detailed' };
      case 'Beta':
      case 'Production':
        return {
          ...cell,
          autoRollback: true,
          loggingLevel: 'detailed'
        };
      case 'Startup':
        return {
          ...cell,
          maxAutonomyDepth: Math.min(cell.maxAutonomyDepth * 2, 10)
        };
      case 'SMB':
      case 'MSB':
      case 'Enterprise':
        return {
          ...cell,
          autoRollback: true,
          loggingLevel: 'full'
        };
    }
  }

  private applyActionConstraints(
    cell: BehaviorMatrixCell,
    actionType: ActionType
  ): BehaviorMatrixCell {
    switch (actionType) {
      case 'deploy':
        return {
          ...cell,
          requiresConfirmation: cell.requiresConfirmation || true,
          autoRollback: true
        };
      case 'delete':
        return {
          ...cell,
          requiresConfirmation: true,
          requiresApproval: true,
          autoRollback: true
        };
      case 'migrate':
        return {
          ...cell,
          requiresConfirmation: true,
          autoRollback: true
        };
      default:
        return cell;
    }
  }

  private getKey(
    projectLevel: ProjectLevel,
    agentSupport: AgentSupportLevel,
    actionType: ActionType
  ): string {
    return `${projectLevel}:${agentSupport}:${actionType}`;
  }

  private generateCombinations(): Combination[] {
    const projectLevels: ProjectLevel[] = [
      'POC', 'MVP', 'Alpha', 'Beta', 'Production', 'Startup', 'SMB', 'MSB', 'Enterprise'
    ];
    const agentSupports: AgentSupportLevel[] = [
      'human_only', 'agent_assisted', 'agent_autonomous'
    ];
    const actionTypes: ActionType[] = [
      'generate', 'modify', 'delete', 'deploy', 'test', 'refactor', 'migrate'
    ];

    const combinations: Combination[] = [];
    for (const pl of projectLevels) {
      for (const as of agentSupports) {
        for (const at of actionTypes) {
          combinations.push({ projectLevel: pl, agentSupport: as, actionType: at });
        }
      }
    }
    return combinations;
  }
}
```

#### 2. Behavior Rules Engine (rules.ts)
```typescript
interface BehaviorRule {
  id: string;
  name: string;
  condition: RuleCondition;
  effect: RuleEffect;
  priority: number;
}

interface RuleCondition {
  projectLevel?: ProjectLevel[];
  agentSupport?: AgentSupportLevel[];
  actionType?: ActionType[];
  environment?: string[];
  hasBreaking?: boolean;
}

interface RuleEffect {
  set?: Partial<BehaviorMatrixCell>;
  modify?: (cell: BehaviorMatrixCell) => BehaviorMatrixCell;
  block?: boolean;
  requireHuman?: boolean;
}

class BehaviorRulesEngine {
  private rules: BehaviorRule[];
  private matrix: BehaviorMatrix;

  constructor(matrix: BehaviorMatrix) {
    this.matrix = matrix;
    this.rules = this.initializeRules();
  }

  evaluate(
    projectLevel: ProjectLevel,
    agentSupport: AgentSupportLevel,
    actionType: ActionType,
    context: ActionContext
  ): BehaviorMatrixCell {
    let cell = this.matrix.getBehavior(projectLevel, agentSupport, actionType, context);

    // Sort rules by priority
    const applicableRules = this.rules
      .filter(rule => this.matchesCondition(rule.condition, projectLevel, agentSupport, actionType, context))
      .sort((a, b) => b.priority - a.priority);

    // Apply each rule
    for (const rule of applicableRules) {
      if (rule.effect.block) {
        cell = { ...cell, canExecute: false };
      }
      
      if (rule.effect.set) {
        cell = { ...cell, ...rule.effect.set };
      }
      
      if (rule.effect.modify) {
        cell = rule.effect.modify(cell);
      }
      
      if (rule.effect.requireHuman) {
        cell = {
          ...cell,
          requiresConfirmation: true,
          requiresApproval: true,
          humanReviewRequired: true
        };
      }
    }

    return cell;
  }

  private matchesCondition(
    condition: RuleCondition,
    projectLevel: ProjectLevel,
    agentSupport: AgentSupportLevel,
    actionType: ActionType,
    context: ActionContext
  ): boolean {
    if (condition.projectLevel && !condition.projectLevel.includes(projectLevel)) {
      return false;
    }
    if (condition.agentSupport && !condition.agentSupport.includes(agentSupport)) {
      return false;
    }
    if (condition.actionType && !condition.actionType.includes(actionType)) {
      return false;
    }
    if (condition.hasBreaking !== undefined && context?.breaking !== condition.hasBreaking) {
      return false;
    }
    return true;
  }

  private initializeRules(): BehaviorRule[] {
    return [
      {
        id: 'rule-001',
        name: 'Production requires rollback',
        condition: { projectLevel: ['Production', 'Enterprise', 'MSB'] },
        effect: { set: { autoRollback: true } },
        priority: 100
      },
      {
        id: 'rule-002',
        name: 'Breaking changes require approval',
        condition: { hasBreaking: true },
        effect: { set: { requiresApproval: true, requiresConfirmation: true } },
        priority: 90
      },
      {
        id: 'rule-003',
        name: 'Deploy requires confirmation',
        condition: { actionType: ['deploy'] },
        effect: { set: { requiresConfirmation: true } },
        priority: 80
      },
      {
        id: 'rule-004',
        name: 'Delete requires human',
        condition: { actionType: ['delete'] },
        effect: { requireHuman: true },
        priority: 70
      },
      {
        id: 'rule-005',
        name: 'POC mode strict oversight',
        condition: { projectLevel: ['POC'] },
        effect: { set: { humanReviewRequired: true, loggingLevel: 'full' } },
        priority: 60
      }
    ];
  }
}
```

#### 3. Metadata-Based Modifiers (modifiers.ts)
```typescript
interface MetadataModifiers {
  projectLevel: ProjectLevel;
  agentSupport: AgentSupportLevel;
  tags: string[];
  customModifiers: Record<string, any>;
}

class BehaviorModifiers {
  apply(
    cell: BehaviorMatrixCell,
    metadata: MetadataModifiers,
    action: AgentAction
  ): BehaviorMatrixCell {
    let modified = { ...cell };

    // Apply tag-based modifiers
    modified = this.applyTagModifiers(modified, metadata.tags);

    // Apply custom modifiers
    modified = this.applyCustomModifiers(modified, metadata.customModifiers);

    // Apply action-specific context
    modified = this.applyContextModifiers(modified, action);

    return modified;
  }

  private applyTagModifiers(cell: BehaviorMatrixCell, tags: string[]): BehaviorMatrixCell {
    let modified = { ...cell };

    if (tags.includes('security')) {
      modified.requiresConfirmation = true;
      modified.requiresApproval = true;
      modified.loggingLevel = 'full';
    }

    if (tags.includes('production')) {
      modified.autoRollback = true;
    }

    if (tags.includes('experimental')) {
      modified.maxAutonomyDepth = Math.min(modified.maxAutonomyDepth, 2);
    }

    if (tags.includes('critical')) {
      modified.humanReviewRequired = true;
    }

    return modified;
  }

  private applyCustomModifiers(
    cell: BehaviorMatrixCell,
    custom: Record<string, any>
  ): BehaviorMatrixCell {
    if (custom.maxDepth) {
      return { ...cell, maxAutonomyDepth: custom.maxDepth };
    }
    if (custom.forceConfirmation) {
      return { ...cell, requiresConfirmation: true };
    }
    return cell;
  }

  private applyContextModifiers(
    cell: BehaviorMatrixCell,
    action: AgentAction
  ): BehaviorMatrixCell {
    if (action.environment === 'production') {
      return {
        ...cell,
        autoRollback: true,
        loggingLevel: 'full'
      };
    }

    if (action.impact === 'high') {
      return {
        ...cell,
        requiresConfirmation: true,
        maxAutonomyDepth: Math.min(cell.maxAutonomyDepth, 5)
      };
    }

    return cell;
  }
}
```

#### 4. Constraint Application (constraints.ts)
```typescript
interface BehavioralConstraints {
  maxExecutionDepth: number;
  maxRollbackDepth: number;
  blockedActions: ActionType[];
  requiredApprovals: string[];
  timeoutMs: number;
}

class ConstraintEnforcer {
  private defaultConstraints: BehavioralConstraints;

  constructor() {
    this.defaultConstraints = {
      maxExecutionDepth: 10,
      maxRollbackDepth: 5,
      blockedActions: [],
      requiredApprovals: [],
      timeoutMs: 300000
    };
  }

  enforce(
    cell: BehaviorMatrixCell,
    constraints: Partial<BehavioralConstraints>
  ): BehaviorMatrixCell {
    const merged = { ...this.defaultConstraints, ...constraints };

    // Apply depth constraints
    if (cell.maxAutonomyDepth > merged.maxExecutionDepth) {
      cell.maxAutonomyDepth = merged.maxExecutionDepth;
    }

    // Apply action blocking
    if (merged.blockedActions.length > 0) {
      cell.canExecute = !merged.blockedActions.includes(
        this.getCurrentActionType()
      );
    }

    return cell;
  }

  private getCurrentActionType(): ActionType {
    // Get from current execution context
    return 'generate';
  }
}
```

#### 5. Behavior Validation (validators.ts)
```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

class BehaviorValidator {
  private matrix: BehaviorMatrix;
  private rules: BehaviorRulesEngine;

  constructor(matrix: BehaviorMatrix, rules: BehaviorRulesEngine) {
    this.matrix = matrix;
    this.rules = rules;
  }

  validateBehavior(
    projectLevel: ProjectLevel,
    agentSupport: AgentSupportLevel,
    actionType: ActionType,
    context: ActionContext
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const cell = this.rules.evaluate(projectLevel, agentSupport, actionType, context);

    // Validate required combinations
    if (agentSupport === 'human_only' && cell.canExecute) {
      errors.push('human_only mode should not allow autonomous execution');
    }

    if (projectLevel === 'POC' && cell.maxAutonomyDepth > 0) {
      warnings.push('POC projects should minimize autonomous execution');
      suggestions.push('Consider using agent_assisted for POC projects');
    }

    // Validate safety constraints
    if (cell.canExecute && cell.autoRollback === false) {
      suggestions.push('Autonomous actions should have autoRollback enabled');
    }

    if (cell.requiresConfirmation === false && cell.humanReviewRequired === true) {
      errors.push('Conflicting requirements: human review required but no confirmation');
    }

    // Validate project level appropriateness
    if (projectLevel === 'Production' && agentSupport === 'human_only') {
      warnings.push('Production projects may benefit from agent assistance');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  validateSpecCompliance(spec: ParsedSpec): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const projectLevel = spec.metadata.project_level as ProjectLevel;
    const agentSupport = spec.metadata.agent_support as AgentSupportLevel;

    // Check for mislabeled specs
    if (projectLevel === 'Production' && agentSupport === 'human_only') {
      warnings.push('Production spec with human_only may slow iteration');
    }

    // Validate required fields
    if (!spec.metadata.project_level) {
      errors.push('Missing required field: project_level');
    }
    if (!spec.metadata.agent_support) {
      errors.push('Missing required field: agent_support');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions: []
    };
  }
}
```

## Test Cases
1. Matrix returns correct behavior for each combination
2. Rules modify behavior correctly based on priority
3. Tag modifiers apply appropriately
4. Constraints enforce limits properly
5. Validation detects mislabeled specs
6. Project level affects autonomy appropriately
7. Action type constraints work correctly
8. Custom modifiers override defaults
9. Warning and error generation works
10. Suggestions provided for improvements

## CLI Commands
```bash
# Get behavior for combination
speclang behavior --project-level Alpha --agent-support agent_autonomous --action generate

# Validate spec compliance
speclang behavior --validate specs/auth.spec.md

# List rules
speclang behavior --rules

# Check matrix cell
speclang behavior --matrix POC:agent_assisted:deploy

# Suggest improvements
speclang behavior --suggest specs/auth.spec.md

# Apply rule
speclang behavior --rule-add --name "Custom Rule" --condition '{"projectLevel":["POC"]}' --effect '{"requireHuman":true}'
```

## Validation
```bash
bun test tests/agent-behavior/
```

## Output Format
After completing, output:
1. Core behavior matrix
2. Behavior rules engine
3. Metadata-based modifiers
4. Constraint application
5. Behavior validation
6. Test results
