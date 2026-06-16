# Bootstrap Phase 0.13: Test Specs Format

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.13 of the bootstrap process.

**Prerequisites**: 
- Phase 0.1-0.12 complete (Core, Parser, Indexer, Tools, Validation)

## Your Task
Implement the test spec format - tests written as natural language specifications. Test specs are first-class citizens that describe expected behavior and are converted to executable tests by the TestWriter agent.

## Read These Specs First
1. `specs/test-specs.spec.md` - Test spec specification
2. `specs/core.spec.dir/agents.spec.md` - TestWriter agent
3. `specs/cascade.spec.md` - Test execution in cascade

## What to Build

### Files to Create
```
src/test-specs/
├── index.ts              # Main exports
├── parser.ts             # Test spec parser
├── generator.ts          # Test code generator
├── runner.ts             # Test execution
├── reporter.ts           # Test result reporter
├── sync.ts               # Sync results back to specs
└── types.ts              # TypeScript types

tests/
└── test-specs.test.ts
```

### Requirements

#### 1. Types (types.ts)

```typescript
interface TestSpec {
  id: string;
  version: string;
  target: string;           // What spec this tests
  scenarios: TestScenario[];
  tags: string[];
}

interface TestScenario {
  name: string;
  given: string[];          // Preconditions
  when: string;             // Action
  then: string[];           // Expected outcomes
  examples?: ExampleTable;  // For parameterized tests
}

interface ExampleTable {
  headers: string[];
  rows: string[][];
}

interface TestResult {
  specId: string;
  scenarioName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  timestamp: number;
}

interface TestReport {
  specId: string;
  totalScenarios: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestResult[];
}
```

#### 2. Test Spec Parser (parser.ts)

```typescript
export class TestSpecParser {
  parse(content: string): TestSpec {
    const header = this.parseHeader(content);
    const scenarios = this.parseScenarios(content);
    
    return {
      id: header.id,
      version: header.version,
      target: header.target,
      scenarios,
      tags: header.tags || []
    };
  }
  
  private parseHeader(content: string): any {
    // Parse YAML header
    const headerMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!headerMatch) throw new Error('No header found');
    
    return yaml.parse(headerMatch[1]);
  }
  
  private parseScenarios(content: string): TestScenario[] {
    const scenarios: TestScenario[] = [];
    
    // Match scenario blocks
    // Format:
    // ## Scenario: {name}
    // Given: {precondition}
    // When: {action}
    // Then: {expected}
    
    const scenarioRegex = /##\s+Scenario:\s+(.+)\n([\s\S]*?)(?=##\s+Scenario:|$)/g;
    
    let match;
    while ((match = scenarioRegex.exec(content)) !== null) {
      const name = match[1].trim();
      const body = match[2];
      
      const scenario: TestScenario = {
        name,
        given: this.parseList(body, 'Given'),
        when: this.parseSingle(body, 'When'),
        then: this.parseList(body, 'Then')
      };
      
      // Check for examples table
      const examples = this.parseExamples(body);
      if (examples) {
        scenario.examples = examples;
      }
      
      scenarios.push(scenario);
    }
    
    return scenarios;
  }
  
  private parseList(body: string, keyword: string): string[] {
    const items: string[] = [];
    const regex = new RegExp(`${keyword}:\\s*(.+?)\\n`, 'g');
    
    let match;
    while ((match = regex.exec(body)) !== null) {
      items.push(match[1].trim());
    }
    
    return items;
  }
  
  private parseSingle(body: string, keyword: string): string {
    const regex = new RegExp(`${keyword}:\\s*(.+?)\\n`);
    const match = body.match(regex);
    return match ? match[1].trim() : '';
  }
  
  private parseExamples(body: string): ExampleTable | null {
    // Match markdown table
    // | field1 | field2 |
    // |--------|--------|
    // | value1 | value2 |
    
    const tableRegex = /\|(.+)\|\n\|[-|\s]+\|\n((?:\|.+\|\n?)+)/;
    const match = body.match(tableRegex);
    
    if (!match) return null;
    
    const headers = match[1].split('|').map(h => h.trim()).filter(Boolean);
    const rows = match[2].trim().split('\n').map(row =>
      row.split('|').map(c => c.trim()).filter(Boolean)
    );
    
    return { headers, rows };
  }
}
```

#### 3. Test Spec Format Example

```markdown
# speclang-header lines:12
id: "@tests/auth/login"
version: 1.0.0
layer: 4
target: "@specs/auth#login"
tags: [auth, login, critical]
short: Login flow tests
---

# Login Tests

Tests for the authentication login flow.

## Scenario: Successful login with valid credentials

Given: a registered user with email "user@example.com"
Given: the user has password "correct-password"
When: the user submits login with email "user@example.com" and password "correct-password"
Then: the system returns a valid JWT token
Then: the token expires in 24 hours
Then: the last login timestamp is updated

## Scenario: Login fails with wrong password

Given: a registered user with email "user@example.com"
Given: the user has password "correct-password"
When: the user submits login with email "user@example.com" and password "wrong-password"
Then: the system returns 401 Unauthorized
Then: the error message is "Invalid credentials"
Then: the failed attempt counter is incremented

## Scenario: Account locked after too many failures

Given: a registered user with email "user@example.com"
Given: the user has 4 failed login attempts
When: the user submits login with wrong password
Then: the account is locked for 15 minutes
Then: the error message is "Account temporarily locked"

## Scenario: Parameterized password validation

Given: a password validation function
When: the password is validated
Then: validation result is correct

| password | is_valid | reason |
|----------|----------|--------|
| Abc123!@ | true | meets all requirements |
| abc123 | false | missing uppercase and special |
| ABCDEF | false | missing lowercase and numbers |
| Ab1! | false | too short |
```

#### 4. Test Code Generator (generator.ts)

```typescript
export class TestGenerator {
  generate(testSpec: TestSpec, language: 'typescript' | 'python' | 'go'): string {
    switch (language) {
      case 'typescript':
        return this.generateTypeScript(testSpec);
      case 'python':
        return this.generatePython(testSpec);
      case 'go':
        return this.generateGo(testSpec);
    }
  }
  
  private generateTypeScript(spec: TestSpec): string {
    const lines: string[] = [];
    
    lines.push(`// @speclang-generated from ${spec.id}`);
    lines.push(`// @speclang-target ${spec.target}`);
    lines.push('');
    lines.push(`import { describe, it, expect } from 'bun:test';`);
    lines.push(`import { ${this.getTargetModule(spec.target)} } from '${this.getTargetPath(spec.target)}';`);
    lines.push('');
    lines.push(`describe('${this.formatDescribe(spec.id)}', () => {`);
    
    for (const scenario of spec.scenarios) {
      if (scenario.examples) {
        lines.push(this.generateParameterizedTest(scenario));
      } else {
        lines.push(this.generateStandardTest(scenario));
      }
    }
    
    lines.push('});');
    
    return lines.join('\n');
  }
  
  private generateStandardTest(scenario: TestScenario): string {
    const lines: string[] = [];
    
    lines.push(`  it('${scenario.name}', async () => {`);
    
    // Given (setup)
    for (const given of scenario.given) {
      lines.push(`    // Given: ${given}`);
      lines.push(`    ${this.translateGiven(given)}`);
    }
    
    lines.push('');
    
    // When (action)
    lines.push(`    // When: ${scenario.when}`);
    lines.push(`    ${this.translateWhen(scenario.when)}`);
    
    lines.push('');
    
    // Then (assertions)
    for (const then of scenario.then) {
      lines.push(`    // Then: ${then}`);
      lines.push(`    ${this.translateThen(then)}`);
    }
    
    lines.push('  });');
    lines.push('');
    
    return lines.join('\n');
  }
  
  private generateParameterizedTest(scenario: TestScenario): string {
    const lines: string[] = [];
    
    lines.push(`  describe('${scenario.name}', () => {`);
    
    for (const row of scenario.examples!.rows) {
      const testName = row.join(' - ');
      lines.push(`    it('${testName}', async () => {`);
      
      // Generate test using row values
      lines.push(`      const params = {`);
      for (let i = 0; i < scenario.examples!.headers.length; i++) {
        lines.push(`        ${scenario.examples!.headers[i]}: ${JSON.stringify(row[i])},`);
      }
      lines.push(`      };`);
      
      lines.push(`      ${this.translateWhen(scenario.when)}`);
      lines.push(`      ${this.translateThen(scenario.then[0])}`);
      lines.push(`    });`);
    }
    
    lines.push('  });');
    lines.push('');
    
    return lines.join('\n');
  }
  
  private translateGiven(given: string): string {
    // Translate natural language to code
    // "a registered user with email X" -> code to create user
    if (given.includes('registered user')) {
      const emailMatch = given.match(/email "([^"]+)"/);
      const email = emailMatch ? emailMatch[1] : 'test@example.com';
      return `const user = await createTestUser({ email: '${email}' });`;
    }
    
    if (given.includes('failed login attempts')) {
      const countMatch = given.match(/(\d+) failed/);
      const count = countMatch ? countMatch[1] : '0';
      return `await setFailedAttempts(user.id, ${count});`;
    }
    
    return `// TODO: Implement setup: ${given}`;
  }
  
  private translateWhen(when: string): string {
    if (when.includes('submits login')) {
      const emailMatch = when.match(/email "([^"]+)"/);
      const passwordMatch = when.match(/password "([^"]+)"/);
      const email = emailMatch ? emailMatch[1] : '';
      const password = passwordMatch ? passwordMatch[1] : '';
      return `const result = await login('${email}', '${password}');`;
    }
    
    if (when.includes('validated')) {
      return `const result = validatePassword(params.password);`;
    }
    
    return `// TODO: Implement action: ${when}`;
  }
  
  private translateThen(then: string): string {
    if (then.includes('returns') && then.includes('JWT')) {
      return `expect(result.token).toBeDefined();`;
    }
    
    if (then.includes('401')) {
      return `expect(result.status).toBe(401);`;
    }
    
    if (then.includes('error message')) {
      const msgMatch = then.match(/"([^"]+)"/);
      const msg = msgMatch ? msgMatch[1] : '';
      return `expect(result.error).toBe('${msg}');`;
    }
    
    if (then.includes('token expires')) {
      const hoursMatch = then.match(/(\d+) hours/);
      const hours = hoursMatch ? hoursMatch[1] : '24';
      return `expect(result.expiresIn).toBe(${hours} * 60 * 60);`;
    }
    
    if (then.includes('account is locked')) {
      const minutesMatch = then.match(/(\d+) minutes/);
      const minutes = minutesMatch ? minutesMatch[1] : '15';
      return `expect(result.lockedUntil).toBeGreaterThan(Date.now() + ${minutes} * 60 * 1000);`;
    }
    
    return `// TODO: Implement assertion: ${then}`;
  }
}
```

#### 5. Test Runner (runner.ts)

```typescript
export class TestRunner {
  async runTestSpec(specPath: string): Promise<TestReport> {
    const parser = new TestSpecParser();
    const content = await fs.readFile(specPath, 'utf-8');
    const testSpec = parser.parse(content);
    
    // Generate test file
    const generator = new TestGenerator();
    const testCode = generator.generate(testSpec, 'typescript');
    
    // Write to temp file
    const testPath = specPath.replace('.test.spec.md', '.generated.test.ts');
    await fs.writeFile(testPath, testCode);
    
    // Run tests
    const results = await this.executeTests(testPath);
    
    return {
      specId: testSpec.id,
      totalScenarios: testSpec.scenarios.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      duration: results.reduce((sum, r) => sum + r.duration, 0),
      results
    };
  }
  
  private async executeTests(testPath: string): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    // Run bun test and parse output
    const output = await exec(`bun test ${testPath} --reporter=json`);
    const testOutput = JSON.parse(output);
    
    for (const test of testOutput.tests || []) {
      results.push({
        specId: test.file,
        scenarioName: test.name,
        status: test.status,
        duration: test.duration,
        error: test.error,
        timestamp: Date.now()
      });
    }
    
    return results;
  }
  
  async runAllTestSpecs(dir: string): Promise<TestReport[]> {
    const files = await this.findTestSpecs(dir);
    return Promise.all(files.map(f => this.runTestSpec(f)));
  }
  
  private async findTestSpecs(dir: string): Promise<string[]> {
    const pattern = path.join(dir, '**/*.test.spec.md');
    return glob.sync(pattern);
  }
}
```

#### 6. Result Sync (sync.ts)

```typescript
export class TestResultSync {
  async syncResultsToSpec(specPath: string, report: TestReport): Promise<void> {
    const content = await fs.readFile(specPath, 'utf-8');
    
    // Add result markers to each scenario
    let updated = content;
    
    for (const result of report.results) {
      const scenarioMarker = `## Scenario: ${result.scenarioName}`;
      const statusMarker = `\n<!-- @test-status: ${result.status} (${result.duration}ms) -->`;
      
      updated = updated.replace(
        scenarioMarker,
        scenarioMarker + statusMarker
      );
    }
    
    // Add summary at end
    const summary = `
---

<!-- @test-report
passed: ${report.passed}
failed: ${report.failed}
skipped: ${report.skipped}
duration: ${report.duration}ms
timestamp: ${new Date().toISOString()}
-->
`;
    
    updated += summary;
    
    await fs.writeFile(specPath, updated);
  }
  
  async updateAllSpecs(dir: string, reports: TestReport[]): Promise<void> {
    for (const report of reports) {
      const specPath = await this.findSpecForReport(report);
      if (specPath) {
        await this.syncResultsToSpec(specPath, report);
      }
    }
  }
}
```

#### 7. Reporter (reporter.ts)

```typescript
export class TestSpecReporter {
  formatReport(report: TestReport): string {
    const lines: string[] = [];
    
    lines.push(`Test Report: ${report.specId}`);
    lines.push('─'.repeat(40));
    lines.push(`Scenarios: ${report.totalScenarios}`);
    lines.push(`  ✓ Passed: ${report.passed}`);
    lines.push(`  ✗ Failed: ${report.failed}`);
    lines.push(`  ○ Skipped: ${report.skipped}`);
    lines.push(`Duration: ${report.duration}ms`);
    lines.push('');
    
    for (const result of report.results) {
      const icon = result.status === 'passed' ? '✓' : 
                   result.status === 'failed' ? '✗' : '○';
      lines.push(`  ${icon} ${result.scenarioName} (${result.duration}ms)`);
      
      if (result.error) {
        lines.push(`    Error: ${result.error}`);
      }
    }
    
    return lines.join('\n');
  }
  
  formatSummary(reports: TestReport[]): string {
    const totals = reports.reduce((acc, r) => ({
      total: acc.total + r.totalScenarios,
      passed: acc.passed + r.passed,
      failed: acc.failed + r.failed,
      skipped: acc.skipped + r.skipped,
      duration: acc.duration + r.duration
    }), { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 });
    
    return `
Test Summary
════════════════════════════════════════
Specs: ${reports.length}
Scenarios: ${totals.total}
  ✓ Passed: ${totals.passed}
  ✗ Failed: ${totals.failed}
  ○ Skipped: ${totals.skipped}
Duration: ${totals.duration}ms
`.trim();
  }
}
```

#### 8. CLI Integration

```bash
# Run test specs
speclang test run specs/auth.test.spec.md

# Run all test specs
speclang test run-all

# Generate test code without running
speclang test generate specs/auth.test.spec.md --output tests/auth.test.ts

# Sync results back to specs
speclang test sync
```

## Test Cases
1. Parse test spec with scenarios
2. Parse parameterized tests with examples
3. Generate TypeScript test code
4. Generate Python test code
5. Run tests and capture results
6. Sync results back to spec
7. Report passed/failed correctly
8. Handle missing setup code gracefully

## Validation
```bash
bun test tests/test-specs.test.ts

# Test the parser
speclang test parse specs/auth.test.spec.md

# Generate and run
speclang test run specs/auth.test.spec.md
```

## Output Format
After completing, output:
1. Files created
2. Test spec format summary
3. Generated test example
4. Test results
