import { ApiService } from '../services/ApiService';
import { JsonRepository } from '../repositories/JsonRepository';
import { buildSnapshot, MetricDetail, NpmTrendPoint } from '../models/EcosystemMetric';

const api = new ApiService();
const repo = new JsonRepository();

const NPM_VALIDATORS = [
  { name: 'ajv',                   label: 'AJV' },
  { name: 'jsonschema',            label: 'jsonschema (npm)' },
  { name: 'zod',                   label: 'Zod' },
  { name: 'yup',                   label: 'Yup' },
  { name: '@cfworker/json-schema', label: '@cfworker/json-schema' },
  { name: 'joi',                   label: 'Joi' },
];

// PyPI packages fetched SEQUENTIALLY (rate limit protection)
const PYPI_VALIDATORS = [
  { name: 'jsonschema',     label: 'jsonschema (PyPI)' },
  { name: 'pydantic',       label: 'Pydantic' },
  { name: 'fastjsonschema', label: 'fastjsonschema (PyPI)' },
];

const GITHUB_REPOS = [
  { owner: 'json-schema-org', repo: 'json-schema-spec',      label: 'json-schema-spec' },
  { owner: 'json-schema-org', repo: 'JSON-Schema-Test-Suite', label: 'test-suite' },
  { owner: 'ajv-validator',   repo: 'ajv',                    label: 'ajv' },
];

export async function collectAndSave(): Promise<void> {
  console.log('\n══ Starting ecosystem data collection ══\n');

  // 1. npm — all concurrent (npm API has no rate limit issues)
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

  // 2. PyPI — SEQUENTIAL with built-in 2s delay to avoid 429 in CI
  const pypiDownloads: MetricDetail<number>[] = [];
  for (const { name, label } of PYPI_VALIDATORS) {
    const value = await api.fetchPypiWeeklyDownloads(name);
    pypiDownloads.push({
      name: `pypi_weekly_${name}`,
      value,
      source: 'pypi',
      category: 'cross_language_adoption',
      description: `Weekly PyPI downloads — ${label}`,
    } satisfies MetricDetail<number>);
  }

  // 3. GitHub — concurrent (authenticated = 5000 req/hr)
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

  // 5. Stack Overflow
  const soMetrics = await Promise.all(
    ['json-schema', 'jsonschema', 'ajv'].map(async (tag) => {
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

  // 6. Trend data
  const [ajvTrend, zodTrend] = await Promise.all([
    api.fetchNpmTrend('ajv'),
    api.fetchNpmTrend('zod'),
  ]);

  const trendMetric: MetricDetail<NpmTrendPoint[]> = {
    name: 'ajv_30day_trend',
    value: ajvTrend,
    source: 'npm',
    category: 'historical_trend',
    description: 'AJV daily download counts for last 30 days',
  };

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