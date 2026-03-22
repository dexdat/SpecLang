/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/skills.spec.dir/skills/sip-106-safety-detection-speclang-v0.md
 * Generated: 2026-03-21
 * 
 * Edit the spec, not this file.
 */

import {
  Detection,
  DetectionContext,
  DetectionConfig,
  DetectionReport,
  Severity,
} from './types';
import { Detector } from './detectors';
import {
  HardcodedSecretsDetector,
  InjectionPatternsDetector,
  SemanticDetector,
  BehavioralAnomalyDetector,
  QualityDetector,
} from './detectors';

export class DetectionAggregator {
  private detectors: Detector[];
  private severityWeights: Record<Severity, number>;

  constructor(config: DetectionConfig = {}) {
    this.detectors = this.initializeDetectors();
    this.severityWeights = {
      [Severity.CRITICAL]: 1.0,
      [Severity.HIGH]: 0.75,
      [Severity.MEDIUM]: 0.5,
      [Severity.LOW]: 0.25,
      [Severity.INFO]: 0.1,
    };
  }

  private initializeDetectors(): Detector[] {
    return [
      new HardcodedSecretsDetector(),
      new InjectionPatternsDetector(),
      new SemanticDetector(),
      new BehavioralAnomalyDetector(),
      new QualityDetector(),
    ];
  }

  detectAll(context: DetectionContext): Detection[] {
    const allDetections: Detection[] = [];
    const cfg = context.config || {};

    for (const detector of this.detectors) {
      if (detector.is_enabled(cfg as DetectionConfig)) {
        try {
          const detections = detector.detect(context);
          allDetections.push(...detections);
        } catch (error) {
          console.error(
            `Detector ${detector.detector_id} failed:`,
            error instanceof Error ? error.message : String(error)
          );
        }
      }
    }

    return allDetections;
  }

  aggregate(detections: Detection[]): DetectionReport {
    const byType: Record<string, Detection[]> = {};
    const bySeverity: Record<string, Detection[]> = {};
    let totalRisk = 0;

    for (const d of detections) {
      // Group by type
      const typeKey = d.detection_type;
      if (!byType[typeKey]) byType[typeKey] = [];
      byType[typeKey].push(d);

      // Group by severity
      const sevKey = d.severity;
      if (!bySeverity[sevKey]) bySeverity[sevKey] = [];
      bySeverity[sevKey].push(d);

      // Calculate risk
      totalRisk += this.severityWeights[d.severity] * d.confidence;
    }

    // Normalize risk
    const maxRisk = detections.length * 1.0;
    const normalizedRisk = maxRisk > 0 ? totalRisk / maxRisk : 0;

    // Sort detections by severity and confidence
    const sortedDetections = [...detections].sort((a, b) => {
      const severityDiff = this.severityWeights[b.severity] - this.severityWeights[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.confidence - a.confidence;
    });

    return {
      total_detections: detections.length,
      by_type: Object.fromEntries(
        Object.entries(byType).map(([k, v]) => [k, v.length])
      ),
      by_severity: Object.fromEntries(
        Object.entries(bySeverity).map(([k, v]) => [k, v.length])
      ),
      total_risk_score: totalRisk,
      normalized_risk: normalizedRisk,
      critical_count: bySeverity[Severity.CRITICAL]?.length || 0,
      high_count: bySeverity[Severity.HIGH]?.length || 0,
      detections: sortedDetections,
    };
  }

  runFullAnalysis(context: DetectionContext): DetectionReport {
    const detections = this.detectAll(context);
    return this.aggregate(detections);
  }

  // Convenience method for quick security scan
  runSecurityScan(context: DetectionContext): DetectionReport {
    const allDetections = this.detectAll(context);
    const securityDetections = allDetections.filter(
      d => d.detection_type === 'security_violation'
    );
    return this.aggregate(securityDetections);
  }

  // Convenience method for quick spec validation
  runSpecValidation(context: DetectionContext): DetectionReport {
    const allDetections = this.detectAll(context);
    const specDetections = allDetections.filter(
      d => d.detection_type === 'spec_anomaly'
    );
    return this.aggregate(specDetections);
  }
}

// Factory function for creating aggregator with custom detectors
export function createAggregator(
  customDetectors: Detector[],
  config: DetectionConfig = {}
): DetectionAggregator {
  const aggregator = new DetectionAggregator(config);
  // Replace default detectors with custom ones if provided
  if (customDetectors.length > 0) {
    (aggregator as unknown as { detectors: Detector[] }).detectors = customDetectors;
  }
  return aggregator;
}
