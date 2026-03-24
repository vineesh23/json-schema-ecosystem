/**
 * index.ts — CLI entry point
 *
 * Usage:
 *   npx ts-node src/index.ts            # collect & save
 *   npx ts-node src/index.ts --dry-run  # print metrics to stdout only
 */
import { collectAndSave } from './controllers/MetricsController';

const isDryRun = process.argv.includes('--dry-run');

(async () => {
  try {
    if (isDryRun) {
      console.log('[index] Dry run — no files will be written.');
      process.env.DRY_RUN = 'true';
    }
    await collectAndSave();
    process.exit(0);
  } catch (err) {
    console.error('[index] Fatal error:', err);
    process.exit(1);
  }
})();
