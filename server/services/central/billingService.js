const { Op } = require('sequelize');
const {
  CentralSubscription,
  CentralBillingInvoice,
  CentralBillingPayment,
  CentralBillingAuditLog,
  CentralConfig,
} = require('../../models');
const { generateSecureToken } = require('./securityService');
const { processRemoteCommand } = require('./commandProcessor');

/**
 * Central Platform Business Subscription & Billing Service
 * 
 * Manages our business revenue: ERP service subscription charges that schools owe us.
 * 
 * STRICT DISTINCTION:
 * This service operates solely on our commercial software subscription records.
 * It NEVER interacts with student fees, school collections, or school bank accounts.
 */

/**
 * 1. Get or create school subscription record
 */
async function getOrCreateSchoolSubscription(schoolId, schoolName = 'Connected School ERP') {
  if (!schoolId) throw new Error('school_id is required');

  let sub = await CentralSubscription.findOne({ where: { school_id: schoolId } });

  if (!sub) {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const expiry = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

    sub = await CentralSubscription.create({
      school_id: schoolId,
      school_name: schoolName,
      plan: 'standard',
      monthly_charge: 150.00,
      custom_charge: null,
      currency: 'USD',
      start_date: today.toISOString().split('T')[0],
      expiry_date: expiry.toISOString().split('T')[0],
      next_due_date: nextMonth.toISOString().split('T')[0],
      status: 'active',
      grace_period_days: 7,
      notes: 'Initial subscription generated upon connection.',
    });

    await CentralBillingAuditLog.create({
      action: 'create_subscription',
      school_id: schoolId,
      target_entity: 'subscription',
      target_id: String(sub.id),
      changes: JSON.stringify({ initial_plan: sub.plan, monthly_charge: sub.monthly_charge }),
      reason: 'New school subscription created',
      performed_by: 'system',
      timestamp: new Date(),
    });
  }

  return sub;
}

/**
 * 2. Update Subscription Charges & Pricing (Editable Charges)
 * PRESERVES historical billing invoices.
 */
async function updateSubscriptionCharges(schoolId, updates, adminUser = 'central_admin', ipAddress = null) {
  const sub = await getOrCreateSchoolSubscription(schoolId);
  const oldValues = {
    plan: sub.plan,
    monthly_charge: sub.monthly_charge,
    custom_charge: sub.custom_charge,
    expiry_date: sub.expiry_date,
    grace_period_days: sub.grace_period_days,
  };

  const allowedUpdates = {};
  if (updates.plan !== undefined) allowedUpdates.plan = String(updates.plan);
  if (updates.monthly_charge !== undefined) allowedUpdates.monthly_charge = parseFloat(updates.monthly_charge);
  if (updates.custom_charge !== undefined) {
    allowedUpdates.custom_charge = updates.custom_charge === null || updates.custom_charge === ''
      ? null
      : parseFloat(updates.custom_charge);
  }
  if (updates.currency) allowedUpdates.currency = String(updates.currency);
  if (updates.start_date) allowedUpdates.start_date = updates.start_date;
  if (updates.expiry_date) allowedUpdates.expiry_date = updates.expiry_date;
  if (updates.next_due_date) allowedUpdates.next_due_date = updates.next_due_date;
  if (updates.grace_period_days !== undefined) allowedUpdates.grace_period_days = parseInt(updates.grace_period_days, 10);
  if (updates.notes !== undefined) allowedUpdates.notes = updates.notes;

  await sub.update(allowedUpdates);

  // Audit log of charge change
  await CentralBillingAuditLog.create({
    action: 'update_charges',
    school_id: schoolId,
    target_entity: 'subscription',
    target_id: String(sub.id),
    changes: JSON.stringify({ before: oldValues, after: allowedUpdates }),
    reason: updates.reason || 'Subscription terms / charges updated by administrator',
    performed_by: adminUser,
    ip_address: ipAddress,
    timestamp: new Date(),
  });

  return sub;
}

/**
 * 3. Generate Monthly Billing Invoice
 */
async function generateMonthlyInvoice(schoolId, month, year, customCharge = null, adminUser = 'central_admin') {
  const sub = await getOrCreateSchoolSubscription(schoolId);
  const billingId = `INV-${year}-${String(month).padStart(2, '0')}-${schoolId}`;

  // Check if invoice already exists
  let invoice = await CentralBillingInvoice.findOne({ where: { billing_id: billingId } });
  if (invoice) {
    return { invoice, created: false };
  }

  // Determine charge: override custom charge > subscription custom charge > standard monthly charge
  let charge = sub.monthly_charge;
  if (customCharge !== null && customCharge !== undefined && customCharge !== '') {
    charge = parseFloat(customCharge);
  } else if (sub.custom_charge !== null && sub.custom_charge !== undefined) {
    charge = parseFloat(sub.custom_charge);
  }

  const dueDate = new Date(year, month - 1, 10).toISOString().split('T')[0];

  invoice = await CentralBillingInvoice.create({
    billing_id: billingId,
    school_id: schoolId,
    billing_month: month,
    billing_year: year,
    amount_due: charge,
    amount_paid: 0.00,
    discount_amount: 0.00,
    balance: charge,
    due_date: dueDate,
    status: 'unpaid',
    notes: `Monthly ERP subscription for ${year}-${String(month).padStart(2, '0')}`,
  });

  await CentralBillingAuditLog.create({
    action: 'generate_invoice',
    school_id: schoolId,
    target_entity: 'invoice',
    target_id: billingId,
    changes: JSON.stringify({ amount_due: charge, month, year }),
    reason: 'Monthly invoice generated',
    performed_by: adminUser,
    timestamp: new Date(),
  });

  return { invoice, created: true };
}

/**
 * 4. Record Payment in Monthly Payment Register
 * Supports partial, full, and overpayments.
 */
async function recordPayment(paymentData, adminUser = 'central_admin', ipAddress = null) {
  const {
    school_id,
    billing_id,
    amount,
    payment_date = new Date().toISOString().split('T')[0],
    payment_method = 'bank_transfer',
    transaction_ref = '',
    notes = '',
  } = paymentData;

  if (!school_id) throw new Error('school_id is required');
  if (!billing_id) throw new Error('billing_id is required');
  if (amount === undefined || amount === null || isNaN(parseFloat(amount))) {
    throw new Error('Valid payment amount is required');
  }

  const parsedAmount = parseFloat(amount);
  const invoice = await CentralBillingInvoice.findOne({ where: { billing_id } });
  if (!invoice) throw new Error(`Invoice ${billing_id} not found`);

  const paymentId = `PAY-${Date.now()}-${generateSecureToken(4).toUpperCase()}`;

  // 1. Create payment entry
  const payment = await CentralBillingPayment.create({
    payment_id: paymentId,
    billing_id,
    school_id,
    amount: parsedAmount,
    payment_date,
    payment_method,
    transaction_ref,
    notes,
    recorded_by: adminUser,
    is_correction: false,
  });

  // 2. Update invoice balance and status
  const newAmountPaid = parseFloat(invoice.amount_paid) + parsedAmount;
  const newBalance = parseFloat(invoice.amount_due) - parseFloat(invoice.discount_amount) - newAmountPaid;

  let newStatus = 'unpaid';
  if (newBalance <= 0) {
    newStatus = 'paid';
  } else if (newAmountPaid > 0) {
    newStatus = 'partially_paid';
  }

  await invoice.update({
    amount_paid: newAmountPaid,
    balance: newBalance,
    status: newStatus,
  });

  // 3. Update subscription status if previously past_due
  const sub = await CentralSubscription.findOne({ where: { school_id } });
  if (sub && sub.status === 'past_due' && newBalance <= 0) {
    // Check if any other unpaid invoices exist
    const otherUnpaid = await CentralBillingInvoice.count({
      where: {
        school_id,
        status: { [Op.in]: ['unpaid', 'partially_paid', 'overdue'] },
      },
    });
    if (otherUnpaid === 0) {
      await sub.update({ status: 'active' });
    }
  }

  // 4. Audit Log
  await CentralBillingAuditLog.create({
    action: 'record_payment',
    school_id,
    target_entity: 'payment',
    target_id: paymentId,
    changes: JSON.stringify({
      amount: parsedAmount,
      billing_id,
      payment_method,
      invoice_balance_after: newBalance,
    }),
    reason: notes || 'Subscription payment recorded by administrator',
    performed_by: adminUser,
    ip_address: ipAddress,
    timestamp: new Date(),
  });

  return {
    payment,
    invoice,
    balance_remaining: newBalance,
  };
}

/**
 * 5. Update / Correct Existing Payment Record with Audit Trail
 */
async function correctPayment(paymentId, updates, reason, adminUser = 'central_admin', ipAddress = null) {
  if (!reason) throw new Error('A detailed reason is required for correcting a payment record');

  const payment = await CentralBillingPayment.findOne({ where: { payment_id: paymentId } });
  if (!payment) throw new Error(`Payment record ${paymentId} not found`);

  const invoice = await CentralBillingInvoice.findOne({ where: { billing_id: payment.billing_id } });
  if (!invoice) throw new Error(`Invoice for payment ${paymentId} not found`);

  const oldValues = {
    amount: payment.amount,
    payment_date: payment.payment_date,
    payment_method: payment.payment_method,
    transaction_ref: payment.transaction_ref,
  };

  const newAmount = updates.amount !== undefined ? parseFloat(updates.amount) : parseFloat(payment.amount);
  const amountDiff = newAmount - parseFloat(payment.amount);

  await payment.update({
    amount: newAmount,
    payment_date: updates.payment_date || payment.payment_date,
    payment_method: updates.payment_method || payment.payment_method,
    transaction_ref: updates.transaction_ref !== undefined ? updates.transaction_ref : payment.transaction_ref,
    notes: updates.notes !== undefined ? updates.notes : payment.notes,
    is_correction: true,
    correction_reason: reason,
  });

  // Re-adjust invoice if amount changed
  if (amountDiff !== 0) {
    const updatedPaid = parseFloat(invoice.amount_paid) + amountDiff;
    const updatedBalance = parseFloat(invoice.amount_due) - parseFloat(invoice.discount_amount) - updatedPaid;
    let updatedStatus = 'unpaid';
    if (updatedBalance <= 0) {
      updatedStatus = 'paid';
    } else if (updatedPaid > 0) {
      updatedStatus = 'partially_paid';
    }

    await invoice.update({
      amount_paid: updatedPaid,
      balance: updatedBalance,
      status: updatedStatus,
    });
  }

  // Audit log entry
  await CentralBillingAuditLog.create({
    action: 'correct_payment',
    school_id: payment.school_id,
    target_entity: 'payment',
    target_id: paymentId,
    changes: JSON.stringify({ before: oldValues, after: { amount: newAmount, ...updates } }),
    reason,
    performed_by: adminUser,
    ip_address: ipAddress,
    timestamp: new Date(),
  });

  return { payment, invoice };
}

/**
 * 6. Get Complete School Billing Details & Balances
 */
async function getSchoolBillingDetails(schoolId) {
  const sub = await getOrCreateSchoolSubscription(schoolId);

  const invoices = await CentralBillingInvoice.findAll({
    where: { school_id: schoolId },
    order: [['billing_year', 'DESC'], ['billing_month', 'DESC']],
  });

  const payments = await CentralBillingPayment.findAll({
    where: { school_id: schoolId },
    order: [['payment_date', 'DESC'], ['created_at', 'DESC']],
  });

  // Calculate outstanding balance across all invoices
  let totalOutstanding = 0;
  let totalBilled = 0;
  let totalPaid = 0;

  invoices.forEach((inv) => {
    totalBilled += parseFloat(inv.amount_due);
    totalPaid += parseFloat(inv.amount_paid);
    totalOutstanding += parseFloat(inv.balance);
  });

  const lastPayment = payments.length > 0 ? payments[0].payment_date : null;

  return {
    subscription: sub,
    summary: {
      total_billed: Math.round(totalBilled * 100) / 100,
      total_paid: Math.round(totalPaid * 100) / 100,
      total_outstanding: Math.round(totalOutstanding * 100) / 100,
      last_payment_date: lastPayment,
    },
    invoices,
    payments,
  };
}

/**
 * 7. Business Dashboard Metrics (Reports & Analytics)
 */
async function getBusinessDashboardMetrics(filters = {}) {
  const { month, year, school_id, plan, status } = filters;

  const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();
  const currentMonth = month ? parseInt(month, 10) : (new Date().getMonth() + 1);

  // 1. Subscription counts
  const totalConnected = await CentralSubscription.count();
  const activeSubs = await CentralSubscription.count({ where: { status: 'active' } });
  const suspendedSubs = await CentralSubscription.count({ where: { status: 'suspended' } });

  // 2. Invoice metrics for selected month & year
  const invoiceWhere = {
    billing_year: currentYear,
    billing_month: currentMonth,
  };
  if (school_id) invoiceWhere.school_id = school_id;

  const monthInvoices = await CentralBillingInvoice.findAll({ where: invoiceWhere });

  let monthCharges = 0;
  let monthReceived = 0;
  let monthOutstanding = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;

  const today = new Date();

  monthInvoices.forEach((inv) => {
    const due = parseFloat(inv.amount_due);
    const paid = parseFloat(inv.amount_paid);
    const bal = parseFloat(inv.balance);

    monthCharges += due;
    monthReceived += paid;
    monthOutstanding += bal;

    if (bal <= 0) {
      paidCount++;
    } else {
      pendingCount++;
      if (inv.due_date && new Date(inv.due_date) < today) {
        overdueCount++;
      }
    }
  });

  // 3. Total outstanding balance across ALL schools and ALL historical months
  const allInvoices = await CentralBillingInvoice.findAll();
  let totalOverallOutstanding = 0;
  allInvoices.forEach((inv) => {
    totalOverallOutstanding += parseFloat(inv.balance);
  });

  // 4. Month-wise payment history (last 6 months)
  const monthHistory = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1 - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();

    const invs = await CentralBillingInvoice.findAll({
      where: { billing_month: m, billing_year: y },
    });

    let mDue = 0;
    let mPaid = 0;
    invs.forEach((item) => {
      mDue += parseFloat(item.amount_due);
      mPaid += parseFloat(item.amount_paid);
    });

    monthHistory.push({
      month: m,
      year: y,
      label: `${d.toLocaleString('default', { month: 'short' })} ${y}`,
      charges: Math.round(mDue * 100) / 100,
      received: Math.round(mPaid * 100) / 100,
      outstanding: Math.round((mDue - mPaid) * 100) / 100,
    });
  }

  // 5. School-wise payment summary list
  const subWhere = {};
  if (plan) subWhere.plan = plan;
  if (status) subWhere.status = status;
  if (school_id) subWhere.school_id = school_id;

  const allSubs = await CentralSubscription.findAll({ where: subWhere });
  const schoolSummaries = [];

  for (const s of allSubs) {
    const details = await getSchoolBillingDetails(s.school_id);
    schoolSummaries.push({
      school_id: s.school_id,
      school_name: s.school_name,
      plan: s.plan,
      monthly_charge: s.custom_charge !== null ? s.custom_charge : s.monthly_charge,
      status: s.status,
      next_due_date: s.next_due_date,
      total_outstanding: details.summary.total_outstanding,
      last_payment_date: details.summary.last_payment_date,
    });
  }

  return {
    selected_period: { month: currentMonth, year: currentYear },
    summary: {
      total_connected_schools: totalConnected,
      active_subscriptions: activeSubs,
      suspended_subscriptions: suspendedSubs,
      schools_paid_this_month: paidCount,
      schools_pending_this_month: pendingCount,
      schools_overdue_this_month: overdueCount,
      total_charges_selected_month: Math.round(monthCharges * 100) / 100,
      total_received_selected_month: Math.round(monthReceived * 100) / 100,
      total_outstanding_selected_month: Math.round(monthOutstanding * 100) / 100,
      total_overall_outstanding: Math.round(totalOverallOutstanding * 100) / 100,
    },
    month_history: monthHistory,
    school_summaries: schoolSummaries,
  };
}

/**
 * 8. Centralized Remote Suspension Control
 * Issues authenticated remote command 'suspend' to the school's ERP.
 */
async function suspendSchoolSubscription(schoolId, reason, adminUser = 'central_admin', ipAddress = null) {
  if (!reason || reason.trim().length === 0) {
    throw new Error('A suspension reason is mandatory for auditing and legal clarity');
  }

  const sub = await getOrCreateSchoolSubscription(schoolId);
  const billingDetails = await getSchoolBillingDetails(schoolId);

  const commandId = `CMD-SUSPEND-${Date.now()}-${generateSecureToken(4).toUpperCase()}`;

  // Execute authenticated remote command to ERP
  const cmdPayload = {
    command_id: commandId,
    school_id: schoolId,
    command_type: 'suspend',
    issued_by: adminUser,
    payload: {
      reason: reason.trim(),
      outstanding_balance: billingDetails.summary.total_outstanding,
      school_name: sub.school_name,
    },
    timestamp: Date.now(),
  };

  const commandResult = await processRemoteCommand(cmdPayload);

  if (!commandResult.success) {
    throw new Error(`Remote suspension failed at ERP: ${commandResult.error || 'Acknowledgement not received'}`);
  }

  // Update subscription status in Central Platform
  await sub.update({
    status: 'suspended',
    notes: `Suspended by ${adminUser}: ${reason.trim()}`,
  });

  // Log in central audit trail
  await CentralBillingAuditLog.create({
    action: 'suspend_school',
    school_id: schoolId,
    target_entity: 'subscription',
    target_id: String(sub.id),
    changes: JSON.stringify({
      previous_status: 'active',
      new_status: 'suspended',
      outstanding_balance: billingDetails.summary.total_outstanding,
      command_id: commandId,
    }),
    reason: reason.trim(),
    performed_by: adminUser,
    ip_address: ipAddress,
    timestamp: new Date(),
  });

  return {
    success: true,
    school_id: schoolId,
    school_name: sub.school_name,
    status: 'suspended',
    reason: reason.trim(),
    outstanding_balance: billingDetails.summary.total_outstanding,
    command_result: commandResult,
    acknowledged_at: new Date().toISOString(),
  };
}

/**
 * 9. Centralized Remote Reactivation Control
 * Issues authenticated remote command 'reactivate' to the school's ERP.
 */
async function reactivateSchoolSubscription(schoolId, reason = 'Subscription payments settled', adminUser = 'central_admin', ipAddress = null) {
  const sub = await getOrCreateSchoolSubscription(schoolId);
  const commandId = `CMD-REACTIVATE-${Date.now()}-${generateSecureToken(4).toUpperCase()}`;

  // Execute authenticated remote command to ERP
  const cmdPayload = {
    command_id: commandId,
    school_id: schoolId,
    command_type: 'reactivate',
    issued_by: adminUser,
    payload: {
      reason: reason.trim(),
      school_name: sub.school_name,
    },
    timestamp: Date.now(),
  };

  const commandResult = await processRemoteCommand(cmdPayload);

  if (!commandResult.success) {
    throw new Error(`Remote reactivation failed at ERP: ${commandResult.error || 'Acknowledgement not received'}`);
  }

  // Restore subscription status
  await sub.update({
    status: 'active',
    notes: `Reactivated by ${adminUser}: ${reason.trim()}`,
  });

  // Log in central audit trail
  await CentralBillingAuditLog.create({
    action: 'reactivate_school',
    school_id: schoolId,
    target_entity: 'subscription',
    target_id: String(sub.id),
    changes: JSON.stringify({
      previous_status: 'suspended',
      new_status: 'active',
      command_id: commandId,
    }),
    reason: reason.trim(),
    performed_by: adminUser,
    ip_address: ipAddress,
    timestamp: new Date(),
  });

  return {
    success: true,
    school_id: schoolId,
    school_name: sub.school_name,
    status: 'active',
    command_result: commandResult,
    acknowledged_at: new Date().toISOString(),
  };
}

/**
 * 10. Extend Subscription Validity
 */
async function extendSubscriptionValidity(schoolId, days = 30, adminUser = 'central_admin', ipAddress = null) {
  const sub = await getOrCreateSchoolSubscription(schoolId);
  const parsedDays = parseInt(days, 10) || 30;

  const currentExp = sub.expiry_date ? new Date(sub.expiry_date) : new Date();
  const newExpiry = new Date(currentExp.getTime() + parsedDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const oldExp = sub.expiry_date;
  await sub.update({
    expiry_date: newExpiry,
    status: 'active',
  });

  const commandId = `CMD-EXTEND-${Date.now()}-${generateSecureToken(4).toUpperCase()}`;
  await processRemoteCommand({
    command_id: commandId,
    school_id: schoolId,
    command_type: 'extend_subscription',
    issued_by: adminUser,
    payload: { days: parsedDays },
    timestamp: Date.now(),
  });

  await CentralBillingAuditLog.create({
    action: 'extend_subscription',
    school_id: schoolId,
    target_entity: 'subscription',
    target_id: String(sub.id),
    changes: JSON.stringify({ old_expiry: oldExp, new_expiry: newExpiry, days: parsedDays }),
    reason: `Subscription extended by ${parsedDays} days`,
    performed_by: adminUser,
    ip_address: ipAddress,
    timestamp: new Date(),
  });

  return {
    success: true,
    school_id: schoolId,
    extended_days: parsedDays,
    expiry_date: newExpiry,
  };
}

module.exports = {
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
};
