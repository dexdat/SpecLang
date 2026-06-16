import { describe, it, expect } from 'vitest';
import { parseBlocks, getDocumentSymbols } from '../../src/lsp/symbols.js';
import { DocumentSymbol, SymbolKind } from 'vscode-languageserver-types';

describe('parseBlocks', () => {
  it('should return empty array for empty document', () => {
    expect(parseBlocks('')).toEqual([]);
  });

  it('should return empty array for document with no blocks', () => {
    const doc = [
      '---',
      'id: "@specs/test"',
      'version: "1.0.0"',
      'layer: 5',
      '---',
      '',
      '# Just a heading',
      'Some content without blocks.',
    ].join('\n');
    expect(parseBlocks(doc)).toEqual([]);
  });

  it('should parse a single block', () => {
    const doc = [
      '### @block:my-block @kind:code',
      'Some content',
      'More content',
    ].join('\n');
    const blocks = parseBlocks(doc);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].name).toBe('my-block');
    expect(blocks[0].kind).toBe('code');
    expect(blocks[0].line).toBe(0);
    expect(blocks[0].endLine).toBe(2);
  });

  it('should parse multiple blocks', () => {
    const doc = [
      '### @block:first @kind:entity',
      'Content of first',
      '### @block:second @kind:note',
      'Content of second',
      '### @block:third @kind:directory',
      'Content of third',
    ].join('\n');
    const blocks = parseBlocks(doc);

    expect(blocks).toHaveLength(3);
    expect(blocks[0].name).toBe('first');
    expect(blocks[0].line).toBe(0);
    expect(blocks[0].endLine).toBe(1);

    expect(blocks[1].name).toBe('second');
    expect(blocks[1].line).toBe(2);
    expect(blocks[1].endLine).toBe(3);

    expect(blocks[2].name).toBe('third');
    expect(blocks[2].line).toBe(4);
    expect(blocks[2].endLine).toBe(5);
  });

  it('should parse blocks with different kinds', () => {
    const doc = [
      '### @block:users @kind:entity',
      '### @block:main @kind:code',
      '### @block:notes @kind:note',
      '### @block:utils @kind:directory',
    ].join('\n');
    const blocks = parseBlocks(doc);
    expect(blocks).toHaveLength(4);
    expect(blocks[0].kind).toBe('entity');
    expect(blocks[1].kind).toBe('code');
    expect(blocks[2].kind).toBe('note');
    expect(blocks[3].kind).toBe('directory');
  });

  it('should default kind to "property" when @kind is missing', () => {
    const doc = [
      '### @block:unnamed',
      'Some content',
    ].join('\n');
    const blocks = parseBlocks(doc);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].name).toBe('unnamed');
    expect(blocks[0].kind).toBe('property');
  });

  it('should extend block to EOF when no subsequent block header', () => {
    const doc = [
      '### @block:only-one @kind:code',
      'line 1',
      'line 2',
      'line 3',
    ].join('\n');
    const blocks = parseBlocks(doc);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].endLine).toBe(3);
  });

  it('should handle extra whitespace after block header', () => {
    const doc = '### @block:spaced   @kind:entity   \ncontent';
    const blocks = parseBlocks(doc);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].name).toBe('spaced');
    expect(blocks[0].kind).toBe('entity');
  });
});

describe('getDocumentSymbols', () => {
  it('should return header section symbol when header exists', () => {
    const doc = [
      '---',
      'id: "@specs/test"',
      'version: "1.0.0"',
      'layer: 5',
      '---',
      '',
      'Some body content',
    ].join('\n');
    const symbols = getDocumentSymbols(doc);

    const headerSymbol = symbols.find((s) => s.name === 'Header');
    expect(headerSymbol).toBeDefined();
    expect(headerSymbol!.kind).toBe(SymbolKind.Namespace);
    expect(headerSymbol!.detail).toBe('SpecLang YAML frontmatter');
  });

  it('should not include header section when document has no header', () => {
    const doc = '# No frontmatter\n\nJust content.';
    const symbols = getDocumentSymbols(doc);
    const headerSymbol = symbols.find((s) => s.name === 'Header');
    expect(headerSymbol).toBeUndefined();
  });

  it('should return blocks container with children', () => {
    const doc = [
      '---',
      'id: "@specs/test"',
      'version: "1.0.0"',
      'layer: 5',
      '---',
      '',
      '### @block:users @kind:entity',
      'User entity definition',
      '### @block:login @kind:code',
      'Login logic',
    ].join('\n');
    const symbols = getDocumentSymbols(doc);

    const blocksContainer = symbols.find((s) => s.name === 'Blocks');
    expect(blocksContainer).toBeDefined();
    expect(blocksContainer!.kind).toBe(SymbolKind.Package);
    expect(blocksContainer!.children).toHaveLength(2);
  });

  it('should assign correct SymbolKind per block kind', () => {
    const doc = [
      '### @block:users @kind:entity',
      '### @block:main @kind:code',
      '### @block:notes @kind:note',
      '### @block:utils @kind:directory',
    ].join('\n');
    const symbols = getDocumentSymbols(doc);
    const blocksContainer = symbols.find((s) => s.name === 'Blocks');
    const children = blocksContainer!.children!;

    expect(children[0].kind).toBe(SymbolKind.Object);
    expect(children[1].kind).toBe(SymbolKind.Function);
    expect(children[2].kind).toBe(SymbolKind.String);
    expect(children[3].kind).toBe(SymbolKind.Module);
  });

  it('should default block kind to Property for missing @kind', () => {
    const doc = [
      '### @block:mystery',
      'Content',
    ].join('\n');
    const symbols = getDocumentSymbols(doc);
    const blocksContainer = symbols.find((s) => s.name === 'Blocks');
    expect(blocksContainer!.children![0].kind).toBe(SymbolKind.Property);
  });

  it('should set correct names on child symbols', () => {
    const doc = [
      '### @block:alpha @kind:entity',
      '### @block:beta @kind:code',
    ].join('\n');
    const symbols = getDocumentSymbols(doc);
    const blocksContainer = symbols.find((s) => s.name === 'Blocks');
    const children = blocksContainer!.children!;

    expect(children[0].name).toBe('alpha');
    expect(children[1].name).toBe('beta');
  });

  it('should set detail to @kind:... on child symbols', () => {
    const doc = [
      '### @block:test @kind:entity',
    ].join('\n');
    const symbols = getDocumentSymbols(doc);
    const blocksContainer = symbols.find((s) => s.name === 'Blocks');
    expect(blocksContainer!.children![0].detail).toBe('@kind:entity');
  });

  it('should compute correct ranges for blocks', () => {
    const doc = [
      '### @block:first @kind:code',
      'line one',
      'line two',
      '### @block:second @kind:note',
      'line three',
    ].join('\n');
    const symbols = getDocumentSymbols(doc);
    const blocksContainer = symbols.find((s) => s.name === 'Blocks');
    const children = blocksContainer!.children!;

    expect(children[0].range.start.line).toBe(0);
    expect(children[0].range.end.line).toBe(2);
    expect(children[1].range.start.line).toBe(3);
    expect(children[1].range.end.line).toBe(4);
  });

  it('should work with realistic spec content', () => {
    const doc = [
      '---',
      'id: "@specs/auth"',
      'version: "1.0.0"',
      'layer: 5',
      'tags: [auth, security]',
      'short: Authentication specification',
      '---',
      '',
      '# Auth Spec',
      '',
      'This spec defines the authentication system.',
      '',
      '### @block:login @kind:code',
      'Handles user login flow.',
      '',
      '### @block:users @kind:entity',
      'User entity definition.',
      '',
      '### @block:notes @kind:note',
      'Implementation notes.',
    ].join('\n');
    const symbols = getDocumentSymbols(doc);

    expect(symbols).toHaveLength(2);

    const headerSymbol = symbols[0];
    expect(headerSymbol.name).toBe('Header');
    expect(headerSymbol.kind).toBe(SymbolKind.Namespace);

    const blocksContainer = symbols[1];
    expect(blocksContainer.name).toBe('Blocks');
    expect(blocksContainer.children).toHaveLength(3);

    const [login, users, notes] = blocksContainer.children!;
    expect(login.name).toBe('login');
    expect(login.kind).toBe(SymbolKind.Function);
    expect(login.detail).toBe('@kind:code');

    expect(users.name).toBe('users');
    expect(users.kind).toBe(SymbolKind.Object);
    expect(users.detail).toBe('@kind:entity');

    expect(notes.name).toBe('notes');
    expect(notes.kind).toBe(SymbolKind.String);
    expect(notes.detail).toBe('@kind:note');

    expect(login.range.start.line).toBe(12);
    expect(login.range.end.line).toBe(13);
    expect(users.range.start.line).toBe(15);
    expect(users.range.end.line).toBe(16);
    expect(notes.range.start.line).toBe(18);
    expect(notes.range.end.line).toBe(19);
  });
});
