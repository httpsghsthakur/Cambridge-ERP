const { Op } = require('sequelize');
const {
  Student,
  Teacher,
  User,
  Attendance,
  TeacherAttendance,
  Result,
  ExamDatesheet,
  Session,
  Setting,
  SecurityLog,
} = require('../../models');
const { getOrCreateConfig } = require('./configService');
const { assertNoFinancialData } = require('./securityService');

/**
 * Data Extractor for Central Platform Integration
 * Collects APPROVED OPERATIONAL DATA ONLY.
 * 
 * NON-NEGOTIABLE POLICY:
 * Absolutely NO student fee records, payment transactions, dues,
 * school bank accounts, transactions, income, expenses, or payroll.
 */

async function extractOperationalData() {
  const config = await getOrCreateConfig();

  // 1. School Information
  const settings = await Setting.findAll();
  const settingsMap = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});

  const activeSession = await Session.findOne({ where: { is_active: true } });

  const schoolInfo = {
    school_id: config.school_id,
    school_name: settingsMap.school_name || config.school_name || 'School ERP',
    school_subtitle: settingsMap.school_subtitle || '',
    school_address: settingsMap.school_address || '',
    school_phone: settingsMap.school_phone || '',
    school_email: settingsMap.school_email || '',
    school_type: 'K-12 Educational Institution',
    academic_session: activeSession?.name || 'N/A',
    connection_status: config.connection_status,
  };

  // 2. Student Statistics (Aggregate counts only — NO PII, NO Fees)
  const totalStudents = await Student.count();
  const activeStudents = await Student.count({ where: { is_active: true } });
  const inactiveStudents = totalStudents - activeStudents;

  // Class-wise student distribution
  const allStudents = await Student.findAll({
    attributes: ['class', 'section', 'gender', 'student_status', 'admission_date'],
  });

  const classWiseCounts = {};
  const sectionWiseCounts = {};
  const genderDistribution = { male: 0, female: 0, other: 0, unspecified: 0 };
  const studentStatusCounts = { active: 0, inactive: 0, pending: 0, alumni: 0 };

  allStudents.forEach((s) => {
    // Class distribution
    const cls = s.class || 'Unassigned';
    classWiseCounts[cls] = (classWiseCounts[cls] || 0) + 1;

    // Section distribution
    const secKey = `${cls}-${s.section || 'General'}`;
    sectionWiseCounts[secKey] = (sectionWiseCounts[secKey] || 0) + 1;

    // Gender
    const g = (s.gender || '').toLowerCase();
    if (g === 'male' || g === 'm') genderDistribution.male++;
    else if (g === 'female' || g === 'f') genderDistribution.female++;
    else if (g === 'other') genderDistribution.other++;
    else genderDistribution.unspecified++;

    // Status
    const st = (s.student_status || (s.is_active ? 'active' : 'inactive')).toLowerCase();
    studentStatusCounts[st] = (studentStatusCounts[st] || 0) + 1;
  });

  const studentStats = {
    total_count: totalStudents,
    active_count: activeStudents,
    inactive_count: inactiveStudents,
    class_wise_distribution: classWiseCounts,
    section_wise_distribution: sectionWiseCounts,
    gender_distribution: genderDistribution,
    status_distribution: studentStatusCounts,
  };

  // 3. Teacher Statistics (Aggregates only — NO Salaries, NO Bank accounts)
  const totalTeachers = await Teacher.count();
  const activeTeachers = await Teacher.count({ where: { status: 'active' } });
  const teachers = await Teacher.findAll({ attributes: ['subject', 'status'] });

  const subjectTeacherCounts = {};
  teachers.forEach((t) => {
    const subj = t.subject || 'General';
    subjectTeacherCounts[subj] = (subjectTeacherCounts[subj] || 0) + 1;
  });

  const teacherStats = {
    total_count: totalTeachers,
    active_count: activeTeachers,
    inactive_count: totalTeachers - activeTeachers,
    subject_wise_distribution: subjectTeacherCounts,
  };

  // 4. Staff Statistics (Aggregated user roles — NO Salaries)
  const users = await User.findAll({ attributes: ['role', 'is_active'] });
  const roleCounts = {};
  let totalStaff = 0;
  let activeStaff = 0;

  users.forEach((u) => {
    if (['student', 'parent'].includes(u.role)) return; // Exclude students & parents from staff
    totalStaff++;
    if (u.is_active) activeStaff++;
    const normalizedRole = u.role === 'fee_collector' ? 'administrative_staff' : u.role;
    roleCounts[normalizedRole] = (roleCounts[normalizedRole] || 0) + 1;
  });

  const staffStats = {
    total_count: totalStaff,
    active_count: activeStaff,
    role_distribution: roleCounts,
  };

  // 5. Attendance Statistics (Aggregates only)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = await Attendance.findAll({
    where: { date: todayStr },
    attributes: ['status'],
  });

  const todaySummary = { present: 0, absent: 0, late: 0, holiday: 0, total: todayRecords.length };
  todayRecords.forEach((r) => {
    if (todaySummary[r.status] !== undefined) todaySummary[r.status]++;
  });

  const allAttendanceCount = await Attendance.count({ where: { status: { [Op.ne]: 'holiday' } } });
  const presentAttendanceCount = await Attendance.count({ where: { status: { [Op.in]: ['present', 'late'] } } });
  const overallAttendanceRate = allAttendanceCount > 0
    ? Math.round((presentAttendanceCount / allAttendanceCount) * 100)
    : 0;

  // Teacher attendance summary
  const teacherTodayRecords = await TeacherAttendance.findAll({
    where: { date: todayStr },
    attributes: ['status'],
  });
  const teacherTodaySummary = { present: 0, absent: 0, late: 0, on_leave: 0, total: teacherTodayRecords.length };
  teacherTodayRecords.forEach((r) => {
    if (teacherTodaySummary[r.status] !== undefined) teacherTodaySummary[r.status]++;
  });

  const attendanceStats = {
    overall_attendance_rate: overallAttendanceRate,
    student_today_summary: todaySummary,
    teacher_today_summary: teacherTodaySummary,
  };

  // 6. Academic Information (Curriculum & aggregate metrics — NO individual marks)
  const totalResults = await Result.count();
  const allResults = await Result.findAll({
    attributes: ['class', 'percentage', 'grade', 'exam_type'],
  });

  let sumPercentage = 0;
  let countWithPct = 0;
  const gradeDistribution = {};

  allResults.forEach((r) => {
    if (r.percentage != null) {
      sumPercentage += parseFloat(r.percentage);
      countWithPct++;
    }
    if (r.grade) {
      gradeDistribution[r.grade] = (gradeDistribution[r.grade] || 0) + 1;
    }
  });

  const averageExamScore = countWithPct > 0 ? Math.round((sumPercentage / countWithPct) * 10) / 10 : 0;
  const totalExamsConducted = await ExamDatesheet.count();

  const academicStats = {
    total_classes: Object.keys(classWiseCounts).length,
    total_sections: Object.keys(sectionWiseCounts).length,
    total_examinations_recorded: totalResults,
    total_datesheets: totalExamsConducted,
    average_examination_percentage: averageExamScore,
    grade_distribution: gradeDistribution,
  };

  // 7. ERP Technical Health
  const mem = process.memoryUsage();
  const recentSecurityEvents = await SecurityLog.count({
    where: {
      created_at: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  const technicalHealth = {
    status: 'operational',
    database_connected: true,
    connector_version: config.connector_version,
    erp_version: config.erp_version,
    node_version: process.version,
    platform: process.platform,
    uptime_seconds: Math.floor(process.uptime()),
    memory_usage_mb: {
      rss: Math.round(mem.rss / (1024 * 1024)),
      heap_used: Math.round(mem.heapUsed / (1024 * 1024)),
      heap_total: Math.round(mem.heapTotal / (1024 * 1024)),
    },
    security_events_last_24h: recentSecurityEvents,
    last_heartbeat_at: config.last_heartbeat_at,
    last_sync_at: config.last_sync_at,
    generated_at: new Date().toISOString(),
  };

  // Compile payload
  const payload = {
    school: schoolInfo,
    students: studentStats,
    teachers: teacherStats,
    staff: staffStats,
    attendance: attendanceStats,
    academics: academicStats,
    health: technicalHealth,
  };

  // STRICT COMPLIANCE CHECK: Throw error if ANY financial key exists
  assertNoFinancialData(payload);

  return payload;
}

module.exports = {
  extractOperationalData,
};
