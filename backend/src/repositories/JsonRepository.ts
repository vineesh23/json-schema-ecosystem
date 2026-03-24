import * as fs from 'fs/promises';
import * as path from 'path';
import { EcosystemSnapshot } from '../models/EcosystemMetric';

export class JsonRepository {
  private outputDir: string;

  constructor(outputDir = path.join(process.cwd(), 'output')) {
    this.outputDir = outputDir;
  }

  /** Save the latest snapshot (overwrites — always reflects current state). */
  async saveLatest(snapshot: EcosystemSnapshot): Promise<void> {
    await this.ensureDir();
    const filePath = path.join(this.outputDir, 'metrics-latest.json');
    await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
    console.log(`[repo] latest → ${filePath}`);
  }

  /**
   * Append this snapshot to a growing history file.
   * Each line is a valid JSON object (newline-delimited JSON / NDJSON).
   * This is cheap to append and easy to process later.
   */
  async appendHistory(snapshot: EcosystemSnapshot): Promise<void> {
    await this.ensureDir();
    const filePath = path.join(this.outputDir, 'metrics-history.ndjson');
    await fs.appendFile(filePath, JSON.stringify(snapshot) + '\n', 'utf-8');
    console.log(`[repo] appended to history → ${filePath}`);
  }

  /**
   * Also save a dated snapshot so every run is individually retrievable.
   * Format: metrics-YYYY-MM-DD.json
   */
  async saveDated(snapshot: EcosystemSnapshot): Promise<void> {
    await this.ensureDir();
    const date = snapshot.timestamp.slice(0, 10); // YYYY-MM-DD
    const filePath = path.join(this.outputDir, `metrics-${date}.json`);
    await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
    console.log(`[repo] dated snapshot → ${filePath}`);
  }

  /** Convenience: save all three in one call. */
  async saveAll(snapshot: EcosystemSnapshot): Promise<void> {
    await Promise.all([
      this.saveLatest(snapshot),
      this.appendHistory(snapshot),
      this.saveDated(snapshot),
    ]);
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
  }
}
