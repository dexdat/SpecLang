/**
 * Metadata-based routing for agent behavior
 * 
 * Generated from: @speclang/agent-protocol/sessions
 */

import {
  SpecMetadata,
  MetadataRouting,
  AgentSupportLevel,
  ProjectLevel,
} from './types';

const PROJECT_LEVEL_ORDER: Record<ProjectLevel, number> = {
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

const RESOURCE_ALLOCATION: Record<ProjectLevel, number> = {
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

function getInteractionStyle(
  metadata: SpecMetadata
): 'autonomous' | 'assisted' | 'human_required' {
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

export function createMetadataRouting(): MetadataRouting {
  return {
    checkPermissions: (metadata: SpecMetadata, action: 'read' | 'write' | 'deploy'): boolean => {
      const { agent_support, project_level } = metadata;

      if (action === 'read') {
        return true;
      }

      if (action === 'deploy') {
        if (agent_support === 'human_only') return false;
        if (agent_support === 'agent_assisted') return false;
        return PROJECT_LEVEL_ORDER[project_level] >= PROJECT_LEVEL_ORDER['Production'];
      }

      if (action === 'write') {
        if (agent_support === 'human_only') return false;
        return true;
      }

      return false;
    },

    getInteractionStyle: (metadata: SpecMetadata): 'autonomous' | 'assisted' | 'human_required' => {
      return getInteractionStyle(metadata);
    },

    shouldRequestApproval: (metadata: SpecMetadata): boolean => {
      const style = getInteractionStyle(metadata);
      return style === 'human_required' || style === 'assisted';
    },

    getResourceAllocation: (metadata: SpecMetadata): number => {
      return RESOURCE_ALLOCATION[metadata.project_level];
    },

    getPriority: (metadata: SpecMetadata): 'low' | 'normal' | 'high' | 'urgent' => {
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

export function parseProjectLevel(value: string | undefined): ProjectLevel {
  if (!value) return 'POC';
  const validLevels: ProjectLevel[] = [
    'POC', 'MVP', 'Alpha', 'Beta', 'Production', 'Startup', 'SMB', 'MSB', 'Enterprise'
  ];
  return validLevels.includes(value as ProjectLevel) ? value as ProjectLevel : 'POC';
}

export function parseAgentSupport(value: string | undefined): AgentSupportLevel {
  if (!value) return 'agent_assisted';
  const validLevels: AgentSupportLevel[] = ['human_only', 'agent_assisted', 'agent_autonomous'];
  return validLevels.includes(value as AgentSupportLevel) ? value as AgentSupportLevel : 'agent_assisted';
}

export function extractMetadataFromHeader(header: Record<string, unknown>): SpecMetadata {
  return {
    id: String(header.id || ''),
    project_level: parseProjectLevel(String(header.project_level || '')),
    agent_support: parseAgentSupport(String(header.agent_support || '')),
    layer: Number(header.layer) || 0,
    tags: Array.isArray(header.tags) ? header.tags.map(String) : [],
  };
}
