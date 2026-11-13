const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { CentralSubscription, CentralBillingAuditLog } = require('../models');
const {
  getOrCreateSchoolSubscription,
  updateSubscriptionCharges,
  generateMonthlyInvoice,
  recordPayment,
  correctPayment,
  getSchoolBillingDetails,
  getBusinessDashboardMetrics,
  suspendSchoolSubscription,
  reactivateSchoolSubscription,
  extendSubscriptionValidity,
} = require('../services/central/billingService');

// All billing endpoints require authenticated central administrator
router.use(protect, authorize('admin'));

/**
 * GET /api/central-billing/dashboard
 * Returns business dashboard analytics, charges, collections, and month history.
 */
router.get('/dashboard', async (req, res) => {
  try {
    const metrics = await getBusinessDashboardMetrics(req.query);
    res.json({ success: true, ...metrics });
  } catch (err) {
    console.error('[BILLING GET /dashboard]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/central-billing/subscriptions
 * List all registered school subscriptions.
 */
router.get('/subscriptions', async (req, res) => {
  try {
    const subs = await CentralSubscription.findAll({
      order: [['created_at', 'DESC']],
    });

    const enriched = await Promise.all(
      subs.map(async (s) => {
        const details = await getSchoolBillingDetails(s.school_id);
        return {
          ...s.toJSON(),
          summary: details.summary,
        };
      })
    );

    res.json({ success: true, subscriptions: enriched });
  } catch (err) {
    console.error('[BILLING GET /subscriptions]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/central-billing/subscriptions/:school_id
 * Get complete billing ledger, invoices, and payments for a specific school.
 */
router.get('/subscriptions/:school_id', async (req, res) => {
  try {
    const details = await getSchoolBillingDetails(req.params.school_id);
    res.json({ success: true, ...details });
  } catch (err) {
    console.error('[BILLING GET /subscriptions/:school_id]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/central-billing/subscriptions/:school_id/charges
 * Update subscription plan, monthly charges, or discounts.
 * Preserves historical invoices.
 */
router.put('/subscriptions/:school_id/charges', async (req, res) => {
  try {
    const adminUser = req.user?.username || req.user?.email || 'central_admin';
    const updated = await updateSubscriptionCharges(req.params.school_id, req.body, adminUser, req.ip);
    res.json({
      success: true,
      message: 'Subscription charges updated successfully. Historical records preserved.',
      subscription: updated,
    });
  } catch (err) {
    console.error('[BILLING PUT /charges]', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/central-billing/subscriptions/:school_id/generate-invoice
 * Generate a monthly subscription invoice for a school.
 */
router.post('/subscriptions/:school_id/generate-invoice', async (req, res) => {
  try {
    const { month, year, custom_charge } = req.body;
    const adminUser = req.user?.username || req.user?.email || 'central_admin';

    if (!month || !year) {
      return res.status(400).json({ success: false, error: 'month and year are required' });
    }

    const result = await generateMonthlyInvoice(
      req.params.school_id,
      parseInt(month, 10),
      parseInt(year, 10),
      custom_charge,
      adminUser
    );

    res.json({
      success: true,
      message: result.created ? 'Monthly invoice generated.' : 'Existing invoice retrieved.',
      invoice: result.invoice,
    });
  } catch (err) {
    console.error('[BILLING POST /generate-invoice]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/central-billing/payments
 * Record a payment received from a school in the Monthly Payment Register.
 */
router.post('/payments', async (req, res) => {
  try {
    const adminUser = req.user?.username || req.user?.email || 'central_admin';
    const result = await recordPayment(req.body, adminUser, req.ip);
    res.json({
      success: true,
      message: 'Subscription payment recorded successfully.',
      ...result,
    });
  } catch (err) {
    console.error('[BILLING POST /payments]', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/central-billing/payments/:payment_id
 * Correct an existing payment entry with mandatory audit reasoning.
 */
router.put('/payments/:payment_id', async (req, res) => {
  try {
    const { updates, reason } = req.body;
    const adminUser = req.user?.username || req.user?.email || 'central_admin';

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'A correction reason is required for the audit trail' });
    }

    const result = await correctPayment(req.params.payment_id, updates, reason, adminUser, req.ip);
    res.json({
      success: true,
      message: 'Payment record corrected and audited.',
      ...result,
    });
  } catch (err) {
    console.error('[BILLING PUT /payments/:payment_id]', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/central-billing/subscriptions/:school_id/suspend
 * Centralized remote suspension control:
 * Sends authenticated remote suspension command to the ERP.
 */
router.post('/subscriptions/:school_id/suspend', async (req, res) => {
  try {
    const { reason } = req.body;
    const adminUser = req.user?.username || req.user?.email || 'central_admin';

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Suspension reason is required' });
    }

    const result = await suspendSchoolSubscription(req.params.school_id, reason, adminUser, req.ip);
    res.json(result);
  } catch (err) {
    console.error('[BILLING POST /suspend]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/central-billing/subscriptions/:school_id/reactivate
 * Centralized remote reactivation control:
 * Sends authenticated remote reactivation command to restore ERP access.
 */
router.post('/subscriptions/:school_id/reactivate', async (req, res) => {
  try {
    const { reason } = req.body;
    const adminUser = req.user?.username || req.user?.email || 'central_admin';

    const result = await reactivateSchoolSubscription(req.params.school_id, reason, adminUser, req.ip);
    res.json(result);
  } catch (err) {
    console.error('[BILLING POST /reactivate]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/central-billing/subscriptions/:school_id/extend
 * Extend subscription validity by N days.
 */
router.post('/subscriptions/:school_id/extend', async (req, res) => {
  try {
    const { days } = req.body;
    const adminUser = req.user?.username || req.user?.email || 'central_admin';

    const result = await extendSubscriptionValidity(req.params.school_id, days || 30, adminUser, req.ip);
    res.json(result);
  } catch (err) {
    console.error('[BILLING POST /extend]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/central-billing/audit-logs
 * Fetch complete audit log history.
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await CentralBillingAuditLog.findAll({
      limit: 100,
      order: [['timestamp', 'DESC']],
    });
    res.json({ success: true, logs });
  } catch (err) {
    console.error('[BILLING GET /audit-logs]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
