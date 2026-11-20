/**
 * SPECLANG-GENERATED: MCP Server Prometheus Metrics
 * Source: @speclang/mcp
 *
 * Dependency-free Prometheus text-exposition (version 0.0.4) registry for the
 * MCP HTTP server's public `/metrics` scrape endpoint.
 *
 * Tier-1 families (see specs/ui.spec.dir/components/system-metrics.spec.md —
 * SystemMetricsPanel: cpu, memory, disk, network) are all emitted, plus host
 * uptime and process-level self-observation series.
 */
/** Exact Content-Type Prometheus expects for the text exposition format. */
export declare const PROMETHEUS_CONTENT_TYPE = "text/plain; version=0.0.4; charset=utf-8";
export type MetricType = 'counter' | 'gauge';
export interface MetricSample {
    /** Optional label set; values are stringified and escaped at render time. */
    labels?: Record<string, string | number>;
    value: number;
}
export interface MetricFamily {
    name: string;
    help: string;
    type: MetricType;
    samples: MetricSample[];
}
/**
 * A tiny metrics registry that renders Prometheus text exposition.
 *
 * Families are declared with HELP/TYPE and accumulate samples; rendering is
 * deterministic (families and label keys sorted) and always ends with exactly
 * one trailing LF, so repeated scrapes diff cleanly.
 */
export declare class MetricsRegistry {
    private readonly families;
    /**
     * Add one sample to a family, declaring the family on first use.
     * A repeated declaration with a different help/type is a programming error,
     * so the first declaration wins (and stays stable in the output).
     */
    add(name: string, help: string, type: MetricType, value: number, labels?: Record<string, string | number>): void;
    /** Convenience for a family with a single unlabelled sample. */
    set(name: string, help: string, type: MetricType, value: number): void;
    /**
     * Declare a family without a sample, so HELP/TYPE appear in the scrape even
     * when nothing has been observed yet (a fresh install, or a counter whose
     * label values are only known once work happens). Prometheus accepts a family
     * with no series; it simply has no samples to select.
     */
    declare(name: string, help: string, type: MetricType): void;
    /** Snapshot of the declared families (sorted by name). */
    getFamilies(): MetricFamily[];
    /** Render the whole registry in Prometheus text exposition format. */
    render(): string;
}
/**
 * Build a registry populated with the current Tier-1 system families plus
 * process and uptime series. Called per scrape — all values are point-in-time
 * reads, so the endpoint never serves stale numbers.
 *
 * OBS-2: pipeline outcome counters live in a cross-process ledger (the pipeline
 * runs under the daemon, the scrape is served here), so they are declared
 * unconditionally and filled from `ledgerPath` — `$SPECLANG_METRICS_LEDGER`
 * when set, else `<cwd>/.speclang/metrics-outcomes.json`.
 */
export declare function collectMetrics(diskPath?: string, ledgerPath?: string): MetricsRegistry;
/**
 * Render the current scrape payload. This is what the `/metrics` route sends.
 */
export declare function renderMetrics(diskPath?: string, ledgerPath?: string): string;
//# sourceMappingURL=metrics.d.ts.map