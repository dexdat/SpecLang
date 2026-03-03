"use strict";
/**
 * SPECLANG-GENERATED: Lens Registry
 * Source: @speclang/lenses
 *
 * Registry for managing and detecting lenses.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LensRegistry = void 0;
exports.createDefaultContext = createDefaultContext;
class LensRegistry {
    lenses = new Map();
    lensesByKind = new Map();
    sortedLenses = [];
    get lensesMap() {
        return this.lenses;
    }
    register(lens) {
        this.lenses.set(lens.name, lens);
        this.lensesByKind.set(lens.kind, lens);
        this.sortedLenses = Array.from(this.lenses.values())
            .sort((a, b) => b.priority - a.priority);
    }
    detect(content, explicitKind) {
        // Priority 1: Explicit @kind marker takes precedence
        if (explicitKind) {
            const lens = this.lensesByKind.get(explicitKind);
            if (lens) {
                return { lens, confidence: 1.0 };
            }
        }
        // Priority 2: Content-based detection (sorted by priority)
        for (const lens of this.sortedLenses) {
            const matches = lens.detect(content);
            if (matches) {
                return { lens, confidence: 1.0 };
            }
        }
        // Default to prose as fallback
        const proseLens = this.lenses.get('prose');
        if (proseLens) {
            return { lens: proseLens, confidence: 0.5 };
        }
        throw new Error('No fallback lens available');
    }
    async parse(content, context) {
        const explicitKind = context.options.explicitKind;
        const { lens } = this.detect(content, explicitKind);
        return lens.parse(content, context);
    }
    async render(block, context) {
        const lensName = block.source?.lens || this.detect(block.content).lens.name;
        const lens = this.lenses.get(lensName);
        if (!lens) {
            throw new Error(`Unknown lens: ${lensName}`);
        }
        return lens.render(block, context);
    }
    getByKind(kind) {
        return this.sortedLenses.find(l => l.kind === kind);
    }
    getByName(name) {
        return this.lenses.get(name);
    }
    list() {
        return [...this.sortedLenses];
    }
}
exports.LensRegistry = LensRegistry;
function createDefaultContext(blockId = 'default', filePath = 'memory://', options = {}) {
    return {
        filePath,
        blockId,
        options: {
            preserveSource: false,
            prettyPrint: true,
            indent: 2,
            ...options
        }
    };
}
//# sourceMappingURL=registry.js.map