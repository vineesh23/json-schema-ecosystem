# JSON Schema Ecosystem Observability

> GSoC 2026 qualification task submission for [json-schema-org/community#980](https://github.com/json-schema-org/community/issues/980)

Automated, daily collection of metrics across the JSON Schema ecosystem — covering validators, community health, cross-language adoption, and historical trends.

---

## ✅ What this does

| Category | Metrics |
|---|---|
| **npm validator market share** | AJV, Zod, Yup, Joi, jsonschema, @cfworker/json-schema — weekly downloads |
| **Python ecosystem** | jsonschema, Pydantic, fastjsonschema — weekly PyPI downloads |
| **GitHub health** | Stars, forks, open issues for `json-schema-spec`, `JSON-Schema-Test-Suite`, `ajv` |
| **Community** | GitHub repos tagged `json-schema`, Stack Overflow questions for `json-schema` / `ajv` |
| **Historical trend** | 30-day daily download trend for AJV and Zod (shows ecosystem evolution) |

All metrics are collected automatically every day via **GitHub Actions** and committed back to the repo.

---

## 📊 Dashboard

After running the collector, open `backend/output/dashboard.html` in a browser.

Charts included:
- 30-day download trend (AJV vs Zod)
- npm validator market share (bar)
- Python ecosystem (doughnut)
- GitHub health (log-scale bar)
- Stack Overflow questions (bar)

---

## 🗄️ Output files

| File | Purpose |
|---|---|
| `output/metrics-latest.json` | Most recent snapshot (overwritten each run) |
| `output/metrics-YYYY-MM-DD.json` | Dated snapshot for every run |
| `output/metrics-history.ndjson` | Append-only log — one JSON object per line — for long-term trend analysis |
| `output/dashboard.html` | Generated HTML dashboard |

The NDJSON history file means you can reconstruct trends over any time range without an external database.

---

## 🚀 Running locally

```bash
cd backend
npm install

# Set optional GitHub token to avoid rate limits (60 req/hr unauthenticated)
export GITHUB_TOKEN=ghp_your_token_here

# Collect metrics
npx ts-node src/index.ts

# Generate dashboard
npx ts-node src/services/generateDashboard.ts

# Open dashboard
open output/dashboard.html
```

---

## ⚙️ Automated via GitHub Actions

The workflow at `.github/workflows/collect-metrics.yml`:
- Runs **daily at 06:00 UTC**
- Can also be triggered manually from the GitHub UI
- Uses `GITHUB_TOKEN` (auto-provided by Actions) for authenticated GitHub API calls
- Commits updated output files back to `main` with `[skip ci]` to prevent loops

---

## 🏗️ Architecture

```
backend/src/
├── index.ts                    # CLI entry point
├── controllers/
│   └── MetricsController.ts    # Orchestrates all collection
├── services/
│   ├── ApiService.ts           # All external API calls (npm, GitHub, PyPI, StackOverflow)
│   └── generateDashboard.ts    # Reads JSON → writes HTML dashboard
├── repositories/
│   └── JsonRepository.ts       # Writes latest / dated / history files
└── models/
    └── EcosystemMetric.ts      # TypeScript types and snapshot builder
```

**Key design decisions:**
- No Express server — a plain script is all that's needed for a data pipeline
- `Promise.all` for concurrent fetching (fast, no sequential bottlenecks)
- NDJSON for history (append-only, no database needed, Git-friendly)
- `safeFetch` wrapper for graceful fallbacks on rate-limited APIs
- `GITHUB_TOKEN` env var for authenticated requests (unauthenticated hits rate limits quickly)

---

## 📈 Extending

To add a new metric:
1. Add a fetch method to `ApiService.ts`
2. Add a call in `MetricsController.ts` and push the result to `allMetrics`
3. Add a chart/stat card in `generateDashboard.ts`

The schema is versioned (`schemaVersion` in each snapshot) so breaking changes are trackable.
