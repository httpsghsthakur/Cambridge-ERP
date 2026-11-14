const { Student, AdmissionRequest, User, sequelize } = require('../models');

async function migratePendingStudents() {
  const txn = await sequelize.transaction();
  try {
    // 1. Migrate students with approval_status: 'pending' (unapproved legacy students)
    const pendingStudents = await Student.findAll({
      where: { approval_status: 'pending' },
      transaction: txn,
    });

    if (pendingStudents.length > 0) {
      console.log(`[MIGRATOR] Found ${pendingStudents.length} pending students to migrate to admission requests.`);
      for (const student of pendingStudents) {
        const existingRequest = await AdmissionRequest.findOne({
          where: {
            first_name: student.first_name,
            last_name: student.last_name,
            parent_phone: student.parent_phone,
          },
          transaction: txn,
        });

        if (!existingRequest) {
          await AdmissionRequest.create({
            first_name: student.first_name,
            last_name: student.last_name,
            date_of_birth: student.date_of_birth,
            gender: student.gender,
            applying_class: student.class,
            parent_name: student.parent_name,
            parent_phone: student.parent_phone,
            parent_email: student.parent_email,
            parent_address: student.parent_address,
            previous_school: student.previous_school,
            status: 'pending',
            submitted_by: student.created_by || null,
            admission_fee_paid: 0,
          }, { transaction: txn });
          console.log(`[MIGRATOR] Created pending AdmissionRequest for ${student.first_name} ${student.last_name}`);
        }

        // Delete user credentials & pending student
        await User.destroy({
          where: { linked_student_id: student.id, role: 'student' },
          transaction: txn,
        });
        await student.destroy({ transaction: txn });
        console.log(`[MIGRATOR] Removed pending Student record ID: ${student.id}`);
      }
    }

    // 2. Migrate students with source: 'admission_approved' and admission_request_id: null (already approved legacy students)
    const approvedLegacyStudents = await Student.findAll({
      where: {
        source: 'admission_approved',
        admission_request_id: null,
      },
      transaction: txn,
    });

    if (approvedLegacyStudents.length > 0) {
      console.log(`[MIGRATOR] Found ${approvedLegacyStudents.length} approved legacy students to link with admission requests.`);
      for (const student of approvedLegacyStudents) {
        const request = await AdmissionRequest.create({
          first_name: student.first_name,
          last_name: student.last_name,
          date_of_birth: student.date_of_birth,
          gender: student.gender,
          applying_class: student.class,
          parent_name: student.parent_name,
          parent_phone: student.parent_phone,
          parent_email: student.parent_email,
          parent_address: student.parent_address,
          previous_school: student.previous_school,
          status: 'approved',
          submitted_by: student.created_by || null,
          reviewed_by: student.approved_by || null,
          approved_at: student.approved_at || student.created_at,
          student_id_created: student.id,
          admission_fee_paid: 0,
        }, { transaction: txn });

        await student.update({ admission_request_id: request.id }, { transaction: txn });
        console.log(`[MIGRATOR] Created approved AdmissionRequest for ${student.first_name} ${student.last_name} (linked with student ID: ${student.id})`);
      }
    }

    await txn.commit();
    console.log('[MIGRATOR] ✅ Database migration completed successfully.');
  } catch (err) {
    await txn.rollback();
    console.error('[MIGRATOR] ❌ Database migration failed:', err.message);
  }
}

async function migrateFeeColumns() {
  try {
    const qi = sequelize.getQueryInterface();
    const classFeeDesc = await qi.describeTable('class_fee_structures');
    
    // Add late_fee_per_day
    if (!classFeeDesc.late_fee_per_day) {
      console.log('[MIGRATOR] Adding late_fee_per_day to class_fee_structures');
      await qi.addColumn('class_fee_structures', 'late_fee_per_day', {
        type: require('sequelize').DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      });
    }

    // Add session_id
    if (!classFeeDesc.session_id) {
      console.log('[MIGRATOR] Adding session_id to class_fee_structures');
      await qi.addColumn('class_fee_structures', 'session_id', {
        type: require('sequelize').DataTypes.INTEGER,
        defaultValue: 1, // Fallback session
        allowNull: false,
      });
    }

    const feesDesc = await qi.describeTable('fees');
    
    // Add late_fee_amount
    if (!feesDesc.late_fee_amount) {
      console.log('[MIGRATOR] Adding late_fee_amount to fees');
      await qi.addColumn('fees', 'late_fee_amount', {
        type: require('sequelize').DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      });
    }

    // Update ENUM for status in fees
    // MySQL requires raw query to update ENUM values
    if (feesDesc.status && sequelize.getDialect() === 'mysql') {
      console.log('[MIGRATOR] Updating status ENUM in fees to include overdue');
      await sequelize.query(`
        ALTER TABLE fees 
        MODIFY COLUMN status ENUM('paid', 'unpaid', 'partial', 'waived', 'not_generated', 'overdue') DEFAULT 'unpaid';
      `);
    }

    console.log('[MIGRATOR] ✅ Fee columns migration completed successfully.');
  } catch (err) {
    console.error('[MIGRATOR] ❌ Fee columns migration failed:', err.message);
  }
}

async function migrateTeacherSubjectColumn() {
  try {
    const qi = sequelize.getQueryInterface();
    const teachersDesc = await qi.describeTable('teachers');
    if (teachersDesc && teachersDesc.subject && sequelize.getDialect() === 'mysql') {
      await sequelize.query('ALTER TABLE teachers MODIFY COLUMN subject VARCHAR(255);');
      console.log('[MIGRATOR] ✅ Teacher subject column resized to VARCHAR(255).');
    }
  } catch (err) {
    console.error('[MIGRATOR] ❌ Teacher subject column migration notice:', err.message);
  }
}

async function migrateDatesheetAndAchievementTables() {
  try {
    const dialect = sequelize.getDialect();
    if (dialect === 'mysql') {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS exam_datesheets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          exam_name VARCHAR(100) NOT NULL,
          exam_type ENUM('unit_test', 'half_yearly', 'annual', 'assessment', 'pre_board', 'other') DEFAULT 'unit_test',
          class VARCHAR(20) NOT NULL,
          section VARCHAR(5) NOT NULL,
          session_id INT NULL,
          created_by_teacher_id INT NULL,
          created_by_user_id INT NOT NULL,
          status ENUM('draft', 'submitted', 'approved', 'rejected', 'declared') DEFAULT 'draft',
          instructions TEXT NULL,
          review_notes TEXT NULL,
          reviewed_by INT NULL,
          reviewed_at DATETIME NULL,
          declared_by INT NULL,
          declared_at DATETIME NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_datesheet_class_sec (class, section),
          INDEX idx_datesheet_status (status)
        );
      `);

      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS exam_datesheet_entries (
          id INT AUTO_INCREMENT PRIMARY KEY,
          datesheet_id INT NOT NULL,
          subject VARCHAR(100) NOT NULL,
          exam_date DATE NOT NULL,
          start_time VARCHAR(15) NOT NULL,
          end_time VARCHAR(15) NOT NULL,
          room VARCHAR(50) NULL,
          syllabus_notes VARCHAR(255) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_entry_datesheet (datesheet_id),
          INDEX idx_entry_exam_date (exam_date)
        );
      `);

      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS student_achievements (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT NOT NULL,
          class VARCHAR(20) NOT NULL,
          section VARCHAR(5) NOT NULL,
          session_id INT NULL,
          category VARCHAR(60) NOT NULL,
          title VARCHAR(150) NOT NULL,
          position VARCHAR(50) NOT NULL,
          event_date DATE NULL,
          level VARCHAR(50) NULL,
          description TEXT NULL,
          added_by_teacher_id INT NULL,
          added_by_user_id INT NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_ach_student (student_id),
          INDEX idx_ach_class_sec (class, section)
        );
      `);

      try {
        await sequelize.query(`
          ALTER TABLE notifications
          MODIFY COLUMN type ENUM(
            'fee_reminder', 'attendance_alert', 'result',
            'general', 'holiday', 'admission', 'promotion',
            'exam_datesheet', 'achievement'
          ) DEFAULT 'general';
        `);
      } catch (enumErr) {
        console.warn('[MIGRATOR] Notifications type ENUM warning:', enumErr.message);
      }
    } else {
      const { ExamDatesheet, ExamDatesheetEntry, StudentAchievement } = require('../models');
      await ExamDatesheet.sync();
      await ExamDatesheetEntry.sync();
      await StudentAchievement.sync();
    }
    console.log('[MIGRATOR] ✅ Exam datesheets and student achievements tables verified.');
  } catch (err) {
    console.error('[MIGRATOR] ❌ Datesheet/achievement table migration failed:', err.message);
  }
}

async function migrateSessionAttendanceAndPromotionColumns() {
  try {
    const qi = sequelize.getQueryInterface();
    const { DataTypes } = require('sequelize');
    const promoDesc = await qi.describeTable('promotion_history');
    const attDesc = await qi.describeTable('attendance');

    if (!attDesc.is_finalized) {
      await qi.addColumn('attendance', 'is_finalized', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      });
    }

    const columnsToAdd = [
      ['from_section', { type: DataTypes.STRING(5), allowNull: true }],
      ['from_session_name', { type: DataTypes.STRING(30), allowNull: true }],
      ['to_session_name', { type: DataTypes.STRING(30), allowNull: true }],
      ['attendance_present', { type: DataTypes.INTEGER, defaultValue: 0 }],
      ['attendance_absent', { type: DataTypes.INTEGER, defaultValue: 0 }],
      ['attendance_late', { type: DataTypes.INTEGER, defaultValue: 0 }],
      ['attendance_holiday', { type: DataTypes.INTEGER, defaultValue: 0 }],
      ['attendance_working_days', { type: DataTypes.INTEGER, defaultValue: 0 }],
      ['attendance_percentage', { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 }],
    ];

    for (const [colName, colDef] of columnsToAdd) {
      if (!promoDesc[colName]) {
        await qi.addColumn('promotion_history', colName, colDef);
      }
    }

    // Backfill legacy attendance rows where session_id IS NULL by matching session date ranges or active session
    const { Session, Attendance, Student, PromotionHistory } = require('../models');
    const sessions = await Session.findAll({ order: [['start_date', 'ASC'], ['id', 'ASC']] });
    const activeSession = sessions.find((s) => s.is_active) || sessions[sessions.length - 1];

    const nullSessionAtts = await Attendance.findAll({
      where: { session_id: null },
      attributes: ['id', 'student_id', 'date', 'class', 'section'],
    });

    if (nullSessionAtts.length > 0 && sessions.length > 0) {
      const studentIds = [...new Set(nullSessionAtts.map((a) => a.student_id))];
      const [students, promotions] = await Promise.all([
        Student.findAll({ where: { id: studentIds }, attributes: ['id', 'session_id', 'class', 'section'] }),
        PromotionHistory.findAll({ where: { student_id: studentIds } }),
      ]);
      const studentMap = new Map(students.map((s) => [s.id, s]));
      const promoByStudent = new Map();
      promotions.forEach((p) => {
        if (!promoByStudent.has(p.student_id)) promoByStudent.set(p.student_id, []);
        promoByStudent.get(p.student_id).push(p);
      });

      for (const att of nullSessionAtts) {
        const matchedSession = sessions.find(
          (s) => s.start_date && s.end_date && att.date >= s.start_date && att.date <= s.end_date
        );
        const stu = studentMap.get(att.student_id);
        const resolvedSessionId = matchedSession?.id || stu?.session_id || activeSession?.id || null;
        if (resolvedSessionId) {
          const updateFields = { session_id: resolvedSessionId };
          if (!att.class && stu) {
            // Only fill class/section from student if student wasn't promoted out of this session
            const stuPromos = promoByStudent.get(att.student_id) || [];
            const matchingPromo = stuPromos.find((p) => String(p.from_session) === String(resolvedSessionId));
            updateFields.class = matchingPromo?.from_class || stu.class;
            updateFields.section = matchingPromo?.from_section || stu.section;
          }
          await Attendance.update(updateFields, { where: { id: att.id } });
        }
      }
      console.log(`[MIGRATOR] ✅ Backfilled session_id on ${nullSessionAtts.length} attendance record(s).`);
    }

    console.log('[MIGRATOR] ✅ Session attendance and promotion history columns verified.');
  } catch (err) {
    console.error('[MIGRATOR] ❌ Session attendance migration failed:', err.message);
  }
}

async function migrateStudentMarksheetColumns() {
  try {
    const qi = sequelize.getQueryInterface();
    const studentsDesc = await qi.describeTable('students');
    const { DataTypes } = require('sequelize');

    const columnsToAdd = [
      { name: 'mother_name', type: DataTypes.STRING(100) },
      { name: 'category', type: DataTypes.STRING(50) },
      { name: 'aadhar_number', type: DataTypes.STRING(20) },
      { name: 'pen_number', type: DataTypes.STRING(30) },
      { name: 'family_id', type: DataTypes.STRING(30) },
    ];

    for (const col of columnsToAdd) {
      if (!studentsDesc[col.name]) {
        console.log(`[MIGRATOR] Adding column ${col.name} to students`);
        await qi.addColumn('students', col.name, {
          type: col.type,
          allowNull: true,
        });
      }
    }
    console.log('[MIGRATOR] ✅ Student marksheet identity columns verified.');
  } catch (err) {
    console.error('[MIGRATOR] ❌ Student marksheet columns migration notice:', err.message);
  }
}

async function migrateActiveSession() {
  try {
    const { Session, Student } = require('../models');
    const { Op } = require('sequelize');

    // Find or create session 2026-2027
    let [session2026, created] = await Session.findOrCreate({
      where: { name: '2026-2027' },
      defaults: {
        name: '2026-2027',
        start_date: '2026-04-01',
        end_date: '2027-03-31',
        is_active: true,
        is_archived: false,
        promotion_completed: false,
      }
    });

    // Ensure session 2026-2027 is active and not archived
    await session2026.update({ is_active: true, is_archived: false });

    // Deactivate all other sessions so only 2026-2027 is active
    await Session.update(
      { is_active: false },
      { where: { id: { [Op.ne]: session2026.id } } }
    );

    // Archive sessions strictly older than 2026-2027
    await Session.update(
      { is_archived: true },
      {
        where: {
          id: { [Op.ne]: session2026.id },
          start_date: { [Op.lt]: '2026-04-01' }
        }
      }
    );

    // Ensure active students are associated with session 2026-2027 if unlinked or pointing to old inactive sessions
    const activeStudents = await Student.findAll({
      attributes: ['id', 'session_id'],
      where: {
        is_active: true,
        approval_status: 'approved',
        [Op.or]: [
          { session_id: null },
          { session_id: { [Op.ne]: session2026.id } }
        ]
      }
    });

    if (activeStudents.length > 0) {
      await Student.update(
        { session_id: session2026.id },
        {
          where: {
            id: { [Op.in]: activeStudents.map(s => s.id) }
          }
        }
      );
      console.log(`[MIGRATOR] Associated ${activeStudents.length} active students to session 2026-2027`);
    }

    console.log('[MIGRATOR] ✅ Active academic session 2026-2027 verified and activated.');
  } catch (err) {
    console.error('[MIGRATOR] ❌ Active session migration failed:', err.message);
  }
}

module.exports = {
  migratePendingStudents,
  migrateFeeColumns,
  migrateTeacherSubjectColumn,
  migrateDatesheetAndAchievementTables,
  migrateSessionAttendanceAndPromotionColumns,
  migrateStudentMarksheetColumns,
  migrateActiveSession,
};
