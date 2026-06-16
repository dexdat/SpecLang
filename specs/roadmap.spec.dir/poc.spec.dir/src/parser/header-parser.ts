/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/roadmap.spec.dir/poc.spec.dir/header-parser.spec.md
 * Generated: 2026-03-03T04:16:52.903044
 * 
 * Edit the spec, not this file.
 */
import { SpecHeader, HeaderValidationResult, POCError } from '../types/poc';
import yaml from 'js-yaml';

export class HeaderParser {
  /**
   * Parse header from content
   * @param content - Full file content
   * @returns Parsed header
   * @throws {POCError} If header is invalid
   */
  parse(content: string): SpecHeader {
    const lines = content.split('\n');
    
    // Validate header marker
    if (!lines[0]?.startsWith('# speclang-header')) {
      throw new POCError('HEADER_ERROR', 'Missing # speclang-header marker');
    }
    
    // Extract line count
    const lineCountMatch = lines[0].match(/lines:(\d+)/);
    if (!lineCountMatch) {
      throw new POCError('HEADER_ERROR', 'Missing lines:N in header marker');
    }
    
    const lineCount = parseInt(lineCountMatch[1], 10);
    
    // SECURITY: Validate line count is within bounds
    if (lineCount <= 0 || lineCount > lines.length) {
      throw new POCError(
        'HEADER_ERROR',
        `Invalid header line count: ${lineCount} (must be 1-${lines.length})`,
        undefined
      );
    }
    
    const headerLines = lines.slice(1, lineCount);
    
    // SECURITY: Validate header ends with '---' separator
    if (!headerLines[headerLines.length - 1]?.trim().startsWith('---')) {
      throw new POCError(
        'HEADER_ERROR',
        'Header must end with --- separator',
        undefined
      );
    }
    
    // Parse YAML content (strip trailing --- document separator)
    const yamlContent = headerLines.join('\n').replace(/^---$/m, '').trim();
    const header = this.parseYaml(yamlContent);
    
    // Validate required fields
    this.validateHeader(header);
    
    return {
      id: header.id,
      version: header.version,
      layer: header.layer,
      short: header.short || '',
      tags: header.tags || [],
      lineCount,
      rawHeader: lines.slice(0, lineCount).join('\n')
    };
  }
  
  /**
   * Validate a parsed header
   */
  validateHeader(data: unknown): void {
    if (typeof data !== 'object' || data === null) {
      throw new POCError('HEADER_ERROR', 'Header data must be an object');
    }
    const header = data as Record<string, unknown>;
    // Required: id
    const id = header.id as string;
    if (!id) {
      throw new POCError('HEADER_ERROR', 'Missing required field: id');
    }
    if (!id.startsWith('@')) {
      throw new POCError('HEADER_ERROR', 'Spec ID must start with @');
    }
    
    // Required: version
    const version = header.version as string;
    if (!version) {
      throw new POCError('HEADER_ERROR', 'Missing required field: version');
    }
    if (!/^\d+\.\d+\.\d+/.test(version)) {
      throw new POCError('HEADER_ERROR', 'Version must be semantic (e.g., 1.0.0)');
    }
    
    // Required: layer
    const layer = header.layer as number;
    if (layer === undefined) {
      throw new POCError('HEADER_ERROR', 'Missing required field: layer');
    }
    if (typeof layer !== 'number' || layer < 0 || layer > 10) {
      throw new POCError('HEADER_ERROR', 'Layer must be number 0-10');
    }
    
    // Optional: tags
    const tags = header.tags;
    if (tags && !Array.isArray(tags)) {
      throw new POCError('HEADER_ERROR', 'Tags must be an array');
    }
  }
  
  /**
   * Parse YAML content using js-yaml library
   * Supports full YAML spec needed for headers
   */
  private parseYaml(yamlContent: string): Record<string, any> {
    try {
      const parsed = yaml.load(yamlContent) as Record<string, any>;
      return parsed || {};
    } catch (error: any) {
      throw new POCError(
        'HEADER_ERROR',
        `Failed to parse YAML header: ${error.message}`,
        undefined,
        error
      );
    }
  }
}
