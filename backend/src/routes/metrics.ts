import { Router } from 'express';
import { generateEcosystemReport } from '../controllers/MetricsController';

const router = Router();

// Endpoint to trigger the report
router.post('/generate', generateEcosystemReport);

export default router;