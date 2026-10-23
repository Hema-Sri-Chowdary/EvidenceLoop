import Obligation from '../models/Obligation.js';
import { isDbConnected } from '../config/db.js';
import { calculateDashboardSummary } from '../services/readinessService.js';
import { generateSeedObligations } from '../utils/seedData.js';

/**
 * GET /api/dashboard/summary
 */
export async function getDashboardSummary(req, res, next) {
  try {
    let obligations = [];

    if (isDbConnected()) {
      obligations = await Obligation.find({}).lean();
    } else {
      // Fetch current obligations from memory store
      const { getObligations } = await import('./obligationController.js');
      const fakeReq = { query: {} };
      const fakeRes = {
        json: (data) => {
          obligations = data.data || [];
        },
      };
      await getObligations(fakeReq, fakeRes, next);
    }

    const summary = calculateDashboardSummary(obligations);

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}
