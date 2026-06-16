/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/ui-dashboard.spec.dir/testing.spec.md
 * Blocks: @ui/testing/framework
 * Generated: 2026-03-03T17:00:00.000Z
 * Baby Step: 3 of 4
 */

/**
 * Performance testing utilities for dashboard components.
 * Measures render times, memory usage, and interaction performance.
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  threshold?: number;
  passed: boolean;
}

export interface PerformanceTestResult {
  component: string;
  metrics: PerformanceMetric[];
  overallScore: number; // 0-100
  recommendations: string[];
}

/**
 * Measure render time of a component.
 */
export async function measureRenderTime(
  renderFn: () => void,
  iterations: number = 10
): Promise<PerformanceMetric> {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    times.push(end - start);
  }
  
  const average = times.reduce((a, b) => a + b, 0) / times.length;
  const threshold = 100; // ms
  const passed = average <= threshold;
  
  return {
    name: 'render-time',
    value: average,
    unit: 'ms',
    threshold,
    passed
  };
}

/**
 * Measure memory usage (simulated - real measurement requires browser APIs).
 */
export async function measureMemoryUsage(
  component: any
): Promise<PerformanceMetric> {
  // Simulated measurement
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const size = JSON.stringify(component).length;
  const memory = size / 1024; // KB
  const threshold = 500; // KB
  const passed = memory <= threshold;
  
  return {
    name: 'memory-usage',
    value: memory,
    unit: 'KB',
    threshold,
    passed
  };
}

/**
 * Measure interaction responsiveness.
 */
export async function measureInteractionTime(
  interactionFn: () => Promise<void> | void,
  iterations: number = 5
): Promise<PerformanceMetric> {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await Promise.resolve(interactionFn());
    const end = performance.now();
    times.push(end - start);
  }
  
  const average = times.reduce((a, b) => a + b, 0) / times.length;
  const threshold = 50; // ms
  const passed = average <= threshold;
  
  return {
    name: 'interaction-time',
    value: average,
    unit: 'ms',
    threshold,
    passed
  };
}

/**
 * Run comprehensive performance test suite.
 */
export async function runPerformanceSuite(
  componentName: string,
  options: {
    renderFn?: () => void;
    interactionFns?: Record<string, () => Promise<void> | void>;
    component?: any;
  }
): Promise<PerformanceTestResult> {
  const metrics: PerformanceMetric[] = [];
  const recommendations: string[] = [];
  
  // Measure render time if provided
  if (options.renderFn) {
    const renderMetric = await measureRenderTime(options.renderFn);
    metrics.push(renderMetric);
    if (!renderMetric.passed) {
      recommendations.push(`Render time ${renderMetric.value.toFixed(2)}ms exceeds threshold ${renderMetric.threshold}ms. Consider optimizing component rendering.`);
    }
  }
  
  // Measure memory if component provided
  if (options.component) {
    const memoryMetric = await measureMemoryUsage(options.component);
    metrics.push(memoryMetric);
    if (!memoryMetric.passed) {
      recommendations.push(`Memory usage ${memoryMetric.value.toFixed(2)}KB exceeds threshold ${memoryMetric.threshold}KB. Consider reducing component size.`);
    }
  }
  
  // Measure interactions
  if (options.interactionFns) {
    for (const [name, fn] of Object.entries(options.interactionFns)) {
      const interactionMetric = await measureInteractionTime(fn);
      interactionMetric.name = `interaction-${name}`;
      metrics.push(interactionMetric);
      if (!interactionMetric.passed) {
        recommendations.push(`Interaction "${name}" time ${interactionMetric.value.toFixed(2)}ms exceeds threshold ${interactionMetric.threshold}ms.`);
      }
    }
  }
  
  // Calculate overall score
  const passedMetrics = metrics.filter(m => m.passed).length;
  const overallScore = metrics.length > 0 ? (passedMetrics / metrics.length) * 100 : 100;
  
  return {
    component: componentName,
    metrics,
    overallScore,
    recommendations
  };
}

/**
 * Generate performance report.
 */
export function generatePerformanceReport(
  result: PerformanceTestResult
): string {
  const report = [`# Performance Report: ${result.component}`];
  report.push(`**Overall Score:** ${result.overallScore.toFixed(1)}/100`);
  report.push(`**Metrics:**`);
  
  result.metrics.forEach(metric => {
    const status = metric.passed ? '✅' : '❌';
    report.push(`- ${status} ${metric.name}: ${metric.value.toFixed(2)}${metric.unit} (threshold: ${metric.threshold}${metric.unit})`);
  });
  
  if (result.recommendations.length > 0) {
    report.push(`\n**Recommendations:**`);
    result.recommendations.forEach(rec => {
      report.push(`- ${rec}`);
    });
  } else {
    report.push(`\n✅ No performance issues detected.`);
  }
  
  return report.join('\n');
}