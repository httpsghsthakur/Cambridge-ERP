const { Fee, Student, ClassFeeStructure, Session, User } = require('../models');
const { Op } = require('sequelize');

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const round2 = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const parseFeeBreakdown = (val) => {
  if (!val) return {};
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof val === 'object' ? { ...val } : {};
};

/**
 * Get fee structure for a class & session.
 * Falls back to class's active structure, then sensible defaults if unconfigured.
 * (Q2 fix) — logs a warning when fallback defaults are used.
 */
const getFeeStructureForClass = async (className, sessionId) => {
  const where = { class: className, is_active: true };
  if (sessionId) where.session_id = sessionId;

  let structure = await ClassFeeStructure.findOne({ where });
  if (!structure && sessionId) {
    structure = await ClassFeeStructure.findOne({
      where: { class: className, is_active: true },
      order: [['is_published', 'DESC'], ['id', 'DESC']],
    });
  }

  if (!structure) {
    console.warn(`[FEE WARNING] No fee structure configured for "${className}". Using hardcoded defaults. Please set up fee structure in admin panel.`);
    return {
      monthly_fee:   2500,
      admission_fee: 5000,
      annual_fee:    1000,
      promotion_fee: 500,
      exam_fee:      300,
      _is_default:   true,
    };
  }

  return structure;
};

/**
 * Generate or get a fee record for a student+month+year+type.
 * If it doesn't exist, create it using the class fee structure.
 * This is the core "upsert" function used everywhere.
 */
const getOrCreateFeeRecord = async (student, month, year, feeType = 'monthly', txn = null) => {
  const options = txn ? { transaction: txn } : {};

  // Check if already exists
  const whereClause = {
    student_id: student.id,
    fee_type: feeType,
  };

  // Enforce session fee is only generated once per academic year (session)
  if (feeType === 'annual') {
    whereClause.session_id = student.session_id;
  } else if (feeType === 'admission') {
    // Admission is once per student ever, handled without month/year limits
  } else {
    whereClause.month = month;
    whereClause.year = year;
  }

  const existing = await Fee.findOne({
    where: whereClause,
    ...options
  });

  if (existing) return { record: existing, created: false };

  // If asking for monthly, check if an admission fee exists for this month.
  // If so, the monthly fee is bundled inside it.
  if (feeType === 'monthly') {
    const existingAdmission = await Fee.findOne({
      where: { student_id: student.id, month, year, fee_type: 'admission' },
      ...options
    });
    if (existingAdmission) return { record: existingAdmission, created: false };
  }

  // Get the fee amount from class structure
  const structure = await getFeeStructureForClass(student.class, student.session_id);

  const amountMap = {
    monthly:     parseFloat(structure.monthly_fee   || 0),
    admission:   parseFloat(structure.admission_fee || 0),
    annual:      parseFloat(structure.annual_fee    || 0),
    promotion:   parseFloat(structure.promotion_fee || 0),
    exam:        parseFloat(structure.exam_fee      || 0),
    miscellaneous: 0,
  };

  const totalAmount = round2(
    amountMap[feeType] !== undefined ? amountMap[feeType] : parseFloat(structure.monthly_fee || 0)
  );

  // Calculate Due Date
  let dueDate = null;
  if (feeType === 'monthly') {
    const monthIndex = MONTHS.indexOf(month);
    if (monthIndex !== -1) {
      const dd = String(structure.monthly_due_date || 10).padStart(2, '0');
      const mm = String(monthIndex + 1).padStart(2, '0');
      dueDate = `${year}-${mm}-${dd}`;
    }
  } else {
    if (structure.annual_due_date) {
      dueDate = structure.annual_due_date;
    }
  }

  const record = await Fee.create({
    student_id:    student.id,
    month,
    year:          parseInt(year),
    fee_type:      feeType,
    total_amount:  totalAmount,
    paid_amount:   0,
    status:        'unpaid',
    due_date:      dueDate,
    session_id:    student.session_id,
    fee_breakdown: { [feeType]: totalAmount },
  }, options);

  return { record, created: true };
};

/**
 * Assign a published fee structure to a student dynamically (e.g., late admission, promotion).
 * Evaluates rules for new vs existing students.
 */
const assignPublishedFeeStructure = async (student, txn = null, isPromotion = false) => {
  const options = txn ? { transaction: txn } : {};
  if (!student.session_id || !student.class || student.approval_status !== 'approved') return false;

  const structure = await ClassFeeStructure.findOne({
    where: { class: student.class, session_id: student.session_id, is_active: true, is_published: true },
    ...options
  });

  if (!structure) return false; // No published structure to assign

  const currentYear = new Date().getFullYear();
  const currentMonth = MONTHS[new Date().getMonth()];

  // 1. Check if New Admission
  let isNewAdmission = false;
  const hasPaidAdmission = await Fee.findOne({
    where: { student_id: student.id, fee_type: 'admission' },
    ...options
  });

  if (!hasPaidAdmission) {
    isNewAdmission = true;
    if (Number(structure.admission_fee || 0) > 0) {
      await getOrCreateFeeRecord(student, currentMonth, currentYear, 'admission', txn);
    }
  }

  // 2. Session / Annual Fee (Skip for new admissions)
  if (Number(structure.annual_fee || 0) > 0 && !isNewAdmission) {
    await getOrCreateFeeRecord(student, currentMonth, currentYear, 'annual', txn);
  }

  // 3. Promotion Fee (If called during promotion)
  if (isPromotion && Number(structure.promotion_fee || 0) > 0) {
    await getOrCreateFeeRecord(student, currentMonth, currentYear, 'promotion', txn);
  }
  
  return true;
};

/**
 * Get all active students WITH their fee status for a given month/year.
 * Students without fee records show as "not_generated".
 * This ensures newly created students always appear.
 */
const getStudentsWithFeeStatus = async (month, year, filters = {}) => {
  const studentWhere = { is_active: true, approval_status: 'approved' };
  if (filters.class)   studentWhere.class   = filters.class;
  if (filters.section) studentWhere.section = filters.section;

  const students = await Student.findAll({
    where: studentWhere,
    include: [{ model: Session, as: 'session', attributes: ['id', 'name'] }],
    order: [['class', 'ASC'], ['section', 'ASC'], ['roll_number', 'ASC']],
  });

  if (!students.length) return [];

  // Fetch existing fee records for these students this month and active ClassFeeStructures
  const studentIds = students.map(s => s.id);
  const [feeRecords, feeStructures] = await Promise.all([
    Fee.findAll({
      where: {
        student_id: { [Op.in]: studentIds },
        month,
        year: parseInt(year),
      },
      include: [{
        model: User,
        as: 'collectedByUser',
        attributes: ['id', 'name']
      }]
    }),
    ClassFeeStructure.findAll({ where: { is_active: true } })
  ]);

  const structureMap = {};
  const structureMapBySession = {};
  feeStructures.forEach(fs => {
    if (fs.session_id) {
      structureMapBySession[`${fs.class}::${fs.session_id}`] = fs;
    }
    if (!structureMap[fs.class] || fs.is_published) {
      structureMap[fs.class] = fs;
    }
  });

  // Map fees by student_id + fee_type
  const feeMap = {};
  feeRecords.forEach(f => {
    const key = `${f.student_id}`;
    if (!feeMap[key]) feeMap[key] = [];
    feeMap[key].push(f);
  });

  // Merge students with their fee data
  return students.map(s => {
    const sJson  = s.toJSON();
    const fees   = feeMap[s.id] || [];
    let monthly = fees.find(f => f.fee_type === 'monthly');
    const admission = fees.find(f => f.fee_type === 'admission');

    // If an admission fee exists but no separate monthly fee, the admission fee serves as both
    if (!monthly && admission) {
      monthly = admission;
    }

    const hasRealMonthly = !!monthly;
    if (!monthly) {
      const clsStructure = (s.session_id ? structureMapBySession[`${s.class}::${s.session_id}`] : null)
        || structureMap[s.class];
      const monthlyFee = clsStructure ? round2(clsStructure.monthly_fee ?? 0) : 2500;
      monthly = {
        id: null,
        student_id: s.id,
        month,
        year: parseInt(year),
        fee_type: 'monthly',
        total_amount: monthlyFee,
        paid_amount: 0.00,
        status: 'not_generated',
        fee_breakdown: { monthly: monthlyFee }
      };
    }

    const billedTotal = round2(
      fees
        .filter(f => f.status !== 'waived')
        .reduce((a, f) => a + parseFloat(f.total_amount || 0) + parseFloat(f.late_fee_amount || 0), 0)
      + (hasRealMonthly ? 0 : round2(monthly.total_amount || 0))
    );
    const paidTotal = round2(
      fees.reduce((a, f) => a + parseFloat(f.paid_amount || 0), 0)
    );

    return {
      ...sJson,
      fee_record:     monthly,
      all_fees:       hasRealMonthly ? fees : [monthly, ...fees],
      fee_status:     hasRealMonthly ? monthly.status : 'not_generated',
      total_due:      billedTotal,
      total_paid:     paidTotal,
      has_fee_record: fees.length > 0,
    };
  });
};

/**
 * Generate monthly fee records for all active students.
 * Skips students who already have a record for this month.
 */
const generateMonthlyFees = async (month, year, sessionId = null, userId = null) => {
  const where = { is_active: true, approval_status: 'approved' };
  if (sessionId) where.session_id = sessionId;

  const students = await Student.findAll({ where });
  let created = 0, skipped = 0;

  for (const student of students) {
    const { created: wasCreated } = await getOrCreateFeeRecord(student, month, year, 'monthly');
    if (wasCreated) created++;
    else skipped++;
  }

  return { created, skipped, total: students.length };
};

/**
 * Build a receipt data object for a fee payment.
 * Used by both the API response and PDF generator.
 */
const buildReceiptData = (fee, student, collectedByUser) => {
  const studentName = `${student.first_name} ${student.last_name}`.trim();
  const className = `${student.class} - ${student.section}`;
  const receiptDate = fee.paid_date || new Date().toISOString().split('T')[0];
  const collectedBy = collectedByUser?.name || 'System';
  const baseAmount = round2(fee.total_amount || 0);
  const lateFee = round2(fee.late_fee_amount || 0);
  const netPayable = fee.status === 'waived' ? 0 : round2(baseAmount + lateFee);
  const paidAmount = round2(fee.paid_amount || 0);
  const balance = fee.status === 'waived' ? 0 : Math.max(0, round2(netPayable - paidAmount));
  const parsedBreakdown = parseFeeBreakdown(fee.fee_breakdown);

  return {
    student_name:    studentName,
    class:           student.class,
    section:         student.section,
    fee_type:        fee.fee_type,
    total_amount:    baseAmount,
    late_fee_amount: lateFee,
    net_payable:     netPayable,
    paid_amount:     paidAmount,
    balance,
    payment_mode:    fee.payment_mode,
    receipt_number:  fee.receipt_number,
    date:            receiptDate,
    collected_by:    collectedBy,
    receipt_date:    receiptDate,
    transactions:    Array.isArray(parsedBreakdown.transactions) ? parsedBreakdown.transactions : [],
    school: {
      name:    'International Cambridge School Kishtwar',
      address: '123 Education Lane, Knowledge City',
      phone:   '+91 9999999999',
      email:   'info@cambridgeschoolkishtwar.com',
    },
    student: {
      id:          student.student_id,
      name:        studentName,
      class:       className,
      parent_name: student.parent_name,
      phone:       student.parent_phone,
    },
    payment: {
      month:           fee.month,
      year:            fee.year,
      fee_type:        fee.fee_type,
      total_amount:    baseAmount,
      late_fee_amount: lateFee,
      net_payable:     netPayable,
      paid_amount:     paidAmount,
      balance,
      payment_mode:    fee.payment_mode,
      status:          fee.status,
      remarks:         fee.remarks,
    },
    fee_breakdown: parsedBreakdown,
  };
};

/**
 * Create admission fee record for a newly approved student.
 */
const createAdmissionFee = async (student, paidAmountOrTxn = 0, txnObj = null) => {
  let paidAmount = 0;
  let txn = null;
  if (paidAmountOrTxn && typeof paidAmountOrTxn === 'object') {
    txn = paidAmountOrTxn;
  } else {
    paidAmount = round2(paidAmountOrTxn || 0);
    txn = txnObj;
  }

  const options = txn ? { transaction: txn } : {};
  const now     = new Date();
  const month   = MONTHS[now.getMonth()];
  const year    = now.getFullYear();

  const structure = await getFeeStructureForClass(student.class, student.session_id);
  const admissionFee = round2(structure.admission_fee ?? 0);
  const monthlyFee   = round2(structure.monthly_fee ?? 0);
  const totalAmount  = round2(admissionFee + monthlyFee);

  if (totalAmount <= 0) return null;

  const status = paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

  return await Fee.create({
    student_id:    student.id,
    month,
    year,
    fee_type:      'admission',
    total_amount:  totalAmount,
    paid_amount:   paidAmount,
    status:        status,
    session_id:    student.session_id,
    fee_breakdown: { admission: admissionFee, monthly: monthlyFee },
  }, options);
};

const createPromotionFee = async (student, toClass, sessionId, txn = null) => {
  const options   = txn ? { transaction: txn } : {};
  const structure = await getFeeStructureForClass(toClass, sessionId);
  const promotionAmt = round2(structure.promotion_fee ?? 0);
  const sessionAmt   = round2(structure.annual_fee ?? 0);
  const totalAmount  = round2(promotionAmt + sessionAmt);

  if (totalAmount <= 0) return null;

  const now   = new Date();
  const month = MONTHS[now.getMonth()];
  const year  = now.getFullYear();

  return await Fee.create({
    student_id:    student.id,
    month,
    year,
    fee_type:      'session_start',
    total_amount:  totalAmount,
    paid_amount:   0,
    status:        'unpaid',
    session_id:    sessionId,
    fee_breakdown: { promotion: promotionAmt, session: sessionAmt, to_class: toClass },
  }, options);
};

/**
 * Derive ordered 12 academic-year month slots from a Session's start_date or name.
 * Defaults to April..March academic calendar.
 */
const getAcademicMonthsForSession = (sessionObj) => {
  let startYear;
  let startMonthIdx = 3; // April

  if (sessionObj?.start_date) {
    const [yStr, mStr] = String(sessionObj.start_date).split('-');
    const parsedY = parseInt(yStr, 10);
    const parsedM = parseInt(mStr, 10);
    if (Number.isFinite(parsedY) && parsedM >= 1 && parsedM <= 12) {
      startYear = parsedY;
      startMonthIdx = parsedM - 1;
    }
  }

  if (!Number.isFinite(startYear) && sessionObj?.name) {
    const match = String(sessionObj.name).match(/(20\d{2})/);
    if (match) startYear = parseInt(match[1], 10);
  }

  if (!Number.isFinite(startYear)) {
    const now = new Date();
    startYear = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
  }

  return Array.from({ length: 12 }, (_, idx) => {
    const absMonth = startMonthIdx + idx;
    return {
      schedule_index: idx + 1,
      month: MONTHS[absMonth % 12],
      year: startYear + Math.floor(absMonth / 12),
    };
  });
};

const monthYearToDate = (monthName, yearNum) => {
  const mIdx = MONTHS.indexOf(monthName);
  const mm = String((mIdx >= 0 ? mIdx : 0) + 1).padStart(2, '0');
  return `${yearNum}-${mm}-15`;
};

const summarizeFeeList = (enrichedList = []) => {
  const totals = {
    total_base_fees: 0,
    total_late_fees: 0,
    total_billed: 0,
    total_cleared: 0,
    total_due: 0,
    total_waived: 0,
    annual_billed: 0,
    annual_cleared: 0,
    annual_due: 0,
    monthly_billed: 0,
    monthly_cleared: 0,
    monthly_due: 0,
    other_billed: 0,
    other_cleared: 0,
    other_due: 0,
    paid_count: 0,
    partial_count: 0,
    unpaid_count: 0,
    overdue_count: 0,
    waived_count: 0,
  };

  for (const f of enrichedList) {
    if (f.status === 'not_generated') continue;
    if (f.status === 'waived') {
      totals.total_waived = round2(totals.total_waived + f.base_amount);
      totals.waived_count += 1;
      continue;
    }

    totals.total_base_fees = round2(totals.total_base_fees + f.base_amount);
    totals.total_late_fees = round2(totals.total_late_fees + f.late_fee_amount);
    totals.total_billed = round2(totals.total_billed + f.net_payable);
    totals.total_cleared = round2(totals.total_cleared + f.cleared_amount);
    totals.total_due = round2(totals.total_due + f.due_amount);

    if (f.fee_type === 'annual' || f.fee_type === 'session_start') {
      totals.annual_billed = round2(totals.annual_billed + f.net_payable);
      totals.annual_cleared = round2(totals.annual_cleared + f.cleared_amount);
      totals.annual_due = round2(totals.annual_due + f.due_amount);
    } else if (f.fee_type === 'monthly') {
      totals.monthly_billed = round2(totals.monthly_billed + f.net_payable);
      totals.monthly_cleared = round2(totals.monthly_cleared + f.cleared_amount);
      totals.monthly_due = round2(totals.monthly_due + f.due_amount);
    } else {
      totals.other_billed = round2(totals.other_billed + f.net_payable);
      totals.other_cleared = round2(totals.other_cleared + f.cleared_amount);
      totals.other_due = round2(totals.other_due + f.due_amount);
    }

    if (f.status === 'paid') totals.paid_count += 1;
    else if (f.status === 'partial') totals.partial_count += 1;
    else if (f.status === 'overdue') totals.overdue_count += 1;
    else if (f.status === 'unpaid') totals.unpaid_count += 1;
  }

  return totals;
};

/**
 * Build structured, reconciled student fee ledger for a session (or all sessions).
 */
const getStudentFeeLedger = async (studentId, { sessionId } = {}) => {
  const student = await Student.findByPk(studentId, {
    include: [{ model: Session, as: 'session', attributes: ['id', 'name', 'start_date', 'end_date', 'is_active', 'is_archived'] }],
  });
  if (!student) return null;

  const [allSessions, allFeeRows] = await Promise.all([
    Session.findAll({ order: [['start_date', 'ASC'], ['id', 'ASC']] }),
    Fee.findAll({
      where: { student_id: student.id },
      include: [
        { model: User, as: 'collectedByUser', attributes: ['id', 'name'] },
        { model: Session, as: 'session', attributes: ['id', 'name', 'start_date', 'end_date', 'is_active', 'is_archived'] },
      ],
      order: [['year', 'ASC'], ['id', 'ASC']],
    }),
  ]);

  const activeSession = allSessions.find((s) => s.is_active) || null;
  const currentSessionId = student.session_id || activeSession?.id || null;

  let selectedSessionId = currentSessionId;
  if (sessionId === 'all') {
    selectedSessionId = 'all';
  } else if (sessionId !== undefined && sessionId !== '') {
    const parsed = Number(sessionId);
    selectedSessionId = Number.isFinite(parsed) ? parsed : sessionId;
  }

  const selectedSessionObj = selectedSessionId !== 'all' && selectedSessionId != null
    ? allSessions.find((s) => String(s.id) === String(selectedSessionId)) || null
    : (allSessions.find((s) => String(s.id) === String(currentSessionId)) || activeSession);

  const resolveFeeSessionId = (feeRow) => {
    if (feeRow.session_id != null) return String(feeRow.session_id);
    const approxDate = feeRow.due_date || monthYearToDate(feeRow.month, feeRow.year);
    const matchedSess = allSessions.find(
      (s) => s.start_date && s.end_date && approxDate >= String(s.start_date) && approxDate <= String(s.end_date)
    );
    if (matchedSess) return String(matchedSess.id);
    return currentSessionId != null ? String(currentSessionId) : null;
  };

  const enrichFee = (f) => {
    const raw = f.toJSON ? f.toJSON() : { ...f };
    const base_amount = round2(raw.total_amount);
    const late_fee_amount = round2(raw.late_fee_amount);
    const net_payable = raw.status === 'waived' ? 0 : round2(base_amount + late_fee_amount);
    const cleared_amount = raw.status === 'waived' ? 0 : round2(raw.paid_amount);
    const due_amount = ['waived', 'not_generated'].includes(raw.status)
      ? 0
      : Math.max(0, round2(net_payable - cleared_amount));

    const sessionLabel = raw.session?.name
      || allSessions.find((s) => String(s.id) === resolveFeeSessionId(raw))?.name
      || null;

    const parsedBreakdown = parseFeeBreakdown(raw.fee_breakdown);
    let transactions = [];
    if (Array.isArray(parsedBreakdown.transactions) && parsedBreakdown.transactions.length > 0) {
      transactions = parsedBreakdown.transactions.map((tx, idx) => {
        const txAmount = round2(tx.amount);
        const collectorName = tx.collected_by_name || raw.collectedByUser?.name || 'System';
        return {
          tx_key: `${raw.id}-tx-${idx}`,
          fee_id: raw.id,
          fee_type: raw.fee_type,
          month: raw.month,
          year: raw.year,
          session_name: sessionLabel,
          receipt_number: tx.receipt_number || raw.receipt_number || `REC-${raw.id}-${idx + 1}`,
          amount: txAmount,
          payment_mode: tx.payment_mode || raw.payment_mode || 'cash',
          paid_date: tx.paid_date || raw.paid_date || null,
          collected_by_name: collectorName,
          remarks: tx.remarks ?? raw.remarks ?? '',
          receipt_data: buildReceiptData(
            {
              ...raw,
              paid_amount: txAmount,
              receipt_number: tx.receipt_number || raw.receipt_number,
              payment_mode: tx.payment_mode || raw.payment_mode,
              paid_date: tx.paid_date || raw.paid_date,
              remarks: tx.remarks ?? raw.remarks ?? '',
            },
            student,
            { name: collectorName }
          ),
        };
      });
    } else if (cleared_amount > 0) {
      const collectorName = raw.collectedByUser?.name || 'System';
      transactions = [{
        tx_key: `${raw.id}-tx-0`,
        fee_id: raw.id,
        fee_type: raw.fee_type,
        month: raw.month,
        year: raw.year,
        session_name: sessionLabel,
        receipt_number: raw.receipt_number || `REC-${raw.id}`,
        amount: cleared_amount,
        payment_mode: raw.payment_mode || 'cash',
        paid_date: raw.paid_date || (raw.updated_at ? String(raw.updated_at).slice(0, 10) : null),
        collected_by_name: collectorName,
        remarks: raw.remarks || '',
        receipt_data: buildReceiptData(raw, student, { name: collectorName }),
      }];
    }

    return {
      ...raw,
      fee_breakdown: parsedBreakdown,
      is_generated: true,
      resolved_session_id: resolveFeeSessionId(raw),
      session_name: sessionLabel,
      base_amount,
      late_fee_amount,
      net_payable,
      cleared_amount,
      due_amount,
      transactions,
      receipt_data: cleared_amount > 0 ? buildReceiptData(raw, student, raw.collectedByUser) : null,
    };
  };

  const allEnriched = allFeeRows.map(enrichFee);
  const scopedFees = selectedSessionId === 'all'
    ? allEnriched
    : allEnriched.filter((f) => f.resolved_session_id === String(selectedSessionId));

  // Resolve published/active structure for selected session & student's class
  let classStructure = null;
  if (student.class) {
    if (selectedSessionObj?.id) {
      classStructure = await ClassFeeStructure.findOne({
        where: { class: student.class, session_id: selectedSessionObj.id, is_active: true },
        order: [['is_published', 'DESC'], ['id', 'DESC']],
      });
    }
    if (!classStructure) {
      classStructure = await ClassFeeStructure.findOne({
        where: { class: student.class, is_active: true },
        order: [['is_published', 'DESC'], ['id', 'DESC']],
      });
    }
  }

  const annualFees = scopedFees.filter((f) => f.fee_type === 'annual' || f.fee_type === 'session_start');
  const monthlyReal = scopedFees.filter((f) => f.fee_type === 'monthly');
  const admissionFees = scopedFees.filter((f) => f.fee_type === 'admission');
  const otherFees = scopedFees.filter(
    (f) => !['annual', 'session_start', 'monthly'].includes(f.fee_type)
  );

  let monthlySchedule = [];
  const scheduledMonthlyAmt = round2(classStructure?.monthly_fee ?? 0);

  if (selectedSessionId === 'all') {
    monthlySchedule = monthlyReal.map((m, idx) => ({ ...m, schedule_index: idx + 1 }));
  } else {
    const slots = getAcademicMonthsForSession(selectedSessionObj);
    const matchedMonthlyIds = new Set();

    monthlySchedule = slots.map((slot) => {
      const existing = monthlyReal.find(
        (f) => f.month === slot.month && Number(f.year) === slot.year && !matchedMonthlyIds.has(f.id)
      );
      if (existing) {
        matchedMonthlyIds.add(existing.id);
        return { ...existing, schedule_index: slot.schedule_index };
      }

      const bundledAdm = admissionFees.find(
        (adm) => adm.month === slot.month && Number(adm.year) === slot.year && Number(adm.fee_breakdown?.monthly || 0) > 0
      );
      if (bundledAdm) {
        return {
          id: null,
          is_generated: false,
          bundled_with_admission: true,
          bundled_fee_id: bundledAdm.id,
          schedule_index: slot.schedule_index,
          month: slot.month,
          year: slot.year,
          fee_type: 'monthly',
          status: bundledAdm.status,
          due_date: bundledAdm.due_date || null,
          base_amount: round2(bundledAdm.fee_breakdown?.monthly || scheduledMonthlyAmt),
          late_fee_amount: 0,
          net_payable: 0, // already accounted for inside admission record to avoid double-counting
          cleared_amount: 0,
          due_amount: 0,
          receipt_number: bundledAdm.receipt_number || null,
          payment_mode: bundledAdm.payment_mode || null,
          paid_date: bundledAdm.paid_date || null,
          remarks: 'Bundled inside Admission Fee record',
          transactions: [],
        };
      }

      const mIdx = MONTHS.indexOf(slot.month);
      const dd = String(classStructure?.monthly_due_date || 10).padStart(2, '0');
      const estDueDate = mIdx >= 0 ? `${slot.year}-${String(mIdx + 1).padStart(2, '0')}-${dd}` : null;

      return {
        id: null,
        is_generated: false,
        schedule_index: slot.schedule_index,
        month: slot.month,
        year: slot.year,
        fee_type: 'monthly',
        status: 'not_generated',
        due_date: estDueDate,
        scheduled_amount: scheduledMonthlyAmt,
        base_amount: scheduledMonthlyAmt,
        late_fee_amount: 0,
        net_payable: 0,
        cleared_amount: 0,
        due_amount: 0,
        receipt_number: null,
        payment_mode: null,
        paid_date: null,
        transactions: [],
      };
    });

    // Include any additional generated monthly fees in this session not matching the 12 exact month/year slots
    monthlyReal.forEach((f) => {
      if (!matchedMonthlyIds.has(f.id)) {
        monthlySchedule.push({ ...f, schedule_index: monthlySchedule.length + 1 });
      }
    });
  }

  const transactionsLedger = scopedFees
    .flatMap((f) => f.transactions || [])
    .sort((a, b) => String(b.paid_date || '').localeCompare(String(a.paid_date || '')) || (b.fee_id - a.fee_id));

  const summary = {
    ...summarizeFeeList(scopedFees),
    scheduled_12m_tuition: round2(scheduledMonthlyAmt * 12),
    receipts_count: transactionsLedger.length,
  };

  const allSessionsSummary = summarizeFeeList(allEnriched);

  return {
    student: {
      id: student.id,
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      class: student.class,
      section: student.section,
      roll_number: student.roll_number,
      session_id: student.session_id,
      session_name: student.session?.name || selectedSessionObj?.name || null,
    },
    sessions: allSessions.map((s) => s.toJSON()),
    currentSessionId,
    selectedSessionId,
    classStructure: classStructure ? (classStructure.toJSON ? classStructure.toJSON() : classStructure) : null,
    summary,
    allSessionsSummary,
    annualFees,
    monthlySchedule,
    otherFees,
    transactionsLedger,
    rawFees: scopedFees,
  };
};

module.exports = {
  round2,
  parseFeeBreakdown,
  getFeeStructureForClass,
  getOrCreateFeeRecord,
  getStudentsWithFeeStatus,
  generateMonthlyFees,
  buildReceiptData,
  createAdmissionFee,
  createPromotionFee,
  assignPublishedFeeStructure,
  getAcademicMonthsForSession,
  getStudentFeeLedger,
  MONTHS,
};
