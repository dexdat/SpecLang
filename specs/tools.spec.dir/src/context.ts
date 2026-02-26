/**
speclang-header lines:5
id: @specs/tools
version: 1.0.0
layer: 5
 */

/**
 * speclang-header lines:8
 * @ref:specs/tools.spec.md
 * 
 * SPECLANG-GENERATED: Tool Context
 * Source: @speclang/tools
 * 
 * Context management for tool execution
 */

import { ToolContext } from './types.js';

let currentContext: ToolContext | null = null;

export function setToolContext(context: ToolContext): void {
  currentContext = context;
}

export function getToolContext(): ToolContext | null {
  return currentContext;
}

export function clearToolContext(): void {
  currentContext = null;
}

export function createToolContext(
  sessionId: string,
  agentRole: string,
  owns: string[] = [],
  workingDirectory: string = process.cwd()
): ToolContext {
  return {
    sessionId,
    agentRole,
    owns,
    workingDirectory,
  };
}
