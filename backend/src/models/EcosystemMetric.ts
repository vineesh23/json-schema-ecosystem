export interface MetricData {
    npm_weekly_downloads: {
        ajv: number;
        jsonschema: number;
        yup: number;
    };
    github_ecosystem: {
        repos_with_topic: number;
        core_spec_stars: number;
        core_spec_open_issues: number;
    };
}

export class EcosystemMetric {
    public timestamp: string;
    public metrics: MetricData;

    constructor(metrics: MetricData) {
        this.timestamp = new Date().toISOString();
        this.metrics = metrics;
    }
}