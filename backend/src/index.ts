import express from 'express';
import metricsRoutes from './routes/metrics';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/api/metrics', metricsRoutes);

app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
    console.log(`👉 To run the task, send a POST request to http://localhost:${PORT}/api/metrics/generate`);
});