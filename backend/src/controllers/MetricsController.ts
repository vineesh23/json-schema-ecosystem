import { Request, Response } from 'express';
import { ApiService } from '../services/ApiService';
import { JsonRepository } from '../repositories/JsonRepository';
import { EcosystemMetric } from '../models/EcosystemMetric';

const apiService = new ApiService();
const repository = new JsonRepository();

export const generateEcosystemReport = async (req: Request, res: Response): Promise<void> => {
    console.log('\n--- [Controller] Starting advanced data collection process ---');
    
    try {
        // Fetch Data
        const [ajv, jsonschema, yup] = await Promise.all([
            apiService.fetchNpmDownloads('ajv'),
            apiService.fetchNpmDownloads('jsonschema'),
            apiService.fetchNpmDownloads('yup')
        ]);
        const topicCount = await apiService.fetchGithubTopicCount('json-schema');
        const specStats = await apiService.fetchGithubRepoStats('json-schema-org', 'json-schema-spec');

        // Create Self-Describing Metrics Array
        const detailedMetrics = [
            { name: "ajv_weekly_downloads", value: ajv, source: "npm" as const, category: "validator_market_share", description: "Weekly downloads for ajv" },
            { name: "jsonschema_weekly_downloads", value: jsonschema, source: "npm" as const, category: "validator_market_share", description: "Weekly downloads for jsonschema" },
            { name: "yup_weekly_downloads", value: yup, source: "npm" as const, category: "validator_market_share", description: "Weekly downloads for yup" },
            { name: "github_topic_repos", value: topicCount, source: "github" as const, category: "community_health", description: "Repos tagged with json-schema" },
            { name: "core_spec_stars", value: specStats.stars, source: "github" as const, category: "community_health", description: "Stars on json-schema-spec repo" },
            { name: "core_spec_open_issues", value: specStats.issues, source: "github" as const, category: "community_health", description: "Open issues on json-schema-spec repo" }
        ];

        const metricRecord = new EcosystemMetric(detailedMetrics);

        const filename = `metrics-latest.json`;
        await repository.save(filename, metricRecord);

        res.status(200).json({ message: 'Success', file: filename });
    } catch (error) {
        console.error('[Controller] Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate ecosystem report' });
    }
};