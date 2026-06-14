// SpecLang VSCode Extension — Activation Script
// Activates on .spec.md files, spawns the Speclang LSP server.

import * as path from 'path';
import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const config = vscode.workspace.getConfiguration('speclang.lsp');
  const serverPath: string = config.get('path', 'speclang-lsp');

  const serverOptions: ServerOptions = {
    command: serverPath,
    args: [],
    transport: TransportKind.stdio
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: 'file', language: 'speclang' }
    ],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/*.spec.md')
    }
  };

  client = new LanguageClient(
    'speclang',
    'SpecLang',
    serverOptions,
    clientOptions
  );

  // Handle configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('speclang.lsp.path')) {
        vscode.window.showInformationMessage(
          'SpecLang: LSP path changed. Restart the extension for it to take effect.'
        );
      }
    })
  );

  client.start();
  console.log('SpecLang LSP client started');
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
