"use strict";
/**
 * SPECLANG-GENERATED: MCP Spec CRUD Tools
 * Source: @speclang/mcp
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
exports.SpecsToolHandler = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("yaml"));
/**
 * Spec CRUD tool handler
 */
class SpecsToolHandler {
    db;
    specsDir;
    constructor(db, specsDir = 'specs') {
        this.db = db;
        this.specsDir = specsDir;
    }
    /**
     * Handle speclang_get_spec - Get full spec by ID or path
     */
    async handleGetSpec(args) {
        const { id, file_path, include_content = false } = args;
        const db = this.db.getDatabase();
        let specQuery = 'SELECT * FROM specs WHERE 1=1';
        const params = [];
        if (id) {
            specQuery += ' AND id = ?';
            params.push(id);
        }
        if (file_path) {
            specQuery += ' AND file_path = ?';
            params.push(file_path);
        }
        const row = db.prepare(specQuery).get(...params);
        if (!row) {
            return { metadata: null };
        }
        // Parse JSON fields
        const tags = JSON.parse(row.tags || '[]');
        const dependsOn = JSON.parse(row.depends_on || '[]');
        // Extract blocks from content
        const blocks = this.extractBlocks(row.content_raw);
        // Get dependents
        const dependents = this.getDependents(row.id || row.file_path);
        const metadata = {
            id: row.id || '',
            file_path: row.file_path,
            tags,
            short_desc: row.short_desc || undefined,
            depends_on: dependsOn,
            updated_at: row.last_edited || undefined
        };
        const result = { metadata, blocks, dependents };
        if (include_content) {
            result.content = row.content_raw;
            result.dependencies = dependsOn;
        }
        return result;
    }
    /**
     * Extract @block: definitions from content
     */
    extractBlocks(content) {
        const blocks = [];
        const pattern = /@block:([a-zA-Z][a-zA-Z0-9_/-]*)/g;
        let match;
        while ((match = pattern.exec(content)) !== null) {
            blocks.push(match[1]);
        }
        return blocks;
    }
    /**
     * Get dependents for a spec
     */
    getDependents(specId) {
        const db = this.db.getDatabase();
        const rows = db.prepare(`
      SELECT s.id FROM specs s
      JOIN spec_deps sd ON s.rowid = sd.src_spec_pk
      JOIN specs target ON sd.dst_spec_pk = target.rowid
      WHERE target.id = ? OR target.file_path = ?
    `).all(specId, specId);
        return rows.map(r => r.id);
    }
    /**
     * Handle speclang_create_spec - Create new spec
     */
    async handleCreateSpec(args) {
        const { id, content, agent_id, file_path } = args;
        // Validate content
        const validation = this.validateSpecContent(content);
        if (!validation.valid) {
            return { success: false, file: '', validation };
        }
        // Determine file path
        const specId = id.startsWith('@') ? id.slice(1) : id;
        const fileName = file_path || `${specId.replace(/\//g, '-')}.spec.md`;
        const fullPath = path.join(this.specsDir, fileName);
        // Check if file already exists
        if (fs.existsSync(fullPath)) {
            return {
                success: false,
                file: fullPath,
                validation: { valid: false, errors: ['Spec file already exists'], warnings: [] }
            };
        }
        try {
            // Ensure directory exists
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            // Write file
            fs.writeFileSync(fullPath, content, 'utf-8');
            // Index in database
            this.indexSpec(fullPath, content, agent_id);
            return { success: true, file: fullPath, validation };
        }
        catch (error) {
            return {
                success: false,
                file: fullPath,
                validation: { valid: false, errors: [`Failed to create spec: ${error}`], warnings: [] }
            };
        }
    }
    /**
     * Handle speclang_update_spec - Update existing spec
     */
    async handleUpdateSpec(args) {
        const { id, content, message, agent_id } = args;
        // Find existing spec
        const db = this.db.getDatabase();
        const existing = db.prepare('SELECT * FROM specs WHERE id = ? OR file_path = ?').get(id, id);
        if (!existing) {
            return {
                success: false,
                changed_blocks: [],
                validation: { valid: false, errors: ['Spec not found'], warnings: [] }
            };
        }
        // Validate content
        const validation = this.validateSpecContent(content);
        if (!validation.valid) {
            return { success: false, changed_blocks: [], validation };
        }
        // Determine changed blocks
        const oldBlocks = this.extractBlocks(existing.content_raw);
        const newBlocks = this.extractBlocks(content);
        const changedBlocks = newBlocks.filter(b => !oldBlocks.includes(b));
        try {
            // Backup old version
            this.createVersion(existing.file_path, existing.content_raw, agent_id);
            // Write new content
            fs.writeFileSync(existing.file_path, content, 'utf-8');
            // Re-index
            this.indexSpec(existing.file_path, content, agent_id);
            return { success: true, changed_blocks: changedBlocks, validation };
        }
        catch (error) {
            return {
                success: false,
                changed_blocks: [],
                validation: { valid: false, errors: [`Failed to update spec: ${error}`], warnings: [] }
            };
        }
    }
    /**
     * Handle speclang_list_specs - List all specs
     */
    async handleListSpecs(args) {
        const { tags, layer, prefix, limit = 100 } = args;
        const db = this.db.getDatabase();
        let sql = 'SELECT * FROM specs WHERE 1=1';
        const params = [];
        if (tags && tags.length > 0) {
            const tagConditions = tags.map(() => `tags LIKE ?`).join(' OR ');
            sql += ` AND (${tagConditions})`;
            for (const tag of tags) {
                params.push(`%"${tag}"%`);
            }
        }
        if (layer !== undefined) {
            sql += ' AND layer = ?';
            params.push(layer);
        }
        if (prefix) {
            sql += ' AND (id LIKE ? OR file_path LIKE ?)';
            params.push(`${prefix}%`, `${prefix}%`);
        }
        sql += ' LIMIT ?';
        params.push(limit);
        const rows = db.prepare(sql).all(...params);
        const specs = rows.map(row => ({
            id: row.id || '',
            file_path: row.file_path,
            tags: JSON.parse(row.tags || '[]'),
            short_desc: row.short_desc || undefined,
            depends_on: JSON.parse(row.depends_on || '[]'),
            layer: row.layer,
            updated_at: row.last_edited || undefined
        }));
        return { specs, total: specs.length };
    }
    /**
     * Validate spec content
     */
    validateSpecContent(content) {
        const errors = [];
        const warnings = [];
        // Check for speclang-header
        if (!content.includes('speclang-header')) {
            errors.push('Missing speclang-header');
        }
        // Try to parse YAML header
        const headerMatch = content.match(/# speclang-header lines:(\d+)([\s\S]*?)---/);
        if (headerMatch) {
            try {
                const headerContent = headerMatch[2];
                yaml.parse(headerContent);
            }
            catch (e) {
                errors.push(`Invalid YAML header: ${e}`);
            }
        }
        else {
            warnings.push('Could not parse header - may need manual review');
        }
        return { valid: errors.length === 0, errors, warnings };
    }
    /**
     * Index a spec in the database
     */
    indexSpec(filePath, content, agentId) {
        const { parseHeader, extractRefsFromContent, extractBlocksFromContent } = require('../../indexer/index.js');
        const { headerLines, metadata } = parseHeader(filePath);
        const refs = extractRefsFromContent(content);
        const blocks = extractBlocksFromContent(content);
        this.db.upsertSpec({
            file_path: filePath,
            id: metadata.id,
            tags: metadata.tags || [],
            short_desc: metadata.short || '',
            header_raw: content.slice(0, headerLines * 100),
            header_lines: headerLines,
            content_raw: content,
            depends_on: refs,
            children: blocks,
            owner_session: agentId
        });
    }
    /**
     * Create version snapshot
     */
    createVersion(filePath, content, agentId) {
        const crypto = require('crypto');
        const hash = crypto.createHash('md5').update(content).digest('hex');
        const db = this.db.getDatabase();
        const spec = db.prepare('SELECT rowid FROM specs WHERE file_path = ?').get(filePath);
        if (spec) {
            db.prepare(`
        INSERT INTO spec_versions (spec_pk, session_id, content_hash, content_raw)
        VALUES (?, ?, ?, ?)
      `).run(spec.rowid, agentId || null, hash, content);
        }
    }
}
exports.SpecsToolHandler = SpecsToolHandler;
//# sourceMappingURL=specs.js.map