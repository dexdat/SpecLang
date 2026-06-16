import { DocumentSymbol, SymbolKind, Range, Position } from 'vscode-languageserver-types';
import { parseHeader } from './server.js';

export interface BlockSymbol {
  name: string;
  kind: string;
  line: number;
  endLine: number;
}

export function parseBlocks(text: string): BlockSymbol[] {
  const lines = text.split('\n');
  const blocks: BlockSymbol[] = [];
  const blockRe = /^### @block:(\S+)(?:\s+@kind:(\S+))?/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(blockRe);
    if (match) {
      const name = match[1];
      const kind = match[2] ?? 'property';
      let endLine = lines.length - 1;
      for (let j = i + 1; j < lines.length; j++) {
        if (/^### @block:/.test(lines[j])) {
          endLine = j - 1;
          break;
        }
      }
      blocks.push({ name, kind, line: i, endLine });
    }
  }

  return blocks;
}

const KIND_MAP: Record<string, SymbolKind> = {
  entity: SymbolKind.Object,
  code: SymbolKind.Function,
  note: SymbolKind.String,
  directory: SymbolKind.Module,
};

export function getDocumentSymbols(text: string): DocumentSymbol[] {
  const lines = text.split('\n');
  const symbols: DocumentSymbol[] = [];
  const { bodyStart } = parseHeader(text);

  if (bodyStart > 0) {
    const headerEndLine = bodyStart - 1;
    symbols.push(
      DocumentSymbol.create(
        'Header',
        'SpecLang YAML frontmatter',
        SymbolKind.Namespace,
        Range.create(Position.create(1, 0), Position.create(headerEndLine, lines[headerEndLine]?.length ?? 0)),
        Range.create(Position.create(1, 0), Position.create(1, 0)),
      ),
    );
  }

  const blocks = parseBlocks(text);
  if (blocks.length > 0) {
    const children: DocumentSymbol[] = blocks.map((block) => {
      const kind = KIND_MAP[block.kind] ?? SymbolKind.Property;
      const startLine = block.line;
      const endLine = block.endLine;
      const nameOffset = lines[startLine].indexOf(`@block:${block.name}`) + 7;
      const endCol = lines[endLine]?.length ?? 0;
      return DocumentSymbol.create(
        block.name,
        `@kind:${block.kind}`,
        kind,
        Range.create(Position.create(startLine, 0), Position.create(endLine, endCol)),
        Range.create(Position.create(startLine, nameOffset), Position.create(startLine, nameOffset + block.name.length)),
      );
    });

    symbols.push(
      DocumentSymbol.create(
        'Blocks',
        `${blocks.length} block${blocks.length !== 1 ? 's' : ''}`,
        SymbolKind.Package,
        Range.create(
          Position.create(blocks[0].line, 0),
          Position.create(blocks[blocks.length - 1].endLine, lines[blocks[blocks.length - 1].endLine]?.length ?? 0),
        ),
        Range.create(
          Position.create(blocks[0].line, 0),
          Position.create(blocks[0].line, 0),
        ),
        children,
      ),
    );
  }

  return symbols;
}
