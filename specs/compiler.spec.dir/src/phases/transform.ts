/**
 * SPECLANG-GENERATED: Transform Phase
 * Source: @speclang/compiler.spec.dir/phases @compiler/transform
 */

import type { ResolvedGraph, IR, IRBlock, IROperation } from './types';
import type { CompilerTarget } from '../targets';

export function transform(resolved: ResolvedGraph, target: CompilerTarget): IR {
  const ir: IR = {
    entities: [],
    operations: [],
    policies: [],
  };

  for (const block of resolved.orderedBlocks) {
    if (block.kind === 'entity') {
      const entity = transformEntity(block, target);
      ir.entities.push(entity);
    } else if (block.kind === 'operation') {
      const operation = transformOperation(block, target);
      ir.operations.push(operation);
    } else if (block.kind === 'policy') {
      ir.policies.push(block.content);
    }
  }

  return applyTargetTransforms(ir, target);
}

function transformEntity(block: import('../../parser/types').Block, target: CompilerTarget): IRBlock {
  const fields: import('./types').IRField[] = [];
  const fieldRegex = /(\w+)(\?)?:\s*(\S+)/g;
  let match;

  while ((match = fieldRegex.exec(block.content)) !== null) {
    fields.push({
      name: match[1],
      type: match[3],
      optional: !!match[2],
    });
  }

  return {
    id: block.id,
    kind: block.kind,
    name: extractName(block.id),
    fields,
    methods: [],
  };
}

function transformOperation(block: import('../../parser/types').Block, target: CompilerTarget): IROperation {
  const params: import('./types').IRField[] = [];
  const paramRegex = /(\w+)(\?)?:\s*(\S+)/g;
  let match;

  while ((match = paramRegex.exec(block.content)) !== null) {
    params.push({
      name: match[1],
      type: match[3],
      optional: !!match[2],
    });
  }

  const returnMatch = block.content.match(/->\s*(\S+)/);
  const returnType = returnMatch ? returnMatch[1] : 'void';

  return {
    name: extractName(block.id),
    params,
    returnType,
    body: block.content,
  };
}

function extractName(blockId: string): string {
  const parts = blockId.split('/');
  return parts[parts.length - 1] || parts[0];
}

function applyTargetTransforms(ir: IR, target: CompilerTarget): IR {
  if (target.features.typeInference) {
    for (const entity of ir.entities) {
      for (const field of entity.fields) {
        if (!field.type) {
          field.type = 'any';
        }
      }
    }
  }

  if (target.features.optionalChaining) {
    for (const op of ir.operations) {
      for (const param of op.params) {
        if (param.optional) {
          param.type = `${param.type} | undefined`;
        }
      }
    }
  }

  return ir;
}
