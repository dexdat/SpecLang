/**
 * SPECLANG-GENERATED: Layer system overview
 * Source: @speclang/layer-definitions
 * Source: @speclang/semantic-definitions/layer-mapping
 */

export interface LayerDefinition {
  depth: number;
  name: string;
  purpose: string;
  exampleSpec: string;
}

export const layerDefinitions: LayerDefinition[] = [
  { depth: 0, name: 'North Star', purpose: 'Project intent', exampleSpec: 'project.scl' },
  { depth: 1, name: 'Feature', purpose: 'Feature breakdown', exampleSpec: 'auth.spec.md' },
  { depth: 2, name: 'Component', purpose: 'Entities, operations', exampleSpec: 'auth/entities.spec.yaml' },
  { depth: 3, name: 'Detail', purpose: 'Pseudocode, algorithms', exampleSpec: 'auth/login-algorithm.spec.yaml' },
  { depth: 4, name: 'Implementation', purpose: 'Language mapping', exampleSpec: 'auth/login-implementation.spec.yaml' },
  { depth: 5, name: 'Code Spec', purpose: 'Direct code mapping', exampleSpec: 'auth/login.go.spec' },
  { depth: 6, name: 'Generated Code', purpose: 'Output code', exampleSpec: 'generated/go/auth/login.go' },
  { depth: 7, name: 'Test Spec', purpose: 'Test descriptions', exampleSpec: 'auth/login.test.spec.md' },
  { depth: 8, name: 'Test Code Spec', purpose: 'Test code mapping', exampleSpec: 'auth/login.test.go.spec' },
  { depth: 9, name: 'Generated Test Code', purpose: 'Generated tests', exampleSpec: 'generated/go/auth/login_test.go' },
  { depth: 10, name: 'Deployment/Ops', purpose: 'Infrastructure', exampleSpec: 'deployment/k8s.spec.yaml' },
] as const;

export function getLayerDefinition(depth: number): LayerDefinition | undefined {
  return layerDefinitions.find(l => l.depth === depth);
}

export function isValidLayer(depth: number): boolean {
  return depth >= 0 && depth <= 10;
}