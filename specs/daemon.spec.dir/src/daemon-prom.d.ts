import * as fs from 'fs/promises';
export interface DaemonPromMetrics {
    up: boolean;
    status: string;
    lastEventAt?: number;
    errors: number;
}
export declare function renderDaemonProm(metrics: DaemonPromMetrics, now?: number): string;
export declare function writeDaemonPromMetrics(projectDir: string, metrics: DaemonPromMetrics, now?: number, renameFile?: typeof fs.rename): Promise<void>;
//# sourceMappingURL=daemon-prom.d.ts.map