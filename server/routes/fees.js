const express  = require('express');
const router   = express.Router();
const { Op }   = require('sequelize');
const crypto   = require('crypto');
const { Fee, Student, User, ClassFeeStructure, Notification, NotificationRead, AuditLog, Session, sequelize } = require('../models');
const { protect, hasPermission, isSuperAdmin, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../utils/cache');
const { validateFeeStructureCreate, validateFeeStructureUpdate, validateFeeCollect } = require('../middleware/validator');
const { feeCollectionLimiter } = require('../middleware/rateLimiters');
const {
  round2,
  parseFeeBreakdown,
  getStudentsWithFeeStatus,
  getOrCreateFeeRecord,
  generateMonthlyFees,
  buildReceiptData,
  getFeeStructureForClass,
  getStudentFeeLedger,
  MONTHS,
} = require('../services/feeService');

// (C3 fix) — whitelisted fields for fee structure
const FEE_STRUCTURE_FIELDS = ['monthly_fee', 'admission_fee', 'annual_fee', 'promotion_fee', 'exam_fee'];

const pick = (obj, keys) => {
  const result = {};
  for (const key of keys) {
    if (obj[key] !== undefined) result[key] = obj[key];
  }
  return result;
};

// (M6 fix) — generate unique receipt number using built-in crypto (uuid v14 is ESM-only)
const generateReceiptNumber = () => `REC-${crypto.randomUUID().split('-')[0].toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

// ─────────────────────────────────────────────────────────────────────────────
// FEE STRUCTURE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/fees/structure — get all class fee structures
router.get('/structure', protect, hasPermission('MANAGE_FEES'), async (req, res) => {
  try {
    const structures = await ClassFeeStructure.findAll({
      where:   { is_active: true },
      order:   [['class', 'ASC']],
      include: [{ model: User, as: 'updatedByUser', attributes: ['id', 'name'] }],
    });
    res.json(structures);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/fees/structure/:class/:session — get one class structure
router.get('/structure/:class/:session', protect, hasPermission('MANAGE_FEES'), async (req, res) => {
  try {
    const structure = await getFeeStructureForClass(req.params.class, req.params.session);
    res.json(structure);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/fees/structure — create or update class fee structure
router.post('/structure', protect, isSuperAdmin, async (req, res) => {
  try {
    const { class: cls, session_id } = req.body;

    if (!cls || !session_id) return res.status(400).json({ message: 'Class and session_id are required.' });

    const safeFees = pick(req.body, FEE_STRUCTURE_FIELDS);

    const [structure, created] = await ClassFeeStructure.upsert({
      class:         cls,
      session_id:    session_id,
      monthly_fee:   parseFloat(safeFees.monthly_fee   || 0),
      admission_fee: parseFloat(safeFees.admission_fee || 0),
      annual_fee:    parseFloat(safeFees.annual_fee    || 0),
      promotion_fee: parseFloat(safeFees.promotion_fee || 0),
      exam_fee:      parseFloat(safeFees.exam_fee      || 0),
      monthly_due_date: parseInt(safeFees.monthly_due_date || 10),
      annual_due_date:  safeFees.annual_due_date || null,
      updated_by:    req.user.id,
      is_active:     true,
    });

    res.status(created ? 201 : 200).json({
      message: `Fee structure for ${cls} ${created ? 'created' : 'updated'}.`,
      structure,
    });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT /api/fees/structure/:id
router.put('/structure/:id', protect, isSuperAdmin, async (req, res) => {
  try {
    const structure = await ClassFeeStructure.findByPk(req.params.id);
    if (!structure) return res.status(404).json({ message: 'Structure not found.' });
    if (structure.is_locked) return res.status(400).json({ message: 'Cannot edit a locked structure.' });

    const safeFees = pick(req.body, FEE_STRUCTURE_FIELDS);
    const updateData = { updated_by: req.user.id };
    
    for (const key of ['monthly_fee', 'admission_fee', 'annual_fee', 'promotion_fee', 'exam_fee']) {
      if (safeFees[key] !== undefined) updateData[key] = parseFloat(safeFees[key]);
    }
    if (safeFees.monthly_due_date !== undefined) updateData.monthly_due_date = parseInt(safeFees.monthly_due_date);
    if (safeFees.annual_due_date !== undefined) updateData.annual_due_date = safeFees.annual_due_date;

    await structure.update(updateData);
    res.json(structure);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// POST /api/fees/structure/:id/publish
router.post('/structure/:id/publish', protect, isSuperAdmin, async (req, res) => {
  const txn = await sequelize.transaction();
  try {
    const structure = await ClassFeeStructure.findByPk(req.params.id, { transaction: txn });
    if (!structure) { await txn.rollback(); return res.status(404).json({ message: 'Structure not found.' }); }
    if (structure.is_locked) { await txn.rollback(); return res.status(400).json({ message: 'Already published and locked.' }); }

    // Lock it
    await structure.update({ is_published: true, is_locked: true, updated_by: req.user.id }, { transaction: txn });

    // Fetch all active students for this class and session
    const students = await Student.findAll({
      where: { class: structure.class, session_id: structure.session_id, is_active: true, approval_status: 'approved' },
      transaction: txn
    });

    const currentYear = new Date().getFullYear();
    const currentMonth = MONTHS[new Date().getMonth()];

    for (const student of students) {
      // 1. Generate Session / Annual Fee
      if (structure.annual_fee > 0) {
        await getOrCreateFeeRecord(student, currentMonth, currentYear, 'annual', txn);
      }
      
      // 2. Generate Admission Fee (only if never charged before)
      if (structure.admission_fee > 0) {
        const hasPaidAdmission = await Fee.findOne({
          where: { student_id: student.id, fee_type: 'admission' },
          transaction: txn
        });
        if (!hasPaidAdmission) {
          await getOrCreateFeeRecord(student, currentMonth, currentYear, 'admission', txn);
        }
      }
    }

    // Dispatch Notification using valid Notification schema fields
    const notif = await Notification.create({
      title: `Fee Structure Published for ${structure.class}`,
      message: `The annual fee structure for ${structure.class} has been published and locked. Please check your fees.`,
      type: 'general',
      recipient_type: 'role',
      recipient_role: 'parents',
      sent_by: req.user.id
    }, { transaction: txn });

    await AuditLog.create({
      user_id: req.user.id,
      action: 'publish_fee_structure',
      target_type: 'ClassFeeStructure',
      target_id: structure.id,
      details: { class: structure.class, session_id: structure.session_id, students_affected: students.length },
      ip_address: req.ip
    }, { transaction: txn });

    await txn.commit();
    res.json({ message: `Structure locked. Generated fees for ${students.length} students.`, structure });
  } catch (err) {
    await txn.rollback();
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FEES OVERVIEW — ALL STUDENTS WITH STATUS (fixes missing students bug)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/fees/overview
 * Returns ALL active students with their fee status for a given month/year.
 * Students without fee records appear as "not_generated".
 * This is the main endpoint for the fees management page.
 */
router.get('/overview', protect, hasPermission('MANAGE_FEES'), async (req, res) => {
  try {
    const {
      month  = MONTHS[new Date().getMonth()],
      year   = new Date().getFullYear(),
      class: cls,
      section,
      fee_status,
    } = req.query;

    // Auto-generate missing fee records for the requested month/year JIT
    await generateMonthlyFees(month, String(year));

    let data = await getStudentsWithFeeStatus(month, String(year), { class: cls, section });

    // Filter by fee_status if provided
    if (fee_status && fee_status !== 'all') {
      data = data.filter(s => s.fee_status === fee_status);
    }

    const summary = {
      total:         data.length,
      paid:          data.filter(s => s.fee_status === 'paid').length,
      unpaid:        data.filter(s => s.fee_status === 'unpaid').length,
      partial:       data.filter(s => s.fee_status === 'partial').length,
      not_generated: data.filter(s => s.fee_status === 'not_generated').length,
      total_due:     data.reduce((a, s) => a + (s.total_due || 0), 0),
      total_paid:    data.reduce((a, s) => a + (s.total_paid || 0), 0),
    };

    res.json({ month, year, summary, students: data });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// FEE RECORD MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/fees — existing fee records with filters
router.get('/', protect, hasPermission('MANAGE_FEES'), async (req, res) => {
  try {
    const { status, month, year, class: cls } = req.query;
    const where = {};
    if (status) where.status = status;
    if (month)  where.month  = month;
    if (year)   where.year   = parseInt(year);

    const include = [{
      model:      Student,
      as:         'student',
      attributes: ['id', 'student_id', 'first_name', 'last_name', 'class', 'section'],
      ...(cls ? { where: { class: cls } } : {}),
    }];

    const fees = await Fee.findAll({
      where,
      include,
      order: [['created_at', 'DESC']],
    });

    res.set('Cache-Control', 'no-store');
    res.json(fees.map(f => f.toJSON()));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Append a payment installment into fee_breakdown.transactions without losing prior partial receipts
const buildUpdatedBreakdownWithTx = (feeRecord, {
  amount,
  receiptNumber,
  paymentMode,
  paidDate,
  collectedById,
  collectedByName,
  remarks,
}) => {
  const existingBreakdown = parseFeeBreakdown(feeRecord.fee_breakdown);
  const existingTxs = Array.isArray(existingBreakdown.transactions)
    ? [...existingBreakdown.transactions]
    : [];

  const prevPaid = round2(feeRecord.paid_amount || 0);
  if (existingTxs.length === 0 && prevPaid > 0) {
    existingTxs.push({
      receipt_number: feeRecord.receipt_number || `REC-${feeRecord.id}-1`,
      amount: prevPaid,
      payment_mode: feeRecord.payment_mode || 'cash',
      paid_date: feeRecord.paid_date || null,
      collected_by: feeRecord.collected_by || null,
      collected_by_name: feeRecord.collectedByUser?.name || 'System',
      remarks: feeRecord.remarks || 'Prior payment',
    });
  }

  existingTxs.push({
    receipt_number: receiptNumber,
    amount: round2(amount),
    payment_mode: paymentMode,
    paid_date: paidDate,
    collected_by: collectedById,
    collected_by_name: collectedByName,
    remarks: remarks || '',
  });

  return {
    ...existingBreakdown,
    transactions: existingTxs,
  };
};

// Shared IDOR guard for fee endpoints (Strict Role-Based Access Control)
const hasStudentFeeAccess = (req, targetStudentId) => {
  // 1. Authorized financial administration roles
  if (['admin', 'admin2', 'fee_collector'].includes(req.user.role)) {
    return true;
  }
  // 2. Parents and Students can ONLY access their own linked student record
  if (req.user.role === 'parent' || req.user.role === 'student') {
    const linkedId = req.user.linked_student_id || req.user.linkedStudent?.id;
    return Boolean(linkedId && linkedId === parseInt(targetStudentId, 10));
  }
  // 3. Teachers and all other unauthorized roles are strictly denied
  return false;
};

// GET /api/fees/student/:studentId — (H2 fix) improved IDOR check
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    if (!hasStudentFeeAccess(req, req.params.studentId)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Auto-generate missing fee record for the current month JIT
    const student = await Student.findByPk(req.params.studentId);
    if (student && student.is_active && student.approval_status === 'approved') {
      const currentMonth = MONTHS[new Date().getMonth()];
      const currentYear = String(new Date().getFullYear());
      await getOrCreateFeeRecord(student, currentMonth, currentYear, 'monthly');
    }

    const fees = await Fee.findAll({
      where:  { student_id: req.params.studentId },
      order:  [['year', 'DESC'], ['month', 'ASC']],
      include:[
        { model: User, as: 'collectedByUser', attributes: ['id', 'name'] },
        { model: Session, as: 'session', attributes: ['id', 'name'] },
      ]
    });
    res.set('Cache-Control', 'no-store');
    res.json(fees.map(f => f.toJSON()));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/fees/student/:studentId/structured — Reconciled session-wise ledger (Annual, 12 Months, Other, Receipts)
router.get('/student/:studentId/structured', protect, async (req, res) => {
  try {
    if (!hasStudentFeeAccess(req, req.params.studentId)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const student = await Student.findByPk(req.params.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    if (student.is_active && student.approval_status === 'approved') {
      const currentMonth = MONTHS[new Date().getMonth()];
      const currentYear = String(new Date().getFullYear());
      await getOrCreateFeeRecord(student, currentMonth, currentYear, 'monthly');
    }

    const ledger = await getStudentFeeLedger(req.params.studentId, {
      sessionId: req.query.session_id,
    });
    res.set('Cache-Control', 'no-store');
    res.json(ledger);
  } catch (err) {
    console.error('Structured fee ledger error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FEE COLLECTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/fees/collect
 * Collect payment for a student for one or more months.
 * If fee record doesn't exist → create it first, then record payment.
 * (H3 fix) — overpayment protection added
 * (M6 fix) — UUID-based receipt numbers
 */
router.post('/collect', feeCollectionLimiter, protect, hasPermission('COLLECT_FEES'), validateFeeCollect, async (req, res) => {
  const txn = await sequelize.transaction();
  try {
    const {
      student_id,
      month,
      year,
      fee_type = 'monthly',
      amount,
      payment_mode,
      remarks,
      // Optional: provide fee_id directly if record already exists
      fee_id,
    } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      await txn.rollback();
      return res.status(400).json({ message: 'Amount must be greater than 0.' });
    }

    let fee;

    if (fee_id) {
      // Existing record
      fee = await Fee.findByPk(fee_id, {
        include: [
          { model: Student, as: 'student' },
          { model: User, as: 'collectedByUser', attributes: ['id', 'name'] },
        ],
        transaction: txn,
        lock: txn.LOCK.UPDATE, // Phase 3: Prevent race conditions
      });
      if (!fee) { await txn.rollback(); return res.status(404).json({ message: 'Fee record not found.' }); }
    } else {
      // Find or create
      if (!student_id || !month || !year) {
        await txn.rollback();
        return res.status(400).json({ message: 'student_id, month, and year are required.' });
      }
      const student = await Student.findByPk(student_id, { transaction: txn });
      if (!student) { await txn.rollback(); return res.status(404).json({ message: 'Student not found.' }); }

      const { record } = await getOrCreateFeeRecord(student, month, parseInt(year), fee_type, txn);
      fee = await Fee.findByPk(record.id, {
        include: [
          { model: Student, as: 'student' },
          { model: User, as: 'collectedByUser', attributes: ['id', 'name'] },
        ],
        transaction: txn,
        lock: txn.LOCK.UPDATE, // Phase 3: Prevent race conditions
      });
    }

    // (H3 fix) — overpayment protection with exact decimal rounding
    const payAmt = round2(amount);
    const totalAmount = round2(parseFloat(fee.total_amount || 0) + parseFloat(fee.late_fee_amount || 0));
    const currentPaid = round2(fee.paid_amount || 0);
    let newPaid = round2(currentPaid + payAmt);

    if (newPaid - totalAmount > 0.009) {
      await txn.rollback();
      const remaining = Math.max(0, round2(totalAmount - currentPaid));
      return res.status(400).json({
        message: `Overpayment not allowed. Maximum payable amount is ₹${remaining.toFixed(2)}.`,
        max_payable: remaining,
      });
    }
    if (totalAmount - newPaid <= 0.009 && newPaid > 0) {
      newPaid = totalAmount;
    }

    const status = newPaid >= totalAmount ? 'paid'
                 : newPaid > 0           ? 'partial'
                 : 'unpaid';

    // (M6 fix) — unique receipt number + immutable payment history inside fee_breakdown.transactions
    const receiptNumber = generateReceiptNumber();
    const paidDate = new Date().toISOString().split('T')[0];
    const updatedBreakdown = buildUpdatedBreakdownWithTx(fee, {
      amount: payAmt,
      receiptNumber,
      paymentMode: payment_mode,
      paidDate,
      collectedById: req.user.id,
      collectedByName: req.user.name || 'Admin',
      remarks,
    });

    await fee.update({
      paid_amount:    newPaid,
      payment_mode,
      remarks,
      collected_by:   req.user.id,
      paid_date:      paidDate,
      status,
      receipt_number: receiptNumber,
      fee_breakdown:  updatedBreakdown,
    }, { transaction: txn });

    // Auto-approve pending student if admission fee is fully paid
    if (fee.fee_type === 'admission' && status === 'paid' && fee.student && fee.student.approval_status === 'pending') {
      const studentToUpdate = fee.student;
      await studentToUpdate.update({
        approval_status: 'approved',
        student_status: 'active',
        approved_by: req.user.id,
        approved_at: new Date(),
        is_active: true
      }, { transaction: txn });
      
      // Since they are now approved, generate their normal fees for this session!
      const { assignPublishedFeeStructure, MONTHS, getOrCreateFeeRecord } = require('../services/feeService');
      const now = new Date();
      await getOrCreateFeeRecord(studentToUpdate, MONTHS[now.getMonth()], now.getFullYear(), 'monthly', txn);
      await assignPublishedFeeStructure(studentToUpdate, txn);
    }

    await AuditLog.create({
      user_id: req.user.id,
      action: 'collect_fee',
      target_type: 'Fee',
      target_id: fee.id,
      details: { amount, payment_mode, receipt_number: receiptNumber, student_id: fee.student_id },
      ip_address: req.ip
    }, { transaction: txn });

    await txn.commit();

    // Reload with associations for receipt
    await fee.reload({ include: [
      { model: Student, as: 'student' },
      { model: User,    as: 'collectedByUser', attributes: ['id', 'name'] }
    ]});

    const receipt = buildReceiptData(fee, fee.student, fee.collectedByUser);

    res.json({
      message: 'Payment collected successfully.',
      fee,
      receipt,
    });
  } catch (err) {
    await txn.rollback();
    res.status(500).json({ message: err.message });
  }
});
/**
 * POST /api/fees/collect-multiple-months
 * Collect fees for multiple months at once (e.g. paying Jan + Feb together).
 * (H3 fix) — overpayment protection added
 * (M6 fix) — UUID-based receipt numbers
 */
router.post('/collect-multiple-months', feeCollectionLimiter, protect, hasPermission('COLLECT_FEES'), async (req, res) => {
  const txn = await sequelize.transaction();
  try {
    const { student_id, months, year, payment_mode, remarks } = req.body;
    // months = [{ month: 'January', amount: 2500 }, ...]

    if (!student_id || !months?.length) {
      await txn.rollback();
      return res.status(400).json({ message: 'student_id and months array required.' });
    }

    const student = await Student.findByPk(student_id, { transaction: txn });
    if (!student) { await txn.rollback(); return res.status(404).json({ message: 'Student not found.' }); }

    const results = [];
    let totalPaidInThisTransaction = 0;
    const baseReceiptNumber = generateReceiptNumber();
    const updatedFees = [];

    for (let i = 0; i < months.length; i++) {
      const entry = months[i];
      const { record } = await getOrCreateFeeRecord(
        student, entry.month, parseInt(year), 'monthly', txn
      );

      // (Phase 3 fix) — Lock the record to prevent race conditions during bulk payment
      const lockedRecord = await Fee.findByPk(record.id, {
        include: [{ model: User, as: 'collectedByUser', attributes: ['id', 'name'] }],
        transaction: txn,
        lock: txn.LOCK.UPDATE
      });

      const payAmt = round2(entry.amount);
      const currentPaid = round2(lockedRecord.paid_amount || 0);
      const totalAmount = round2(parseFloat(lockedRecord.total_amount || 0) + parseFloat(lockedRecord.late_fee_amount || 0));
      let newPaid = round2(currentPaid + payAmt);

      // (H3 fix) — overpayment check per month
      if (newPaid - totalAmount > 0.009) {
        await txn.rollback();
        const remaining = Math.max(0, round2(totalAmount - currentPaid));
        return res.status(400).json({
          message: `Overpayment not allowed for ${entry.month}. Max payable: ₹${remaining.toFixed(2)}.`,
        });
      }
      if (totalAmount - newPaid <= 0.009 && newPaid > 0) {
        newPaid = totalAmount;
      }

      const status = newPaid >= totalAmount ? 'paid'
                   : newPaid > 0 ? 'partial' : 'unpaid';

      const uniqueReceiptNumber = `${baseReceiptNumber}-${i + 1}`;
      const paidDate = new Date().toISOString().split('T')[0];
      const updatedBreakdown = buildUpdatedBreakdownWithTx(lockedRecord, {
        amount: payAmt,
        receiptNumber: uniqueReceiptNumber,
        paymentMode: payment_mode,
        paidDate,
        collectedById: req.user.id,
        collectedByName: req.user.name || 'Admin',
        remarks,
      });

      await lockedRecord.update({
        paid_amount:    newPaid,
        payment_mode,
        remarks,
        collected_by:   req.user.id,
        paid_date:      paidDate,
        status,
        receipt_number: uniqueReceiptNumber, // Ensure uniqueness in DB
        fee_breakdown:  updatedBreakdown,
      }, { transaction: txn });

      totalPaidInThisTransaction = round2(totalPaidInThisTransaction + payAmt);
      results.push({ month: entry.month, status, paid: newPaid });
      updatedFees.push(lockedRecord);
    }

    await txn.commit();

    const collectedByUser = await User.findByPk(req.user.id, { attributes: ['id', 'name'] });

    // Build consolidated receipt data
    const consolidatedFeeMock = {
      ...updatedFees[0].toJSON(),
      fee_type: 'monthly_multi',
      paid_amount: totalPaidInThisTransaction,
      total_amount: round2(updatedFees.reduce((sum, f) => sum + parseFloat(f.total_amount || 0), 0)),
      late_fee_amount: round2(updatedFees.reduce((sum, f) => sum + parseFloat(f.late_fee_amount || 0), 0)),
      month: months.map(m => m.month.slice(0, 3)).join(', '),
      receipt_number: baseReceiptNumber,
      fee_breakdown: Object.fromEntries(months.map(m => [`${m.month} Fee`, round2(m.amount)])),
    };

    const receipt = buildReceiptData(consolidatedFeeMock, student, collectedByUser);

    res.json({
      message:        `Fees collected for ${months.length} month(s).`,
      student:        { id: student.id, name: `${student.first_name} ${student.last_name}` },
      months_updated: results,
      receipt,
      fee: consolidatedFeeMock,
    });
  } catch (err) {
    await txn.rollback();
    console.error('MULTI COLLECT ERROR:', err);
    res.status(500).json({ message: err.name + ': ' + (err.errors ? err.errors.map(e => e.message).join(', ') : err.message) });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE FEES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/fees/generate
 * Generate monthly fee records for all active students.
 * Safe to run multiple times — skips already-generated records.
 */
router.post('/generate', protect, hasPermission('MANAGE_FEES'), async (req, res) => {
  try {
    const {
      month      = MONTHS[new Date().getMonth()],
      year       = new Date().getFullYear(),
      session_id = null,
    } = req.body;

    const result = await generateMonthlyFees(month, parseInt(year), session_id, req.user.id);

    res.json({
      message:  `Fee generation complete for ${month} ${year}.`,
      ...result,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/**
 * POST /api/fees/generate-for-student
 * Generate fee record for a single student (e.g. newly admitted).
 */
router.post('/generate-for-student', protect, hasPermission('MANAGE_FEES'), async (req, res) => {
  try {
    const { student_id, month, year, fee_type = 'monthly' } = req.body;

    const student = await Student.findByPk(student_id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const { record, created } = await getOrCreateFeeRecord(
      student,
      month || MONTHS[new Date().getMonth()],
      year  || new Date().getFullYear(),
      fee_type
    );

    res.json({
      message: created ? 'Fee record created.' : 'Fee record already exists.',
      fee: record,
      created,
    });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

router.get('/summary/monthly', protect, hasPermission('MANAGE_FEES'), async (req, res) => {
  try {
    const { month = MONTHS[new Date().getMonth()], year = new Date().getFullYear() } = req.query;

    const fees = await Fee.findAll({ where: { month, year: parseInt(year) } });

    const activeFees = fees.filter(f => f.status !== 'waived');
    const total     = round2(activeFees.reduce((a, f) => a + parseFloat(f.total_amount || 0) + parseFloat(f.late_fee_amount || 0), 0));
    const collected = round2(activeFees.reduce((a, f) => a + parseFloat(f.paid_amount  || 0), 0));

    res.json({
      month, year,
      total, collected,
      pending:       Math.max(0, round2(total - collected)),
      paid_count:    fees.filter(f => f.status === 'paid').length,
      unpaid_count:  fees.filter(f => f.status === 'unpaid').length,
      partial_count: fees.filter(f => f.status === 'partial').length,
      rate:          total > 0 ? Math.round((collected / total) * 100) : 0,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
// ─────────────────────────────────────────────────────────────────────────────
// REMINDERS
// ─────────────────────────────────────────────────────────────────────────────

router.post('/send-reminders', protect, authorize('admin', 'admin2', 'fee_collector'), async (req, res) => {
  try {
    const { sendPushToUser } = require('../services/pushNotificationService');
    
    // Find all students with pending fees
    const students = await Student.findAll({
      where: { is_active: true },
      include: [{
        model: Fee,
        as: 'fees',
        where: { status: { [Op.in]: ['unpaid', 'partial', 'overdue'] } },
        required: true
      }, {
        model: User,
        as: 'parentUser',
      }]
    });

    let sentCount = 0;

    for (const student of students) {
      if (!student.parentUser) continue;

      let totalPending = 0;
      const pendingMonths = new Set();
      
      for (const fee of student.fees) {
        totalPending += parseFloat(fee.total_amount) - parseFloat(fee.paid_amount);
        pendingMonths.add(fee.month);
      }

      const monthsStr = Array.from(pendingMonths).join(', ');
      const message = `You have outstanding fees totaling ₹${totalPending.toFixed(2)} for the months of: ${monthsStr}.`;

      // Create Notification
      const notification = await Notification.create({
        title: 'Pending Fee Reminder',
        message,
        type: 'fee_reminder',
        sent_by: req.user.id,
        recipient_type: 'individual',
        recipient_user_id: student.parentUser.id
      });

      await NotificationRead.create({
        notification_id: notification.id,
        user_id: student.parentUser.id,
        is_read: false
      });

      // Send Push
      await sendPushToUser(student.parentUser.id, 'Pending Fee Reminder', message);
      sentCount++;
    }

    res.json({ message: 'Reminders sent successfully.', sentCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
