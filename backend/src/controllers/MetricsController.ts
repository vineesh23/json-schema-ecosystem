import { Request, Response } from 'express';
import { ApiService } from '../services/ApiService';
import { JsonRepository } from '../repositories/JsonRepository';
import { EcosystemMetric } from '../models/EcosystemMetric';

const apiService = new ApiService();
const repository = new JsonRepository();

export const generateEcosystemReport = async (req: Request, res: Response): Promise<void> => {
    console.log('\n--- [Controller] Starting advanced data collection process ---');
    
    try {
        // Fetch NPM Data (using Promise.all makes them run concurrently for speed)
        const [ajv, jsonschema, yup] = await Promise.all([
            apiService.fetchNpmDownloads('ajv'),
            apiService.fetchNpmDownloads('jsonschema'),
            apiService.fetchNpmDownloads('yup')
        ]);

        // Fetch GitHub Data
        const topicCount = await apiService.fetchGithubTopicCount('json-schema');
        const specStats = await apiService.fetchGithubRepoStats('json-schema-org', 'json-schema-spec');

        // Map via Model
        const metricRecord = new EcosystemMetric({
            npm_weekly_downloads: {
                ajv: ajv,
                jsonschema: jsonschema,
                yup: yup
            },
            github_ecosystem: {
                repos_with_topic: topicCount,
                core_spec_stars: specStats.stars,
                core_spec_open_issues: specStats.issues
            }
        });

        // Save via Repository
        const filename = `ecosystem-run-${Date.now()}.json`;
        await repository.save(filename, metricRecord);

        res.status(200).json({
            message: 'Ecosystem report generated successfully',
            file: filename,
            data: metricRecord
        });

    } catch (error) {
        console.error('[Controller] Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate ecosystem report' });
    }
};