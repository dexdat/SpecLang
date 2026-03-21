/**
 * SPECLANG-GENERATED: Metadata validator
 * Source: @specs/validation/completeness-metadata
 */

import { MetadataCheck, SpecHeader } from './types';

export class MetadataValidator {
  validate(header: SpecHeader, criteria: { required: string[]; recommended: string[] }): MetadataCheck {
    const present: string[] = [];
    const missing: string[] = [];
    
    // Check required fields
    for (const field of criteria.required) {
      if (header[field] !== undefined && header[field] !== null && header[field] !== '') {
        present.push(field);
      } else {
        missing.push(field);
      }
    }
    
    const passed = missing.length === 0;
    const score = present.length / (criteria.required.length + criteria.recommended.length);
    
    return {
      passed,
      present,
      missing,
      score: Math.round(score * 100) / 100
    };
  }
  
  validateId(id: string): boolean {
    return /^@[a-z][a-z0-9/-]*$/.test(id);
  }
  
  validateVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+/.test(version);
  }
  
  validateLayer(layer: number): boolean {
    return layer >= 0 && layer <= 10;
  }
  
  validateProjectLevel(level: string): boolean {
    const validLevels = ['POC', 'MVP', 'Alpha', 'Beta', 'Production', 'Startup', 'SMB', 'MSB', 'Enterprise'];
    return validLevels.includes(level);
  }
  
  validateAgentSupport(support: string): boolean {
    const validSupports = ['human_only', 'agent_assisted', 'agent_autonomous'];
    return validSupports.includes(support);
  }
}
