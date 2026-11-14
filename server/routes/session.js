const express = require('express');
const router  = express.Router();
const { Op }  = require('sequelize');
const { Session, Student, PromotionHistory, Fee, Attendance, sequelize } = require('../models');
const { protect, isSuperAdmin, isAdmin } = require('../middleware/auth');
const { clearCache } = require('../utils/cache');

const PROMOTION_MAP = {
  'day care':  'Playgroup',
  'Playgroup': 'Nursery',
  'Nursery':   'LKG',
  'LKG':       'UKG',
  'UKG':       '1st',
  '1st':       '2nd',
  '2nd':       '3rd',
  '3rd':       '4th',
  '4th':       '5th',
  '5th':       '6th',
  '6th':       '7th',
  '7th':       '8th',
  '8th':       '9th',
  '9th':       '10th',
  '10th':      'alumni',
};

const ALUMNI_TARGETS = new Set(['alumni', 'passed_out', 'graduated', 'alumni / graduated', 'graduated (alumni)']);

// (C6 fix) — whitelisted fields for session creation
const SESSION_CREATE_FIELDS = ['name', 'start_date', 'end_date'];

const pick = (obj, keys) => {
  const result = {};
  for (const key of keys) {
    if (obj[key] !== undefined) result[key] = obj[key];
  }
  return result;
};

router.get('/', protect, isAdmin, async (req, res) => {
  try {
    const [sessions, activeCounts, totalCounts] = await Promise.all([
      Session.findAll({ order: [['start_date', 'DESC'], ['id', 'DESC']] }),
      Student.findAll({
        where: { is_active: true, approval_status: 'approved' },
        attributes: ['session_id', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['session_id'],
        raw: true,
      }),
      Student.findAll({
        attributes: ['session_id', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['session_id'],
        raw: true,
      }),
    ]);

    const activeMap = new Map(activeCounts.map(r => [Number(r.session_id), Number(r.count || 0)]));
    const totalMap  = new Map(totalCounts.map(r => [Number(r.session_id), Number(r.count || 0)]));

    const activeSession = sessions.find(s => s.is_active);
    const activeStart   = activeSession?.start_date ? new Date(activeSession.start_date) : null;

    const payload = sessions.map(s => {
      const json = s.toJSON();
      const sStart = json.start_date ? new Date(json.start_date) : null;
      let status_label = 'Upcoming';
      if (json.is_active) {
        status_label = 'Active';
      } else if (json.is_archived || json.promotion_completed || (activeStart && sStart && sStart < activeStart)) {
        status_label = 'Previous';
      }
      return {
        ...json,
        status_label,
        active_student_count: activeMap.get(json.id) || 0,
        total_student_count: totalMap.get(json.id) || 0,
      };
    });

    res.json(payload);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/active', protect, async (req, res) => {
  try {
    let session = await Session.findOne({
      where: { is_active: true },
      order: [['start_date', 'DESC'], ['id', 'DESC']]
    });
    if (!session) {
      session = await Session.findOne({
        order: [['start_date', 'DESC'], ['id', 'DESC']]
      });
    }
    res.json(session);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// (C6 fix) — only whitelisted fields accepted
router.post('/', protect, isSuperAdmin, async (req, res) => {
  try {
    const safeData = pick(req.body, SESSION_CREATE_FIELDS);
    safeData.name = (safeData.name || '').trim();

    if (!safeData.name) {
      return res.status(400).json({ message: 'Session name is required.' });
    }

    const existing = await Session.findOne({ where: { name: safeData.name } });
    if (existing) {
      return res.status(400).json({ message: `Session "${safeData.name}" already exists.` });
    }

    if (!safeData.start_date || !safeData.end_date) {
      const nameStr = safeData.name;
      const matchRange = nameStr.match(/^(\d{4})[-/](\d{2,4})$/);
      if (matchRange) {
        const startYear = parseInt(matchRange[1], 10);
        let endYearStr = matchRange[2];
        if (endYearStr.length === 2) {
          endYearStr = matchRange[1].slice(0, 2) + endYearStr;
        }
        const endYear = parseInt(endYearStr, 10);

        if (!safeData.start_date) safeData.start_date = `${startYear}-04-01`;
        if (!safeData.end_date)   safeData.end_date   = `${endYear}-03-31`;
      } else {
        const matchSingle = nameStr.match(/^(\d{4})$/);
        if (matchSingle) {
          const startYear = parseInt(matchSingle[1], 10);
          if (!safeData.start_date) safeData.start_date = `${startYear}-04-01`;
          if (!safeData.end_date)   safeData.end_date   = `${startYear + 1}-03-31`;
        } else {
          const currentYear = new Date().getFullYear();
          if (!safeData.start_date) safeData.start_date = `${currentYear}-04-01`;
          if (!safeData.end_date)   safeData.end_date   = `${currentYear + 1}-03-31`;
        }
      }
    }

    if (new Date(safeData.end_date) <= new Date(safeData.start_date)) {
      return res.status(400).json({ message: 'End date must be after start date.' });
    }

    const session = await Session.create(safeData);
    await clearCache('/dashboard');
    res.status(201).json(session);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id/activate', protect, isSuperAdmin, async (req, res) => {
  const txn = await sequelize.transaction();
  try {
    const targetSession = await Session.findByPk(req.params.id, { transaction: txn });
    if (!targetSession) {
      await txn.rollback();
      return res.status(404).json({ message: 'Session not found.' });
    }

    await Session.update({ is_active: false }, { where: {}, transaction: txn });
    await targetSession.update({ is_active: true, is_archived: false }, { transaction: txn });

    // Archive sessions strictly older than the newly activated session so past sessions do not appear as Upcoming
    if (targetSession.start_date) {
      await Session.update(
        { is_archived: true },
        {
          where: {
            id: { [Op.ne]: targetSession.id },
            start_date: { [Op.lt]: targetSession.start_date },
          },
          transaction: txn,
        }
      );
    }

    await txn.commit();
    await clearCache('/dashboard');
    res.json({ message: 'Session activated.' });
  } catch (err) {
    await txn.rollback();
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/archive', protect, isSuperAdmin, async (req, res) => {
  try {
    const target = await Session.findByPk(req.params.id);
    if (!target) return res.status(404).json({ message: 'Session not found.' });
    if (target.is_active) {
      return res.status(400).json({ message: 'Cannot archive the currently active session.' });
    }

    const nextArchived = req.body?.is_archived !== undefined ? Boolean(req.body.is_archived) : !target.is_archived;
    await target.update({ is_archived: nextArchived });
    await clearCache('/dashboard');
    res.json({ message: nextArchived ? 'Session archived.' : 'Session restored from archive.', session: target });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, isSuperAdmin, async (req, res) => {
  try {
    const target = await Session.findByPk(req.params.id);
    if (!target) return res.status(404).json({ message: 'Session not found.' });
    if (target.is_active) {
      return res.status(400).json({ message: 'Cannot delete the currently active session.' });
    }

    const [studentCount, feeCount, historyCount] = await Promise.all([
      Student.count({ where: { session_id: target.id } }),
      Fee.count({ where: { session_id: target.id } }),
      PromotionHistory.count({
        where: {
          [Op.or]: [
            { from_session: String(target.id) },
            { to_session: String(target.id) },
          ],
        },
      }),
    ]);

    if (studentCount > 0 || feeCount > 0 || historyCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete a session with linked students, fees, or promotion history. Archive it instead.',
      });
    }

    await target.destroy();
    await clearCache('/dashboard');
    res.json({ message: 'Session deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/session/promote
 * Bulk promotion with:
 * - Senior-most class -> Graduated (Alumni) (`student_status: 'alumni'`)
 * - Auto-create promotion fee for each promoted student
 */
router.post('/promote', protect, isSuperAdmin, async (req, res) => {
  const txn = await sequelize.transaction();
  try {
    const {
      from_session_id,
      to_session_id,
      class_promotion_map,
      activate_target = true,
    } = req.body;

    if (!from_session_id || !to_session_id) {
      await txn.rollback();
      return res.status(400).json({ message: 'from_session_id and to_session_id are required.' });
    }

    if (Number(from_session_id) === Number(to_session_id)) {
      await txn.rollback();
      return res.status(400).json({ message: 'Source and target sessions must be different.' });
    }

    const [fromSession, toSession] = await Promise.all([
      Session.findByPk(from_session_id, { transaction: txn }),
      Session.findByPk(to_session_id, { transaction: txn }),
    ]);

    if (!fromSession || !toSession) {
      await txn.rollback();
      return res.status(404).json({ message: 'Source or target session not found.' });
    }

    if (fromSession.start_date && toSession.start_date && new Date(toSession.start_date) < new Date(fromSession.start_date)) {
      await txn.rollback();
      return res.status(400).json({ message: 'Cannot promote students into an older session.' });
    }

    if (toSession.is_archived) {
      await txn.rollback();
      return res.status(400).json({ message: 'Cannot promote students into an archived session.' });
    }

    const { assignPublishedFeeStructure } = require('../services/feeService');
    const promotionMapToUse = class_promotion_map || PROMOTION_MAP;

    const summary = [];

    for (const [fromClass, toClass] of Object.entries(promotionMapToUse)) {
      const students = await Student.findAll({
        where: {
          class:       fromClass,
          session_id:  from_session_id,
          is_active:   true,
        },
        include: [{
          model: Fee,
          as: 'fees',
          where: {
            status: { [Op.in]: ['unpaid', 'partial', 'overdue'] }
          },
          required: false
        }],
        transaction: txn,
      });

      const eligibleStudents = students.filter(s => !s.fees || s.fees.length === 0);
      const studentIds = eligibleStudents.map(s => s.id);
      const isAlumniTarget = ALUMNI_TARGETS.has(String(toClass || '').trim().toLowerCase());
      const normalizedToClass = isAlumniTarget ? 'alumni' : toClass;

      if (studentIds.length === 0) {
        summary.push({ fromClass, toClass: normalizedToClass, count: 0, skipped: students.length });
        continue;
      }

      const [fromSessRec, toSessRec] = await Promise.all([
        Session.findByPk(from_session_id, { transaction: txn }),
        !isAlumniTarget && to_session_id
          ? Session.findByPk(to_session_id, { transaction: txn })
          : Promise.resolve(null),
      ]);

      // ── Snapshot & finalize prior-session attendance before promoting ─────
      const rawAttRows = await Attendance.findAll({
        where: { student_id: studentIds },
        transaction: txn,
      });

      const fromSessIdNum = Number(from_session_id);
      const fromSessStart = fromSessRec?.start_date ? String(fromSessRec.start_date) : null;
      const fromSessEnd = fromSessRec?.end_date ? String(fromSessRec.end_date) : null;
      const toSessStart = toSessRec?.start_date ? String(toSessRec.start_date) : null;

      const belongsToFromSession = (row) => {
        if (row.session_id != null) {
          return String(row.session_id) === String(from_session_id);
        }
        const d = String(row.date || '');
        if (toSessStart && d >= toSessStart) {
          return false;
        }
        if (fromSessStart && fromSessEnd && d >= fromSessStart && d <= fromSessEnd) {
          return true;
        }
        return !toSessStart || d < toSessStart;
      };

      const matchedFromRows = rawAttRows.filter(belongsToFromSession);
      const matchedAttIds = matchedFromRows.map((r) => r.id);

      if (matchedAttIds.length > 0) {
        await Attendance.update(
          {
            session_id: Number.isFinite(fromSessIdNum) ? fromSessIdNum : from_session_id,
            is_finalized: true,
          },
          { where: { id: matchedAttIds }, transaction: txn }
        );
      }

      const attSnapshotMap = new Map();
      for (const s of eligibleStudents) {
        attSnapshotMap.set(s.id, {
          present: 0,
          absent: 0,
          late: 0,
          holiday: 0,
          workingDays: 0,
          percentage: 0,
        });
      }
      for (const row of matchedFromRows) {
        const snap = attSnapshotMap.get(row.student_id);
        if (!snap) continue;
        if (row.status === 'present') snap.present += 1;
        else if (row.status === 'absent') snap.absent += 1;
        else if (row.status === 'late') snap.late += 1;
        else if (row.status === 'holiday') snap.holiday += 1;
      }
      for (const snap of attSnapshotMap.values()) {
        snap.workingDays = snap.present + snap.absent + snap.late;
        snap.percentage = snap.workingDays > 0
          ? Number((((snap.present + snap.late) / snap.workingDays) * 100).toFixed(2))
          : 0;
      }

      if (isAlumniTarget) {
        // ── Graduated (Alumni) ────────────────────────────────────────────────
        await Student.update(
          { is_active: false, student_status: 'alumni' },
          { where: { id: studentIds }, transaction: txn }
        );
      } else {
        // ── Regular promotion ─────────────────────────────────────────────────
        await Student.update(
          { class: normalizedToClass, session_id: to_session_id },
          { where: { id: studentIds }, transaction: txn }
        );

        for (const student of eligibleStudents) {
          student.class = normalizedToClass;
          student.session_id = to_session_id;
          await assignPublishedFeeStructure(student, txn, true);
        }
      }

      await PromotionHistory.bulkCreate(
        eligibleStudents.map((s) => {
          const snap = attSnapshotMap.get(s.id) || {
            present: 0, absent: 0, late: 0, holiday: 0, workingDays: 0, percentage: 0,
          };
          return {
            student_id:              s.id,
            from_class:              fromClass,
            from_section:            s.section || null,
            to_class:                normalizedToClass,
            from_session:            String(from_session_id),
            from_session_name:       fromSessRec?.name || String(from_session_id),
            to_session:              to_session_id ? String(to_session_id) : 'alumni',
            to_session_name:         isAlumniTarget ? 'Graduated / Alumni' : (toSessRec?.name || String(to_session_id)),
            attendance_present:      snap.present,
            attendance_absent:       snap.absent,
            attendance_late:         snap.late,
            attendance_holiday:      snap.holiday,
            attendance_working_days: snap.workingDays,
            attendance_percentage:   snap.percentage,
            promoted_by:             req.user.id,
          };
        }),
        { transaction: txn }
      );

      summary.push({
        fromClass,
        toClass: normalizedToClass,
        count: eligibleStudents.length,
        skipped: students.length - eligibleStudents.length,
      });
    }

    // Archive promoted source session
    await fromSession.update(
      { is_archived: true, is_active: false, promotion_completed: true },
      { transaction: txn }
    );

    if (activate_target) {
      await Session.update(
        { is_active: false },
        { where: { id: { [Op.ne]: toSession.id } }, transaction: txn }
      );
      await toSession.update(
        { is_active: true, is_archived: false },
        { transaction: txn }
      );
    }

    await txn.commit();
    await clearCache('/dashboard');
    res.json({ message: 'Promotion completed successfully.', summary });
  } catch (err) {
    await txn.rollback();
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/session/promotion-history ───────────────────────────────────────
router.get('/promotion-history', protect, isAdmin, async (req, res) => {
  try {
    const { student_id, from_session, to_session, limit = 150 } = req.query;
    const where = {};
    if (student_id) where.student_id = Number(student_id);
    if (from_session) where.from_session = String(from_session);
    if (to_session) where.to_session = String(to_session);

    const history = await PromotionHistory.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'student_id', 'first_name', 'last_name', 'class', 'section', 'roll_number'],
        },
      ],
      order: [['created_at', 'DESC'], ['id', 'DESC']],
      limit: Math.min(Number(limit) || 150, 500),
    });

    res.json({ history });
  } catch (err) {
    console.error('Get promotion history error:', err);
    res.status(500).json({ message: 'Failed to load promotion history', error: err.message });
  }
});

module.exports = router;