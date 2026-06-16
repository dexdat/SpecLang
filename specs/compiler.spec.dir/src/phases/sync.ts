/**
 * SPECLANG-GENERATED: Sync Phase (Bidirectional Sync)
 * Source: @speclang/compiler.spec.dir/phases @compiler/detect-drift @compiler/sync-code-to-spec @compiler/sync-spec-to-code
 */

import * as fs from 'fs';
import * as path from 'path';
import type { SpecGraph, DriftReport, DriftStatus, BlockUpdate, CodeUpdate, Artifact } from './types';

export function detectDrift(spec: SpecGraph, files: string[]): DriftReport {
  const specBlockIds = new Set(spec.nodes.map((b) => b.id));
  const codeBlockIds = new Set<string>();

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const markers = extractCodeMarkers(content);
      markers.forEach((m) => codeBlockIds.add(m));
    } catch {
      // File may not exist yet
    }
  }

  const specChanges: string[] = [];
  const codeChanges: string[] = [];

  for (const id of specBlockIds) {
    if (!codeBlockIds.has(id)) {
      specChanges.push(id);
    }
  }

  for (const id of codeBlockIds) {
    if (!specBlockIds.has(id)) {
      codeChanges.push(id);
    }
  }

  let status: DriftStatus;
  if (specChanges.length > 0 && codeChanges.length === 0) {
    status = 'spec_ahead';
  } else if (codeChanges.length > 0 && specChanges.length === 0) {
    status = 'code_ahead';
  } else if (specChanges.length > 0 && codeChanges.length > 0) {
    status = 'code_ahead';
  } else {
    status = 'in_sync';
  }

  return { status, specChanges, codeChanges };
}

export function syncCodeToSpec(code: string, blockId: string): BlockUpdate {
  const markers = extractCodeMarkers(code);
  const logic = extractLogicFromCode(code);
  const proposedContent = `// @speclang-id: ${blockId}\n${logic}`;

  return {
    blockId,
    proposedContent,
  };
}

export function syncSpecToCode(specBlock: import('../../parser/types').Block, artifacts: Artifact[]): CodeUpdate[] {
  const updates: CodeUpdate[] = [];

  for (const artifact of artifacts) {
    if (artifact.markers.includes(specBlock.id)) {
      const newContent = addSpeclangMarker(artifact.content, specBlock.id);
      updates.push({
        path: artifact.path,
        newContent,
        oldContent: artifact.content,
      });
    }
  }

  return updates;
}

function extractCodeMarkers(content: string): string[] {
  const markerRegex = /@speclang-id:\s*(\S+)/g;
  const markers: string[] = [];
  let match;

  while ((match = markerRegex.exec(content)) !== null) {
    markers.push(match[1]);
  }

  return markers;
}

function extractLogicFromCode(code: string): string {
  const lines = code.split('\n');
  const nonMarkerLines = lines.filter((line) => !line.includes('@speclang-id'));
  return nonMarkerLines.join('\n').trim();
}

function addSpeclangMarker(content: string, blockId: string): string {
  if (content.includes('@speclang-id:')) {
    return content.replace(/@speclang-id:\s*\S+/, `@speclang-id: ${blockId}`);
  }
  return `// @speclang-id: ${blockId}\n${content}`;
}
