export class ApiService {
    async fetchNpmDownloads(packageName: string): Promise<number> {
        console.log(`[Service] Fetching NPM downloads for ${packageName}...`);
        const url = `https://api.npmjs.org/downloads/point/last-week/${packageName}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`NPM API Error: ${response.status}`);
        const data = await response.json();
        return data.downloads;
    }

    async fetchGithubTopicCount(topic: string): Promise<number> {
        console.log(`[Service] Fetching GitHub topic count for ${topic}...`);
        const url = `https://api.github.com/search/repositories?q=topic:${topic}&per_page=1`;
        const response = await fetch(url, {
            headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'JSON-Schema-Ecosystem-PoC' }
        });
        if (!response.ok) throw new Error(`GitHub API Error: ${response.status}`);
        const data = await response.json();
        return data.total_count;
    }

    async fetchGithubRepoStats(owner: string, repo: string): Promise<{ stars: number, issues: number }> {
        console.log(`[Service] Fetching GitHub stats for ${owner}/${repo}...`);
        const url = `https://api.github.com/repos/${owner}/${repo}`;
        const response = await fetch(url, {
            headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'JSON-Schema-Ecosystem-PoC' }
        });
        if (!response.ok) throw new Error(`GitHub API Error: ${response.status}`);
        const data = await response.json();
        return { stars: data.stargazers_count, issues: data.open_issues_count };
    }
}