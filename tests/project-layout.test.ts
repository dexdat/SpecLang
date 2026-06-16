/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Tests for Project Layout module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';

import {
  initProject,
  formatInitResult,
  validateProject,
  isProjectValid,
  getValidationSummary,
  findProjectRoot,
  buildProjectStructure,
  loadProjectLayoutConfig,
  isSpeclangProject,
  generateProjectScl,
  generateSpeclangRc,
  generateGitignore,
  generateInitialSpec,
  generateInitialTestSpec,
  getDefaultProjectSclVars,
  getDefaultSpeclangRcVars,
  DEFAULT_PROJECT_STRUCTURE
} from '../src/project-layout/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Project Layout Module', () => {
  // Test temp directory
  let testDir: string;
  
  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-test-'));
  });
  
  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
  
  // ==========================================================================
  // Init Command Tests
  // ==========================================================================
  
  describe('initProject', () => {
    it('should create project with default options', async () => {
      const result = await initProject({
        name: 'test-project',
        targetDir: testDir,
        initGit: false,
        json: true
      });
      
      expect(result.success).toBe(true);
      expect(result.projectRoot).toBe(path.join(testDir, 'test-project'));
      expect(result.filesCreated).toContain('project.scl');
      expect(result.filesCreated).toContain('.speclangrc');
      expect(result.filesCreated).toContain('.gitignore');
      expect(result.errors).toHaveLength(0);
    });
    
    it('should create project in current directory with "."', async () => {
      const result = await initProject({
        name: '.',
        targetDir: testDir,
        initGit: false,
        json: true
      });
      
      expect(result.success).toBe(true);
      expect(result.projectRoot).toBe(testDir);
    });
    
    it('should create project with custom targets', async () => {
      const result = await initProject({
        name: 'multi-target',
        targetDir: testDir,
        targets: ['typescript', 'python', 'go'],
        initGit: false,
        json: true
      });
      
      expect(result.success).toBe(true);
      
      // Verify project.scl contains targets
      const projectScl = fs.readFileSync(
        path.join(testDir, 'multi-target', 'project.scl'),
        'utf-8'
      );
      expect(projectScl).toContain('typescript');
      expect(projectScl).toContain('python');
      expect(projectScl).toContain('go');
    });
    
    it('should create project with custom description and version', async () => {
      const result = await initProject({
        name: 'custom-project',
        targetDir: testDir,
        description: 'My custom project',
        version: '2.0.0',
        initGit: false,
        json: true
      });
      
      expect(result.success).toBe(true);
      
      const projectScl = fs.readFileSync(
        path.join(testDir, 'custom-project', 'project.scl'),
        'utf-8'
      );
      expect(projectScl).toContain('My custom project');
      expect(projectScl).toContain('2.0.0');
    });
    
    it('should fail when project already exists without force', async () => {
      // Create project first
      await initProject({
        name: 'existing',
        targetDir: testDir,
        initGit: false
      });
      
      // Try to create again
      const result = await initProject({
        name: 'existing',
        targetDir: testDir,
        initGit: false,
        force: false
      });
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    it('should overwrite with force flag', async () => {
      // Create project first
      await initProject({
        name: 'force-test',
        targetDir: testDir,
        initGit: false
      });
      
      // Modify project.scl
      fs.writeFileSync(
        path.join(testDir, 'force-test', 'project.scl'),
        '# Modified'
      );
      
      // Create again with force
      const result = await initProject({
        name: 'force-test',
        targetDir: testDir,
        initGit: false,
        force: true
      });
      
      expect(result.success).toBe(true);
    });
    
    it('should create directory structure', async () => {
      await initProject({
        name: 'dir-struct',
        targetDir: testDir,
        initGit: false
      });
      
      const projectRoot = path.join(testDir, 'dir-struct');
      
      expect(fs.existsSync(path.join(projectRoot, 'specs'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, 'tests'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, 'generated'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.speclang'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.speclang', 'locks'))).toBe(true);
    });
    
    it('should create initial spec and test files', async () => {
      await initProject({
        name: 'my-awesome-app',
        targetDir: testDir,
        initGit: false
      });
      
      const projectRoot = path.join(testDir, 'my-awesome-app');
      
      expect(fs.existsSync(path.join(projectRoot, 'specs', 'my-awesome-app.scl'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, 'tests', 'my-awesome-app.test.spec.scl'))).toBe(true);
    });
  });
  
  // ==========================================================================
  // Validation Tests
  // ==========================================================================
  
  describe('validateProject', () => {
    it('should validate a newly created project', async () => {
      await initProject({
        name: 'valid-project',
        targetDir: testDir,
        initGit: false
      });
      
      const result = validateProject(path.join(testDir, 'valid-project'));
      
      expect(result.valid).toBe(true);
      expect(result.structure).toBeDefined();
    });
    
    it('should return error for non-existent project', () => {
      const result = validateProject('/non/existent/path');
      
      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.code === 'NO_PROJECT_ROOT')).toBe(true);
    });
    
    it('should return error when missing north star', () => {
      fs.mkdirSync(path.join(testDir, 'empty-project'));
      
      const result = validateProject(path.join(testDir, 'empty-project'));
      
      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.code === 'MISSING_NORTH_STAR')).toBe(true);
    });
    
    it('should return warnings for missing optional dirs', async () => {
      await initProject({
        name: 'minimal-project',
        targetDir: testDir,
        initGit: false
      });
      
      // Remove optional directories
      fs.rmSync(path.join(testDir, 'minimal-project', 'generated'), { recursive: true });
      
      const result = validateProject(path.join(testDir, 'minimal-project'));
      
      expect(result.issues.some(i => i.code === 'MISSING_GENERATED_DIR')).toBe(true);
    });
  });
  
  describe('isProjectValid', () => {
    it('should return true for valid project', async () => {
      await initProject({
        name: 'valid-check',
        targetDir: testDir,
        initGit: false
      });
      
      expect(isProjectValid(path.join(testDir, 'valid-check'))).toBe(true);
    });
    
    it('should return false for invalid project', () => {
      expect(isProjectValid('/invalid/path')).toBe(false);
    });
  });
  
  describe('getValidationSummary', () => {
    it('should format validation result', async () => {
      await initProject({
        name: 'summary-test',
        targetDir: testDir,
        initGit: false
      });
      
      const result = validateProject(path.join(testDir, 'summary-test'));
      const summary = getValidationSummary(result);
      
      expect(summary).toContain('valid');
    });
  });
  
  // ==========================================================================
  // Config Tests
  // ==========================================================================
  
  describe('findProjectRoot', () => {
    it('should find project root from nested directory', async () => {
      await initProject({
        name: 'nested-project',
        targetDir: testDir,
        initGit: false
      });
      
      const nestedDir = path.join(testDir, 'nested-project', 'specs', 'auth');
      fs.mkdirSync(nestedDir, { recursive: true });
      
      const root = findProjectRoot(nestedDir);
      
      expect(root).toBe(path.join(testDir, 'nested-project'));
    });
    
    it('should return null for non-project directory', () => {
      const root = findProjectRoot(testDir);
      
      expect(root).toBeNull();
    });
  });
  
  describe('buildProjectStructure', () => {
    it('should build correct structure', () => {
      const structure = buildProjectStructure('/test/project');
      
      expect(structure.root).toBe('/test/project');
      expect(structure.specs).toBe('/test/project/specs');
      expect(structure.tests).toBe('/test/project/tests');
      expect(structure.generated).toBe('/test/project/generated');
      expect(structure.speclang).toBe('/test/project/.speclang');
      expect(structure.northStar).toBe('/test/project/project.scl');
      expect(structure.config).toBe('/test/project/.speclangrc');
      expect(structure.gitignore).toBe('/test/project/.gitignore');
    });
  });
  
  describe('loadProjectLayoutConfig', () => {
    it('should load config for valid project', async () => {
      await initProject({
        name: 'config-test',
        targetDir: testDir,
        initGit: false
      });
      
      const config = loadProjectLayoutConfig(path.join(testDir, 'config-test'));
      
      expect(config).not.toBeNull();
      expect(config?.projectRoot).toBe(path.join(testDir, 'config-test'));
      expect(config?.speclangrc).toBeDefined();
      expect(config?.layout).toBeDefined();
    });
    
    it('should return null for invalid project', () => {
      const config = loadProjectLayoutConfig('/invalid/path');
      
      expect(config).toBeNull();
    });
  });
  
  describe('isSpeclangProject', () => {
    it('should return true for speclang project', async () => {
      await initProject({
        name: 'is-speclang',
        targetDir: testDir,
        initGit: false
      });
      
      expect(isSpeclangProject(path.join(testDir, 'is-speclang'))).toBe(true);
    });
    
    it('should return false for non-speclang directory', () => {
      expect(isSpeclangProject(testDir)).toBe(false);
    });
  });
  
  // ==========================================================================
  // Template Tests
  // ==========================================================================
  
  describe('Template Generation', () => {
    describe('generateProjectScl', () => {
      it('should generate valid project.scl content', () => {
        const vars = getDefaultProjectSclVars('test-app');
        const content = generateProjectScl(vars);
        
        expect(content).toContain('project.scl');
        expect(content).toContain('test-app');
        expect(content).toContain('speclang-header');
      });
      
      it('should include targets in output', () => {
        const vars = getDefaultProjectSclVars('test');
        vars.targets = ['typescript', 'python'];
        
        const content = generateProjectScl(vars);
        
        expect(content).toContain('typescript');
        expect(content).toContain('python');
      });
    });
    
    describe('generateSpeclangRc', () => {
      it('should generate valid .speclangrc content', () => {
        const vars = getDefaultSpeclangRcVars('.');
        const content = generateSpeclangRc(vars);
        
        expect(content).toContain('version: 1');
        expect(content).toContain('spec_dirs:');
        expect(content).toContain('generated_dir:');
      });
    });
    
    describe('generateGitignore', () => {
      it('should generate valid .gitignore content', () => {
        const content = generateGitignore();
        
        expect(content).toContain('generated/');
        expect(content).toContain('.speclang/');
        expect(content).toContain('node_modules/');
      });
    });
    
    describe('generateInitialSpec', () => {
      it('should generate valid initial spec', () => {
        const content = generateInitialSpec('my-feature');
        
        expect(content).toContain('speclang-header');
        expect(content).toContain('my-feature');
        expect(content).toContain('Entities');
        expect(content).toContain('Operations');
      });
      
      it('should sanitize name for block IDs', () => {
        const content = generateInitialSpec('My Feature!');
        
        expect(content).toContain('my-feature');
      });
    });
    
    describe('generateInitialTestSpec', () => {
      it('should generate valid test spec', () => {
        const content = generateInitialTestSpec('auth');
        
        expect(content).toContain('speclang-header');
        expect(content).toContain('Tests');
        expect(content).toContain('auth');
      });
    });
  });
  
  // ==========================================================================
  // Constants Tests
  // ==========================================================================
  
  describe('Constants', () => {
    it('should have correct default project structure', () => {
      expect(DEFAULT_PROJECT_STRUCTURE.northStar).toBe('project.scl');
      expect(DEFAULT_PROJECT_STRUCTURE.specs).toBe('specs');
      expect(DEFAULT_PROJECT_STRUCTURE.tests).toBe('tests');
      expect(DEFAULT_PROJECT_STRUCTURE.generated).toBe('generated');
      expect(DEFAULT_PROJECT_STRUCTURE.speclang).toBe('.speclang');
      expect(DEFAULT_PROJECT_STRUCTURE.config).toBe('.speclangrc');
      expect(DEFAULT_PROJECT_STRUCTURE.gitignore).toBe('.gitignore');
    });
  });
  
  // ==========================================================================
  // Format Result Tests
  // ==========================================================================
  
  describe('formatInitResult', () => {
    it('should format successful result', async () => {
      const result = await initProject({
        name: 'format-test',
        targetDir: testDir,
        initGit: false,
        json: true
      });
      
      const formatted = formatInitResult(result);
      
      expect(formatted).toContain('✅');
      expect(formatted).toContain('format-test');
    });
    
    it('should format failed result', async () => {
      const result = await initProject({
        name: 'fail-test',
        targetDir: testDir,
        initGit: false
      });
      
      // Force failure
      result.success = false;
      result.errors.push('Test error');
      
      const formatted = formatInitResult(result);
      
      expect(formatted).toContain('❌');
      expect(formatted).toContain('Test error');
    });
    
    it('should format JSON when requested', async () => {
      const result = await initProject({
        name: 'json-test',
        targetDir: testDir,
        initGit: false,
        json: true
      });
      
      const formatted = formatInitResult(result, true);
      
      expect(() => JSON.parse(formatted)).not.toThrow();
      expect(JSON.parse(formatted).success).toBe(true);
    });
  });
});
