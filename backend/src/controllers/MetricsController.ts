import { ApiService } from '../services/ApiService';
import { JsonRepository } from '../repositories/JsonRepository';
import { buildSnapshot, MetricDetail, NpmTrendPoint } from '../models/EcosystemMetric';

const api = new ApiService();
const repo = new JsonRepository();

// ── Validators to track ────────────────────────────────────────────────────
const NPM_VALIDATORS = [
  { name: 'ajv',                    label: 'AJV' },
  { name: 'jsonschema',             label: 'jsonschema (npm)' },
  { name: 'zod',                    label: 'Zod' },
  { name: 'yup',                    label: 'Yup' },
  { name: '@cfworker/json-schema',  label: '@cfworker/json-schema' },
  { name: 'joi',                    label: 'Joi' },
];

const PYPI_VALIDATORS = [
  { name: 'jsonschema',   label: 'jsonschema (PyPI)' },
  { name: 'pydantic',     label: 'Pydantic' },
  { name: 'fastjsonschema', label: 'fastjsonschema (PyPI)' },
];

const GITHUB_REPOS = [
  { owner: 'json-schema-org', repo: 'json-schema-spec',     label: 'json-schema-spec' },
  { owner: 'json-schema-org', repo: 'JSON-Schema-Test-Suite',label: 'test-suite' },
  { owner: 'ajv-validator',   repo: 'ajv',                   label: 'ajv' },
];

// ── Main collect function ──────────────────────────────────────────────────
export async function collectAndSave(): Promise<void> {
  console.log('\n══ Starting ecosystem data collection ══\n');

  // 1. npm weekly downloads for all validators
  const npmDownloads = await Promise.all(
    NPM_VALIDATORS.map(async ({ name, label }) => {
      const value = await api.fetchNpmWeeklyDownloads(name);
      return {
        name: `npm_weekly_${name.replace(/[@/]/g, '_')}`,
        value,
        source: 'npm',
        category: 'validator_market_share',
        description: `Weekly npm downloads — ${label}`,
      } satisfies MetricDetail<number>;
    })
  );

  // 2. PyPI weekly downloads
  const pypiDownloads = await Promise.all(
    PYPI_VALIDATORS.map(async ({ name, label }) => {
      const value = await api.fetchPypiWeeklyDownloads(name);
      return {
        name: `pypi_weekly_${name}`,
        value,
        source: 'pypi',
        category: 'cross_language_adoption',
        description: `Weekly PyPI downloads — ${label}`,
      } satisfies MetricDetail<number>;
    })
  );

  // 3. GitHub repo stats
  const githubStats = await Promise.all(
    GITHUB_REPOS.map(async ({ owner, repo, label }) => {
      const value = await api.fetchGithubRepoStats(owner, repo);
      return {
        name: `github_stats_${repo.replace(/-/g, '_')}`,
        value,
        source: 'github',
        category: 'community_health',
        description: `GitHub stats for ${label}`,
      } satisfies MetricDetail;
    })
  );

  // 4. GitHub topic counts
  const topicCounts = await Promise.all(
    ['json-schema', 'jsonschema'].map(async (topic) => {
      const value = await api.fetchGithubTopicRepoCount(topic);
      return {
        name: `github_topic_${topic.replace(/-/g, '_')}`,
        value,
        source: 'github',
        category: 'community_health',
        description: `GitHub repos tagged with topic "${topic}"`,
      } satisfies MetricDetail<number>;
    })
  );

  // 5. Stack Overflow question counts
  const soTags = ['json-schema', 'jsonschema', 'ajv'];
  const soMetrics = await Promise.all(
    soTags.map(async (tag) => {
      const value = await api.fetchStackOverflowTagCount(tag);
      return {
        name: `stackoverflow_${tag.replace(/-/g, '_')}`,
        value,
        source: 'stackoverflow',
        category: 'community_support',
        description: `Stack Overflow question count for tag "${tag}"`,
      } satisfies MetricDetail<number>;
    })
  );

  // 6. AJV 30-day trend (the main "pulse" chart)
  const ajvTrend = await api.fetchNpmTrend('ajv');
  const trendMetric: MetricDetail<NpmTrendPoint[]> = {
    name: 'ajv_30day_trend',
    value: ajvTrend,
    source: 'npm',
    category: 'historical_trend',
    description: 'AJV daily download counts for last 30 days',
  };

  // 7. Zod 30-day trend (rising validator — shows ecosystem evolution)
  const zodTrend = await api.fetchNpmTrend('zod');
  const zodTrendMetric: MetricDetail<NpmTrendPoint[]> = {
    name: 'zod_30day_trend',
    value: zodTrend,
    source: 'npm',
    category: 'historical_trend',
    description: 'Zod daily download counts for last 30 days',
  };

  const allMetrics: MetricDetail[] = [
    ...npmDownloads,
    ...pypiDownloads,
    ...githubStats,
    ...topicCounts,
    ...soMetrics,
    trendMetric,
    zodTrendMetric,
  ];

  const snapshot = buildSnapshot(allMetrics);
  await repo.saveAll(snapshot);

  console.log(`\n✅ Collection complete — ${allMetrics.length} metrics saved.\n`);
}
