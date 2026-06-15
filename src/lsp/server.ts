/**
 * SpecLang LSP Server — Language Server Protocol implementation for .spec.md files.
 *
 * Provides:
 *  - Diagnostic validation of spec headers (required fields: id, version, layer)
 *  - Full document sync (re-validates on open/change)
 *  - Go-to-definition for @ref: annotations
 *  - Initialize/shutdown lifecycle
 */

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  TextDocumentSyncKind,
  InitializeResult,
  Diagnostic,
  DiagnosticSeverity,
  Hover,
  MarkupContent,
  MarkupKind,
  CompletionItemKind,
  InsertTextFormat,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { parseReferences, resolveReference, resolveFileRef } from './references.js';
import { getSpecCompletions, getBlockCompletions, detectCompletionContext } from './completions.js';

export interface SpecHeader {
  id?: string;
  version?: string;
  layer?: string | number;
  tags?: string;
  agent_support?: string;
  short?: string;
  project_level?: string;
}

/**
 * Parse YAML-like frontmatter from a spec document.
 * SpecLang headers use simple YAML between --- markers at the top of the file.
 */
export function parseHeader(text: string): { header: SpecHeader; bodyStart: number } {
  const header: SpecHeader = {};
  let bodyStart = 0;

  // Check for opening ---
  const lines = text.split('\n');
  if (lines.length === 0 || lines[0].trim() !== '---') {
    return { header, bodyStart: 0 };
  }

  // Find closing ---
  let i = 1;
  for (; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      bodyStart = i + 1;
      break;
    }
    // Parse key: value
    const match = lines[i].match(/^(\w[\w-]*)\s*:\s*(.+)$/);
    if (match) {
      const key = match[1];
      const value = match[2].trim();
      switch (key) {
        case 'id':
          header.id = value.replace(/['"]/g, '');
          break;
        case 'version':
          header.version = value.replace(/['"]/g, '');
          break;
        case 'layer':
          header.layer = value;
          break;
        case 'tags':
          header.tags = value;
          break;
        case 'agent_support':
          header.agent_support = value;
          break;
        case 'short':
          header.short = value;
          break;
        case 'project_level':
          header.project_level = value;
          break;
      }
    }
  }

  return { header, bodyStart };
}

/**
 * Validate a spec document and produce diagnostics.
 */
function validateDiagnostics(textDocument: TextDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const text = textDocument.getText();
  const { header } = parseHeader(text);

  // Check required fields
  const requiredFields: Array<{ key: keyof SpecHeader; label: string; line: number }> = [
    { key: 'id', label: 'id', line: 0 },
    { key: 'version', label: 'version', line: 1 },
    { key: 'layer', label: 'layer', line: 2 },
  ];

  for (const field of requiredFields) {
    if (!header[field.key]) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: {
          start: { line: field.line, character: 0 },
          end: { line: field.line, character: 100 },
        },
        message: `Missing required header field: ${field.label}. SpecLang specs must define '${field.label}' in the YAML frontmatter.`,
        source: 'speclang',
      });
    }
  }

  // Validate layer is numeric if present
  if (header.layer !== undefined) {
    const layerNum = Number(header.layer);
    if (isNaN(layerNum)) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: {
          start: { line: 2, character: 0 },
          end: { line: 2, character: 100 },
        },
        message: `Layer must be a number, got: '${header.layer}'. Valid layers: 0-10.`,
        source: 'speclang',
      });
    }
  }

  return diagnostics;
}

/**
 * Start the LSP server on stdio.
 */
export function startServer(): void {
  const connection = createConnection(ProposedFeatures.all);
  const documents = new TextDocuments(TextDocument);
  let workspaceRoot: string = process.cwd();

  connection.onInitialize((params: InitializeParams): InitializeResult => {
    if (params.workspaceFolders && params.workspaceFolders.length > 0) {
      workspaceRoot = new URL(params.workspaceFolders[0].uri).pathname;
    }
    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Full,
        hoverProvider: true,
        completionProvider: {
          triggerCharacters: ['@', '#'],
          resolveProvider: false,
        },
        diagnosticProvider: {
          documentSelector: [{ language: 'speclang', pattern: '**/*.spec.md' }],
          interFileDependencies: false,
          workspaceDiagnostics: false,
        },
      },
    };
  });

  connection.onInitialized(() => {
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
  });

  // Validate on document open and change
  documents.onDidOpen((event) => {
    const diagnostics = validateDiagnostics(event.document);
    connection.sendDiagnostics({ uri: event.document.uri, diagnostics });
  });

  documents.onDidChangeContent((event) => {
    const diagnostics = validateDiagnostics(event.document);
    connection.sendDiagnostics({ uri: event.document.uri, diagnostics });
  });

  // Go-to-definition for @ref: annotations
  connection.onDefinition((params) => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc) return null;

    const text = doc.getText();
    const refs = parseReferences(text);

    const target = refs.find(r =>
      r.line === params.position.line &&
      params.position.character >= r.startChar &&
      params.position.character <= r.endChar
    );

    if (!target) return null;

    const location = resolveReference(target, workspaceRoot);
    if (!location) return null;

    return {
      uri: `file://${location.filePath}`,
      range: {
        start: { line: location.line, character: location.character },
        end: { line: location.line, character: location.character },
      },
    };
  });

  // Hover — show spec metadata when hovering over the header area
  connection.onHover((params): Hover | null => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc) return null;

    const text = doc.getText();
    const { header, bodyStart } = parseHeader(text);

    if (bodyStart === 0) return null;

    const line = params.position.line;
    if (line < 1 || line > bodyStart - 2) return null;

    const parts: string[] = ['**SpecLang Spec**'];

    if (header.id !== undefined) parts.push(`- **ID:** ${header.id}`);
    if (header.version !== undefined) parts.push(`- **Version:** ${header.version}`);
    if (header.layer !== undefined) parts.push(`- **Layer:** ${header.layer}`);
    if (header.tags !== undefined) parts.push(`- **Tags:** ${header.tags.replace(/^\[|\]$/g, '')}`);
    if (header.agent_support !== undefined) parts.push(`- **Agent Support:** ${header.agent_support}`);
    if (header.short !== undefined) parts.push(`- **Short:** ${header.short}`);
    if (header.project_level !== undefined) parts.push(`- **Project Level:** ${header.project_level}`);

    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: parts.join('\n'),
      },
    };
  });

  // Completion — autocomplete @ref: annotations
  connection.onCompletion((params) => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc) return [];

    const text = doc.getText();
    const lines = text.split('\n');
    const lineText = lines[params.position.line] || '';
    const textBeforeCursor = lineText.substring(0, params.position.character);

    const ctx = detectCompletionContext(textBeforeCursor);

    if (ctx.type === 'block') {
      const filePath = resolveFileRef(ctx.specId, workspaceRoot);
      if (!filePath) return [];
      const blocks = getBlockCompletions(filePath);
      if (ctx.partialBlock) {
        return blocks.filter((b) => b.label.startsWith(ctx.partialBlock));
      }
      return blocks;
    }

    if (ctx.type === 'spec') {
      const specs = getSpecCompletions(workspaceRoot);
      if (ctx.partialId) {
        return specs.filter((s) => s.label.startsWith(ctx.partialId));
      }
      return specs;
    }

    if (ctx.type === 'ref-prefix') {
      return [{
        label: '@ref:',
        kind: CompletionItemKind.Snippet,
        detail: 'Spec reference annotation',
        insertText: '@ref:',
        insertTextFormat: InsertTextFormat.PlainText,
      }];
    }

    return [];
  });

  connection.onShutdown(() => {
    // Cleanup if needed
  });

  // Make the text document manager listen on the connection
  documents.listen(connection);

  // Start listening
  connection.listen();
}
