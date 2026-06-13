/**
 * SPECLANG-GENERATED: Go package generator tests
 * Source: @speclang/compiler.spec.dir/go
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  GoPackageGenerator,
  createGoPackageGenerator,
  type GoPackageFile,
  type GoPackageOptions,
} from '../../src/compiler/go/generator';
import type { SpecField, SpecMethod } from '../../src/compiler/go/generator';

describe('GoPackageGenerator', () => {
  let pkgGen: GoPackageGenerator;

  beforeEach(() => {
    pkgGen = createGoPackageGenerator({
      module: 'github.com/test/mypackage',
      goVersion: '1.22',
      packageName: 'mypackage',
    });
  });

  describe('createGoPackageGenerator', () => {
    it('should create a GoPackageGenerator with default options', () => {
      const gen = createGoPackageGenerator();
      expect(gen).toBeInstanceOf(GoPackageGenerator);
      expect(gen.fileCount).toBe(0);
    });

    it('should create with custom module options', () => {
      const gen = createGoPackageGenerator({
        module: 'github.com/foo/bar',
        goVersion: '1.23',
        packageName: 'bar',
      });
      expect(gen.fileCount).toBe(0);
    });

    it('should create without go.mod generation', () => {
      const gen = createGoPackageGenerator({ addGoMod: false });
      const files = gen.generateAll();
      const hasGoMod = files.some(f => f.filename === 'go.mod');
      expect(hasGoMod).toBe(false);
    });
  });

  describe('addBlock', () => {
    it('should add a struct block as a .go file', () => {
      const fields: SpecField[] = [
        { name: 'id', type: 'UUID' },
        { name: 'name', type: 'String' },
      ];

      pkgGen.addBlock({
        name: 'User',
        package: 'mypackage',
        fields,
      });

      expect(pkgGen.fileCount).toBe(1);
      const files = pkgGen.generateAll();
      const goFiles = files.filter(f => f.filename.endsWith('.go'));
      expect(goFiles.length).toBe(1);
      expect(goFiles[0].filename).toBe('user.go');
      expect(goFiles[0].content).toContain('package mypackage');
      expect(goFiles[0].content).toContain('type User struct');
    });

    it('should add multiple blocks as separate files', () => {
      pkgGen.addBlock({
        name: 'User',
        package: 'mypackage',
        fields: [{ name: 'name', type: 'String' }],
      });
      pkgGen.addBlock({
        name: 'Product',
        package: 'mypackage',
        fields: [{ name: 'price', type: 'Float64' }],
      });

      expect(pkgGen.fileCount).toBe(2);
      const files = pkgGen.generateAll();
      const filenames = files.map(f => f.filename);
      expect(filenames).toContain('user.go');
      expect(filenames).toContain('product.go');
    });

    it('should handle blocks with methods', () => {
      const methods: SpecMethod[] = [
        {
          name: 'GetName',
          params: [],
          returns: ['string'],
        },
      ];

      pkgGen.addBlock({
        name: 'Widget',
        package: 'mypackage',
        fields: [{ name: 'name', type: 'String' }],
        methods,
      });

      const files = pkgGen.generateAll();
      const widgetFile = files.find(f => f.filename === 'widget.go');
      expect(widgetFile).toBeDefined();
      expect(widgetFile!.content).toContain('func (r *Widget) GetName() string');
    });
  });

  describe('addStruct', () => {
    it('should add a struct directly', () => {
      const fields: SpecField[] = [
        { name: 'email', type: 'String' },
        { name: 'age', type: 'Int' },
      ];

      pkgGen.addStruct('Person', fields);

      expect(pkgGen.fileCount).toBe(1);
      const files = pkgGen.generateAll();
      const personFile = files.find(f => f.filename === 'person.go');
      expect(personFile).toBeDefined();
      expect(personFile!.content).toContain('type Person struct');
      expect(personFile!.content).toContain('Email string');
      expect(personFile!.content).toContain('Age int');
    });

    it('should use custom package name', () => {
      pkgGen.addStruct('Config', [], 'configpkg');
      const files = pkgGen.generateAll();
      const configFile = files.find(f => f.filename === 'config.go');
      expect(configFile!.content).toContain('package configpkg');
    });
  });

  describe('addInterface', () => {
    it('should add an interface as a file', () => {
      const methods: SpecMethod[] = [
        {
          name: 'FindByID',
          params: [{ name: 'id', type: 'Int64' }],
          returns: ['string', 'error'],
        },
      ];

      pkgGen.addInterface('UserRepository', methods);

      expect(pkgGen.fileCount).toBe(1);
      const files = pkgGen.generateAll();
      const ifaceFile = files.find(f => f.filename === 'user_repository_interface.go');
      expect(ifaceFile).toBeDefined();
      expect(ifaceFile!.content).toContain('type UserRepository interface');
      expect(ifaceFile!.content).toContain('FindByID(id int64) (string, error)');
    });
  });

  describe('addFile', () => {
    it('should add a raw file', () => {
      pkgGen.addFile('helpers.go', 'package mypackage\n\nfunc Help() string {\n  return "help"\n}\n');
      expect(pkgGen.fileCount).toBe(1);
      expect(pkgGen.hasFile('helpers.go')).toBe(true);
    });

    it('should overwrite existing file', () => {
      pkgGen.addFile('same.go', '// version 1\n');
      pkgGen.addFile('same.go', '// version 2\n');
      const files = pkgGen.generateAll();
      const sameFile = files.find(f => f.filename === 'same.go');
      expect(sameFile!.content).toContain('version 2');
    });
  });

  describe('hasFile / removeFile', () => {
    it('should check file existence', () => {
      pkgGen.addFile('test.go', '');
      expect(pkgGen.hasFile('test.go')).toBe(true);
      expect(pkgGen.hasFile('missing.go')).toBe(false);
    });

    it('should remove a file', () => {
      pkgGen.addFile('remove_me.go', '');
      expect(pkgGen.fileCount).toBe(1);
      const removed = pkgGen.removeFile('remove_me.go');
      expect(removed).toBe(true);
      expect(pkgGen.fileCount).toBe(0);
    });

    it('should return false when removing non-existent file', () => {
      expect(pkgGen.removeFile('nope.go')).toBe(false);
    });
  });

  describe('generateGoMod', () => {
    it('should generate valid go.mod content', () => {
      const mod = pkgGen.generateGoMod();
      expect(mod).toContain('module github.com/test/mypackage');
      expect(mod).toContain('go 1.22');
    });
  });

  describe('generateAll', () => {
    it('should include go.mod by default', () => {
      pkgGen.addStruct('Empty', []);
      const files = pkgGen.generateAll();
      const goMod = files.find(f => f.filename === 'go.mod');
      expect(goMod).toBeDefined();
      expect(goMod!.content).toContain('module github.com/test/mypackage');
    });

    it('should return files sorted by filename', () => {
      pkgGen.addStruct('Zebra', []);
      pkgGen.addStruct('Alpha', []);
      const files = pkgGen.generateAll();
      const filenames = files.map(f => f.filename);
      expect(filenames.indexOf('alpha.go')).toBeLessThan(filenames.indexOf('zebra.go'));
    });

    it('should return empty array when no files added', () => {
      const gen = createGoPackageGenerator({ addGoMod: false });
      expect(gen.generateAll()).toEqual([]);
    });
  });

  describe('getGenerator', () => {
    it('should return the underlying GoCodeGenerator', () => {
      const gen = pkgGen.getGenerator();
      expect(gen.language).toBe('go');
      expect(gen.extension).toBe('.go');
    });
  });

  describe('clear', () => {
    it('should remove all files', () => {
      pkgGen.addStruct('A', []);
      pkgGen.addStruct('B', []);
      expect(pkgGen.fileCount).toBe(2);
      pkgGen.clear();
      expect(pkgGen.fileCount).toBe(0);
    });
  });
});
