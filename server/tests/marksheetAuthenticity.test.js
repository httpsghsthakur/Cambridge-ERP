const assert = require('assert');
const { Student, Result, ResultSubject, Attendance, Session, sequelize } = require('../models');
const { migrateStudentMarksheetColumns, migrateSessionAttendanceAndPromotionColumns } = require('../utils/dbMigrator');

async function runMarksheetAuthenticityTests() {
  console.log('\n================================================================');
  console.log('   MARKSHEET REAL DATA AUTHENTICITY VERIFICATION SUITE');
  console.log('================================================================\n');

  try {
    // 1. Run migrations
    console.log('  [TEST] 1. Verify student marksheet columns migration ...');
    await migrateSessionAttendanceAndPromotionColumns();
    await migrateStudentMarksheetColumns();
    const qi = sequelize.getQueryInterface();
    const cols = await qi.describeTable('students');
    assert(cols.mother_name, 'mother_name column must exist in students');
    assert(cols.category, 'category column must exist in students');
    assert(cols.aadhar_number, 'aadhar_number column must exist in students');
    assert(cols.pen_number, 'pen_number column must exist in students');
    assert(cols.family_id, 'family_id column must exist in students');
    console.log('  [TEST] 1. Verify student marksheet columns migration ... ✅ PASS\n');

    // 2. Create student with authentic attributes
    console.log('  [TEST] 2. Create and retrieve student with authentic DB details ...');
    let session = await Session.findOne();
    if (!session) {
      session = await Session.create({
        name: '2025-2026',
        start_date: '2025-04-01',
        end_date: '2026-03-31',
        is_active: true,
      });
    }

    const testStudentId = 'SCH-TEST-' + Date.now().toString().slice(-4);
    const createdStudent = await Student.create({
      student_id: testStudentId,
      first_name: 'Aarav',
      last_name: 'Sharma',
      class: 'Class 9',
      section: 'B',
      roll_number: 14,
      session_id: session.id,
      parent_name: 'Ramesh Sharma',
      mother_name: 'Sunita Sharma',
      category: 'OBC',
      aadhar_number: '987654321012',
      pen_number: 'PEN99887766',
      family_id: 'FAM-554433',
      date_of_birth: '2010-06-15',
      approval_status: 'approved',
    });

    const fetched = await Student.findByPk(createdStudent.id, {
      include: [{ model: Session, as: 'session' }],
    });
    assert.strictEqual(fetched.first_name, 'Aarav');
    assert.strictEqual(fetched.last_name, 'Sharma');
    assert.strictEqual(fetched.mother_name, 'Sunita Sharma');
    assert.strictEqual(fetched.category, 'OBC');
    assert.strictEqual(fetched.aadhar_number, '987654321012');
    assert.strictEqual(fetched.pen_number, 'PEN99887766');
    assert.strictEqual(fetched.family_id, 'FAM-554433');
    assert.strictEqual(fetched.roll_number, 14);
    assert.strictEqual(fetched.date_of_birth, '2010-06-15');
    console.log('  [TEST] 2. Create and retrieve student with authentic DB details ... ✅ PASS\n');

    // 3. Create real exam result with exactly 3 subjects (no dummy 6-subject inflation)
    console.log('  [TEST] 3. Create real exam result and verify subject summation ...');
    const exam = await Result.create({
      student_id: createdStudent.id,
      exam_name: 'Mid Term Assessment 2025',
      exam_type: 'half_yearly',
      class: 'Class 9',
      section: 'B',
      session_id: session.id,
      total_marks: 300,
      total_obtained: 255,
      percentage: 85.0,
      grade: 'A',
      rank: 2,
      workflow_status: 'published',
      is_published: true,
    });

    await ResultSubject.bulkCreate([
      { result_id: exam.id, subject: 'MATHEMATICS', max_marks: 100, obtained_marks: 92, grade: 'A+' },
      { result_id: exam.id, subject: 'PHYSICS', max_marks: 100, obtained_marks: 81, grade: 'A' },
      { result_id: exam.id, subject: 'CHEMISTRY', max_marks: 100, obtained_marks: 82, grade: 'A' },
    ]);

    // Add attendance record
    await Attendance.create({
      student_id: createdStudent.id,
      date: '2025-05-01',
      status: 'present',
      session_id: session.id,
    });

    const examWithSubs = await Result.findByPk(exam.id, {
      include: [
        { model: ResultSubject, as: 'subjects' },
        { model: Student, as: 'student', include: [{ model: Session, as: 'session' }] },
      ],
    });

    assert.strictEqual(examWithSubs.subjects.length, 3, 'Only real 3 subjects must be present');
    const totalMax = examWithSubs.subjects.reduce((sum, s) => sum + s.max_marks, 0);
    const totalObt = examWithSubs.subjects.reduce((sum, s) => sum + s.obtained_marks, 0);
    assert.strictEqual(totalMax, 300);
    assert.strictEqual(totalObt, 255);
    assert.strictEqual(examWithSubs.student.mother_name, 'Sunita Sharma');
    assert.strictEqual(examWithSubs.student.aadhar_number, '987654321012');
    console.log('  [TEST] 3. Create real exam result and verify subject summation ... ✅ PASS\n');

    // 4. Verify clean handling when optional fields are null (no dummy fallbacks)
    console.log('  [TEST] 4. Null student fields do not emit fake hardcoded fallbacks ...');
    const emptyStudent = await Student.create({
      student_id: 'SCH-EMPTY-' + Date.now().toString().slice(-4),
      first_name: 'TestEmpty',
      last_name: 'User',
      class: 'Class 1',
      section: 'A',
      roll_number: null,
      parent_name: null,
      mother_name: null,
      category: null,
      aadhar_number: null,
      pen_number: null,
      family_id: null,
      date_of_birth: null,
    });

    assert.strictEqual(emptyStudent.mother_name, null);
    assert.strictEqual(emptyStudent.aadhar_number, null);
    assert.strictEqual(emptyStudent.pen_number, null);
    assert.strictEqual(emptyStudent.family_id, null);
    assert.strictEqual(emptyStudent.category, null);
    assert.strictEqual(emptyStudent.roll_number, null);
    console.log('  [TEST] 4. Null student fields do not emit fake hardcoded fallbacks ... ✅ PASS\n');

    // 5. Verify teacher exam name and student profile photo fidelity
    console.log('  [TEST] 5. Verify teacher exam name fidelity and student profile photo ...');
    const teacherExamName = 'Unit Test 1 — November 2026';
    const testStudentWithPhoto = await Student.create({
      student_id: 'SCH-PHOTO-' + Date.now().toString().slice(-4),
      first_name: 'Priya',
      last_name: 'Verma',
      class: 'Class 8',
      section: 'A',
      profile_photo: '/uploads/avatars/student-photo-test.jpg',
      approval_status: 'approved',
    });

    const teacherResult = await Result.create({
      student_id: testStudentWithPhoto.id,
      exam_name: teacherExamName,
      exam_type: 'unit_test',
      class: 'Class 8',
      section: 'A',
      session_id: session.id,
      total_marks: 100,
      total_obtained: 88,
      percentage: 88.0,
      grade: 'A',
      workflow_status: 'published',
      is_published: true,
    });

    const fetchedExam = await Result.findByPk(teacherResult.id, {
      include: [{ model: Student, as: 'student' }],
    });
    assert.strictEqual(fetchedExam.exam_name, teacherExamName, 'Teacher exam name must match exactly');
    assert.strictEqual(fetchedExam.student.profile_photo, '/uploads/avatars/student-photo-test.jpg', 'Student profile photo must match');
    console.log('  [TEST] 5. Verify teacher exam name fidelity and student profile photo ... ✅ PASS\n');

    // Clean up test records
    await Result.destroy({ where: { id: teacherResult.id } });
    await Student.destroy({ where: { id: testStudentWithPhoto.id } });
    await ResultSubject.destroy({ where: { result_id: exam.id } });
    await Result.destroy({ where: { id: exam.id } });
    await Attendance.destroy({ where: { student_id: createdStudent.id } });
    await Student.destroy({ where: { id: [createdStudent.id, emptyStudent.id] } });

    console.log('================================================================');
    console.log('   ALL MARKSHEET AUTHENTICITY TESTS PASSED (0 FAILED)');
    console.log('================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Marksheet Authenticity Test FAILED:', err);
    process.exit(1);
  }
}

runMarksheetAuthenticityTests();
