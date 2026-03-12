export interface MetricDetail {
    name: string;
    value: number;
    source: 'npm' | 'github';
    category: string;
    description: string;
}

export class EcosystemMetric {
    public timestamp: string;
    public metrics: MetricDetail[];

    constructor(metrics: MetricDetail[]) {
        this.timestamp = new Date().toISOString();
        this.metrics = metrics;
    }
}