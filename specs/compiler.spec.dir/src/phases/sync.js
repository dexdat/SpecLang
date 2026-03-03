"use strict";
/**
 * SPECLANG-GENERATED: Sync Phase (Bidirectional Sync)
 * Source: @speclang/compiler.spec.dir/phases @compiler/detect-drift @compiler/sync-code-to-spec @compiler/sync-spec-to-code
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
exports.detectDrift = detectDrift;
exports.syncCodeToSpec = syncCodeToSpec;
exports.syncSpecToCode = syncSpecToCode;
const fs = __importStar(require("fs"));
function detectDrift(spec, files) {
    const specBlockIds = new Set(spec.nodes.map((b) => b.id));
    const codeBlockIds = new Set();
    for (const file of files) {
        try {
            const content = fs.readFileSync(file, 'utf-8');
            const markers = extractCodeMarkers(content);
            markers.forEach((m) => codeBlockIds.add(m));
        }
        catch {
            // File may not exist yet
        }
    }
    const specChanges = [];
    const codeChanges = [];
    for (const id of specBlockIds) {
        if (!codeBlockIds.has(id)) {
            specChanges.push(id);
        }
    }
    for (const id of codeBlockIds) {
        if (!specBlockIds.has(id)) {
            codeChanges.push(id);
        }
    }
    let status;
    if (specChanges.length > 0 && codeChanges.length === 0) {
        status = 'spec_ahead';
    }
    else if (codeChanges.length > 0 && specChanges.length === 0) {
        status = 'code_ahead';
    }
    else if (specChanges.length > 0 && codeChanges.length > 0) {
        status = 'code_ahead';
    }
    else {
        status = 'in_sync';
    }
    return { status, specChanges, codeChanges };
}
function syncCodeToSpec(code, blockId) {
    const markers = extractCodeMarkers(code);
    const logic = extractLogicFromCode(code);
    const proposedContent = `// @speclang-id: ${blockId}\n${logic}`;
    return {
        blockId,
        proposedContent,
    };
}
function syncSpecToCode(specBlock, artifacts) {
    const updates = [];
    for (const artifact of artifacts) {
        if (artifact.markers.includes(specBlock.id)) {
            const newContent = addSpeclangMarker(artifact.content, specBlock.id);
            updates.push({
                path: artifact.path,
                newContent,
                oldContent: artifact.content,
            });
        }
    }
    return updates;
}
function extractCodeMarkers(content) {
    const markerRegex = /@speclang-id:\s*(\S+)/g;
    const markers = [];
    let match;
    while ((match = markerRegex.exec(content)) !== null) {
        markers.push(match[1]);
    }
    return markers;
}
function extractLogicFromCode(code) {
    const lines = code.split('\n');
    const nonMarkerLines = lines.filter((line) => !line.includes('@speclang-id'));
    return nonMarkerLines.join('\n').trim();
}
function addSpeclangMarker(content, blockId) {
    if (content.includes('@speclang-id:')) {
        return content.replace(/@speclang-id:\s*\S+/, `@speclang-id: ${blockId}`);
    }
    return `// @speclang-id: ${blockId}\n${content}`;
}
//# sourceMappingURL=sync.js.map