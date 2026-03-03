"use strict";
/**
 * SPECLANG-GENERATED: Parse Phase
 * Source: @speclang/compiler.spec.dir/phases @compiler/parse
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePhase = parsePhase;
exports.parse = parse;
const fs = __importStar(require("fs"));
const errors_1 = require("./errors");
async function parsePhase(sources) {
    const graph = {
        nodes: [],
        edges: [],
        headers: {},
        errors: [],
        sources: [],
    };
    for (const source of sources) {
        try {
            const content = await fs.promises.readFile(source, 'utf-8');
            const parsed = parseSpecContent(content, source);
            graph.nodes.push(...parsed.blocks);
            graph.edges.push(...parsed.references);
            graph.headers[parsed.metadata.id] = parsed.metadata;
            graph.sources.push(source);
        }
        catch (err) {
            const error = (0, errors_1.createError)('E005', `Failed to parse ${source}: ${err.message}`, { file: source, line: 1, column: 1 });
            graph.errors.push(error);
        }
    }
    return graph;
}
function parseSpecContent(content, filepath) {
    const lines = content.split('\n');
    let headerLines = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '---') {
            headerLines = i + 1;
            break;
        }
    }
    if (headerLines === 0) {
        throw new Error('Missing header separator ---');
    }
    const metadata = parseHeader(lines.slice(1, headerLines - 1).join('\n'));
    const contentBody = lines.slice(headerLines).join('\n');
    const blocks = extractBlocks(contentBody, headerLines);
    const references = extractReferences(contentBody, filepath);
    return { metadata, blocks, references };
}
function parseHeader(headerText) {
    const lines = headerText.split('\n');
    const metadata = {};
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            continue;
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx === -1)
            continue;
        const key = trimmed.slice(0, colonIdx).trim();
        const rawValue = trimmed.slice(colonIdx + 1).trim();
        let value = rawValue;
        if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
            value = rawValue.slice(1, -1).split(',').map((v) => v.trim());
        }
        metadata[key] = value;
    }
    return metadata;
}
function extractBlocks(content, offset) {
    const blocks = [];
    const lines = content.split('\n');
    let currentBlock = null;
    let contentLines = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const blockMatch = line.match(/#\s*@block:(\S+)\s*@kind:(\S+)/);
        if (blockMatch) {
            if (currentBlock) {
                blocks.push({
                    id: currentBlock.id,
                    kind: currentBlock.kind,
                    content: contentLines.join('\n').trim(),
                    line: currentBlock.line,
                });
            }
            currentBlock = {
                id: blockMatch[1],
                kind: blockMatch[2],
                line: offset + i + 1,
            };
            contentLines = [];
        }
        else if (currentBlock) {
            contentLines.push(line);
        }
    }
    if (currentBlock) {
        blocks.push({
            id: currentBlock.id,
            kind: currentBlock.kind,
            content: contentLines.join('\n').trim(),
            line: currentBlock.line,
        });
    }
    return blocks;
}
function extractReferences(content, filepath) {
    const references = [];
    const refRegex = /@ref:(\S+)/g;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let match;
        while ((match = refRegex.exec(lines[i])) !== null) {
            references.push({
                ref: match[1],
                sourceFile: filepath,
                line: i + 1,
            });
        }
    }
    return references;
}
function parse(sources) {
    return parsePhase(sources);
}
//# sourceMappingURL=parse.js.map