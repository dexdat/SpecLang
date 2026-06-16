/**
 * SpecLang LSP Server — Language Server Protocol implementation for .spec.md files.
 *
 * Provides:
 *  - Diagnostic validation of spec headers (required fields: id, version, layer)
 *  - Full document sync (re-validates on open/change)
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
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

interface SpecHeader {
  id?: string;
  version?: string;
  layer?: string | number;
}

/**
 * Parse YAML-like frontmatter from a spec document.
 * SpecLang headers use simple YAML between --- markers at the top of the file.
 */
function parseHeader(text: string): { header: SpecHeader; bodyStart: number } {
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

  connection.onInitialize((_params: InitializeParams): InitializeResult => {
    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Full,
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

  connection.onShutdown(() => {
    // Cleanup if needed
  });

  // Make the text document manager listen on the connection
  documents.listen(connection);

  // Start listening
  connection.listen();
}
