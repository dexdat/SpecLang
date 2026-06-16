/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/skills.spec.dir/skills/sip-106-safety-detection-speclang-v0.md
 * Generated: 2026-03-21
 * 
 * Edit the spec, not this file.
 */

export enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

export enum DetectionType {
  SPEC_ANOMALY = 'spec_anomaly',
  SECURITY_VIOLATION = 'security_violation',
  QUALITY_ISSUE = 'quality_issue',
  BEHAVIORAL_ANOMALY = 'behavioral_anomaly',
}

export interface Detection {
  detector_id: string;
  detection_type: DetectionType;
  severity: Severity;
  title: string;
  description: string;
  location?: string;
  evidence: Record<string, unknown>;
  recommendation: string;
  confidence: number;
}

export interface DetectionContext {
  spec?: {
    header?: Record<string, unknown>;
    blocks?: Array<{
      id?: string;
      kind?: string;
      content?: string;
      layer?: number;
      definition?: Record<string, unknown>;
    }>;
  };
  file_operations?: Array<{
    path: string;
    operation: string;
    size?: number;
  }>;
  dependencies?: string[];
  known_dependencies?: string[];
  operations?: Array<{
    name: string;
    location?: string;
  }>;
  loop_depth?: number;
  config?: Record<string, unknown>;
  external_refs?: string[];
}

export interface DetectionConfig {
  detectors?: {
    semantic?: boolean;
    behavioral?: boolean;
    security?: boolean;
    quality?: boolean;
  };
}

export interface DetectionReport {
  total_detections: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  total_risk_score: number;
  normalized_risk: number;
  critical_count: number;
  high_count: number;
  detections: Detection[];
}
