"use strict";
/**
 * Metadata-based routing for agent behavior
 *
 * Generated from: @speclang/agent-protocol/sessions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMetadataRouting = createMetadataRouting;
exports.parseProjectLevel = parseProjectLevel;
exports.parseAgentSupport = parseAgentSupport;
exports.extractMetadataFromHeader = extractMetadataFromHeader;
const PROJECT_LEVEL_ORDER = {
    'POC': 1,
    'MVP': 2,
    'Alpha': 3,
    'Beta': 4,
    'Production': 5,
    'Startup': 6,
    'SMB': 7,
    'MSB': 8,
    'Enterprise': 9,
};
const RESOURCE_ALLOCATION = {
    'POC': 1,
    'MVP': 2,
    'Alpha': 3,
    'Beta': 4,
    'Production': 10,
    'Startup': 5,
    'SMB': 7,
    'MSB': 8,
    'Enterprise': 10,
};
function getInteractionStyle(metadata) {
    const { project_level, agent_support } = metadata;
    if (agent_support === 'human_only') {
        return 'human_required';
    }
    if (agent_support === 'agent_assisted') {
        return 'assisted';
    }
    if (agent_support === 'agent_autonomous') {
        return 'autonomous';
    }
    const level = PROJECT_LEVEL_ORDER[project_level];
    if (level <= 2) {
        return 'human_required';
    }
    if (level <= 4) {
        return 'assisted';
    }
    return 'autonomous';
}
function createMetadataRouting() {
    return {
        checkPermissions: (metadata, action) => {
            const { agent_support, project_level } = metadata;
            if (action === 'read') {
                return true;
            }
            if (action === 'deploy') {
                if (agent_support === 'human_only')
                    return false;
                if (agent_support === 'agent_assisted')
                    return false;
                return PROJECT_LEVEL_ORDER[project_level] >= PROJECT_LEVEL_ORDER['Production'];
            }
            if (action === 'write') {
                if (agent_support === 'human_only')
                    return false;
                return true;
            }
            return false;
        },
        getInteractionStyle: (metadata) => {
            return getInteractionStyle(metadata);
        },
        shouldRequestApproval: (metadata) => {
            const style = getInteractionStyle(metadata);
            return style === 'human_required' || style === 'assisted';
        },
        getResourceAllocation: (metadata) => {
            return RESOURCE_ALLOCATION[metadata.project_level];
        },
        getPriority: (metadata) => {
            const { project_level, agent_support } = metadata;
            if (agent_support === 'agent_autonomous' && project_level === 'Production') {
                return 'urgent';
            }
            if (agent_support === 'agent_autonomous') {
                return 'high';
            }
            if (PROJECT_LEVEL_ORDER[project_level] >= PROJECT_LEVEL_ORDER['Beta']) {
                return 'normal';
            }
            return 'low';
        },
    };
}
function parseProjectLevel(value) {
    if (!value)
        return 'POC';
    const validLevels = [
        'POC', 'MVP', 'Alpha', 'Beta', 'Production', 'Startup', 'SMB', 'MSB', 'Enterprise'
    ];
    return validLevels.includes(value) ? value : 'POC';
}
function parseAgentSupport(value) {
    if (!value)
        return 'agent_assisted';
    const validLevels = ['human_only', 'agent_assisted', 'agent_autonomous'];
    return validLevels.includes(value) ? value : 'agent_assisted';
}
function extractMetadataFromHeader(header) {
    return {
        id: String(header.id || ''),
        project_level: parseProjectLevel(String(header.project_level || '')),
        agent_support: parseAgentSupport(String(header.agent_support || '')),
        layer: Number(header.layer) || 0,
        tags: Array.isArray(header.tags) ? header.tags.map(String) : [],
    };
}
//# sourceMappingURL=metadata-routing.js.map