# speclang-header lines:7
id: "@speclang/roadmap/poc/tests"
parent: "@ref:specs/roadmap/poc"version: 0.1.0
layer: 2
short: "Comprehensive test suite for POC"
tags: [poc, tests, testing, validation]
---

# POC: Test Suite

Complete test specification for POC.

## Test Structure

### @poc/tests/structure

```
tests/
├── unit/
│   ├── file-watcher.test.ts
│   ├── block-parser.test.ts
│   ├── templates.test.ts
│   ├── simple-agent.test.ts
│   └── code-generator.test.ts
├── integration/
│   ├── daemon.test.ts
│   ├── cascade.test.ts
│   └── end-to-end.test.ts
└── fixtures/
    ├── specs/
    │   ├── hello.spec.md
    │   └── complex.spec.md
    └── expected/
        └── hello.ts
```

## Unit Tests

### @poc/tests/file-watcher

**Test File**: `tests/unit/file-watcher.test.ts`

```typescript
describe('FileWatcher', () => {
  let watcher: FileWatcher;
  let tempDir: string;
  
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
    watcher = new FileWatcher();
  });
  
  afterEach(async () => {
    await watcher.stop();
    await fs.rm(tempDir, { recursive: true });
  });
  
  it('should detect file creation', async () => {
    const events: FileEvent[] = [];
    watcher.on('change', (e) => events.push(e));
    await watcher.watch(tempDir);
    
    await fs.writeFile(path.join(tempDir, 'test.md'), 'content');
    await wait(500);
    
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('created');
    expect(events[0].path).toContain('test.md');
  });
  
  it('should detect file modification', async () => {
    const filePath = path.join(tempDir, 'test.md');
    await fs.writeFile(filePath, 'initial');
    
    const events: FileEvent[] = [];
    watcher.on('change', (e) => events.push(e));
    await watcher.watch(tempDir);
    
    await fs.writeFile(filePath, 'modified');
    await wait(500);
    
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('modified');
  });
  
  it('should detect file deletion', async () => {
    const filePath = path.join(tempDir, 'test.md');
    await fs.writeFile(filePath, 'content');
    await watcher.watch(tempDir);
    
    const events: FileEvent[] = [];
    watcher.on('change', (e) => events.push(e));
    
    await fs.unlink(filePath);
    await wait(500);
    
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('deleted');
  });
  
  it('should debounce rapid changes', async () => {
    const events: FileEvent[] = [];
    watcher.on('change', (e) => events.push(e));
    await watcher.watch(tempDir);
    
    const filePath = path.join(tempDir, 'test.md');
    
    // Rapid edits
    await fs.writeFile(filePath, 'edit1');
    await fs.writeFile(filePath, 'edit2');
    await fs.writeFile(filePath, 'edit3');
    
    await wait(500);
    
    // Should only see 1 event (debounced)
    expect(events.length).toBeLessThanOrEqual(1);
  });
  
  it('should ignore files matching ignore patterns', async () => {
    const events: FileEvent[] = [];
    watcher.on('change', (e) => events.push(e));
    await watcher.watch(tempDir, { ignore: ['*.tmp'] });
    
    await fs.writeFile(path.join(tempDir, 'test.tmp'), 'content');
    await wait(500);
    
    expect(events).toHaveLength(0);
  });
});
```

### @poc/tests/block-parser

**Test File**: `tests/unit/block-parser.test.ts`

```typescript
describe('BlockParser', () => {
  let parser: BlockParser;
  
  beforeEach(() => {
    parser = new BlockParser();
  });
  
  it('should parse function block', () => {
    const markdown = `
### @block::greet @kind:function
Greets a user.

**Parameters:**
- name: string - User name

**Returns:** string - Greeting
`;
    
    const blocks = parser.parse(markdown);
    
    expect(blocks).toHaveLength(1);
    expect(blocks[0].id).toBe('greet');
    expect(blocks[0].kind).toBe('function');
    expect(blocks[0].parameters).toHaveLength(1);
    expect(blocks[0].parameters[0]).toEqual({
      name: 'name',
      type: 'string',
      description: 'User name',
      optional: false
    });
    expect(blocks[0].returns).toEqual({
      type: 'string',
      description: 'Greeting'
    });
  });
  
  it('should parse multiple blocks', () => {
    const markdown = `
### @block::foo @kind:function
Foo function.

### @block::bar @kind:class
Bar class.
`;
    
    const blocks = parser.parse(markdown);
    
    expect(blocks).toHaveLength(2);
    expect(blocks[0].id).toBe('foo');
    expect(blocks[1].id).toBe('bar');
  });
  
  it('should handle optional parameters', () => {
    const markdown = `
### @block::test @kind:function
Test function.

**Parameters:**
- name: string - Required param
- greeting?: string - Optional param
`;
    
    const blocks = parser.parse(markdown);
    
    expect(blocks[0].parameters[0].optional).toBe(false);
    expect(blocks[0].parameters[1].optional).toBe(true);
  });
  
  it('should parse class block', () => {
    const markdown = `
### @block::User @kind:class
User entity.

**Properties:**
- name: string - User name
- email: string - User email
`;
    
    const blocks = parser.parse(markdown);
    
    expect(blocks[0].kind).toBe('class');
    expect(blocks[0].id).toBe('User');
  });
  
  it('should handle block with no parameters', () => {
    const markdown = `
### @block::hello @kind:function
Say hello.
`;
    
    const blocks = parser.parse(markdown);
    
    expect(blocks[0].parameters).toHaveLength(0);
  });
  
  it('should parse code examples', () => {
    const markdown = `
### @block::greet @kind:function
Greets a user.

**Example:**
\`\`\`typescript
greet("Alice") // "Hello, Alice!"
\`\`\`
`;
    
    const blocks = parser.parse(markdown);
    
    expect(blocks[0].examples).toHaveLength(1);
    expect(blocks[0].examples[0].language).toBe('typescript');
    expect(blocks[0].examples[0].code).toContain('greet("Alice")');
  });
});
```

### @poc/tests/templates

**Test File**: `tests/unit/templates.test.ts`

```typescript
describe('Templates', () => {
  it('should generate function template', () => {
    const data: TemplateData = {
      id: 'greet',
      description: 'Greets a user',
      params: 'name: string',
      paramDocs: ' * @param name - User name',
      returnType: 'string',
      returnDoc: 'Greeting message',
      specRef: 'specs/hello.spec.md#greet'
    };
    
    const code = functionTemplate(data);
    
    expect(code).toContain('export function greet(name: string): string');
    expect(code).toContain('// SPECLANG-GENERATED');
    expect(code).toContain('Greets a user');
    expect(code).toContain('@param name');
  });
  
  it('should generate class template', () => {
    const data = { id: 'User', description: 'User class' };
    const code = classTemplate(data);
    
    expect(code).toContain('export class User');
    expect(code).toContain('User class');
  });
  
  it('should generate interface template', () => {
    const data = { 
      id: 'UserProps', 
      description: 'User properties',
      properties: '  name: string;  // User name'
    };
    const code = interfaceTemplate(data);
    
    expect(code).toContain('export interface UserProps');
    expect(code).toContain('name: string');
  });
  
  it('should handle empty parameters', () => {
    const data: TemplateData = {
      id: 'hello',
      description: 'Say hello',
      params: '',
      paramDocs: '',
      returnType: 'void',
      returnDoc: 'Nothing',
      specRef: 'specs/test.spec.md#hello'
    };
    
    const code = functionTemplate(data);
    
    expect(code).toContain('export function hello(): void');
  });
});
```

### @poc/tests/simple-agent

**Test File**: `tests/unit/simple-agent.test.ts`

```typescript
describe('SimpleAgent', () => {
  let agent: SimpleAgent;
  let tempDir: string;
  
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-test-'));
    agent = new SimpleAgent({ outputDir: tempDir });
  });
  
  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true });
  });
  
  it('should process file change and generate code', async () => {
    const specPath = path.join(tempDir, 'specs', 'test.spec.md');
    await fs.mkdir(path.dirname(specPath), { recursive: true });
    await fs.writeFile(specPath, `
# speclang-header lines:5
id: "@test/hello"
version: 1.0.0
---

### @block::greet @kind:function
Greets a user.

**Parameters:**
- name: string - User name

**Returns:** string - Greeting
`);
    
    const event: FileEvent = {
      type: 'modified',
      path: specPath,
      timestamp: Date.now()
    };
    
    await agent.onFileChanged(event);
    
    // Verify code was generated
    const codePath = path.join(tempDir, 'test.spec.dir', 'src', 'greet.ts');
    const exists = await fs.access(codePath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });
});
```

## Integration Tests

### @poc/tests/daemon-integration

**Test File**: `tests/integration/daemon.test.ts`

```typescript
describe('PocDaemon Integration', () => {
  let daemon: PocDaemon;
  let tempDir: string;
  
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'daemon-test-'));
    
    // Create directory structure
    await fs.mkdir(path.join(tempDir, 'specs'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
    
    daemon = new PocDaemon({
      watchDirectory: path.join(tempDir, 'specs'),
      outputDirectory: path.join(tempDir, 'src')
    });
  });
  
  afterEach(async () => {
    await daemon.stop();
    await fs.rm(tempDir, { recursive: true });
  });
  
  it('should start and watch for changes', async () => {
    await daemon.start();
    
    expect(daemon.isRunning).toBe(true);
  });
  
  it('should detect and process file changes', async () => {
    await daemon.start();
    
    // Create a spec file
    const specPath = path.join(tempDir, 'specs', 'test.spec.md');
    await fs.writeFile(specPath, `
# speclang-header lines:5
id: "@test/hello"
version: 1.0.0
---

### @block::greet @kind:function
Say hello.
`);
    
    // Wait for processing
    await wait(2000);
    
    // Verify code was generated
    const codePath = path.join(tempDir, 'src', 'test', 'greet.ts');
    const exists = await fs.access(codePath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });
});
```

### @poc/tests/cascade

**Test File**: `tests/integration/cascade.test.ts`

```typescript
describe('Cascade Flow', () => {
  it('should complete full cascade', async () => {
    // Create temp project
    const tempDir = await setupTempProject();
    
    // Create daemon
    const daemon = new PocDaemon({
      watchDirectory: path.join(tempDir, 'specs'),
      outputDirectory: path.join(tempDir, 'src')
    });
    
    // Track convergence
    let convergenceEvent: ConvergenceEvent | null = null;
    daemon.on('converged', (e) => {
      convergenceEvent = e;
    });
    
    await daemon.start();
    
    // Create spec
    await createSpec(tempDir, 'hello.spec.md', greetSpec);
    
    // Wait for convergence
    await waitForConvergence(daemon, 10000);
    
    // Verify
    expect(convergenceEvent).toBeTruthy();
    expect(convergenceEvent!.filesChanged).toHaveLength(1);
    expect(convergenceEvent!.duration).toBeLessThan(5000);
    
    // Verify code generated
    const codeExists = await fs.access(
      path.join(tempDir, 'src', 'hello', 'greet.ts')
    ).then(() => true).catch(() => false);
    expect(codeExists).toBe(true);
    
    // Cleanup
    await daemon.stop();
    await fs.rm(tempDir, { recursive: true });
  });
});
```

### @poc/tests/end-to-end

**Test File**: `tests/integration/end-to-end.test.ts`

```typescript
describe('End-to-End Happy Path', () => {
  it('should complete demo workflow', async () => {
    // 1. Setup
    const project = await createTempProject();
    const daemon = await startDaemon(project);
    
    // 2. User creates spec
    await fs.writeFile(
      path.join(project, 'specs', 'greeting.spec.md'),
      greetingSpec
    );
    
    // 3. Wait for cascade
    await waitForConvergence(daemon, 10000);
    
    // 4. Verify code exists
    const codePath = path.join(project, 'src', 'greeting', 'greet.ts');
    const code = await fs.readFile(codePath, 'utf-8');
    
    expect(code).toContain('export function greet');
    expect(code).toContain('// SPECLANG-GENERATED');
    
    // 5. Verify it builds
    const buildResult = await exec('npm run build', { cwd: project });
    expect(buildResult.code).toBe(0);
    
    // 6. Cleanup
    await daemon.stop();
    await cleanup(project);
  });
});
```

## Test Fixtures

### @poc/tests/fixtures

**Simple Spec** (`tests/fixtures/specs/hello.spec.md`):
```markdown
# speclang-header lines:5
id: "@test/hello"
version: 1.0.0
---

### @block::greet @kind:function
Greets a user.

**Parameters:**
- name: string - User's name

**Returns:** string - Greeting message
```

**Complex Spec** (`tests/fixtures/specs/complex.spec.md`):
```markdown
# speclang-header lines:10
id: "@test/complex"
version: 1.0.0
---

### @block::calculateTotal @kind:function
Calculate total price.

**Parameters:**
- price: number - Unit price
- quantity: number - Quantity
- tax?: number - Tax rate (optional)

**Returns:** number - Total price

### @block::Order @kind:class
Order entity.

**Properties:**
- items: OrderItem[] - Order items
- total: number - Order total
- status: OrderStatus - Order status

### @block::OrderStatus @kind:enum
Order status values.

**Values:**
- pending - Order is pending
- confirmed - Order confirmed
- shipped - Order shipped
```

## Test Commands

### @poc/tests/commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage

# Run specific test
npx vitest run tests/unit/block-parser.test.ts

# Run tests in watch mode
npx vitest --watch
```

## Success Criteria

### @poc/tests/success

**All tests must pass:**
- ✅ 90%+ code coverage
- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ End-to-end happy path passes
- ✅ Build succeeds after tests
