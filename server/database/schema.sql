-- CREATE DATABASE IF NOT EXISTS school_erp;
-- USE school_erp;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. SESSIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(20) NOT NULL UNIQUE,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  promotion_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexing for active/archived lookups
CREATE INDEX idx_sessions_active_archived ON sessions(is_active, is_archived);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. STUDENTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL UNIQUE,
  first_name VARCHAR(60) NOT NULL,
  last_name VARCHAR(60) NOT NULL,
  date_of_birth DATE,
  gender ENUM('Male','Female','Other'),
  class VARCHAR(20) NOT NULL,
  section VARCHAR(5) NOT NULL,
  roll_number INT,
  session_id INT,
  parent_name VARCHAR(100),
  parent_email VARCHAR(150),
  parent_phone VARCHAR(15),
  parent_address TEXT,
  parent_occupation VARCHAR(100),
  admission_date DATE DEFAULT (CURDATE()),
  is_active BOOLEAN DEFAULT TRUE,
  student_status ENUM('active','inactive','alumni','transferred','suspended') DEFAULT 'active',
  source ENUM('admin_created','admission_approved') DEFAULT 'admin_created',
  admission_request_id INT,
  created_by INT,
  approval_status ENUM('pending','approved','rejected') DEFAULT 'approved',
  approved_by INT,
  approved_at DATETIME,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Scale Optimization Indexes for Students (Fast Search & Class Rosters)
CREATE INDEX idx_students_class_section ON students(class, section);
CREATE INDEX idx_students_session_active ON students(session_id, is_active, approval_status);
CREATE INDEX idx_students_search_names ON students(first_name, last_name);
CREATE INDEX idx_students_parent_phone ON students(parent_phone);
CREATE INDEX idx_students_status ON students(student_status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TEACHERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(80) NOT NULL,
  phone VARCHAR(15),
  email VARCHAR(150),
  qualification VARCHAR(100),
  join_date DATE,
  status ENUM('active','leave','inactive') DEFAULT 'active',
  assigned_classes TEXT,
  document_type VARCHAR(50),
  document_number VARCHAR(100),
  staff_type VARCHAR(50) DEFAULT 'Teacher',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Scale Optimization Indexes for Teachers
CREATE INDEX idx_teachers_search ON teachers(name, subject);
CREATE INDEX idx_teachers_status ON teachers(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. USERS (Security & Password Invalidation Integration)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','admin2','teacher','student','parent','fee_collector') DEFAULT 'parent',
  linked_student_id INT,
  linked_teacher_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  phone VARCHAR(15),
  profile_photo VARCHAR(255),
  password_changed_at DATETIME NULL, -- Integrated missing codebase column
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (linked_student_id) REFERENCES students(id) ON DELETE SET NULL,
  FOREIGN KEY (linked_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

-- Scale Optimization Indexes for Users (Fast Auth, RBAC & Association checks)
CREATE INDEX idx_users_role_active ON users(role, is_active);
CREATE INDEX idx_users_linked_student ON users(linked_student_id);
CREATE INDEX idx_users_linked_teacher ON users(linked_teacher_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ATTENDANCE (Millions of rows scaling)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  class VARCHAR(20),
  section VARCHAR(5),
  date DATE NOT NULL,
  status ENUM('present','absent','holiday','late') NOT NULL,
  marked_by INT,
  session_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_student_date (student_id, date),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

-- Scale Optimization Indexes for Attendance sheets lookups
CREATE INDEX idx_attendance_date_class_section ON attendance(date, class, section);
CREATE INDEX idx_attendance_session ON attendance(session_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. FEES (High Transaction Volume Optimization)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE fees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  month VARCHAR(20) NOT NULL,
  year INT,
  fee_type ENUM('monthly','quarterly','annual','exam','admission','promotion','miscellaneous') DEFAULT 'monthly',
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0.00,
  due_date DATE,
  paid_date DATE,
  status ENUM('paid','unpaid','partial','waived','not_generated') DEFAULT 'unpaid',
  payment_mode ENUM('cash','online','cheque','dd','upi'),
  receipt_number VARCHAR(30) UNIQUE,
  collected_by INT,
  remarks TEXT,
  session_id INT,
  fee_breakdown JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (collected_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  UNIQUE KEY unique_student_monthly_fee (student_id, month, year, fee_type)
);

-- Scale Optimization Indexes for Fees & Financial Reports
CREATE INDEX idx_fees_status ON fees(status);
CREATE INDEX idx_fees_session ON fees(session_id);
CREATE INDEX idx_fees_month_year ON fees(month, year);
CREATE INDEX idx_fees_collected_by ON fees(collected_by);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. RESULTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  exam_name VARCHAR(80),
  exam_type ENUM('unit_test','half_yearly','annual','assessment','class_test'),
  class VARCHAR(20),
  section VARCHAR(5),
  session_id INT,
  total_marks INT,
  total_obtained INT,
  percentage DECIMAL(5,2),
  grade VARCHAR(5),
  rank INT,
  entered_by INT,
  workflow_status ENUM('draft','submitted','incharge_approved','admin2_approved','published','rejected') DEFAULT 'draft',
  incharge_reviewed_by INT,
  incharge_reviewed_at DATETIME,
  admin2_approved_by INT,
  admin2_approved_at DATETIME,
  admin_approved_by INT,
  admin_approved_at DATETIME,
  rejection_reason TEXT,
  workflow_notes TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  is_class_test BOOLEAN DEFAULT FALSE,
  sent_to_parents BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (entered_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (incharge_reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (admin2_approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (admin_approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Scale Optimization Indexes for Results Lookup and Rankings
CREATE INDEX idx_results_student ON results(student_id);
CREATE INDEX idx_results_class_section ON results(class, section);
CREATE INDEX idx_results_workflow ON results(workflow_status, is_published);
CREATE INDEX idx_results_session ON results(session_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. RESULT SUBJECTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE result_subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  result_id INT NOT NULL,
  subject VARCHAR(80) NOT NULL,
  max_marks INT,
  obtained_marks INT,
  grade VARCHAR(5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (result_id) REFERENCES results(id) ON DELETE CASCADE
);

-- Scale Optimization Index for Subject Analytics
CREATE INDEX idx_result_subjects_lookup ON result_subjects(result_id, subject);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. NOTIFICATIONS & ALERTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('fee_reminder','attendance_alert','result','general','holiday','admission','promotion') DEFAULT 'general',
  sent_by INT,
  recipient_type ENUM('all','role','individual') DEFAULT 'all',
  recipient_role ENUM('all','parents','teachers','fee_collector','admin2'),
  recipient_user_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Scale Optimization Index for Instant Inbox notifications load
CREATE INDEX idx_notifications_recipients ON notifications(recipient_type, recipient_role, recipient_user_id, is_active);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. NOTIFICATION READS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE notification_reads (
  notification_id INT NOT NULL,
  user_id INT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notification_id, user_id),
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. TIMETABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE timetable (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class VARCHAR(20) NOT NULL,
  section VARCHAR(5) NOT NULL,
  day ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
  period_number INT NOT NULL,
  start_time TIME,
  end_time TIME,
  subject VARCHAR(80),
  teacher_id INT,
  session_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

-- Timetable class schedules indexes
CREATE INDEX idx_timetable_schedule ON timetable(class, section, day);
CREATE INDEX idx_timetable_teacher ON timetable(teacher_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. PROMOTION HISTORY LOG
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE promotion_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  from_class VARCHAR(20),
  to_class VARCHAR(20),
  from_session VARCHAR(20),
  to_session VARCHAR(20),
  promoted_by INT,
  promoted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (promoted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexing for History Audit tracking
CREATE INDEX idx_promotion_student ON promotion_history(student_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. ADMISSION REQUESTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE admission_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(60) NOT NULL,
  last_name VARCHAR(60) NOT NULL,
  date_of_birth DATE,
  gender ENUM('Male','Female','Other'),
  applying_class VARCHAR(20) NOT NULL,
  parent_name VARCHAR(100) NOT NULL,
  parent_phone VARCHAR(15) NOT NULL,
  parent_email VARCHAR(150),
  parent_address TEXT,
  previous_school VARCHAR(150),
  status ENUM('pending','under_review','approved','rejected') DEFAULT 'pending',
  submitted_by INT,
  reviewed_by INT,
  review_notes TEXT,
  approved_at DATETIME,
  student_id_created INT,
  admission_fee_paid DECIMAL(10,2) DEFAULT 0.00,
  documents_submitted JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Admission status dashboard search indexes
CREATE INDEX idx_admission_status ON admission_requests(status);
CREATE INDEX idx_admission_parent_phone ON admission_requests(parent_phone);

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. TEACHER ATTENDANCE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE teacher_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('present','absent','half_day','leave','holiday') NOT NULL,
  marked_by INT,
  remarks VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_teacher_date (teacher_id, date),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Teacher rosters dates indexes
CREATE INDEX idx_teacher_attendance_date ON teacher_attendance(date);

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. CLASS INCHARGES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE class_incharges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  class VARCHAR(20) NOT NULL,
  section VARCHAR(5) NOT NULL,
  session_id INT,
  assigned_by INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_class_section_session (class, section, session_id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 16. CLASS FEE STRUCTURES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE class_fee_structures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class VARCHAR(20) NOT NULL UNIQUE,
  monthly_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  admission_fee DECIMAL(10,2) DEFAULT 0.00,
  annual_fee DECIMAL(10,2) DEFAULT 0.00,
  promotion_fee DECIMAL(10,2) DEFAULT 0.00,
  exam_fee DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 17. AUDIT LOGS (Immutable Security Audit Logging Integration)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Audit query logs optimization indexing
CREATE INDEX idx_audit_user_action ON audit_logs(user_id, action);
CREATE INDEX idx_audit_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_time ON audit_logs(created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 18. PUSH SUBSCRIPTIONS (Web Push Notifications Integration)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh VARCHAR(255) NOT NULL,
  auth VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_push_user ON push_subscriptions(user_id);


CREATE TABLE IF NOT EXISTS staff_leaves (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  leave_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  admin_remarks TEXT,
  total_days DECIMAL(5,1),
  attachment_url VARCHAR(255),
  approved_by INT,
  action_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

