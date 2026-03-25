import { NpmTrendPoint, GithubRepoStats } from '../models/EcosystemMetric';

export class ApiService {
  private githubHeaders = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'JSON-Schema-Ecosystem-GSoC',
    ...(process.env.GITHUB_TOKEN
      ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      : {}),
  };

  private async safeFetch<T>(
    label: string,
    url: string,
    options?: RequestInit,
    fallback?: T
  ): Promise<T> {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        console.warn(`⚠️  [${label}] HTTP ${res.status} — returning fallback`);
        if (fallback !== undefined) return fallback;
        throw new Error(`${label}: HTTP ${res.status}`);
      }
      return res.json() as Promise<T>;
    } catch (err) {
      if (fallback !== undefined) {
        console.warn(`⚠️  [${label}] fetch failed — returning fallback:`, err);
        return fallback;
      }
      throw err;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ── npm ──────────────────────────────────────────────────────────────────

  async fetchNpmWeeklyDownloads(pkg: string): Promise<number> {
    console.log(`[npm] weekly downloads → ${pkg}`);
    const data = await this.safeFetch<{ downloads: number }>(
      `npm/${pkg}`,
      `https://api.npmjs.org/downloads/point/last-week/${pkg}`
    );
    return data.downloads;
  }

  async fetchNpmTrend(pkg: string): Promise<NpmTrendPoint[]> {
    console.log(`[npm] 30-day trend → ${pkg}`);
    const data = await this.safeFetch<{ downloads: NpmTrendPoint[] }>(
      `npm-trend/${pkg}`,
      `https://api.npmjs.org/downloads/range/last-month/${pkg}`
    );
    return data.downloads;
  }

  // ── GitHub ───────────────────────────────────────────────────────────────

  async fetchGithubTopicRepoCount(topic: string): Promise<number> {
    console.log(`[github] topic count → ${topic}`);
    const data = await this.safeFetch<{ total_count: number }>(
      `github-topic/${topic}`,
      `https://api.github.com/search/repositories?q=topic:${topic}&per_page=1`,
      { headers: this.githubHeaders }
    );
    return data.total_count;
  }

  async fetchGithubRepoStats(owner: string, repo: string): Promise<GithubRepoStats> {
    console.log(`[github] repo stats → ${owner}/${repo}`);
    const data = await this.safeFetch<{
      stargazers_count: number;
      open_issues_count: number;
      forks_count: number;
      subscribers_count: number;
    }>(
      `github-repo/${owner}/${repo}`,
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers: this.githubHeaders }
    );
    return {
      stars: data.stargazers_count,
      openIssues: data.open_issues_count,
      forks: data.forks_count,
      watchers: data.subscribers_count,
    };
  }

  // ── PyPI ─────────────────────────────────────────────────────────────────
  // pypistats.org rate-limits aggressively (HTTP 429) in CI environments.
  // Fix: 2s delay before each call + always fallback to 0 on failure.

  async fetchPypiWeeklyDownloads(pkg: string): Promise<number> {
    console.log(`[pypi] weekly downloads → ${pkg}`);
    await this.sleep(2000); // prevent 429 in CI
    const data = await this.safeFetch<{ data: { last_week: number } }>(
      `pypi/${pkg}`,
      `https://pypistats.org/api/packages/${pkg}/recent`,
      {},
      { data: { last_week: 0 } } // never throw on 429
    );
    return data.data.last_week;
  }

  // ── Stack Overflow ───────────────────────────────────────────────────────

  async fetchStackOverflowTagCount(tag: string): Promise<number> {
    console.log(`[stackoverflow] tag count → ${tag}`);

    const urls = [
      `https://api.stackexchange.com/2.3/tags/${encodeURIComponent(tag)}/info?site=stackoverflow`,
      `https://api.stackexchange.com/2.3/tags?inname=${encodeURIComponent(tag)}&site=stackoverflow&order=desc&sort=popular`,
    ];

    for (const url of urls) {
      const data = await this.safeFetch<{
        items?: Array<{ count?: number; question_count?: number; name: string }>;
        quota_remaining?: number;
      }>(`stackoverflow/${tag}`, url, {}, { items: [] });

      const item = data.items?.find(
        (i) => i.name === tag || i.name === tag.replace(/-/g, '')
      );

      if (item) {
        if (data.quota_remaining !== undefined && data.quota_remaining < 10) {
          console.warn(`⚠️  [stackoverflow] quota low: ${data.quota_remaining} remaining`);
        }
        return item.question_count ?? item.count ?? 0;
      }
    }

    console.warn(`⚠️  [stackoverflow] no data found for tag "${tag}" — returning 0`);
    return 0;
  }
}