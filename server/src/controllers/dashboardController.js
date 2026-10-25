import Obligation from '../models/Obligation.js';
import { isDbConnected, isProduction } from '../config/db.js';
import { calculateDashboardSummary } from '../services/readinessService.js';

/**
 * GET /api/dashboard/summary
 * Scoped to user's trusted organization
 */
export async function getDashboardSummary(req, res, next) {
  try {
    let obligations = [];
    const userOrg = req.user?.org || 'General Organization';

    if (isDbConnected()) {
      const orgFilter = {
        $or: [
          { org: userOrg },
          { org: 'General Organization' },
          { org: { $exists: false } },
        ],
      };
      obligations = await Obligation.find(orgFilter).lean();
    } else {
      if (isProduction()) {
        return res.status(503).json({
          success: false,
          message: 'Database connection unavailable. MongoDB Atlas is mandatory in production.',
        });
      }
      const { getObligations } = await import('./obligationController.js');
      const fakeReq = { query: {}, user: req.user };
      const fakeRes = {
        json: (payload) => {
          obligations = payload.data || [];
        },
      };
      await getObligations(fakeReq, fakeRes, next);
    }

    const summary = calculateDashboardSummary(obligations);

    return res.json({
      success: true,
      data: summary,
      organization: userOrg,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getDashboardSummary,
};
