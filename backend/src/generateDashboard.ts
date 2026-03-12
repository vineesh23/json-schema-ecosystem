import * as fs from 'fs';
import * as path from 'path';

// Read the latest JSON data
const dataPath = path.join(process.cwd(), 'output', 'metrics-latest.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const jsonData = JSON.parse(rawData);

// Extract data for the charts
const m = jsonData.metrics;
const getVal = (name: string) => m.find((x: any) => x.name === name).value;

// Generate the HTML string with data injected
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><title>Ecosystem Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: sans-serif; background: #0d1117; color: #c9d1d9; padding: 40px; display: flex; flex-direction: column; align-items: center; }
        .dashboard { display: flex; gap: 30px; width: 100%; max-width: 1000px; margin-top: 20px; }
        .card { background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 20px; flex: 1; }
    </style>
</head>
<body>
    <h1>JSON Schema Ecosystem Observability</h1>
    <p>Last Updated: ${new Date(jsonData.timestamp).toLocaleString()}</p>
    <div class="dashboard">
        <div class="card"><canvas id="npmChart"></canvas></div>
        <div class="card"><canvas id="githubChart"></canvas></div>
    </div>
    <script>
        new Chart(document.getElementById('npmChart'), {
            type: 'bar',
            data: {
                labels: ['AJV', 'jsonschema', 'Yup'],
                datasets: [{ label: 'Downloads', data: [${getVal('ajv_weekly_downloads')}, ${getVal('jsonschema_weekly_downloads')}, ${getVal('yup_weekly_downloads')}], backgroundColor: ['#cb3837', '#f39c12', '#3498db'] }]
            },
            options: { plugins: { title: { display: true, text: 'Validator Market Share', color: '#fff' }, legend: {display: false} } }
        });
        new Chart(document.getElementById('githubChart'), {
            type: 'bar',
            data: {
                labels: ['Repos w/ Topic', 'Spec Stars', 'Spec Issues'],
                datasets: [{ label: 'Stats', data: [${getVal('github_topic_repos')}, ${getVal('core_spec_stars')}, ${getVal('core_spec_open_issues')}], backgroundColor: ['#2ea043', '#e3b341', '#f85149'] }]
            },
            options: { scales: { y: { type: 'logarithmic' } }, plugins: { title: { display: true, text: 'GitHub Health (Log Scale)', color: '#fff' }, legend: {display: false} } }
        });
    </script>
</body>
</html>`;

// Write the HTML file to the output folder
fs.writeFileSync(path.join(process.cwd(), 'output', 'dashboard.html'), htmlContent);
console.log('✅ Dashboard successfully generated at output/dashboard.html');