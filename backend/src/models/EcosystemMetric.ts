export interface NpmTrendPoint {
  downloads: number;
  day: string;
}

export interface GithubRepoStats {
  stars: number;
  openIssues: number;
  forks: number;
  watchers: number;
}

export type MetricSource = 'npm' | 'github' | 'pypi' | 'stackoverflow';
export type MetricCategory =
  | 'validator_market_share'
  | 'community_health'
  | 'cross_language_adoption'
  | 'community_support'
  | 'historical_trend';

export interface MetricDetail<T = number | NpmTrendPoint[] | GithubRepoStats> {
  name: string;
  value: T;
  source: MetricSource;
  category: MetricCategory;
  description: string;
}

export interface EcosystemSnapshot {
  timestamp: string;           // ISO-8601
  schemaVersion: string;       // bump when shape changes
  metrics: MetricDetail[];
}

export function buildSnapshot(metrics: MetricDetail[]): EcosystemSnapshot {
  return {
    timestamp: new Date().toISOString(),
    schemaVersion: '2.0.0',
    metrics,
  };
}
