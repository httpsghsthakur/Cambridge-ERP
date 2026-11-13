const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const bcrypt = require('bcryptjs');
const {
  sequelize, User, Student, Teacher,
  Session, Fee, Notification, ClassFeeStructure
} = require('./models');

async function seed() {
  // Ensure models are synced without dropping tables created by schema.sql
  await sequelize.sync();
  console.log('✅ Tables created');

  // ── Session ──────────────────────────────────────────────────────────────
  const session = await Session.create({
    name: '2024-2025',
    start_date: '2024-06-01',
    end_date: '2025-05-31',
    is_active: true
  });

  // ── Teachers ─────────────────────────────────────────────────────────────
  const teachers = await Teacher.bulkCreate([
    { teacher_id: 'TCH001', name: 'Mrs. Sunita Verma',  subject: 'Mathematics',    phone: '9901234567', status: 'active', assigned_classes: '8th,9th,10th' },
    { teacher_id: 'TCH002', name: 'Mr. Rakesh Joshi',   subject: 'Science',        phone: '9912345678', status: 'active', assigned_classes: '7th,8th,9th' },
    { teacher_id: 'TCH003', name: 'Ms. Anjali Dubey',   subject: 'English',        phone: '9923456789', status: 'active', assigned_classes: '8th,9th,10th' },
    { teacher_id: 'TCH004', name: 'Mr. Pankaj Tiwari',  subject: 'Social Studies', phone: '9934567890', status: 'active', assigned_classes: '7th,8th' },
    { teacher_id: 'TCH005', name: 'Mrs. Lata Mishra',   subject: 'Hindi',          phone: '9945678901', status: 'leave',  assigned_classes: '9th,10th' },
  ]);

  // ── Class Fee Structures ──────────────────────────────────────────────────
  await ClassFeeStructure.bulkCreate([
    { class: 'Playgroup', monthly_fee: 1200, admission_fee: 2500, annual_fee: 600,  promotion_fee: 0,   exam_fee: 100 },
    { class: 'Nursery',   monthly_fee: 1200, admission_fee: 2500, annual_fee: 600,  promotion_fee: 200, exam_fee: 100 },
    { class: 'LKG',       monthly_fee: 1400, admission_fee: 3000, annual_fee: 700,  promotion_fee: 250, exam_fee: 150 },
    { class: 'UKG',       monthly_fee: 1400, admission_fee: 3000, annual_fee: 700,  promotion_fee: 250, exam_fee: 150 },
    { class: 'day care',  monthly_fee: 1500, admission_fee: 3000, annual_fee: 800,  promotion_fee: 300, exam_fee: 200 },
    { class: '1st',       monthly_fee: 1500, admission_fee: 3000, annual_fee: 800,  promotion_fee: 300, exam_fee: 200 },
    { class: '2nd',       monthly_fee: 1500, admission_fee: 3000, annual_fee: 800,  promotion_fee: 300, exam_fee: 200 },
    { class: '3rd',       monthly_fee: 1800, admission_fee: 3500, annual_fee: 900,  promotion_fee: 350, exam_fee: 250 },
    { class: '4th',       monthly_fee: 1800, admission_fee: 3500, annual_fee: 900,  promotion_fee: 350, exam_fee: 250 },
    { class: '5th',       monthly_fee: 1800, admission_fee: 3500, annual_fee: 900,  promotion_fee: 350, exam_fee: 250 },
    { class: '6th',       monthly_fee: 2000, admission_fee: 4000, annual_fee: 1000, promotion_fee: 400, exam_fee: 300 },
    { class: '7th',       monthly_fee: 2200, admission_fee: 4000, annual_fee: 1000, promotion_fee: 400, exam_fee: 300 },
    { class: '8th',       monthly_fee: 2500, admission_fee: 4500, annual_fee: 1200, promotion_fee: 500, exam_fee: 350 },
    { class: '9th',       monthly_fee: 2800, admission_fee: 5000, annual_fee: 1200, promotion_fee: 500, exam_fee: 400 },
    { class: '10th',      monthly_fee: 3000, admission_fee: 5000, annual_fee: 1500, promotion_fee: 600, exam_fee: 500 },
  ], { ignoreDuplicates: true });

  console.log('✅ Fee structures seeded');

  // ── Students ─────────────────────────────────────────────────────────────
  const students = await Student.bulkCreate([
    { student_id: 'STU001', first_name: 'Aanya',  last_name: 'Sharma', class: '8th',  section: 'A', roll_number: 1, session_id: session.id, gender: 'Female', parent_name: 'Rajesh Sharma',  parent_phone: '9812345678', parent_email: 'rajesh@example.com' },
    { student_id: 'STU002', first_name: 'Ravi',   last_name: 'Kumar',  class: '8th',  section: 'A', roll_number: 2, session_id: session.id, gender: 'Male',   parent_name: 'Suresh Kumar',   parent_phone: '9823456789', parent_email: 'suresh@example.com' },
    { student_id: 'STU003', first_name: 'Priya',  last_name: 'Singh',  class: '9th',  section: 'B', roll_number: 1, session_id: session.id, gender: 'Female', parent_name: 'Mohan Singh',    parent_phone: '9834567890', parent_email: 'mohan@example.com' },
    { student_id: 'STU004', first_name: 'Arjun',  last_name: 'Patel',  class: '9th',  section: 'A', roll_number: 3, session_id: session.id, gender: 'Male',   parent_name: 'Dinesh Patel',   parent_phone: '9845678901', parent_email: 'dinesh@example.com' },
    { student_id: 'STU005', first_name: 'Meera',  last_name: 'Rao',    class: '10th', section: 'A', roll_number: 2, session_id: session.id, gender: 'Female', parent_name: 'Venkat Rao',     parent_phone: '9856789012', parent_email: 'venkat@example.com' },
    { student_id: 'STU006', first_name: 'Kabir',  last_name: 'Mehta',  class: '7th',  section: 'B', roll_number: 4, session_id: session.id, gender: 'Male',   parent_name: 'Amit Mehta',     parent_phone: '9867890123', parent_email: 'amit@example.com' },
    { student_id: 'STU007', first_name: 'Zara',   last_name: 'Khan',   class: '10th', section: 'B', roll_number: 1, session_id: session.id, gender: 'Female', parent_name: 'Farrukh Khan',   parent_phone: '9878901234', parent_email: 'farrukh@example.com' },
    { student_id: 'STU008', first_name: 'Dev',    last_name: 'Gupta',  class: '8th',  section: 'B', roll_number: 5, session_id: session.id, gender: 'Male',   parent_name: 'Vinod Gupta',    parent_phone: '9889012345', parent_email: 'vinod@example.com' },
  ]);

  // ── Users ─────────────────────────────────────────────────────────────────
  const seedPassword = process.env.SEED_PASSWORD || 'Admin@123';
  const pass = await bcrypt.hash(seedPassword, 12);
  await User.bulkCreate([
    { name: 'Admin User',    email: 'admin@school.com',   password: pass, role: 'admin' },
    { name: 'Sunita Verma',  email: 'teacher@school.com', password: pass, role: 'teacher',       linked_teacher_id: teachers[0].id },
    { name: 'Rajesh Sharma', email: 'parent@school.com',  password: pass, role: 'parent',        linked_student_id: students[0].id },
    { name: 'Fee Collector', email: 'fees@school.com',    password: pass, role: 'fee_collector' },
    { name: 'Admin2 User',   email: 'admin2@school.com',  password: pass, role: 'admin2' },
    { name: 'Fee Collector', email: 'fc@school.com',      password: pass, role: 'fee_collector' },
  ]);

  console.log('✅ Users seeded');

  // ── Fee records ───────────────────────────────────────────────────────────
  const feeAmt = { '7th': 2200, '8th': 2500, '9th': 2800, '10th': 3000 };
  await Fee.bulkCreate(students.map((s, i) => ({
    student_id:   s.id,
    month:        'April',
    year:         2025,
    fee_type:     'monthly',
    total_amount: feeAmt[s.class] || 2500,
    paid_amount:  [0, 2, 4, 6].includes(i) ? (feeAmt[s.class] || 2500) : i === 3 ? 1400 : 0,
    status:       [0, 2, 4, 6].includes(i) ? 'paid' : i === 3 ? 'partial' : 'unpaid',
    session_id:   session.id
  })));

  console.log('✅ Fees records seeded');

  // ── Notifications ─────────────────────────────────────────────────────────
  await Notification.bulkCreate([
    { title: 'Fee Reminder',    message: 'April fees are due. Please pay before the 10th.',  type: 'fee_reminder',      recipient_role: 'parents',  sent_by: 1 },
    { title: 'Exam Schedule',   message: 'Half-yearly exams start May 15, 2025.',             type: 'result',            recipient_role: 'all',      sent_by: 1 },
    { title: 'Holiday Notice',  message: 'School closed on May 1st (Labour Day).',            type: 'holiday',           recipient_role: 'all',      sent_by: 1 },
    { title: 'PTM Scheduled',   message: 'Parent-Teacher Meeting on April 26, 9am–1pm.',     type: 'general',           recipient_role: 'parents',  sent_by: 1 },
    { title: 'Low Attendance',  message: 'Some students have attendance below 75%.',          type: 'attendance_alert',  recipient_role: 'parents',  sent_by: 1 },
  ]);

  console.log('\n✅ Seed complete!');
  console.log('─────────────────────────────────');
  console.log('Login credentials:');
  console.log(`Default password is: ${seedPassword}`);
  console.log('─────────────────────────────────');
  process.exit(0);
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
