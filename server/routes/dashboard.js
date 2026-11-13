const express = require('express');
const { Op, fn, col } = require('sequelize');
const {
  Student,
  Teacher,
  Fee,
  Attendance,
  TeacherAttendance,
  AdmissionRequest,
  Notification,
  ClassIncharge,
  ClassFeeStructure,
  Timetable,
  Event,
  Result,
  Session,
  PromotionHistory,
} = require('../models');
const { protect, authorize } = require('../middleware/auth');
const { MONTHS } = require('../services/feeService');
const { getTeacherAllowedClasses } = require('../utils/teacherAllowedClasses');
const { resolveRowSessionId, buildStudentSessionAttendance } = require('../utils/attendanceSessionHelper');

const router = express.Router();

const getIstNow = () => {
  const istOffsetMs = 330 * 60 * 1000;
  const shifted = new Date(Date.now() + istOffsetMs);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(), // 0-11
    day: shifted.getUTCDate(),
  };
};

const formatYmd = (year, monthIndex, day) => {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

router.get('/admin', protect, authorize('admin', 'admin2'), async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const istNow = getIstNow();
    const today = formatYmd(istNow.year, istNow.month, istNow.day);

    // Last 6 calendar months ending in current IST month
    const last6Months = [];
    for (let offset = 5; offset >= 0; offset--) {
      const d = new Date(Date.UTC(istNow.year, istNow.month - offset, 1));
      last6Months.push({
        year: d.getUTCFullYear(),
        monthIdx: d.getUTCMonth(),
        monthName: MONTHS[d.getUTCMonth()],
        shortLabel: MONTHS[d.getUTCMonth()].slice(0, 3),
        endOfMonth: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59)),
      });
    }

    const [
      totalStudents,
      totalTeachers,
      pendingApprovals,
      pendingAdmissions,
      recentStudents,
      notifications,
      todayAttendance,
      feeTotals,
      monthlyFees,
      studentClasses,
      feeClasses,
      timetableClasses,
      allActiveStudents,
      allActiveTeachers,
    ] = await Promise.all([
      Student.count({ where: { is_active: true, approval_status: 'approved' } }),
      Teacher.count({ where: { status: 'active' } }),
      Student.count({ where: { approval_status: 'pending' } }),
      AdmissionRequest.count({ where: { status: 'pending' } }),
      Student.findAll({
        where: { is_active: true, approval_status: 'approved' },
        order: [['created_at', 'DESC']],
        limit: 5,
      }),
      Notification.findAll({ order: [['created_at', 'DESC']], limit: 4 }),
      Attendance.findAll({
        where: { date: today },
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      Fee.findAll({
        where: { status: { [Op.notIn]: ['waived', 'not_generated'] } },
        attributes: [
          [fn('SUM', col('total_amount')), 'total_amount'],
          [fn('SUM', col('paid_amount')), 'paid_amount'],
        ],
        raw: true,
      }),
      Fee.findAll({
        where: {
          status: { [Op.notIn]: ['waived', 'not_generated'] },
          [Op.or]: last6Months.map(m => ({ month: m.monthName, year: m.year })),
        },
        attributes: [
          'year',
          'month',
          [fn('SUM', col('paid_amount')), 'collected'],
        ],
        group: ['year', 'month'],
        raw: true,
      }),
      Student.findAll({
        where: { is_active: true, approval_status: 'approved' },
        attributes: [[fn('DISTINCT', col('class')), 'class']],
        raw: true,
      }),
      ClassFeeStructure.findAll({
        where: { is_active: true },
        attributes: [[fn('DISTINCT', col('class')), 'class']],
        raw: true,
      }),
      Timetable.findAll({
        attributes: [[fn('DISTINCT', col('class')), 'class']],
        raw: true,
      }),
      Student.findAll({
        where: { is_active: true, approval_status: 'approved' },
        attributes: ['id', 'class', 'created_at'],
        raw: true,
      }),
      Teacher.findAll({
        where: { status: 'active' },
        attributes: ['id', 'created_at'],
        raw: true,
      }),
    ]);

    const classSet = new Set(
      [...studentClasses, ...feeClasses, ...timetableClasses]
        .map(r => String(r.class || '').trim())
        .filter(Boolean)
    );
    const totalClasses = classSet.size;

    const attendanceMap = todayAttendance.reduce((acc, row) => {
      acc[row.status] = Number(row.count || 0);
      return acc;
    }, {});
    const present = attendanceMap.present || 0;
    const late    = attendanceMap.late || 0;
    const absent  = attendanceMap.absent || 0;
    const holiday = attendanceMap.holiday || 0;
    const marked  = present + late + absent;

    const feeTotal     = Number(feeTotals[0]?.total_amount || 0);
    const feeCollected = Number(feeTotals[0]?.paid_amount || 0);
    const feeByMonthKey = monthlyFees.reduce((acc, row) => {
      acc[`${row.year}-${row.month}`] = Number(row.collected || 0);
      return acc;
    }, {});

    // Real 6-month cumulative / collection sparklines
    const studentSpark = last6Months.map(m => ({
      label: m.shortLabel,
      value: allActiveStudents.filter(s => !s.created_at || new Date(s.created_at) <= m.endOfMonth).length,
    }));
    const teacherSpark = last6Months.map(m => ({
      label: m.shortLabel,
      value: allActiveTeachers.filter(t => !t.created_at || new Date(t.created_at) <= m.endOfMonth).length,
    }));
    const classSpark = last6Months.map(m => {
      const clsSet = new Set(
        allActiveStudents
          .filter(s => !s.created_at || new Date(s.created_at) <= m.endOfMonth)
          .map(s => String(s.class || '').trim())
          .filter(Boolean)
      );
      return { label: m.shortLabel, value: Math.max(clsSet.size, totalClasses) };
    });
    const feeSpark = last6Months.map(m => ({
      label: m.shortLabel,
      value: feeByMonthKey[`${m.year}-${m.monthName}`] || 0,
    }));

    res.json({
      stats: {
        total_students: totalStudents,
        active_teachers: totalTeachers,
        total_classes: totalClasses,
        fee_collected: feeCollected,
        fee_total: feeTotal,
        pending_fee_amount: Math.max(feeTotal - feeCollected, 0),
        pending_student_approvals: pendingApprovals,
        pending_admission_requests: pendingAdmissions,
        attendance_present: present,
        attendance_late: late,
        attendance_absent: absent,
        attendance_holiday: holiday,
        attendance_marked: marked,
        attendance_percentage: marked ? Math.round(((present + late) / marked) * 100) : 0,
      },
      sparklines: {
        students: studentSpark,
        teachers: teacherSpark,
        classes: classSpark,
        fees: feeSpark,
      },
      charts: {
        fee_collection: last6Months.map(m => ({
          month: m.shortLabel,
          amount: feeByMonthKey[`${m.year}-${m.monthName}`] || 0,
        })),
        attendance_summary: [
          { label: 'Present', pct: present },
          { label: 'Absent', pct: absent },
          { label: 'Late', pct: late },
          { label: 'Holiday', pct: holiday },
        ],
      },
      recent_students: recentStudents.map(s => s.toJSON()),
      notifications: notifications.map(n => n.toJSON()),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/low-attendance - Returns students with < 80% attendance (current session)
router.get('/low-attendance', protect, authorize('admin', 'admin2'), async (req, res) => {
  try {
    const activeSession = await Session.findOne({ where: { is_active: true } });
    const students = await Student.findAll({
      where: { is_active: true, approval_status: 'approved' },
      attributes: ['id', 'student_id', 'first_name', 'last_name', 'class', 'section', 'roll_number', 'session_id'],
    });

    const records = await Attendance.findAll({
      where: { status: { [Op.ne]: 'holiday' } },
      attributes: ['student_id', 'status', 'session_id'],
    });

    const recordsByStudent = new Map();
    for (const r of records) {
      if (!recordsByStudent.has(r.student_id)) recordsByStudent.set(r.student_id, []);
      recordsByStudent.get(r.student_id).push(r);
    }

    const lowAttendanceStudents = students.map(s => {
      const effSessId = s.session_id || activeSession?.id || null;
      const sRows = (recordsByStudent.get(s.id) || []).filter(r =>
        !effSessId || r.session_id == null || Number(r.session_id) === Number(effSessId)
      );
      const total = sRows.length;
      if (total === 0) {
        return { student: s, percentage: 0, total: 0, present: 0 };
      }
      const presentAndLate = sRows.filter(r => r.status === 'present' || r.status === 'late').length;
      const percentage = Math.round((presentAndLate / total) * 100);
      return { student: s, percentage, total, present: presentAndLate };
    }).filter(s => s.percentage < 80 && s.total > 0);

    lowAttendanceStudents.sort((a, b) => a.percentage - b.percentage);

    res.json({ lowAttendance: lowAttendanceStudents });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/student-attendance/:studentId - Current session & session-wise comparison stats
router.get('/student-attendance/:studentId', protect, authorize('admin', 'admin2'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findByPk(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const [allSessions, allRecords, promotions] = await Promise.all([
      Session.findAll({ order: [['start_date', 'ASC'], ['id', 'ASC']] }),
      Attendance.findAll({ where: { student_id: studentId }, order: [['date', 'ASC']] }),
      PromotionHistory.findAll({ where: { student_id: studentId }, order: [['id', 'ASC']] }),
    ]);

    const {
      currentSessionId,
      sessionComparison,
    } = buildStudentSessionAttendance({
      student,
      allSessions,
      allRecords,
      promotions,
    });

    const currentSessionRows = allRecords.filter(r => {
      if (r.status === 'holiday') return false;
      if (!currentSessionId) return true;
      return resolveRowSessionId(r, allSessions) === String(currentSessionId);
    });

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    let monthTotal = 0, monthPresent = 0;
    let yearTotal = 0, yearPresent = 0;

    currentSessionRows.forEach(r => {
      yearTotal++;
      if (r.status === 'present' || r.status === 'late') yearPresent++;

      if (r.date >= startOfMonth && r.date <= endOfMonth) {
        monthTotal++;
        if (r.status === 'present' || r.status === 'late') monthPresent++;
      }
    });

    res.json({
      student,
      currentSessionId,
      monthly: {
        total: monthTotal,
        present: monthPresent,
        percentage: monthTotal ? Math.round((monthPresent / monthTotal) * 100) : 0
      },
      yearly: {
        total: yearTotal,
        present: yearPresent,
        percentage: yearTotal ? Math.round((yearPresent / yearTotal) * 100) : 0
      },
      sessionComparison,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/chart - Retrieve aggregated line chart data for different periods
router.get('/chart', protect, authorize('admin', 'admin2'), async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const { period = 'current_month' } = req.query;

    const istNow = getIstNow();
    const todayStr = formatYmd(istNow.year, istNow.month, istNow.day);

    let isDaily = false;
    let monthsBack = 0;

    if (period === 'current_month') {
      isDaily = true;
    } else if (period === 'last_2_months') {
      monthsBack = 1;
    } else if (period === 'last_3_months') {
      monthsBack = 2;
    } else if (period === 'last_6_months') {
      monthsBack = 5;
    } else if (period === 'last_12_months') {
      monthsBack = 11;
    } else {
      isDaily = true;
    }

    const monthList = [];
    for (let offset = monthsBack; offset >= 0; offset--) {
      const d = new Date(Date.UTC(istNow.year, istNow.month - offset, 1));
      const yr = d.getUTCFullYear();
      const mo = d.getUTCMonth();
      monthList.push({
        year: yr,
        monthIdx: mo,
        monthName: MONTHS[mo],
        shortMonth: MONTHS[mo].slice(0, 3),
        label: `${MONTHS[mo].slice(0, 3)} ${String(yr).slice(-2)}`,
        ymPrefix: `${yr}-${String(mo + 1).padStart(2, '0')}`,
      });
    }

    const firstMonth = monthList[0];
    const lastMonth = monthList[monthList.length - 1];
    const lastMonthDays = new Date(Date.UTC(lastMonth.year, lastMonth.monthIdx + 1, 0)).getUTCDate();

    const startStr = formatYmd(firstMonth.year, firstMonth.monthIdx, 1);
    const endStr = formatYmd(lastMonth.year, lastMonth.monthIdx, lastMonthDays);

    const feeMonthConditions = monthList.map(m => ({ year: m.year, month: m.monthName }));

    const [attendances, teacherAttendances, fees] = await Promise.all([
      Attendance.findAll({
        where: { date: { [Op.between]: [startStr, endStr] } },
        attributes: ['date', 'status'],
        raw: true,
      }),
      TeacherAttendance.findAll({
        where: { date: { [Op.between]: [startStr, endStr] } },
        attributes: ['date', 'status'],
        raw: true,
      }),
      Fee.findAll({
        where: {
          status: { [Op.notIn]: ['waived', 'not_generated'] },
          [Op.or]: [
            ...feeMonthConditions,
            { paid_date: { [Op.between]: [startStr, endStr] } },
            { due_date: { [Op.between]: [startStr, endStr] } },
          ],
        },
        attributes: ['month', 'year', 'total_amount', 'paid_amount', 'paid_date', 'due_date', 'status'],
        raw: true,
      }),
    ]);

    const getFeeYmPrefix = (f) => {
      const mIdx = MONTHS.indexOf(f.month);
      if (mIdx !== -1 && f.year) {
        return `${Number(f.year)}-${String(mIdx + 1).padStart(2, '0')}`;
      }
      const refDate = f.paid_date || f.due_date;
      if (refDate) return String(refDate).slice(0, 7);
      return null;
    };

    const finalData = [];

    if (isDaily) {
      const targetMonth = monthList[0];
      const monthFees = fees.filter(f => getFeeYmPrefix(f) === targetMonth.ymPrefix);
      const monthExpected = monthFees.reduce((sum, f) => sum + parseFloat(f.total_amount || 0), 0);

      for (let day = 1; day <= lastMonthDays; day++) {
        const dateStr = formatYmd(targetMonth.year, targetMonth.monthIdx, day);
        const label = `${day} ${targetMonth.shortMonth}`;

        if (dateStr > todayStr) {
          finalData.push({ label, attendance: null, fees: null, teacherAttendance: null });
          continue;
        }

        // 1. Student Attendance %
        const dayAtts = attendances.filter(a => String(a.date).slice(0, 10) === dateStr);
        const stPresent = dayAtts.filter(a => a.status === 'present' || a.status === 'late').length;
        const stMarked = dayAtts.filter(a => ['present', 'late', 'absent'].includes(a.status)).length;
        const attRate = stMarked > 0 ? Math.round((stPresent / stMarked) * 1000) / 10 : null;

        // 2. Cumulative Fee Collection % in month up to dateStr
        let feesRate = null;
        if (monthExpected > 0) {
          const cumPaid = monthFees.reduce((sum, f) => {
            const pDate = f.paid_date ? String(f.paid_date).slice(0, 10) : null;
            if (pDate ? pDate <= dateStr : f.status === 'paid') {
              return sum + parseFloat(f.paid_amount || 0);
            }
            return sum;
          }, 0);
          feesRate = Math.min(100, Math.round((cumPaid / monthExpected) * 1000) / 10);
        }

        // 3. Teacher Attendance %
        const dayTeacherAtts = teacherAttendances.filter(t => String(t.date).slice(0, 10) === dateStr);
        const tAttended = dayTeacherAtts.reduce((sum, t) => {
          if (t.status === 'present') return sum + 1;
          if (t.status === 'half_day') return sum + 0.5;
          return sum;
        }, 0);
        const tMarked = dayTeacherAtts.filter(t => ['present', 'half_day', 'absent', 'leave'].includes(t.status)).length;
        const teacherAttRate = tMarked > 0 ? Math.round((tAttended / tMarked) * 1000) / 10 : null;

        finalData.push({
          label,
          attendance: attRate,
          fees: feesRate,
          teacherAttendance: teacherAttRate,
        });
      }
    } else {
      for (const m of monthList) {
        // 1. Student Attendance %
        const monthAtts = attendances.filter(a => String(a.date).slice(0, 7) === m.ymPrefix);
        const stPresent = monthAtts.filter(a => a.status === 'present' || a.status === 'late').length;
        const stMarked = monthAtts.filter(a => ['present', 'late', 'absent'].includes(a.status)).length;
        const attRate = stMarked > 0 ? Math.round((stPresent / stMarked) * 1000) / 10 : null;

        // 2. Fee Collection %
        const monthFees = fees.filter(f => getFeeYmPrefix(f) === m.ymPrefix);
        const totalExpected = monthFees.reduce((sum, f) => sum + parseFloat(f.total_amount || 0), 0);
        const totalPaid = monthFees.reduce((sum, f) => sum + parseFloat(f.paid_amount || 0), 0);
        const feesRate = totalExpected > 0 ? Math.min(100, Math.round((totalPaid / totalExpected) * 1000) / 10) : null;

        // 3. Teacher Attendance %
        const monthTeacherAtts = teacherAttendances.filter(t => String(t.date).slice(0, 7) === m.ymPrefix);
        const tAttended = monthTeacherAtts.reduce((sum, t) => {
          if (t.status === 'present') return sum + 1;
          if (t.status === 'half_day') return sum + 0.5;
          return sum;
        }, 0);
        const tMarked = monthTeacherAtts.filter(t => ['present', 'half_day', 'absent', 'leave'].includes(t.status)).length;
        const teacherAttRate = tMarked > 0 ? Math.round((tAttended / tMarked) * 1000) / 10 : null;

        finalData.push({
          label: m.label,
          attendance: attRate,
          fees: feesRate,
          teacherAttendance: teacherAttRate,
        });
      }
    }

    const avgNonNull = (key) => {
      const vals = finalData.map(d => d[key]).filter(v => v !== null && v !== undefined);
      if (vals.length === 0) return '0%';
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
      return `${Math.round(avg * 10) / 10}%`;
    };

    const hasData = finalData.some(
      d => d.attendance !== null || d.fees !== null || d.teacherAttendance !== null
    );

    res.json({
      data: finalData,
      hasData,
      averages: {
        attendance: avgNonNull('attendance'),
        fees: avgNonNull('fees'),
        teacherAttendance: avgNonNull('teacherAttendance'),
      },
    });
  } catch (err) {
    console.error('[dashboard][GET /chart]', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/teacher - Retrieve real-time dashboard statistics for teachers
router.get('/teacher', protect, authorize('teacher'), async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const teacher = await Teacher.findByPk(req.user.linked_teacher_id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher record not found.' });
    }

    const allowedClasses = await getTeacherAllowedClasses(req.user.linked_teacher_id);
    const istNow = getIstNow();
    const today = formatYmd(istNow.year, istNow.month, istNow.day);
    const startOfTodayIstUtc = new Date(
      Date.UTC(istNow.year, istNow.month, istNow.day, 0, 0, 0) - 330 * 60 * 1000
    );

    const [
      totalStudents,
      todayAttendance,
      allAttendanceStats,
      incharges,
      notifications,
      upcomingEvents
    ] = await Promise.all([
      // 1. Total students in allowed classes
      Student.count({
        where: {
          class: { [Op.in]: allowedClasses },
          is_active: true,
          approval_status: 'approved'
        }
      }),
      // 2. Today's attendance summary
      Attendance.findAll({
        where: {
          class: { [Op.in]: allowedClasses },
          date: today
        },
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status']
      }),
      // 3. All attendance stats for average percentage
      Attendance.findAll({
        where: {
          class: { [Op.in]: allowedClasses }
        },
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status']
      }),
      // 4. Incharge classes for pending result approvals
      ClassIncharge.findAll({
        where: { teacher_id: req.user.linked_teacher_id, is_active: true }
      }),
      // 5. Announcements
      Notification.findAll({
        where: {
          is_active: true,
          [Op.or]: [
            { recipient_type: 'all' },
            { recipient_type: 'role', recipient_role: { [Op.in]: ['all', 'teachers'] } },
            { recipient_type: 'individual', recipient_user_id: req.user.id }
          ]
        },
        order: [['created_at', 'DESC']],
        limit: 5
      }),
      // 6. Upcoming events
      Event.findAll({
        where: {
          is_active: true,
          event_date: { [Op.gte]: startOfTodayIstUtc }
        },
        order: [['event_date', 'ASC']],
        limit: 5
      })
    ]);

    // Process attendance today
    const attendanceMap = todayAttendance.reduce((acc, row) => {
      acc[row.status] = Number(row.get('count') || 0);
      return acc;
    }, {});
    const marked = Object.values(attendanceMap).reduce((sum, count) => sum + count, 0);

    // Process overall attendance percentage
    const allAttMap = allAttendanceStats.reduce((acc, row) => {
      acc[row.status] = Number(row.get('count') || 0);
      return acc;
    }, {});
    const allPresent = (allAttMap.present || 0) + (allAttMap.late || 0);
    const allMarked = Object.values(allAttMap).reduce((sum, count) => sum + count, 0);
    const averageAttendancePercentage = allMarked ? Math.round((allPresent / allMarked) * 100) : 0;

    // Process pending approvals
    let pendingResultApprovals = 0;
    if (incharges.length > 0) {
      pendingResultApprovals = await Result.count({
        where: {
          workflow_status: 'submitted',
          [Op.or]: incharges.map(i => ({ class: i.class, section: i.section }))
        }
      });
    }

    // Process Timetable Today
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDayName = days[new Date().getDay()];
    let timetableToday = [];

    if (todayDayName !== 'Sunday') {
      timetableToday = await Timetable.findAll({
        where: {
          teacher_id: teacher.id,
          day: todayDayName
        },
        order: [['period_number', 'ASC']]
      });
    }

    const slots = timetableToday.map(t => ({ class: t.class, section: t.section }));
    const studentCounts = {};
    if (slots.length > 0) {
      const counts = await Student.findAll({
        where: {
          is_active: true,
          approval_status: 'approved',
          [Op.or]: slots.map(s => ({ class: s.class, section: s.section }))
        },
        attributes: ['class', 'section', [fn('COUNT', col('id')), 'count']],
        group: ['class', 'section']
      });
      counts.forEach(c => {
        const key = `${c.class}_${c.section}`;
        studentCounts[key] = Number(c.get('count') || 0);
      });
    }

    const timetableWithStudentCounts = timetableToday.map(t => {
      const key = `${t.class}_${t.section}`;
      return {
        ...t.toJSON(),
        student_count: studentCounts[key] || 0
      };
    });

    res.json({
      stats: {
        assigned_classes: allowedClasses.length,
        total_students: totalStudents,
        attendance_present: (attendanceMap.present || 0) + (attendanceMap.late || 0),
        attendance_marked: marked,
        attendance_percentage: averageAttendancePercentage,
        pending_approvals: pendingResultApprovals
      },
      timetable: timetableWithStudentCounts,
      announcements: notifications.map(n => n.toJSON()),
      events: upcomingEvents.map(e => e.toJSON())
    });

  } catch (err) {
    console.error('[dashboard][GET /teacher]', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
