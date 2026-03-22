/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/skills.spec.dir/skills/sip-106-safety-detection-speclang-v0.md
 * Generated: 2026-03-21
 * 
 * Edit the spec, not this file.
 */

// Types and interfaces
export {
  Severity,
  DetectionType,
  Detection,
  DetectionContext,
  DetectionConfig,
  DetectionReport,
} from './types';

// Base detector class
export { Detector } from './detectors';

// Concrete detector implementations
export {
  HardcodedSecretsDetector,
  InjectionPatternsDetector,
  SemanticDetector,
  BehavioralAnomalyDetector,
  QualityDetector,
} from './detectors';

// Aggregator
export { DetectionAggregator, createAggregator } from './aggregator';

// Convenience re-exports
import { DetectionAggregator } from './aggregator';
import type { DetectionContext, DetectionConfig, DetectionReport } from './types';

/**
 * Run a complete safety detection analysis
 * 
 * @param context - The detection context containing spec, file operations, etc.
 * @param config - Optional configuration for detectors
 * @returns DetectionReport with all findings
 * 
 * @example
 * ```typescript
 * import { runSafetyScan } from './safety-detection';
 * 
 * const report = runSafetyScan({
 *   spec: {
 *     header: { layer: 5 },
 *     blocks: [{ id: 'test', content: '...', kind: 'entity' }]
 *   },
 *   file_operations: [{ path: 'src/test.ts', operation: 'write' }],
 *   config: { detectors: { semantic: true, security: true } }
 * });
 * 
 * console.log(`Found ${report.total_detections} issues`);
 * console.log(`Risk score: ${(report.normalized_risk * 100).toFixed(1)}%`);
 * ```
 */
export function runSafetyScan(
  context: DetectionContext,
  config?: DetectionConfig
): DetectionReport {
  const aggregator = new DetectionAggregator(config);
  return aggregator.runFullAnalysis(context);
}

/**
 * Run a security-focused scan
 * 
 * @param context - The detection context
 * @param config - Optional configuration
 * @returns DetectionReport with only security findings
 */
export function runSecurityScan(
  context: DetectionContext,
  config?: DetectionConfig
): DetectionReport {
  const aggregator = new DetectionAggregator(config);
  return aggregator.runSecurityScan(context);
}

/**
 * Run a spec validation scan
 * 
 * @param context - The detection context
 * @param config - Optional configuration
 * @returns DetectionReport with only spec anomaly findings
 */
export function runSpecValidation(
  context: DetectionContext,
  config?: DetectionConfig
): DetectionReport {
  const aggregator = new DetectionAggregator(config);
  return aggregator.runSpecValidation(context);
}
