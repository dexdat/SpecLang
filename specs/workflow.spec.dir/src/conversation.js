"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/workflow.dir/daily-use.spec.md
 * Blocks: @workflow/conversation, @workflow/conversation-example
 * Generated: 2026-02-22
 *
 * Edit the spec, not this file.
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
exports.parseCommand = parseCommand;
exports.executeParsedCommand = executeParsedCommand;
exports.processConversation = processConversation;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Intent patterns (from @workflow/conversation)
 */
const INTENT_PATTERNS = [
    {
        intent: 'start_feature',
        patterns: [
            /\b(build|create|make|implement)\b.*\b(app|api|service|app|system)\b/i,
            /\b(build|create|make)\b.*\b(go|typescript|python|rust|java)\b/i,
            /\bstart\s+(a\s+)?(new\s+)?(project|feature)\b/i
        ],
        entityExtractors: [
            /\b(go|typescript|python|rust|java|react|node)\b/i,
            /\b(rest\s+)?api\b/i,
            /\b(app|application|service|system)\b/i
        ]
    },
    {
        intent: 'extend_feature',
        patterns: [
            /\b(add|extend|add\s+support\s+for)\b/i,
            /\benable\b/i,
            /\bimplement\b.*\b(feature|capability)\b/i
        ],
        entityExtractors: [
            /\b(password\s+reset|rate\s+limiting|auth|login|logout)\b/i,
            /\b(feature|capability)\b/i
        ]
    },
    {
        intent: 'modify_config',
        patterns: [
            /\b(use|switch|change|replace).*\b(sqlite|postgres|mysql|mongodb)\b/i,
            /\b(change|update|modify)\s+(config|setting)\b/i
        ],
        entityExtractors: [
            /\b(sqlite|postgres|postgresql|mysql|mongodb|redis)\b/i,
            /\bconfig|setting\b/i
        ]
    },
    {
        intent: 'review_changes',
        patterns: [
            /\b(show|what|list).*\b(changed|changes|diff)\b/i,
            /\bwhat\s+(did|has)\s+(we|been)\s+(changed|built)\b/i,
            /\breview\b/i
        ],
        entityExtractors: []
    },
    {
        intent: 'explain_spec',
        patterns: [
            /\b(explain|describe|what\s+is|understand)\b/i,
            /\bwhy\b/i
        ],
        entityExtractors: [
            /\b(spec|block)\b/i
        ]
    },
    {
        intent: 'fix_issue',
        patterns: [
            /\b(fix|bug|issue|problem|error|fail)\b/i,
            /\b(not\s+working|broken|wrong)\b/i
        ],
        entityExtractors: [
            /\b(login|auth|api|database|build)\b/i
        ]
    }
];
/**
 * Parse user command from natural language
 *
 * @block:workflow/conversation @kind:code
 *
 * Examples:
 * - "Build a Go API with auth" → start_feature
 * - "Add password reset" → extend_feature
 * - "Use PostgreSQL instead of SQLite" → modify_config
 * - "Show me what changed" → review_changes
 */
function parseCommand(input) {
    const trimmed = input.trim();
    // Try each intent pattern
    let bestMatch = null;
    let highestScore = 0;
    for (const pattern of INTENT_PATTERNS) {
        for (const regex of pattern.patterns) {
            if (regex.test(trimmed)) {
                // Calculate confidence based on entity matches
                let entityScore = 0;
                for (const extractor of pattern.entityExtractors) {
                    const matches = trimmed.match(extractor);
                    if (matches) {
                        entityScore += matches.length;
                    }
                }
                const score = 1 + entityScore * 0.1;
                if (score > highestScore) {
                    highestScore = score;
                    bestMatch = pattern;
                }
            }
        }
    }
    // Extract entities
    const entities = [];
    if (bestMatch) {
        for (const extractor of bestMatch.entityExtractors) {
            const matches = trimmed.match(extractor);
            if (matches) {
                entities.push(...matches);
            }
        }
    }
    // Determine intent
    const intent = bestMatch?.intent || 'unknown';
    // Calculate confidence (0-1)
    const confidence = Math.min(highestScore / 2, 1);
    // Generate suggested action
    const suggestedAction = generateSuggestedAction(intent, entities, trimmed);
    return {
        intent,
        confidence,
        entities,
        rawInput: trimmed,
        suggestedAction
    };
}
/**
 * Generate suggested action based on intent
 */
function generateSuggestedAction(intent, entities, rawInput) {
    switch (intent) {
        case 'start_feature':
            return `Update project.scl to: "${rawInput}" and trigger cascade`;
        case 'extend_feature':
            return `Find relevant spec and add: "${entities.join(', ')}"`;
        case 'modify_config':
            return `Update configuration for: "${entities.join(', ')}"`;
        case 'review_changes':
            return 'Run: speclang status and show changes since last convergence';
        case 'explain_spec':
            return `Read and explain spec related to: "${entities.join(', ')}"`;
        case 'fix_issue':
            return `Analyze issue and update relevant spec`;
        default:
            return 'Ask user for clarification';
    }
}
/**
 * Execute parsed command
 */
async function executeParsedCommand(command, projectPath) {
    const { intent, entities, rawInput } = command;
    switch (intent) {
        case 'start_feature':
            return await handleStartFeature(rawInput, projectPath);
        case 'extend_feature':
            return await handleExtendFeature(entities, projectPath);
        case 'modify_config':
            return await handleModifyConfig(entities, projectPath);
        case 'review_changes':
            return handleReviewChanges(projectPath);
        case 'explain_spec':
            return handleExplainSpec(entities, projectPath);
        case 'fix_issue':
            return await handleFixIssue(entities, rawInput, projectPath);
        default:
            return 'I didn\'t understand that. Could you rephrase?';
    }
}
/**
 * Handle start feature intent
 */
async function handleStartFeature(description, projectPath) {
    // Update project.scl with the new feature request
    const northStarPath = path.join(projectPath, 'project.scl');
    if (!fs.existsSync(northStarPath)) {
        return 'Error: project.scl not found. Initialize project first: speclang init';
    }
    // Read existing north star
    let content = fs.readFileSync(northStarPath, 'utf-8');
    // Append the new feature request
    const separator = content.includes('##') ? '\n\n' : '\n';
    const featureBlock = `${separator}## New Feature\n\n${description}\n`;
    // Find position to insert (after existing content)
    const headerEnd = content.indexOf('---', content.indexOf('---') + 3);
    if (headerEnd > 0) {
        content = content.slice(0, headerEnd + 3) + featureBlock + content.slice(headerEnd + 3);
    }
    else {
        content += featureBlock;
    }
    fs.writeFileSync(northStarPath, content);
    return `I've added your request to project.scl:\n\n"${description}"\n\nThe cascade will now expand this into specs and generate code.`;
}
/**
 * Recursively find every `.spec.md` file under a directory, returning
 * absolute paths. Used by handleExtendFeature and handleFixIssue to locate
 * candidate specs without depending on a glob library.
 */
function findSpecFiles(rootDir) {
    const results = [];
    if (!fs.existsSync(rootDir)) {
        return results;
    }
    const walk = (dir) => {
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: false });
        } catch {
            return;
        }
        for (const name of entries) {
            const full = path.join(dir, name);
            let stat;
            try {
                stat = fs.statSync(full);
            } catch {
                continue;
            }
            if (stat.isDirectory()) {
                if (name === 'node_modules' || name.startsWith('.')) {
                    continue;
                }
                walk(full);
            } else if (stat.isFile() && name.endsWith('.spec.md')) {
                results.push(full);
            }
        }
    };
    walk(rootDir);
    return results;
}

/**
 * Pick the first spec whose name (filename stem, minus `.spec.md`) contains
 * any of the given search tokens, case-insensitively. Returns absolute path
 * or null if nothing matches.
 */
function pickSpecByName(specsDir, tokens) {
    const files = findSpecFiles(specsDir);
    const lowered = tokens.map((t) => t.toLowerCase()).filter((t) => t.length > 0);
    if (lowered.length === 0) {
        return null;
    }
    for (const file of files) {
        const base = path.basename(file, '.spec.md').toLowerCase();
        if (lowered.some((t) => base.includes(t))) {
            return file;
        }
    }
    return null;
}

/**
 * Handle extend feature intent
 */
async function handleExtendFeature(entities, projectPath) {
    // TODO: Find relevant spec and extend it
    return `I'll add "${entities.join(', ')}" to the relevant spec and trigger the cascade.`;
}
/**
 * Handle modify config intent
 *
 * Reads `.speclangrc` (JSON), applies setting changes implied by `entities`,
 * and writes the updated config back. Recognised settings today are the
 * common database providers, plus a generic key=value fallback so the user
 * can still set arbitrary top-level fields ("port=8080"). Unknown entities
 * are reported back rather than silently dropped.
 */
async function handleModifyConfig(entities, projectPath) {
    const configPath = path.join(projectPath, '.speclangrc');
    if (!fs.existsSync(configPath)) {
        return 'Error: .speclangrc not found. Initialize the project first: speclang init';
    }
    if (entities.length === 0) {
        return 'Which setting would you like to change? Try: "use postgres", "use sqlite", or "port=5432".';
    }
    let raw;
    try {
        raw = fs.readFileSync(configPath, 'utf-8');
    } catch (err) {
        return `Failed to read .speclangrc: ${err.message}`;
    }
    let config;
    try {
        config = JSON.parse(raw);
    } catch (err) {
        return `.speclangrc is not valid JSON: ${err.message}`;
    }
    const DB_ALIASES = {
        sqlite: 'sqlite',
        postgres: 'postgresql',
        postgresql: 'postgresql',
        mysql: 'mysql',
        mongodb: 'mongodb',
        redis: 'redis'
    };
    const applied = [];
    const unrecognized = [];
    for (const entity of entities) {
        const lower = entity.toLowerCase().trim();
        if (DB_ALIASES[lower]) {
            config['db'] = DB_ALIASES[lower];
            applied.push(`db → ${DB_ALIASES[lower]}`);
            continue;
        }
        const kvMatch = entity.match(/^([a-zA-Z_][a-zA-Z0-9_.]*)\s*=\s*(.+)$/);
        if (kvMatch) {
            const key = kvMatch[1];
            const value = kvMatch[2];
            const trimmed = value.trim();
            const num = Number(trimmed);
            config[key.toLowerCase()] = trimmed !== '' && !isNaN(num) ? num : trimmed;
            applied.push(`${key} → ${trimmed}`);
            continue;
        }
        unrecognized.push(entity);
    }
    if (applied.length === 0) {
        return `I didn't recognise any settings in: "${entities.join(', ')}".\nTry "use postgres", "use sqlite", or "key=value" (e.g. "port=5432").`;
    }
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    } catch (err) {
        return `Failed to write .speclangrc: ${err.message}`;
    }
    const lines = [`Updated .speclangrc:`];
    for (const a of applied) {
        lines.push(`  - ${a}`);
    }
    if (unrecognized.length > 0) {
        lines.push(`(Ignored unrecognized entities: ${unrecognized.join(', ')})`);
    }
    lines.push('The cascade will pick this up on the next convergence.');
    return lines.join('\n');
}
/**
 * Handle review changes intent
 */
function handleReviewChanges(projectPath) {
    const { getChanges, formatChanges } = require('./review.js');
    const changes = getChanges(projectPath);
    return formatChanges(changes);
}
/**
 * Handle explain spec intent
 */
function handleExplainSpec(entities, projectPath) {
    if (entities.length === 0) {
        return 'Which spec would you like me to explain?';
    }
    const { showSpecDiff } = require('./review.js');
    const specId = entities[0];
    return showSpecDiff(specId, projectPath);
}
/**
 * Handle fix issue intent
 *
 * Finds the spec whose name best matches the reported issue (re-using the
 * same findSpecFiles/pickSpecByName helpers as handleExtendFeature), reads
 * it, and returns a focused analysis pointing the cascade at the likely
 * problem area. When nothing matches, we still return a useful summary so
 * the user can refine the request rather than getting a placeholder.
 */
async function handleFixIssue(entities, description, projectPath) {
    const specsDir = path.join(projectPath, 'specs');
    if (entities.length === 0) {
        return 'Which area is the issue in? Try: "fix the auth login bug" or "fix the database error".';
    }
    const tokens = [...entities].sort((a, b) => b.length - a.length);
    const target = pickSpecByName(specsDir, tokens);
    if (!target) {
        return [
            `I couldn't find a spec matching "${entities.join(', ')}".`,
            `Describe the area more specifically, or run \`speclang status\` to see known specs.`,
            `Once a matching spec exists I'll read it and propose a fix.`
        ].join('\n');
    }
    let content;
    try {
        content = fs.readFileSync(target, 'utf-8');
    } catch (err) {
        return `Found spec ${target} but failed to read it: ${err.message}`;
    }
    const lowerEntities = tokens.map((t) => t.toLowerCase());
    const lines = content.split('\n');
    const matchingHeadings = [];
    let currentHeading = '';
    for (const line of lines) {
        if (/^#{1,6}\s+/.test(line)) {
            currentHeading = line;
        }
        if (currentHeading && lowerEntities.some((t) => line.toLowerCase().includes(t))) {
            if (!matchingHeadings.includes(currentHeading)) {
                matchingHeadings.push(currentHeading);
            }
        }
    }
    const rel = path.relative(projectPath, target);
    const out = [
        `Issue analysis for: "${description}"`,
        ``,
        `Relevant spec: ${rel}`
    ];
    if (matchingHeadings.length > 0) {
        out.push(``, `Sections most likely implicated:`);
        for (const h of matchingHeadings.slice(0, 5)) {
            out.push(`  - ${h.replace(/^#+\s*/, '')}`);
        }
    } else {
        out.push(``, `(No section headings mention "${entities.join(', ')}" directly — the spec may need a new block for this issue.)`);
    }
    out.push(
        ``,
        `Next step: add an "@block" describing the expected behaviour and let the cascade regenerate the affected code.`,
        `Reported issue: ${new Date().toISOString()} entities=${JSON.stringify(entities)}`
    );
    return out.join('\n');
}
/**
 * Process a user conversation turn
 *
 * @block:workflow/conversation-example @kind:code
 */
async function processConversation(userInput, projectPath) {
    // Parse the command
    const parsed = parseCommand(userInput);
    console.log(`[Conversation] Parsed intent: ${parsed.intent} (confidence: ${parsed.confidence})`);
    // Execute based on intent
    return await executeParsedCommand(parsed, projectPath);
}
//# sourceMappingURL=conversation.js.map