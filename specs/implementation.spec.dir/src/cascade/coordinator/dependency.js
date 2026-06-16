"use strict";
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
exports.DependencyTracker = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DependencyTracker {
    graph;
    indexPath;
    constructor(indexPath = '_index.json') {
        this.indexPath = indexPath;
        this.graph = { nodes: new Map(), trees: new Map() };
    }
    loadIndex() {
        if (!fs.existsSync(this.indexPath)) {
            throw new Error(`Index file not found: ${this.indexPath}`);
        }
        const indexData = JSON.parse(fs.readFileSync(this.indexPath, 'utf-8'));
        this.buildGraph(indexData);
    }
    buildGraph(indexData) {
        const specs = indexData.specs || {};
        for (const [specPath, specData] of Object.entries(specs)) {
            const spec = specData;
            const id = spec.id;
            const layer = spec.layer || 0;
            const refs = spec.refs || [];
            const type = this.determineType(specPath);
            const node = {
                id,
                layer,
                type,
                filePath: specPath,
                dependencies: refs.map(r => r.replace('@ref:', '')),
                children: []
            };
            this.graph.nodes.set(id, node);
        }
        this.organizeIntoTrees();
    }
    determineType(filePath) {
        if (filePath.startsWith('specs/'))
            return 'spec';
        if (filePath.startsWith('src/'))
            return 'code';
        if (filePath.startsWith('tests/'))
            return 'test';
        if (filePath.startsWith('docs/'))
            return 'doc';
        return 'spec';
    }
    organizeIntoTrees() {
        const treeTypes = ['spec', 'code', 'test', 'doc'];
        for (const type of treeTypes) {
            const nodes = Array.from(this.graph.nodes.values())
                .filter(n => n.type === type)
                .sort((a, b) => a.layer - b.layer);
            this.graph.trees.set(type, nodes);
        }
    }
    getDependents(specId) {
        return Array.from(this.graph.nodes.values())
            .filter(node => node.dependencies.includes(specId));
    }
    getDependencies(specId) {
        return this.graph.nodes.get(specId)?.dependencies || [];
    }
    getTree(type) {
        return this.graph.trees.get(type) || [];
    }
    getNode(specId) {
        return this.graph.nodes.get(specId);
    }
    getNodesByLayer(layer) {
        return Array.from(this.graph.nodes.values())
            .filter(n => n.layer === layer);
    }
    getOrderedForCascade(triggerId) {
        const result = [];
        const visited = new Set();
        const traverse = (id) => {
            if (visited.has(id))
                return;
            visited.add(id);
            const node = this.graph.nodes.get(id);
            if (!node)
                return;
            for (const dep of node.dependencies) {
                traverse(dep);
            }
            result.push(node);
        };
        traverse(triggerId);
        return result;
    }
    saveState(state) {
        const stateDir = '.speclang';
        if (!fs.existsSync(stateDir)) {
            fs.mkdirSync(stateDir, { recursive: true });
        }
        fs.writeFileSync(path.join(stateDir, 'cascade_state.json'), JSON.stringify(state, null, 2));
    }
    loadState() {
        const statePath = '.speclang/cascade_state.json';
        if (!fs.existsSync(statePath)) {
            return null;
        }
        return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    }
    createInitialState(triggerFile, maxDepth = 5) {
        return {
            cascade_id: `cascade-${Date.now()}`,
            depth: 0,
            max_depth: maxDepth,
            status: 'running',
            trigger_file: triggerFile,
            current_agent: '',
            agents_invoked: [],
            verification_results: [],
            depth_by_tree: { specs: 0, src: 0, tests: 0, docs: 0 }
        };
    }
}
exports.DependencyTracker = DependencyTracker;
//# sourceMappingURL=dependency.js.map