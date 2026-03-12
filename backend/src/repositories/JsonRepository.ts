import * as fs from 'fs/promises';
import * as path from 'path';
import { EcosystemMetric } from '../models/EcosystemMetric';

export class JsonRepository {
    // Saves to the /output folder in the backend directory
    private outputDir = path.join(process.cwd(), 'output');

    async save(filename: string, data: EcosystemMetric): Promise<void> {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
            const filePath = path.join(this.outputDir, filename);
            
            // Outputs structured JSON with 2-space indentation
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8'); 
            console.log(`[Repository] Success! Data saved to ${filePath}`);
        } catch (error) {
            console.error(`[Repository] Failed to save file:`, error);
            throw error;
        }
    }
}