"use strict";
/**
 * SPECLANG-GENERATED: Splitting strategies implementation
 * Source: @speclang/dynamic-split/strategy @block:split/logic
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
exports.ByTokenSplitStrategy = exports.BySectionSplitStrategy = exports.SmartSplitStrategy = exports.SplitStrategyBase = void 0;
exports.createStrategy = createStrategy;
const path = __importStar(require("path"));
const types_1 = require("./types");
const token_counter_1 = require("./token-counter");
/**
 * Base class for all splitting strategies
 */
class SplitStrategyBase {
    config;
    counter;
    constructor(config = {}) {
        this.config = { ...types_1.DEFAULT_SPLIT_CONFIG, ...config };
        this.counter = new token_counter_1.TokenCounter();
    }
    /**
     * Parse spec content into blocks
     */
    parseBlocks(content) {
        const lines = content.split('\n');
        const headerLines = [];
        const blocks = [];
        const otherLines = [];
        let inHeader = false;
        let inBlock = false;
        let currentBlock = null;
        let currentContent = [];
        // Block pattern: # @block:id @kind:kind
        const blockPattern = /^#+\s+@block:(\S+)\s+@kind:(\S+)/;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;
            // Check for header section (before first block or after ---)
            if (line.startsWith('# ') && !line.includes('@block:')) {
                inHeader = true;
            }
            // Check for block start
            const blockMatch = line.match(blockPattern);
            if (blockMatch) {
                // Save previous block
                if (currentBlock) {
                    currentBlock.content = currentContent.join('\n').trim();
                    blocks.push(currentBlock);
                }
                // Start new block
                currentBlock = {
                    id: blockMatch[1],
                    kind: blockMatch[2],
                    content: '',
                    line: lineNum,
                };
                currentContent = [];
                inBlock = true;
                inHeader = false;
            }
            else if (inBlock && currentBlock) {
                currentContent.push(line);
            }
            else if (!inBlock && !inHeader) {
                otherLines.push(line);
            }
        }
        // Save last block
        if (currentBlock) {
            currentBlock.content = currentContent.join('\n').trim();
            blocks.push(currentBlock);
        }
        // Extract header (first occurrence)
        const headerMatch = content.match(/^(# [^\n]+\n(?:---\n[\s\S]*?\n---)?)/);
        const header = headerMatch ? headerMatch[1] : '';
        return {
            header,
            blocks,
            otherContent: otherLines.join('\n'),
        };
    }
    /**
     * Calculate how many parts are needed
     */
    calculatePartCount(tokens) {
        const maxTokens = this.config.max_tokens - this.config.budget_overhead;
        const parts = Math.ceil(tokens / maxTokens);
        return Math.max(1, Math.min(parts, 10)); // Cap at 10 parts
    }
    /**
     * Generate parent index content
     */
    generateParentIndex(parentPath, children, metadata) {
        const parentId = metadata.id || this.pathToId(parentPath);
        const version = metadata.version || '1.0.0';
        // Generate children references
        const childrenRefs = children.map(child => {
            const childId = this.pathToId(child.path);
            return `  - @ref:${childId}`;
        }).join('\n');
        const short = metadata.short || `${parentId.split('/').pop()} (${children.length} sub-specs)`;
        // Generate header
        const headerLines = 10;
        const header = `# speclang-header lines:${headerLines}
id: ${parentId}
version: ${version}
children:
${childrenRefs}
short: "${short}"
---

This spec has been split. See ${path.basename(parentPath)}.dir/ for details.
`;
        return header;
    }
    /**
     * Generate child spec content
     */
    generateChildSpec(parentPath, childPath, content, part, totalParts, metadata, siblings) {
        const parentId = metadata.id || this.pathToId(parentPath);
        const childId = this.pathToId(childPath);
        const version = metadata.version || '1.0.0';
        // Build siblings section
        let siblingsSection = '';
        if (siblings?.prev || siblings?.next) {
            siblingsSection = '\nsiblings:';
            if (siblings.prev) {
                siblingsSection += `\n  prev: @ref:${this.pathToId(siblings.prev)}`;
            }
            if (siblings.next) {
                siblingsSection += `\n  next: @ref:${this.pathToId(siblings.next)}`;
            }
        }
        const headerLines = 8 + (siblingsSection ? 3 : 0);
        const header = `# speclang-header lines:${headerLines}
id: ${childId}
parent: @ref:${parentId}
part: ${part}/${totalParts}${siblingsSection}
short: "${this.generateShortDescription(content, part)}"
---

${content}
`;
        return header;
    }
    /**
     * Convert path to spec ID
     */
    pathToId(filePath) {
        // Convert path like "specs/auth/login.spec.yaml" to "@specs/auth/login"
        const normalized = filePath
            .replace(/^specs\//, '')
            .replace(/\.spec\.(yaml|md|ts)$/, '')
            .replace(/\.dir\//, '.dir/');
        return `@${normalized}`;
    }
    /**
     * Generate short description from content
     */
    generateShortDescription(content, part) {
        const firstLine = content.split('\n').find(line => line.trim().length > 0) || '';
        const cleaned = firstLine.replace(/^#+\s*/, '').substring(0, 50);
        return cleaned || `Part ${part}`;
    }
}
exports.SplitStrategyBase = SplitStrategyBase;
/**
 * Smart splitting strategy - groups related blocks together
 */
class SmartSplitStrategy extends SplitStrategyBase {
    split(specPath, content, metadata) {
        const { header, blocks, otherContent } = this.parseBlocks(content);
        const totalTokens = this.counter.count(content);
        // If under limit, no split needed
        if (totalTokens <= this.config.max_tokens) {
            return {
                split: false,
                originalPath: specPath,
                parent: {
                    path: specPath,
                    content,
                    part: 1,
                    totalParts: 1,
                },
                children: [],
                strategy: 'smart',
            };
        }
        // Group blocks into parts
        const parts = this.groupBlocks(blocks, otherContent, totalTokens);
        const totalParts = parts.length;
        // Generate directory path
        const dirPath = specPath.replace(/\.spec\.(yaml|md|ts)$/, '.spec.dir');
        // Generate children
        const children = parts.map((partContent, index) => {
            const partNum = index + 1;
            const childPath = `${dirPath}/part-${partNum}.spec.yaml`;
            // Determine siblings
            const siblings = {};
            if (index > 0) {
                siblings.prev = `${dirPath}/part-${index}.spec.yaml`;
            }
            if (index < parts.length - 1) {
                siblings.next = `${dirPath}/part-${index + 2}.spec.yaml`;
            }
            return {
                path: childPath,
                content: this.generateChildSpec(specPath, childPath, partContent, partNum, totalParts, metadata, siblings),
                part: partNum,
                totalParts,
            };
        });
        // Generate parent index
        const parentContent = this.generateParentIndex(specPath, children, metadata);
        return {
            split: true,
            originalPath: specPath,
            parent: {
                path: specPath,
                content: parentContent,
                part: 1,
                totalParts: 1,
            },
            children,
            strategy: 'smart',
        };
    }
    /**
     * Group blocks into balanced parts
     */
    groupBlocks(blocks, otherContent, totalTokens) {
        const maxTokens = this.config.max_tokens - this.config.budget_overhead;
        const parts = [];
        let currentPart = [];
        let currentTokens = 0;
        // Add non-block content to first part initially
        let remainingOther = otherContent;
        for (const block of blocks) {
            const blockTokens = this.counter.count(block.content);
            // If single block exceeds limit, split it
            if (blockTokens > maxTokens) {
                // Save current part
                if (currentPart.length > 0) {
                    parts.push(currentPart.join('\n\n'));
                    currentPart = [];
                    currentTokens = 0;
                }
                // Split oversized block
                const blockParts = this.splitBlockContent(block.content, maxTokens);
                parts.push(...blockParts);
                continue;
            }
            // Check if adding block would exceed limit
            if (currentTokens + blockTokens > maxTokens && currentPart.length > 0) {
                // Save current part
                parts.push(currentPart.join('\n\n'));
                currentPart = [];
                currentTokens = 0;
            }
            // Add block to current part
            const blockText = `## @block:${block.id} @kind:${block.kind}\n${block.content}`;
            currentPart.push(blockText);
            currentTokens += blockTokens;
        }
        // Add remaining content
        if (currentPart.length > 0) {
            parts.push(currentPart.join('\n\n'));
        }
        return parts.length > 0 ? parts : [remainingOther];
    }
    /**
     * Split block content that exceeds limit
     */
    splitBlockContent(content, maxTokens) {
        const lines = content.split('\n');
        const parts = [];
        let currentPart = [];
        let currentTokens = 0;
        for (const line of lines) {
            const lineTokens = this.counter.count(line);
            if (currentTokens + lineTokens > maxTokens && currentPart.length > 0) {
                parts.push(currentPart.join('\n'));
                currentPart = [];
                currentTokens = 0;
            }
            currentPart.push(line);
            currentTokens += lineTokens;
        }
        if (currentPart.length > 0) {
            parts.push(currentPart.join('\n'));
        }
        return parts;
    }
}
exports.SmartSplitStrategy = SmartSplitStrategy;
/**
 * By-section splitting strategy - splits at section boundaries
 */
class BySectionSplitStrategy extends SplitStrategyBase {
    split(specPath, content, metadata) {
        const totalTokens = this.counter.count(content);
        // If under limit, no split needed
        if (totalTokens <= this.config.max_tokens) {
            return {
                split: false,
                originalPath: specPath,
                parent: {
                    path: specPath,
                    content,
                    part: 1,
                    totalParts: 1,
                },
                children: [],
                strategy: 'by-section',
            };
        }
        // Split by h2 headers (##)
        const sections = this.splitBySections(content);
        const dirPath = specPath.replace(/\.spec\.(yaml|md|ts)$/, '.spec.dir');
        const totalParts = sections.length;
        const children = sections.map((section, index) => {
            const partNum = index + 1;
            const childPath = `${dirPath}/section-${partNum}.spec.yaml`;
            const siblings = {};
            if (index > 0) {
                siblings.prev = `${dirPath}/section-${index}.spec.yaml`;
            }
            if (index < sections.length - 1) {
                siblings.next = `${dirPath}/section-${index + 2}.spec.yaml`;
            }
            return {
                path: childPath,
                content: this.generateChildSpec(specPath, childPath, section, partNum, totalParts, metadata, siblings),
                part: partNum,
                totalParts,
            };
        });
        const parentContent = this.generateParentIndex(specPath, children, metadata);
        return {
            split: true,
            originalPath: specPath,
            parent: {
                path: specPath,
                content: parentContent,
                part: 1,
                totalParts: 1,
            },
            children,
            strategy: 'by-section',
        };
    }
    /**
     * Split content by h2 headers
     */
    splitBySections(content) {
        const lines = content.split('\n');
        const sections = [];
        let currentSection = [];
        for (const line of lines) {
            // Check for h2 header (##)
            if (line.match(/^##\s+/)) {
                if (currentSection.length > 0) {
                    sections.push(currentSection.join('\n'));
                    currentSection = [];
                }
            }
            currentSection.push(line);
        }
        if (currentSection.length > 0) {
            sections.push(currentSection.join('\n'));
        }
        return sections.length > 0 ? sections : [content];
    }
}
exports.BySectionSplitStrategy = BySectionSplitStrategy;
/**
 * By-token splitting strategy - evenly splits by token count
 */
class ByTokenSplitStrategy extends SplitStrategyBase {
    split(specPath, content, metadata) {
        const totalTokens = this.counter.count(content);
        // If under limit, no split needed
        if (totalTokens <= this.config.max_tokens) {
            return {
                split: false,
                originalPath: specPath,
                parent: {
                    path: specPath,
                    content,
                    part: 1,
                    totalParts: 1,
                },
                children: [],
                strategy: 'by-token',
            };
        }
        // Calculate parts needed
        const partCount = this.calculatePartCount(totalTokens);
        const maxTokens = Math.ceil(totalTokens / partCount);
        // Split by tokens
        const parts = this.splitByTokens(content, partCount);
        const dirPath = specPath.replace(/\.spec\.(yaml|md|ts)$/, '.spec.dir');
        const totalParts = parts.length;
        const children = parts.map((partContent, index) => {
            const partNum = index + 1;
            const childPath = `${dirPath}/part-${partNum}.spec.yaml`;
            const siblings = {};
            if (index > 0) {
                siblings.prev = `${dirPath}/part-${index}.spec.yaml`;
            }
            if (index < parts.length - 1) {
                siblings.next = `${dirPath}/part-${index + 2}.spec.yaml`;
            }
            return {
                path: childPath,
                content: this.generateChildSpec(specPath, childPath, partContent, partNum, totalParts, metadata, siblings),
                part: partNum,
                totalParts,
            };
        });
        const parentContent = this.generateParentIndex(specPath, children, metadata);
        return {
            split: true,
            originalPath: specPath,
            parent: {
                path: specPath,
                content: parentContent,
                part: 1,
                totalParts: 1,
            },
            children,
            strategy: 'by-token',
        };
    }
    /**
     * Split content evenly by token count
     */
    splitByTokens(content, partCount) {
        const lines = content.split('\n');
        const parts = [];
        let currentPart = [];
        let currentTokens = 0;
        const targetTokens = this.counter.count(content) / partCount;
        for (const line of lines) {
            const lineTokens = this.counter.count(line);
            if (currentTokens + lineTokens > targetTokens && currentPart.length > 0) {
                parts.push(currentPart.join('\n'));
                currentPart = [];
                currentTokens = 0;
            }
            currentPart.push(line);
            currentTokens += lineTokens;
        }
        if (currentPart.length > 0) {
            parts.push(currentPart.join('\n'));
        }
        return parts.length > 0 ? parts : [content];
    }
}
exports.ByTokenSplitStrategy = ByTokenSplitStrategy;
/**
 * Create a split strategy by name
 */
function createStrategy(strategy, config) {
    switch (strategy) {
        case 'smart':
            return new SmartSplitStrategy(config);
        case 'by-section':
            return new BySectionSplitStrategy(config);
        case 'by-token':
            return new ByTokenSplitStrategy(config);
        default:
            return new SmartSplitStrategy(config);
    }
}
//# sourceMappingURL=strategy.js.map