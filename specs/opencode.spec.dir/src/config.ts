/**
 * OpenCode Plugin Configuration
 * 
 * Configuration loading and profile management
 */

import * as fs from 'fs';
import * as path from 'path';
import type { 
  OpenCodePluginConfig, 
  BuildProfile, 
  BuildProfileConfig 
} from './types';

export const DEFAULT_CONFIG: OpenCodePluginConfig = {
  projectDir: process.cwd(),
  quietPeriod: 30,
  maxConcurrent: 10,
  profile: 'mvp'
};

export const PROFILES: Record<BuildProfile, BuildProfileConfig> = {
  poc: {
    agents: ['SpecWriter', 'CodeGen', 'TestWriter'],
    tests: 'basic',
    pipeline: ['build']
  },
  mvp: {
    agents: ['SpecWriter', 'CodeGen', 'TestWriter', 'BackSync'],
    tests: 'standard',
    pipeline: ['build', 'test']
  },
  enterprise: {
    agents: [
      'SpecWriter',
      'CodeGen-Go',
      'CodeGen-TS',
      'TestWriter',
      'Adversarial',
      'SecurityAudit',
      'ComplianceCheck'
    ],
    tests: 'comprehensive',
    pipeline: ['build', 'test', 'security', 'compliance'],
    coverageMin: 80,
    securityScan: true
  }
};

export interface SpeclangRC {
  profile?: BuildProfile;
  profiles?: Record<BuildProfile, BuildProfileConfig>;
  models?: Record<string, string>;
  quietPeriod?: number;
  maxConcurrent?: number;
}

export function loadConfig(projectDir: string): OpenCodePluginConfig {
  const configPath = path.join(projectDir, '.speclangrc');
  
  let config: Partial<OpenCodePluginConfig> = { ...DEFAULT_CONFIG };
  config.projectDir = projectDir;
  
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      const rc = parseSpeclangRC(content);
      
      if (rc.profile) {
        config.profile = rc.profile;
      }
      if (rc.quietPeriod) {
        config.quietPeriod = rc.quietPeriod;
      }
      if (rc.maxConcurrent) {
        config.maxConcurrent = rc.maxConcurrent;
      }
    } catch (error) {
      console.warn(`Failed to load .speclangrc: ${error}`);
    }
  }
  
  return config as OpenCodePluginConfig;
}

function parseSpeclangRC(content: string): SpeclangRC {
  const result: SpeclangRC = {};
  
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('profile:')) {
      const value = trimmed.substring(8).trim();
      if (value === 'poc' || value === 'mvp' || value === 'enterprise') {
        result.profile = value;
      }
    } else if (trimmed.startsWith('quietPeriod:')) {
      result.quietPeriod = parseInt(trimmed.substring(12).trim(), 10);
    } else if (trimmed.startsWith('maxConcurrent:')) {
      result.maxConcurrent = parseInt(trimmed.substring(14).trim(), 10);
    }
  }
  
  return result;
}

export function getProfile(profile: BuildProfile): BuildProfileConfig {
  return PROFILES[profile];
}

export function getAllProfiles(): Record<BuildProfile, BuildProfileConfig> {
  return { ...PROFILES };
}
