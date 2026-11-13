-- SQL Script to insert students and users
-- Generated dynamically for Hostinger MySQL

-- 1. Get the current active session
SET @session_id = COALESCE(
  (SELECT id FROM sessions WHERE is_active = TRUE LIMIT 1),
  (SELECT id FROM sessions ORDER BY id DESC LIMIT 1),
  1
);

-- ==========================================
-- CLASS: Playgroup
-- ==========================================

-- Section A
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_PLAYGROUP_A_1', 'Playgroup-Student', 'A1', 'Playgroup', 'A', 1, @session_id, 'Male', 'Parent of Playgroup-Student A1', '9999999999', 'parent_playgroupstudentA1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Playgroup-Student A1', 'playgroupstudentA1@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_PLAYGROUP_A_2', 'Playgroup-Student', 'A2', 'Playgroup', 'A', 2, @session_id, 'Male', 'Parent of Playgroup-Student A2', '9999999999', 'parent_playgroupstudentA2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Playgroup-Student A2', 'playgroupstudentA2@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_PLAYGROUP_A_3', 'Playgroup-Student', 'A3', 'Playgroup', 'A', 3, @session_id, 'Male', 'Parent of Playgroup-Student A3', '9999999999', 'parent_playgroupstudentA3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Playgroup-Student A3', 'playgroupstudentA3@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_PLAYGROUP_A_4', 'Playgroup-Student', 'A4', 'Playgroup', 'A', 4, @session_id, 'Male', 'Parent of Playgroup-Student A4', '9999999999', 'parent_playgroupstudentA4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Playgroup-Student A4', 'playgroupstudentA4@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_PLAYGROUP_A_5', 'Playgroup-Student', 'A5', 'Playgroup', 'A', 5, @session_id, 'Male', 'Parent of Playgroup-Student A5', '9999999999', 'parent_playgroupstudentA5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Playgroup-Student A5', 'playgroupstudentA5@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_PLAYGROUP_A_6', 'Playgroup-Student', 'A6', 'Playgroup', 'A', 6, @session_id, 'Male', 'Parent of Playgroup-Student A6', '9999999999', 'parent_playgroupstudentA6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Playgroup-Student A6', 'playgroupstudentA6@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_PLAYGROUP_A_7', 'Playgroup-Student', 'A7', 'Playgroup', 'A', 7, @session_id, 'Male', 'Parent of Playgroup-Student A7', '9999999999', 'parent_playgroupstudentA7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Playgroup-Student A7', 'playgroupstudentA7@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_PLAYGROUP_A_8', 'Playgroup-Student', 'A8', 'Playgroup', 'A', 8, @session_id, 'Male', 'Parent of Playgroup-Student A8', '9999999999', 'parent_playgroupstudentA8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Playgroup-Student A8', 'playgroupstudentA8@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_PLAYGROUP_A_9', 'Playgroup-Student', 'A9', 'Playgroup', 'A', 9, @session_id, 'Male', 'Parent of Playgroup-Student A9', '9999999999', 'parent_playgroupstudentA9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Playgroup-Student A9', 'playgroupstudentA9@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_PLAYGROUP_A_10', 'Playgroup-Student', 'A10', 'Playgroup', 'A', 10, @session_id, 'Male', 'Parent of Playgroup-Student A10', '9999999999', 'parent_playgroupstudentA10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Playgroup-Student A10', 'playgroupstudentA10@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- Section B
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_PLAYGROUP_B_1', 'Playgroup-student', 'B1', 'Playgroup', 'B', 1, @session_id, 'Female', 'Parent of Playgroup-studentB1', '9999999999', 'parent_playgroupstudentB1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Playgroup-studentB1', 'playgroupstudentB1@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_PLAYGROUP_B_2', 'Playgroup-student', 'B2', 'Playgroup', 'B', 2, @session_id, 'Female', 'Parent of Playgroup-studentB2', '9999999999', 'parent_playgroupstudentB2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Playgroup-studentB2', 'playgroupstudentB2@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_PLAYGROUP_B_3', 'Playgroup-student', 'B3', 'Playgroup', 'B', 3, @session_id, 'Female', 'Parent of Playgroup-studentB3', '9999999999', 'parent_playgroupstudentB3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Playgroup-studentB3', 'playgroupstudentB3@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_PLAYGROUP_B_4', 'Playgroup-student', 'B4', 'Playgroup', 'B', 4, @session_id, 'Female', 'Parent of Playgroup-studentB4', '9999999999', 'parent_playgroupstudentB4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Playgroup-studentB4', 'playgroupstudentB4@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_PLAYGROUP_B_5', 'Playgroup-student', 'B5', 'Playgroup', 'B', 5, @session_id, 'Female', 'Parent of Playgroup-studentB5', '9999999999', 'parent_playgroupstudentB5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Playgroup-studentB5', 'playgroupstudentB5@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_PLAYGROUP_B_6', 'Playgroup-student', 'B6', 'Playgroup', 'B', 6, @session_id, 'Female', 'Parent of Playgroup-studentB6', '9999999999', 'parent_playgroupstudentB6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Playgroup-studentB6', 'playgroupstudentB6@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_PLAYGROUP_B_7', 'Playgroup-student', 'B7', 'Playgroup', 'B', 7, @session_id, 'Female', 'Parent of Playgroup-studentB7', '9999999999', 'parent_playgroupstudentB7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Playgroup-studentB7', 'playgroupstudentB7@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_PLAYGROUP_B_8', 'Playgroup-student', 'B8', 'Playgroup', 'B', 8, @session_id, 'Female', 'Parent of Playgroup-studentB8', '9999999999', 'parent_playgroupstudentB8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Playgroup-studentB8', 'playgroupstudentB8@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_PLAYGROUP_B_9', 'Playgroup-student', 'B9', 'Playgroup', 'B', 9, @session_id, 'Female', 'Parent of Playgroup-studentB9', '9999999999', 'parent_playgroupstudentB9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Playgroup-studentB9', 'playgroupstudentB9@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_PLAYGROUP_B_10', 'Playgroup-student', 'B10', 'Playgroup', 'B', 10, @session_id, 'Female', 'Parent of Playgroup-studentB10', '9999999999', 'parent_playgroupstudentB10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Playgroup-studentB10', 'playgroupstudentB10@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- ==========================================
-- CLASS: Nursery
-- ==========================================

-- Section A
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_NURSERY_A_1', 'Nursery-Student', 'A1', 'Nursery', 'A', 1, @session_id, 'Male', 'Parent of Nursery-Student A1', '9999999999', 'parent_nurserystudentA1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Nursery-Student A1', 'nurserystudentA1@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_NURSERY_A_2', 'Nursery-Student', 'A2', 'Nursery', 'A', 2, @session_id, 'Male', 'Parent of Nursery-Student A2', '9999999999', 'parent_nurserystudentA2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Nursery-Student A2', 'nurserystudentA2@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_NURSERY_A_3', 'Nursery-Student', 'A3', 'Nursery', 'A', 3, @session_id, 'Male', 'Parent of Nursery-Student A3', '9999999999', 'parent_nurserystudentA3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Nursery-Student A3', 'nurserystudentA3@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_NURSERY_A_4', 'Nursery-Student', 'A4', 'Nursery', 'A', 4, @session_id, 'Male', 'Parent of Nursery-Student A4', '9999999999', 'parent_nurserystudentA4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Nursery-Student A4', 'nurserystudentA4@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_NURSERY_A_5', 'Nursery-Student', 'A5', 'Nursery', 'A', 5, @session_id, 'Male', 'Parent of Nursery-Student A5', '9999999999', 'parent_nurserystudentA5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Nursery-Student A5', 'nurserystudentA5@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_NURSERY_A_6', 'Nursery-Student', 'A6', 'Nursery', 'A', 6, @session_id, 'Male', 'Parent of Nursery-Student A6', '9999999999', 'parent_nurserystudentA6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Nursery-Student A6', 'nurserystudentA6@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_NURSERY_A_7', 'Nursery-Student', 'A7', 'Nursery', 'A', 7, @session_id, 'Male', 'Parent of Nursery-Student A7', '9999999999', 'parent_nurserystudentA7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Nursery-Student A7', 'nurserystudentA7@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_NURSERY_A_8', 'Nursery-Student', 'A8', 'Nursery', 'A', 8, @session_id, 'Male', 'Parent of Nursery-Student A8', '9999999999', 'parent_nurserystudentA8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Nursery-Student A8', 'nurserystudentA8@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_NURSERY_A_9', 'Nursery-Student', 'A9', 'Nursery', 'A', 9, @session_id, 'Male', 'Parent of Nursery-Student A9', '9999999999', 'parent_nurserystudentA9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Nursery-Student A9', 'nurserystudentA9@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_NURSERY_A_10', 'Nursery-Student', 'A10', 'Nursery', 'A', 10, @session_id, 'Male', 'Parent of Nursery-Student A10', '9999999999', 'parent_nurserystudentA10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Nursery-Student A10', 'nurserystudentA10@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- Section B
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_NURSERY_B_1', 'Nursery-student', 'B1', 'Nursery', 'B', 1, @session_id, 'Female', 'Parent of Nursery-studentB1', '9999999999', 'parent_nurserystudentB1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Nursery-studentB1', 'nurserystudentB1@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_NURSERY_B_2', 'Nursery-student', 'B2', 'Nursery', 'B', 2, @session_id, 'Female', 'Parent of Nursery-studentB2', '9999999999', 'parent_nurserystudentB2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Nursery-studentB2', 'nurserystudentB2@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_NURSERY_B_3', 'Nursery-student', 'B3', 'Nursery', 'B', 3, @session_id, 'Female', 'Parent of Nursery-studentB3', '9999999999', 'parent_nurserystudentB3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Nursery-studentB3', 'nurserystudentB3@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_NURSERY_B_4', 'Nursery-student', 'B4', 'Nursery', 'B', 4, @session_id, 'Female', 'Parent of Nursery-studentB4', '9999999999', 'parent_nurserystudentB4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Nursery-studentB4', 'nurserystudentB4@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_NURSERY_B_5', 'Nursery-student', 'B5', 'Nursery', 'B', 5, @session_id, 'Female', 'Parent of Nursery-studentB5', '9999999999', 'parent_nurserystudentB5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Nursery-studentB5', 'nurserystudentB5@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_NURSERY_B_6', 'Nursery-student', 'B6', 'Nursery', 'B', 6, @session_id, 'Female', 'Parent of Nursery-studentB6', '9999999999', 'parent_nurserystudentB6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Nursery-studentB6', 'nurserystudentB6@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_NURSERY_B_7', 'Nursery-student', 'B7', 'Nursery', 'B', 7, @session_id, 'Female', 'Parent of Nursery-studentB7', '9999999999', 'parent_nurserystudentB7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Nursery-studentB7', 'nurserystudentB7@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_NURSERY_B_8', 'Nursery-student', 'B8', 'Nursery', 'B', 8, @session_id, 'Female', 'Parent of Nursery-studentB8', '9999999999', 'parent_nurserystudentB8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Nursery-studentB8', 'nurserystudentB8@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_NURSERY_B_9', 'Nursery-student', 'B9', 'Nursery', 'B', 9, @session_id, 'Female', 'Parent of Nursery-studentB9', '9999999999', 'parent_nurserystudentB9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Nursery-studentB9', 'nurserystudentB9@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_NURSERY_B_10', 'Nursery-student', 'B10', 'Nursery', 'B', 10, @session_id, 'Female', 'Parent of Nursery-studentB10', '9999999999', 'parent_nurserystudentB10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('Nursery-studentB10', 'nurserystudentB10@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- ==========================================
-- CLASS: LKG
-- ==========================================

-- Section A
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_LKG_A_1', 'LKG-Student', 'A1', 'LKG', 'A', 1, @session_id, 'Male', 'Parent of LKG-Student A1', '9999999999', 'parent_lkgstudentA1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('LKG-Student A1', 'lkgstudentA1@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_LKG_A_2', 'LKG-Student', 'A2', 'LKG', 'A', 2, @session_id, 'Male', 'Parent of LKG-Student A2', '9999999999', 'parent_lkgstudentA2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('LKG-Student A2', 'lkgstudentA2@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_LKG_A_3', 'LKG-Student', 'A3', 'LKG', 'A', 3, @session_id, 'Male', 'Parent of LKG-Student A3', '9999999999', 'parent_lkgstudentA3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('LKG-Student A3', 'lkgstudentA3@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_LKG_A_4', 'LKG-Student', 'A4', 'LKG', 'A', 4, @session_id, 'Male', 'Parent of LKG-Student A4', '9999999999', 'parent_lkgstudentA4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('LKG-Student A4', 'lkgstudentA4@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_LKG_A_5', 'LKG-Student', 'A5', 'LKG', 'A', 5, @session_id, 'Male', 'Parent of LKG-Student A5', '9999999999', 'parent_lkgstudentA5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('LKG-Student A5', 'lkgstudentA5@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_LKG_A_6', 'LKG-Student', 'A6', 'LKG', 'A', 6, @session_id, 'Male', 'Parent of LKG-Student A6', '9999999999', 'parent_lkgstudentA6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('LKG-Student A6', 'lkgstudentA6@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_LKG_A_7', 'LKG-Student', 'A7', 'LKG', 'A', 7, @session_id, 'Male', 'Parent of LKG-Student A7', '9999999999', 'parent_lkgstudentA7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('LKG-Student A7', 'lkgstudentA7@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_LKG_A_8', 'LKG-Student', 'A8', 'LKG', 'A', 8, @session_id, 'Male', 'Parent of LKG-Student A8', '9999999999', 'parent_lkgstudentA8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('LKG-Student A8', 'lkgstudentA8@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_LKG_A_9', 'LKG-Student', 'A9', 'LKG', 'A', 9, @session_id, 'Male', 'Parent of LKG-Student A9', '9999999999', 'parent_lkgstudentA9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('LKG-Student A9', 'lkgstudentA9@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_LKG_A_10', 'LKG-Student', 'A10', 'LKG', 'A', 10, @session_id, 'Male', 'Parent of LKG-Student A10', '9999999999', 'parent_lkgstudentA10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('LKG-Student A10', 'lkgstudentA10@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- Section B
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_LKG_B_1', 'LKG-student', 'B1', 'LKG', 'B', 1, @session_id, 'Female', 'Parent of LKG-studentB1', '9999999999', 'parent_lkgstudentB1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('LKG-studentB1', 'lkgstudentB1@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_LKG_B_2', 'LKG-student', 'B2', 'LKG', 'B', 2, @session_id, 'Female', 'Parent of LKG-studentB2', '9999999999', 'parent_lkgstudentB2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('LKG-studentB2', 'lkgstudentB2@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_LKG_B_3', 'LKG-student', 'B3', 'LKG', 'B', 3, @session_id, 'Female', 'Parent of LKG-studentB3', '9999999999', 'parent_lkgstudentB3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('LKG-studentB3', 'lkgstudentB3@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_LKG_B_4', 'LKG-student', 'B4', 'LKG', 'B', 4, @session_id, 'Female', 'Parent of LKG-studentB4', '9999999999', 'parent_lkgstudentB4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('LKG-studentB4', 'lkgstudentB4@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_LKG_B_5', 'LKG-student', 'B5', 'LKG', 'B', 5, @session_id, 'Female', 'Parent of LKG-studentB5', '9999999999', 'parent_lkgstudentB5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('LKG-studentB5', 'lkgstudentB5@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_LKG_B_6', 'LKG-student', 'B6', 'LKG', 'B', 6, @session_id, 'Female', 'Parent of LKG-studentB6', '9999999999', 'parent_lkgstudentB6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('LKG-studentB6', 'lkgstudentB6@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_LKG_B_7', 'LKG-student', 'B7', 'LKG', 'B', 7, @session_id, 'Female', 'Parent of LKG-studentB7', '9999999999', 'parent_lkgstudentB7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('LKG-studentB7', 'lkgstudentB7@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_LKG_B_8', 'LKG-student', 'B8', 'LKG', 'B', 8, @session_id, 'Female', 'Parent of LKG-studentB8', '9999999999', 'parent_lkgstudentB8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('LKG-studentB8', 'lkgstudentB8@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_LKG_B_9', 'LKG-student', 'B9', 'LKG', 'B', 9, @session_id, 'Female', 'Parent of LKG-studentB9', '9999999999', 'parent_lkgstudentB9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('LKG-studentB9', 'lkgstudentB9@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_LKG_B_10', 'LKG-student', 'B10', 'LKG', 'B', 10, @session_id, 'Female', 'Parent of LKG-studentB10', '9999999999', 'parent_lkgstudentB10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('LKG-studentB10', 'lkgstudentB10@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- ==========================================
-- CLASS: UKG
-- ==========================================

-- Section A
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_UKG_A_1', 'UKG-Student', 'A1', 'UKG', 'A', 1, @session_id, 'Male', 'Parent of UKG-Student A1', '9999999999', 'parent_ukgstudentA1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('UKG-Student A1', 'ukgstudentA1@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_UKG_A_2', 'UKG-Student', 'A2', 'UKG', 'A', 2, @session_id, 'Male', 'Parent of UKG-Student A2', '9999999999', 'parent_ukgstudentA2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('UKG-Student A2', 'ukgstudentA2@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_UKG_A_3', 'UKG-Student', 'A3', 'UKG', 'A', 3, @session_id, 'Male', 'Parent of UKG-Student A3', '9999999999', 'parent_ukgstudentA3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('UKG-Student A3', 'ukgstudentA3@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_UKG_A_4', 'UKG-Student', 'A4', 'UKG', 'A', 4, @session_id, 'Male', 'Parent of UKG-Student A4', '9999999999', 'parent_ukgstudentA4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('UKG-Student A4', 'ukgstudentA4@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_UKG_A_5', 'UKG-Student', 'A5', 'UKG', 'A', 5, @session_id, 'Male', 'Parent of UKG-Student A5', '9999999999', 'parent_ukgstudentA5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('UKG-Student A5', 'ukgstudentA5@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_UKG_A_6', 'UKG-Student', 'A6', 'UKG', 'A', 6, @session_id, 'Male', 'Parent of UKG-Student A6', '9999999999', 'parent_ukgstudentA6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('UKG-Student A6', 'ukgstudentA6@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_UKG_A_7', 'UKG-Student', 'A7', 'UKG', 'A', 7, @session_id, 'Male', 'Parent of UKG-Student A7', '9999999999', 'parent_ukgstudentA7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('UKG-Student A7', 'ukgstudentA7@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_UKG_A_8', 'UKG-Student', 'A8', 'UKG', 'A', 8, @session_id, 'Male', 'Parent of UKG-Student A8', '9999999999', 'parent_ukgstudentA8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('UKG-Student A8', 'ukgstudentA8@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_UKG_A_9', 'UKG-Student', 'A9', 'UKG', 'A', 9, @session_id, 'Male', 'Parent of UKG-Student A9', '9999999999', 'parent_ukgstudentA9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('UKG-Student A9', 'ukgstudentA9@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_UKG_A_10', 'UKG-Student', 'A10', 'UKG', 'A', 10, @session_id, 'Male', 'Parent of UKG-Student A10', '9999999999', 'parent_ukgstudentA10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('UKG-Student A10', 'ukgstudentA10@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- Section B
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_UKG_B_1', 'UKG-student', 'B1', 'UKG', 'B', 1, @session_id, 'Female', 'Parent of UKG-studentB1', '9999999999', 'parent_ukgstudentB1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('UKG-studentB1', 'ukgstudentB1@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_UKG_B_2', 'UKG-student', 'B2', 'UKG', 'B', 2, @session_id, 'Female', 'Parent of UKG-studentB2', '9999999999', 'parent_ukgstudentB2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('UKG-studentB2', 'ukgstudentB2@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_UKG_B_3', 'UKG-student', 'B3', 'UKG', 'B', 3, @session_id, 'Female', 'Parent of UKG-studentB3', '9999999999', 'parent_ukgstudentB3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('UKG-studentB3', 'ukgstudentB3@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_UKG_B_4', 'UKG-student', 'B4', 'UKG', 'B', 4, @session_id, 'Female', 'Parent of UKG-studentB4', '9999999999', 'parent_ukgstudentB4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('UKG-studentB4', 'ukgstudentB4@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_UKG_B_5', 'UKG-student', 'B5', 'UKG', 'B', 5, @session_id, 'Female', 'Parent of UKG-studentB5', '9999999999', 'parent_ukgstudentB5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('UKG-studentB5', 'ukgstudentB5@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_UKG_B_6', 'UKG-student', 'B6', 'UKG', 'B', 6, @session_id, 'Female', 'Parent of UKG-studentB6', '9999999999', 'parent_ukgstudentB6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('UKG-studentB6', 'ukgstudentB6@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_UKG_B_7', 'UKG-student', 'B7', 'UKG', 'B', 7, @session_id, 'Female', 'Parent of UKG-studentB7', '9999999999', 'parent_ukgstudentB7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('UKG-studentB7', 'ukgstudentB7@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_UKG_B_8', 'UKG-student', 'B8', 'UKG', 'B', 8, @session_id, 'Female', 'Parent of UKG-studentB8', '9999999999', 'parent_ukgstudentB8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('UKG-studentB8', 'ukgstudentB8@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_UKG_B_9', 'UKG-student', 'B9', 'UKG', 'B', 9, @session_id, 'Female', 'Parent of UKG-studentB9', '9999999999', 'parent_ukgstudentB9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('UKG-studentB9', 'ukgstudentB9@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_UKG_B_10', 'UKG-student', 'B10', 'UKG', 'B', 10, @session_id, 'Female', 'Parent of UKG-studentB10', '9999999999', 'parent_ukgstudentB10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('UKG-studentB10', 'ukgstudentB10@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- ==========================================
-- CLASS: day care
-- ==========================================

-- Section A
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_DAYCARE_A_1', 'day care-Student', 'A1', 'day care', 'A', 1, @session_id, 'Male', 'Parent of day care-Student A1', '9999999999', 'parent_daycarestudentA1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('day care-Student A1', 'daycarestudentA1@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_DAYCARE_A_2', 'day care-Student', 'A2', 'day care', 'A', 2, @session_id, 'Male', 'Parent of day care-Student A2', '9999999999', 'parent_daycarestudentA2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('day care-Student A2', 'daycarestudentA2@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_DAYCARE_A_3', 'day care-Student', 'A3', 'day care', 'A', 3, @session_id, 'Male', 'Parent of day care-Student A3', '9999999999', 'parent_daycarestudentA3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('day care-Student A3', 'daycarestudentA3@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_DAYCARE_A_4', 'day care-Student', 'A4', 'day care', 'A', 4, @session_id, 'Male', 'Parent of day care-Student A4', '9999999999', 'parent_daycarestudentA4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('day care-Student A4', 'daycarestudentA4@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_DAYCARE_A_5', 'day care-Student', 'A5', 'day care', 'A', 5, @session_id, 'Male', 'Parent of day care-Student A5', '9999999999', 'parent_daycarestudentA5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('day care-Student A5', 'daycarestudentA5@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_DAYCARE_A_6', 'day care-Student', 'A6', 'day care', 'A', 6, @session_id, 'Male', 'Parent of day care-Student A6', '9999999999', 'parent_daycarestudentA6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('day care-Student A6', 'daycarestudentA6@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_DAYCARE_A_7', 'day care-Student', 'A7', 'day care', 'A', 7, @session_id, 'Male', 'Parent of day care-Student A7', '9999999999', 'parent_daycarestudentA7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('day care-Student A7', 'daycarestudentA7@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_DAYCARE_A_8', 'day care-Student', 'A8', 'day care', 'A', 8, @session_id, 'Male', 'Parent of day care-Student A8', '9999999999', 'parent_daycarestudentA8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('day care-Student A8', 'daycarestudentA8@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_DAYCARE_A_9', 'day care-Student', 'A9', 'day care', 'A', 9, @session_id, 'Male', 'Parent of day care-Student A9', '9999999999', 'parent_daycarestudentA9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('day care-Student A9', 'daycarestudentA9@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_DAYCARE_A_10', 'day care-Student', 'A10', 'day care', 'A', 10, @session_id, 'Male', 'Parent of day care-Student A10', '9999999999', 'parent_daycarestudentA10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('day care-Student A10', 'daycarestudentA10@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- Section B
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_DAYCARE_B_1', 'day care-student', 'B1', 'day care', 'B', 1, @session_id, 'Female', 'Parent of day care-studentB1', '9999999999', 'parent_daycarestudentB1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('day care-studentB1', 'daycarestudentB1@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_DAYCARE_B_2', 'day care-student', 'B2', 'day care', 'B', 2, @session_id, 'Female', 'Parent of day care-studentB2', '9999999999', 'parent_daycarestudentB2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('day care-studentB2', 'daycarestudentB2@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_DAYCARE_B_3', 'day care-student', 'B3', 'day care', 'B', 3, @session_id, 'Female', 'Parent of day care-studentB3', '9999999999', 'parent_daycarestudentB3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('day care-studentB3', 'daycarestudentB3@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_DAYCARE_B_4', 'day care-student', 'B4', 'day care', 'B', 4, @session_id, 'Female', 'Parent of day care-studentB4', '9999999999', 'parent_daycarestudentB4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('day care-studentB4', 'daycarestudentB4@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_DAYCARE_B_5', 'day care-student', 'B5', 'day care', 'B', 5, @session_id, 'Female', 'Parent of day care-studentB5', '9999999999', 'parent_daycarestudentB5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('day care-studentB5', 'daycarestudentB5@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_DAYCARE_B_6', 'day care-student', 'B6', 'day care', 'B', 6, @session_id, 'Female', 'Parent of day care-studentB6', '9999999999', 'parent_daycarestudentB6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('day care-studentB6', 'daycarestudentB6@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_DAYCARE_B_7', 'day care-student', 'B7', 'day care', 'B', 7, @session_id, 'Female', 'Parent of day care-studentB7', '9999999999', 'parent_daycarestudentB7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('day care-studentB7', 'daycarestudentB7@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_DAYCARE_B_8', 'day care-student', 'B8', 'day care', 'B', 8, @session_id, 'Female', 'Parent of day care-studentB8', '9999999999', 'parent_daycarestudentB8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('day care-studentB8', 'daycarestudentB8@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_DAYCARE_B_9', 'day care-student', 'B9', 'day care', 'B', 9, @session_id, 'Female', 'Parent of day care-studentB9', '9999999999', 'parent_daycarestudentB9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('day care-studentB9', 'daycarestudentB9@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_DAYCARE_B_10', 'day care-student', 'B10', 'day care', 'B', 10, @session_id, 'Female', 'Parent of day care-studentB10', '9999999999', 'parent_daycarestudentB10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('day care-studentB10', 'daycarestudentB10@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- ==========================================
-- CLASS: 1st
-- ==========================================

-- Section A
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_1ST_A_1', '1st-Student', 'A1', '1st', 'A', 1, @session_id, 'Male', 'Parent of 1st-Student A1', '9999999999', 'parent_1ststudentA1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('1st-Student A1', '1ststudentA1@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_1ST_A_2', '1st-Student', 'A2', '1st', 'A', 2, @session_id, 'Male', 'Parent of 1st-Student A2', '9999999999', 'parent_1ststudentA2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('1st-Student A2', '1ststudentA2@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_1ST_A_3', '1st-Student', 'A3', '1st', 'A', 3, @session_id, 'Male', 'Parent of 1st-Student A3', '9999999999', 'parent_1ststudentA3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('1st-Student A3', '1ststudentA3@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_1ST_A_4', '1st-Student', 'A4', '1st', 'A', 4, @session_id, 'Male', 'Parent of 1st-Student A4', '9999999999', 'parent_1ststudentA4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('1st-Student A4', '1ststudentA4@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_1ST_A_5', '1st-Student', 'A5', '1st', 'A', 5, @session_id, 'Male', 'Parent of 1st-Student A5', '9999999999', 'parent_1ststudentA5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('1st-Student A5', '1ststudentA5@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_1ST_A_6', '1st-Student', 'A6', '1st', 'A', 6, @session_id, 'Male', 'Parent of 1st-Student A6', '9999999999', 'parent_1ststudentA6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('1st-Student A6', '1ststudentA6@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_1ST_A_7', '1st-Student', 'A7', '1st', 'A', 7, @session_id, 'Male', 'Parent of 1st-Student A7', '9999999999', 'parent_1ststudentA7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('1st-Student A7', '1ststudentA7@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_1ST_A_8', '1st-Student', 'A8', '1st', 'A', 8, @session_id, 'Male', 'Parent of 1st-Student A8', '9999999999', 'parent_1ststudentA8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('1st-Student A8', '1ststudentA8@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_1ST_A_9', '1st-Student', 'A9', '1st', 'A', 9, @session_id, 'Male', 'Parent of 1st-Student A9', '9999999999', 'parent_1ststudentA9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('1st-Student A9', '1ststudentA9@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_1ST_A_10', '1st-Student', 'A10', '1st', 'A', 10, @session_id, 'Male', 'Parent of 1st-Student A10', '9999999999', 'parent_1ststudentA10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('1st-Student A10', '1ststudentA10@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- Section B
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_1ST_B_1', '1st-student', 'B1', '1st', 'B', 1, @session_id, 'Female', 'Parent of 1st-studentB1', '9999999999', 'parent_1ststudentB1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('1st-studentB1', '1ststudentB1@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_1ST_B_2', '1st-student', 'B2', '1st', 'B', 2, @session_id, 'Female', 'Parent of 1st-studentB2', '9999999999', 'parent_1ststudentB2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('1st-studentB2', '1ststudentB2@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_1ST_B_3', '1st-student', 'B3', '1st', 'B', 3, @session_id, 'Female', 'Parent of 1st-studentB3', '9999999999', 'parent_1ststudentB3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('1st-studentB3', '1ststudentB3@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_1ST_B_4', '1st-student', 'B4', '1st', 'B', 4, @session_id, 'Female', 'Parent of 1st-studentB4', '9999999999', 'parent_1ststudentB4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('1st-studentB4', '1ststudentB4@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_1ST_B_5', '1st-student', 'B5', '1st', 'B', 5, @session_id, 'Female', 'Parent of 1st-studentB5', '9999999999', 'parent_1ststudentB5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('1st-studentB5', '1ststudentB5@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_1ST_B_6', '1st-student', 'B6', '1st', 'B', 6, @session_id, 'Female', 'Parent of 1st-studentB6', '9999999999', 'parent_1ststudentB6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('1st-studentB6', '1ststudentB6@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_1ST_B_7', '1st-student', 'B7', '1st', 'B', 7, @session_id, 'Female', 'Parent of 1st-studentB7', '9999999999', 'parent_1ststudentB7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('1st-studentB7', '1ststudentB7@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_1ST_B_8', '1st-student', 'B8', '1st', 'B', 8, @session_id, 'Female', 'Parent of 1st-studentB8', '9999999999', 'parent_1ststudentB8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('1st-studentB8', '1ststudentB8@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_1ST_B_9', '1st-student', 'B9', '1st', 'B', 9, @session_id, 'Female', 'Parent of 1st-studentB9', '9999999999', 'parent_1ststudentB9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('1st-studentB9', '1ststudentB9@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_1ST_B_10', '1st-student', 'B10', '1st', 'B', 10, @session_id, 'Female', 'Parent of 1st-studentB10', '9999999999', 'parent_1ststudentB10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('1st-studentB10', '1ststudentB10@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- ==========================================
-- CLASS: 2nd
-- ==========================================

-- Section A
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_2ND_A_1', '2nd-Student', 'A1', '2nd', 'A', 1, @session_id, 'Male', 'Parent of 2nd-Student A1', '9999999999', 'parent_2ndstudentA1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('2nd-Student A1', '2ndstudentA1@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_2ND_A_2', '2nd-Student', 'A2', '2nd', 'A', 2, @session_id, 'Male', 'Parent of 2nd-Student A2', '9999999999', 'parent_2ndstudentA2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('2nd-Student A2', '2ndstudentA2@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_2ND_A_3', '2nd-Student', 'A3', '2nd', 'A', 3, @session_id, 'Male', 'Parent of 2nd-Student A3', '9999999999', 'parent_2ndstudentA3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('2nd-Student A3', '2ndstudentA3@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_2ND_A_4', '2nd-Student', 'A4', '2nd', 'A', 4, @session_id, 'Male', 'Parent of 2nd-Student A4', '9999999999', 'parent_2ndstudentA4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('2nd-Student A4', '2ndstudentA4@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_2ND_A_5', '2nd-Student', 'A5', '2nd', 'A', 5, @session_id, 'Male', 'Parent of 2nd-Student A5', '9999999999', 'parent_2ndstudentA5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('2nd-Student A5', '2ndstudentA5@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_2ND_A_6', '2nd-Student', 'A6', '2nd', 'A', 6, @session_id, 'Male', 'Parent of 2nd-Student A6', '9999999999', 'parent_2ndstudentA6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('2nd-Student A6', '2ndstudentA6@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_2ND_A_7', '2nd-Student', 'A7', '2nd', 'A', 7, @session_id, 'Male', 'Parent of 2nd-Student A7', '9999999999', 'parent_2ndstudentA7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('2nd-Student A7', '2ndstudentA7@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_2ND_A_8', '2nd-Student', 'A8', '2nd', 'A', 8, @session_id, 'Male', 'Parent of 2nd-Student A8', '9999999999', 'parent_2ndstudentA8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('2nd-Student A8', '2ndstudentA8@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_2ND_A_9', '2nd-Student', 'A9', '2nd', 'A', 9, @session_id, 'Male', 'Parent of 2nd-Student A9', '9999999999', 'parent_2ndstudentA9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('2nd-Student A9', '2ndstudentA9@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_2ND_A_10', '2nd-Student', 'A10', '2nd', 'A', 10, @session_id, 'Male', 'Parent of 2nd-Student A10', '9999999999', 'parent_2ndstudentA10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('2nd-Student A10', '2ndstudentA10@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- Section B
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_2ND_B_1', '2nd-student', 'B1', '2nd', 'B', 1, @session_id, 'Female', 'Parent of 2nd-studentB1', '9999999999', 'parent_2ndstudentB1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('2nd-studentB1', '2ndstudentB1@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_2ND_B_2', '2nd-student', 'B2', '2nd', 'B', 2, @session_id, 'Female', 'Parent of 2nd-studentB2', '9999999999', 'parent_2ndstudentB2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('2nd-studentB2', '2ndstudentB2@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_2ND_B_3', '2nd-student', 'B3', '2nd', 'B', 3, @session_id, 'Female', 'Parent of 2nd-studentB3', '9999999999', 'parent_2ndstudentB3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('2nd-studentB3', '2ndstudentB3@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_2ND_B_4', '2nd-student', 'B4', '2nd', 'B', 4, @session_id, 'Female', 'Parent of 2nd-studentB4', '9999999999', 'parent_2ndstudentB4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('2nd-studentB4', '2ndstudentB4@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_2ND_B_5', '2nd-student', 'B5', '2nd', 'B', 5, @session_id, 'Female', 'Parent of 2nd-studentB5', '9999999999', 'parent_2ndstudentB5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('2nd-studentB5', '2ndstudentB5@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_2ND_B_6', '2nd-student', 'B6', '2nd', 'B', 6, @session_id, 'Female', 'Parent of 2nd-studentB6', '9999999999', 'parent_2ndstudentB6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('2nd-studentB6', '2ndstudentB6@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_2ND_B_7', '2nd-student', 'B7', '2nd', 'B', 7, @session_id, 'Female', 'Parent of 2nd-studentB7', '9999999999', 'parent_2ndstudentB7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('2nd-studentB7', '2ndstudentB7@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_2ND_B_8', '2nd-student', 'B8', '2nd', 'B', 8, @session_id, 'Female', 'Parent of 2nd-studentB8', '9999999999', 'parent_2ndstudentB8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('2nd-studentB8', '2ndstudentB8@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_2ND_B_9', '2nd-student', 'B9', '2nd', 'B', 9, @session_id, 'Female', 'Parent of 2nd-studentB9', '9999999999', 'parent_2ndstudentB9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('2nd-studentB9', '2ndstudentB9@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_2ND_B_10', '2nd-student', 'B10', '2nd', 'B', 10, @session_id, 'Female', 'Parent of 2nd-studentB10', '9999999999', 'parent_2ndstudentB10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('2nd-studentB10', '2ndstudentB10@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- ==========================================
-- CLASS: 3rd
-- ==========================================

-- Section A
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_3RD_A_1', '3rd-Student', 'A1', '3rd', 'A', 1, @session_id, 'Male', 'Parent of 3rd-Student A1', '9999999999', 'parent_3rdstudentA1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('3rd-Student A1', '3rdstudentA1@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_3RD_A_2', '3rd-Student', 'A2', '3rd', 'A', 2, @session_id, 'Male', 'Parent of 3rd-Student A2', '9999999999', 'parent_3rdstudentA2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('3rd-Student A2', '3rdstudentA2@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_3RD_A_3', '3rd-Student', 'A3', '3rd', 'A', 3, @session_id, 'Male', 'Parent of 3rd-Student A3', '9999999999', 'parent_3rdstudentA3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('3rd-Student A3', '3rdstudentA3@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_3RD_A_4', '3rd-Student', 'A4', '3rd', 'A', 4, @session_id, 'Male', 'Parent of 3rd-Student A4', '9999999999', 'parent_3rdstudentA4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('3rd-Student A4', '3rdstudentA4@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_3RD_A_5', '3rd-Student', 'A5', '3rd', 'A', 5, @session_id, 'Male', 'Parent of 3rd-Student A5', '9999999999', 'parent_3rdstudentA5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('3rd-Student A5', '3rdstudentA5@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_3RD_A_6', '3rd-Student', 'A6', '3rd', 'A', 6, @session_id, 'Male', 'Parent of 3rd-Student A6', '9999999999', 'parent_3rdstudentA6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('3rd-Student A6', '3rdstudentA6@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_3RD_A_7', '3rd-Student', 'A7', '3rd', 'A', 7, @session_id, 'Male', 'Parent of 3rd-Student A7', '9999999999', 'parent_3rdstudentA7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('3rd-Student A7', '3rdstudentA7@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_3RD_A_8', '3rd-Student', 'A8', '3rd', 'A', 8, @session_id, 'Male', 'Parent of 3rd-Student A8', '9999999999', 'parent_3rdstudentA8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('3rd-Student A8', '3rdstudentA8@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_3RD_A_9', '3rd-Student', 'A9', '3rd', 'A', 9, @session_id, 'Male', 'Parent of 3rd-Student A9', '9999999999', 'parent_3rdstudentA9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('3rd-Student A9', '3rdstudentA9@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_3RD_A_10', '3rd-Student', 'A10', '3rd', 'A', 10, @session_id, 'Male', 'Parent of 3rd-Student A10', '9999999999', 'parent_3rdstudentA10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('3rd-Student A10', '3rdstudentA10@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- Section B
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_3RD_B_1', '3rd-student', 'B1', '3rd', 'B', 1, @session_id, 'Female', 'Parent of 3rd-studentB1', '9999999999', 'parent_3rdstudentB1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('3rd-studentB1', '3rdstudentB1@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_3RD_B_2', '3rd-student', 'B2', '3rd', 'B', 2, @session_id, 'Female', 'Parent of 3rd-studentB2', '9999999999', 'parent_3rdstudentB2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('3rd-studentB2', '3rdstudentB2@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_3RD_B_3', '3rd-student', 'B3', '3rd', 'B', 3, @session_id, 'Female', 'Parent of 3rd-studentB3', '9999999999', 'parent_3rdstudentB3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('3rd-studentB3', '3rdstudentB3@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_3RD_B_4', '3rd-student', 'B4', '3rd', 'B', 4, @session_id, 'Female', 'Parent of 3rd-studentB4', '9999999999', 'parent_3rdstudentB4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('3rd-studentB4', '3rdstudentB4@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_3RD_B_5', '3rd-student', 'B5', '3rd', 'B', 5, @session_id, 'Female', 'Parent of 3rd-studentB5', '9999999999', 'parent_3rdstudentB5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('3rd-studentB5', '3rdstudentB5@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_3RD_B_6', '3rd-student', 'B6', '3rd', 'B', 6, @session_id, 'Female', 'Parent of 3rd-studentB6', '9999999999', 'parent_3rdstudentB6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('3rd-studentB6', '3rdstudentB6@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_3RD_B_7', '3rd-student', 'B7', '3rd', 'B', 7, @session_id, 'Female', 'Parent of 3rd-studentB7', '9999999999', 'parent_3rdstudentB7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('3rd-studentB7', '3rdstudentB7@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_3RD_B_8', '3rd-student', 'B8', '3rd', 'B', 8, @session_id, 'Female', 'Parent of 3rd-studentB8', '9999999999', 'parent_3rdstudentB8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('3rd-studentB8', '3rdstudentB8@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_3RD_B_9', '3rd-student', 'B9', '3rd', 'B', 9, @session_id, 'Female', 'Parent of 3rd-studentB9', '9999999999', 'parent_3rdstudentB9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('3rd-studentB9', '3rdstudentB9@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_3RD_B_10', '3rd-student', 'B10', '3rd', 'B', 10, @session_id, 'Female', 'Parent of 3rd-studentB10', '9999999999', 'parent_3rdstudentB10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('3rd-studentB10', '3rdstudentB10@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- ==========================================
-- CLASS: 4th
-- ==========================================

-- Section A
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_4TH_A_1', '4th-Student', 'A1', '4th', 'A', 1, @session_id, 'Male', 'Parent of 4th-Student A1', '9999999999', 'parent_4thstudentA1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('4th-Student A1', '4thstudentA1@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_4TH_A_2', '4th-Student', 'A2', '4th', 'A', 2, @session_id, 'Male', 'Parent of 4th-Student A2', '9999999999', 'parent_4thstudentA2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('4th-Student A2', '4thstudentA2@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_4TH_A_3', '4th-Student', 'A3', '4th', 'A', 3, @session_id, 'Male', 'Parent of 4th-Student A3', '9999999999', 'parent_4thstudentA3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('4th-Student A3', '4thstudentA3@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_4TH_A_4', '4th-Student', 'A4', '4th', 'A', 4, @session_id, 'Male', 'Parent of 4th-Student A4', '9999999999', 'parent_4thstudentA4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('4th-Student A4', '4thstudentA4@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_4TH_A_5', '4th-Student', 'A5', '4th', 'A', 5, @session_id, 'Male', 'Parent of 4th-Student A5', '9999999999', 'parent_4thstudentA5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('4th-Student A5', '4thstudentA5@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_4TH_A_6', '4th-Student', 'A6', '4th', 'A', 6, @session_id, 'Male', 'Parent of 4th-Student A6', '9999999999', 'parent_4thstudentA6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('4th-Student A6', '4thstudentA6@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_4TH_A_7', '4th-Student', 'A7', '4th', 'A', 7, @session_id, 'Male', 'Parent of 4th-Student A7', '9999999999', 'parent_4thstudentA7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('4th-Student A7', '4thstudentA7@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_4TH_A_8', '4th-Student', 'A8', '4th', 'A', 8, @session_id, 'Male', 'Parent of 4th-Student A8', '9999999999', 'parent_4thstudentA8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('4th-Student A8', '4thstudentA8@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_4TH_A_9', '4th-Student', 'A9', '4th', 'A', 9, @session_id, 'Male', 'Parent of 4th-Student A9', '9999999999', 'parent_4thstudentA9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('4th-Student A9', '4thstudentA9@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_4TH_A_10', '4th-Student', 'A10', '4th', 'A', 10, @session_id, 'Male', 'Parent of 4th-Student A10', '9999999999', 'parent_4thstudentA10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('4th-Student A10', '4thstudentA10@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- Section B
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_4TH_B_1', '4th-student', 'B1', '4th', 'B', 1, @session_id, 'Female', 'Parent of 4th-studentB1', '9999999999', 'parent_4thstudentB1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('4th-studentB1', '4thstudentB1@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_4TH_B_2', '4th-student', 'B2', '4th', 'B', 2, @session_id, 'Female', 'Parent of 4th-studentB2', '9999999999', 'parent_4thstudentB2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('4th-studentB2', '4thstudentB2@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_4TH_B_3', '4th-student', 'B3', '4th', 'B', 3, @session_id, 'Female', 'Parent of 4th-studentB3', '9999999999', 'parent_4thstudentB3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('4th-studentB3', '4thstudentB3@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_4TH_B_4', '4th-student', 'B4', '4th', 'B', 4, @session_id, 'Female', 'Parent of 4th-studentB4', '9999999999', 'parent_4thstudentB4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('4th-studentB4', '4thstudentB4@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_4TH_B_5', '4th-student', 'B5', '4th', 'B', 5, @session_id, 'Female', 'Parent of 4th-studentB5', '9999999999', 'parent_4thstudentB5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('4th-studentB5', '4thstudentB5@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_4TH_B_6', '4th-student', 'B6', '4th', 'B', 6, @session_id, 'Female', 'Parent of 4th-studentB6', '9999999999', 'parent_4thstudentB6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('4th-studentB6', '4thstudentB6@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_4TH_B_7', '4th-student', 'B7', '4th', 'B', 7, @session_id, 'Female', 'Parent of 4th-studentB7', '9999999999', 'parent_4thstudentB7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('4th-studentB7', '4thstudentB7@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_4TH_B_8', '4th-student', 'B8', '4th', 'B', 8, @session_id, 'Female', 'Parent of 4th-studentB8', '9999999999', 'parent_4thstudentB8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('4th-studentB8', '4thstudentB8@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_4TH_B_9', '4th-student', 'B9', '4th', 'B', 9, @session_id, 'Female', 'Parent of 4th-studentB9', '9999999999', 'parent_4thstudentB9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('4th-studentB9', '4thstudentB9@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_4TH_B_10', '4th-student', 'B10', '4th', 'B', 10, @session_id, 'Female', 'Parent of 4th-studentB10', '9999999999', 'parent_4thstudentB10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('4th-studentB10', '4thstudentB10@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- ==========================================
-- CLASS: 5th
-- ==========================================

-- Section A
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_5TH_A_1', '5th-Student', 'A1', '5th', 'A', 1, @session_id, 'Male', 'Parent of 5th-Student A1', '9999999999', 'parent_5thstudentA1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('5th-Student A1', '5thstudentA1@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_5TH_A_2', '5th-Student', 'A2', '5th', 'A', 2, @session_id, 'Male', 'Parent of 5th-Student A2', '9999999999', 'parent_5thstudentA2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('5th-Student A2', '5thstudentA2@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_5TH_A_3', '5th-Student', 'A3', '5th', 'A', 3, @session_id, 'Male', 'Parent of 5th-Student A3', '9999999999', 'parent_5thstudentA3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('5th-Student A3', '5thstudentA3@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_5TH_A_4', '5th-Student', 'A4', '5th', 'A', 4, @session_id, 'Male', 'Parent of 5th-Student A4', '9999999999', 'parent_5thstudentA4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('5th-Student A4', '5thstudentA4@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_5TH_A_5', '5th-Student', 'A5', '5th', 'A', 5, @session_id, 'Male', 'Parent of 5th-Student A5', '9999999999', 'parent_5thstudentA5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('5th-Student A5', '5thstudentA5@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_5TH_A_6', '5th-Student', 'A6', '5th', 'A', 6, @session_id, 'Male', 'Parent of 5th-Student A6', '9999999999', 'parent_5thstudentA6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('5th-Student A6', '5thstudentA6@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_5TH_A_7', '5th-Student', 'A7', '5th', 'A', 7, @session_id, 'Male', 'Parent of 5th-Student A7', '9999999999', 'parent_5thstudentA7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('5th-Student A7', '5thstudentA7@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_5TH_A_8', '5th-Student', 'A8', '5th', 'A', 8, @session_id, 'Male', 'Parent of 5th-Student A8', '9999999999', 'parent_5thstudentA8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('5th-Student A8', '5thstudentA8@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_5TH_A_9', '5th-Student', 'A9', '5th', 'A', 9, @session_id, 'Male', 'Parent of 5th-Student A9', '9999999999', 'parent_5thstudentA9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('5th-Student A9', '5thstudentA9@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_5TH_A_10', '5th-Student', 'A10', '5th', 'A', 10, @session_id, 'Male', 'Parent of 5th-Student A10', '9999999999', 'parent_5thstudentA10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('5th-Student A10', '5thstudentA10@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- Section B
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_5TH_B_1', '5th-student', 'B1', '5th', 'B', 1, @session_id, 'Female', 'Parent of 5th-studentB1', '9999999999', 'parent_5thstudentB1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('5th-studentB1', '5thstudentB1@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_5TH_B_2', '5th-student', 'B2', '5th', 'B', 2, @session_id, 'Female', 'Parent of 5th-studentB2', '9999999999', 'parent_5thstudentB2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('5th-studentB2', '5thstudentB2@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_5TH_B_3', '5th-student', 'B3', '5th', 'B', 3, @session_id, 'Female', 'Parent of 5th-studentB3', '9999999999', 'parent_5thstudentB3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('5th-studentB3', '5thstudentB3@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_5TH_B_4', '5th-student', 'B4', '5th', 'B', 4, @session_id, 'Female', 'Parent of 5th-studentB4', '9999999999', 'parent_5thstudentB4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('5th-studentB4', '5thstudentB4@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_5TH_B_5', '5th-student', 'B5', '5th', 'B', 5, @session_id, 'Female', 'Parent of 5th-studentB5', '9999999999', 'parent_5thstudentB5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('5th-studentB5', '5thstudentB5@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_5TH_B_6', '5th-student', 'B6', '5th', 'B', 6, @session_id, 'Female', 'Parent of 5th-studentB6', '9999999999', 'parent_5thstudentB6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('5th-studentB6', '5thstudentB6@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_5TH_B_7', '5th-student', 'B7', '5th', 'B', 7, @session_id, 'Female', 'Parent of 5th-studentB7', '9999999999', 'parent_5thstudentB7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('5th-studentB7', '5thstudentB7@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_5TH_B_8', '5th-student', 'B8', '5th', 'B', 8, @session_id, 'Female', 'Parent of 5th-studentB8', '9999999999', 'parent_5thstudentB8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('5th-studentB8', '5thstudentB8@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_5TH_B_9', '5th-student', 'B9', '5th', 'B', 9, @session_id, 'Female', 'Parent of 5th-studentB9', '9999999999', 'parent_5thstudentB9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('5th-studentB9', '5thstudentB9@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_5TH_B_10', '5th-student', 'B10', '5th', 'B', 10, @session_id, 'Female', 'Parent of 5th-studentB10', '9999999999', 'parent_5thstudentB10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('5th-studentB10', '5thstudentB10@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- ==========================================
-- CLASS: 6th
-- ==========================================

-- Section A
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_6TH_A_1', '6th-Student', 'A1', '6th', 'A', 1, @session_id, 'Male', 'Parent of 6th-Student A1', '9999999999', 'parent_6thstudentA1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('6th-Student A1', '6thstudentA1@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_6TH_A_2', '6th-Student', 'A2', '6th', 'A', 2, @session_id, 'Male', 'Parent of 6th-Student A2', '9999999999', 'parent_6thstudentA2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('6th-Student A2', '6thstudentA2@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_6TH_A_3', '6th-Student', 'A3', '6th', 'A', 3, @session_id, 'Male', 'Parent of 6th-Student A3', '9999999999', 'parent_6thstudentA3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('6th-Student A3', '6thstudentA3@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_6TH_A_4', '6th-Student', 'A4', '6th', 'A', 4, @session_id, 'Male', 'Parent of 6th-Student A4', '9999999999', 'parent_6thstudentA4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('6th-Student A4', '6thstudentA4@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_6TH_A_5', '6th-Student', 'A5', '6th', 'A', 5, @session_id, 'Male', 'Parent of 6th-Student A5', '9999999999', 'parent_6thstudentA5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('6th-Student A5', '6thstudentA5@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_6TH_A_6', '6th-Student', 'A6', '6th', 'A', 6, @session_id, 'Male', 'Parent of 6th-Student A6', '9999999999', 'parent_6thstudentA6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('6th-Student A6', '6thstudentA6@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_6TH_A_7', '6th-Student', 'A7', '6th', 'A', 7, @session_id, 'Male', 'Parent of 6th-Student A7', '9999999999', 'parent_6thstudentA7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('6th-Student A7', '6thstudentA7@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_6TH_A_8', '6th-Student', 'A8', '6th', 'A', 8, @session_id, 'Male', 'Parent of 6th-Student A8', '9999999999', 'parent_6thstudentA8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('6th-Student A8', '6thstudentA8@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_6TH_A_9', '6th-Student', 'A9', '6th', 'A', 9, @session_id, 'Male', 'Parent of 6th-Student A9', '9999999999', 'parent_6thstudentA9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('6th-Student A9', '6thstudentA9@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_6TH_A_10', '6th-Student', 'A10', '6th', 'A', 10, @session_id, 'Male', 'Parent of 6th-Student A10', '9999999999', 'parent_6thstudentA10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('6th-Student A10', '6thstudentA10@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- Section B
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_6TH_B_1', '6th-student', 'B1', '6th', 'B', 1, @session_id, 'Female', 'Parent of 6th-studentB1', '9999999999', 'parent_6thstudentB1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('6th-studentB1', '6thstudentB1@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_6TH_B_2', '6th-student', 'B2', '6th', 'B', 2, @session_id, 'Female', 'Parent of 6th-studentB2', '9999999999', 'parent_6thstudentB2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('6th-studentB2', '6thstudentB2@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_6TH_B_3', '6th-student', 'B3', '6th', 'B', 3, @session_id, 'Female', 'Parent of 6th-studentB3', '9999999999', 'parent_6thstudentB3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('6th-studentB3', '6thstudentB3@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_6TH_B_4', '6th-student', 'B4', '6th', 'B', 4, @session_id, 'Female', 'Parent of 6th-studentB4', '9999999999', 'parent_6thstudentB4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('6th-studentB4', '6thstudentB4@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_6TH_B_5', '6th-student', 'B5', '6th', 'B', 5, @session_id, 'Female', 'Parent of 6th-studentB5', '9999999999', 'parent_6thstudentB5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('6th-studentB5', '6thstudentB5@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_6TH_B_6', '6th-student', 'B6', '6th', 'B', 6, @session_id, 'Female', 'Parent of 6th-studentB6', '9999999999', 'parent_6thstudentB6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('6th-studentB6', '6thstudentB6@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_6TH_B_7', '6th-student', 'B7', '6th', 'B', 7, @session_id, 'Female', 'Parent of 6th-studentB7', '9999999999', 'parent_6thstudentB7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('6th-studentB7', '6thstudentB7@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_6TH_B_8', '6th-student', 'B8', '6th', 'B', 8, @session_id, 'Female', 'Parent of 6th-studentB8', '9999999999', 'parent_6thstudentB8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('6th-studentB8', '6thstudentB8@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_6TH_B_9', '6th-student', 'B9', '6th', 'B', 9, @session_id, 'Female', 'Parent of 6th-studentB9', '9999999999', 'parent_6thstudentB9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('6th-studentB9', '6thstudentB9@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_6TH_B_10', '6th-student', 'B10', '6th', 'B', 10, @session_id, 'Female', 'Parent of 6th-studentB10', '9999999999', 'parent_6thstudentB10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('6th-studentB10', '6thstudentB10@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- ==========================================
-- CLASS: 7th
-- ==========================================

-- Section A
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_7TH_A_1', '7th-Student', 'A1', '7th', 'A', 1, @session_id, 'Male', 'Parent of 7th-Student A1', '9999999999', 'parent_7thstudentA1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('7th-Student A1', '7thstudentA1@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_7TH_A_2', '7th-Student', 'A2', '7th', 'A', 2, @session_id, 'Male', 'Parent of 7th-Student A2', '9999999999', 'parent_7thstudentA2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('7th-Student A2', '7thstudentA2@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_7TH_A_3', '7th-Student', 'A3', '7th', 'A', 3, @session_id, 'Male', 'Parent of 7th-Student A3', '9999999999', 'parent_7thstudentA3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('7th-Student A3', '7thstudentA3@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_7TH_A_4', '7th-Student', 'A4', '7th', 'A', 4, @session_id, 'Male', 'Parent of 7th-Student A4', '9999999999', 'parent_7thstudentA4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('7th-Student A4', '7thstudentA4@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_7TH_A_5', '7th-Student', 'A5', '7th', 'A', 5, @session_id, 'Male', 'Parent of 7th-Student A5', '9999999999', 'parent_7thstudentA5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('7th-Student A5', '7thstudentA5@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_7TH_A_6', '7th-Student', 'A6', '7th', 'A', 6, @session_id, 'Male', 'Parent of 7th-Student A6', '9999999999', 'parent_7thstudentA6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('7th-Student A6', '7thstudentA6@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_7TH_A_7', '7th-Student', 'A7', '7th', 'A', 7, @session_id, 'Male', 'Parent of 7th-Student A7', '9999999999', 'parent_7thstudentA7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('7th-Student A7', '7thstudentA7@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_7TH_A_8', '7th-Student', 'A8', '7th', 'A', 8, @session_id, 'Male', 'Parent of 7th-Student A8', '9999999999', 'parent_7thstudentA8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('7th-Student A8', '7thstudentA8@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_7TH_A_9', '7th-Student', 'A9', '7th', 'A', 9, @session_id, 'Male', 'Parent of 7th-Student A9', '9999999999', 'parent_7thstudentA9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('7th-Student A9', '7thstudentA9@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_7TH_A_10', '7th-Student', 'A10', '7th', 'A', 10, @session_id, 'Male', 'Parent of 7th-Student A10', '9999999999', 'parent_7thstudentA10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('7th-Student A10', '7thstudentA10@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- Section B
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_7TH_B_1', '7th-student', 'B1', '7th', 'B', 1, @session_id, 'Female', 'Parent of 7th-studentB1', '9999999999', 'parent_7thstudentB1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('7th-studentB1', '7thstudentB1@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_7TH_B_2', '7th-student', 'B2', '7th', 'B', 2, @session_id, 'Female', 'Parent of 7th-studentB2', '9999999999', 'parent_7thstudentB2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('7th-studentB2', '7thstudentB2@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_7TH_B_3', '7th-student', 'B3', '7th', 'B', 3, @session_id, 'Female', 'Parent of 7th-studentB3', '9999999999', 'parent_7thstudentB3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('7th-studentB3', '7thstudentB3@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_7TH_B_4', '7th-student', 'B4', '7th', 'B', 4, @session_id, 'Female', 'Parent of 7th-studentB4', '9999999999', 'parent_7thstudentB4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('7th-studentB4', '7thstudentB4@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_7TH_B_5', '7th-student', 'B5', '7th', 'B', 5, @session_id, 'Female', 'Parent of 7th-studentB5', '9999999999', 'parent_7thstudentB5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('7th-studentB5', '7thstudentB5@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_7TH_B_6', '7th-student', 'B6', '7th', 'B', 6, @session_id, 'Female', 'Parent of 7th-studentB6', '9999999999', 'parent_7thstudentB6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('7th-studentB6', '7thstudentB6@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_7TH_B_7', '7th-student', 'B7', '7th', 'B', 7, @session_id, 'Female', 'Parent of 7th-studentB7', '9999999999', 'parent_7thstudentB7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('7th-studentB7', '7thstudentB7@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_7TH_B_8', '7th-student', 'B8', '7th', 'B', 8, @session_id, 'Female', 'Parent of 7th-studentB8', '9999999999', 'parent_7thstudentB8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('7th-studentB8', '7thstudentB8@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_7TH_B_9', '7th-student', 'B9', '7th', 'B', 9, @session_id, 'Female', 'Parent of 7th-studentB9', '9999999999', 'parent_7thstudentB9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('7th-studentB9', '7thstudentB9@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_7TH_B_10', '7th-student', 'B10', '7th', 'B', 10, @session_id, 'Female', 'Parent of 7th-studentB10', '9999999999', 'parent_7thstudentB10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('7th-studentB10', '7thstudentB10@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- ==========================================
-- CLASS: 8th
-- ==========================================

-- Section A
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_8TH_A_1', '8th-Student', 'A1', '8th', 'A', 1, @session_id, 'Male', 'Parent of 8th-Student A1', '9999999999', 'parent_8thstudentA1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('8th-Student A1', '8thstudentA1@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_8TH_A_2', '8th-Student', 'A2', '8th', 'A', 2, @session_id, 'Male', 'Parent of 8th-Student A2', '9999999999', 'parent_8thstudentA2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('8th-Student A2', '8thstudentA2@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_8TH_A_3', '8th-Student', 'A3', '8th', 'A', 3, @session_id, 'Male', 'Parent of 8th-Student A3', '9999999999', 'parent_8thstudentA3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('8th-Student A3', '8thstudentA3@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_8TH_A_4', '8th-Student', 'A4', '8th', 'A', 4, @session_id, 'Male', 'Parent of 8th-Student A4', '9999999999', 'parent_8thstudentA4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('8th-Student A4', '8thstudentA4@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_8TH_A_5', '8th-Student', 'A5', '8th', 'A', 5, @session_id, 'Male', 'Parent of 8th-Student A5', '9999999999', 'parent_8thstudentA5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('8th-Student A5', '8thstudentA5@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_8TH_A_6', '8th-Student', 'A6', '8th', 'A', 6, @session_id, 'Male', 'Parent of 8th-Student A6', '9999999999', 'parent_8thstudentA6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('8th-Student A6', '8thstudentA6@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_8TH_A_7', '8th-Student', 'A7', '8th', 'A', 7, @session_id, 'Male', 'Parent of 8th-Student A7', '9999999999', 'parent_8thstudentA7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('8th-Student A7', '8thstudentA7@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_8TH_A_8', '8th-Student', 'A8', '8th', 'A', 8, @session_id, 'Male', 'Parent of 8th-Student A8', '9999999999', 'parent_8thstudentA8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('8th-Student A8', '8thstudentA8@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_8TH_A_9', '8th-Student', 'A9', '8th', 'A', 9, @session_id, 'Male', 'Parent of 8th-Student A9', '9999999999', 'parent_8thstudentA9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('8th-Student A9', '8thstudentA9@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_8TH_A_10', '8th-Student', 'A10', '8th', 'A', 10, @session_id, 'Male', 'Parent of 8th-Student A10', '9999999999', 'parent_8thstudentA10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('8th-Student A10', '8thstudentA10@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- Section B
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_8TH_B_1', '8th-student', 'B1', '8th', 'B', 1, @session_id, 'Female', 'Parent of 8th-studentB1', '9999999999', 'parent_8thstudentB1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('8th-studentB1', '8thstudentB1@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_8TH_B_2', '8th-student', 'B2', '8th', 'B', 2, @session_id, 'Female', 'Parent of 8th-studentB2', '9999999999', 'parent_8thstudentB2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('8th-studentB2', '8thstudentB2@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_8TH_B_3', '8th-student', 'B3', '8th', 'B', 3, @session_id, 'Female', 'Parent of 8th-studentB3', '9999999999', 'parent_8thstudentB3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('8th-studentB3', '8thstudentB3@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_8TH_B_4', '8th-student', 'B4', '8th', 'B', 4, @session_id, 'Female', 'Parent of 8th-studentB4', '9999999999', 'parent_8thstudentB4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('8th-studentB4', '8thstudentB4@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_8TH_B_5', '8th-student', 'B5', '8th', 'B', 5, @session_id, 'Female', 'Parent of 8th-studentB5', '9999999999', 'parent_8thstudentB5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('8th-studentB5', '8thstudentB5@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_8TH_B_6', '8th-student', 'B6', '8th', 'B', 6, @session_id, 'Female', 'Parent of 8th-studentB6', '9999999999', 'parent_8thstudentB6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('8th-studentB6', '8thstudentB6@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_8TH_B_7', '8th-student', 'B7', '8th', 'B', 7, @session_id, 'Female', 'Parent of 8th-studentB7', '9999999999', 'parent_8thstudentB7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('8th-studentB7', '8thstudentB7@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_8TH_B_8', '8th-student', 'B8', '8th', 'B', 8, @session_id, 'Female', 'Parent of 8th-studentB8', '9999999999', 'parent_8thstudentB8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('8th-studentB8', '8thstudentB8@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_8TH_B_9', '8th-student', 'B9', '8th', 'B', 9, @session_id, 'Female', 'Parent of 8th-studentB9', '9999999999', 'parent_8thstudentB9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('8th-studentB9', '8thstudentB9@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_8TH_B_10', '8th-student', 'B10', '8th', 'B', 10, @session_id, 'Female', 'Parent of 8th-studentB10', '9999999999', 'parent_8thstudentB10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('8th-studentB10', '8thstudentB10@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- ==========================================
-- CLASS: 9th
-- ==========================================

-- Section A
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_9TH_A_1', '9th-Student', 'A1', '9th', 'A', 1, @session_id, 'Male', 'Parent of 9th-Student A1', '9999999999', 'parent_9thstudentA1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('9th-Student A1', '9thstudentA1@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_9TH_A_2', '9th-Student', 'A2', '9th', 'A', 2, @session_id, 'Male', 'Parent of 9th-Student A2', '9999999999', 'parent_9thstudentA2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('9th-Student A2', '9thstudentA2@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_9TH_A_3', '9th-Student', 'A3', '9th', 'A', 3, @session_id, 'Male', 'Parent of 9th-Student A3', '9999999999', 'parent_9thstudentA3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('9th-Student A3', '9thstudentA3@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_9TH_A_4', '9th-Student', 'A4', '9th', 'A', 4, @session_id, 'Male', 'Parent of 9th-Student A4', '9999999999', 'parent_9thstudentA4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('9th-Student A4', '9thstudentA4@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_9TH_A_5', '9th-Student', 'A5', '9th', 'A', 5, @session_id, 'Male', 'Parent of 9th-Student A5', '9999999999', 'parent_9thstudentA5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('9th-Student A5', '9thstudentA5@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_9TH_A_6', '9th-Student', 'A6', '9th', 'A', 6, @session_id, 'Male', 'Parent of 9th-Student A6', '9999999999', 'parent_9thstudentA6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('9th-Student A6', '9thstudentA6@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_9TH_A_7', '9th-Student', 'A7', '9th', 'A', 7, @session_id, 'Male', 'Parent of 9th-Student A7', '9999999999', 'parent_9thstudentA7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('9th-Student A7', '9thstudentA7@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_9TH_A_8', '9th-Student', 'A8', '9th', 'A', 8, @session_id, 'Male', 'Parent of 9th-Student A8', '9999999999', 'parent_9thstudentA8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('9th-Student A8', '9thstudentA8@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_9TH_A_9', '9th-Student', 'A9', '9th', 'A', 9, @session_id, 'Male', 'Parent of 9th-Student A9', '9999999999', 'parent_9thstudentA9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('9th-Student A9', '9thstudentA9@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_9TH_A_10', '9th-Student', 'A10', '9th', 'A', 10, @session_id, 'Male', 'Parent of 9th-Student A10', '9999999999', 'parent_9thstudentA10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('9th-Student A10', '9thstudentA10@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- Section B
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_9TH_B_1', '9th-student', 'B1', '9th', 'B', 1, @session_id, 'Female', 'Parent of 9th-studentB1', '9999999999', 'parent_9thstudentB1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('9th-studentB1', '9thstudentB1@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_9TH_B_2', '9th-student', 'B2', '9th', 'B', 2, @session_id, 'Female', 'Parent of 9th-studentB2', '9999999999', 'parent_9thstudentB2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('9th-studentB2', '9thstudentB2@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_9TH_B_3', '9th-student', 'B3', '9th', 'B', 3, @session_id, 'Female', 'Parent of 9th-studentB3', '9999999999', 'parent_9thstudentB3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('9th-studentB3', '9thstudentB3@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_9TH_B_4', '9th-student', 'B4', '9th', 'B', 4, @session_id, 'Female', 'Parent of 9th-studentB4', '9999999999', 'parent_9thstudentB4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('9th-studentB4', '9thstudentB4@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_9TH_B_5', '9th-student', 'B5', '9th', 'B', 5, @session_id, 'Female', 'Parent of 9th-studentB5', '9999999999', 'parent_9thstudentB5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('9th-studentB5', '9thstudentB5@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_9TH_B_6', '9th-student', 'B6', '9th', 'B', 6, @session_id, 'Female', 'Parent of 9th-studentB6', '9999999999', 'parent_9thstudentB6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('9th-studentB6', '9thstudentB6@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_9TH_B_7', '9th-student', 'B7', '9th', 'B', 7, @session_id, 'Female', 'Parent of 9th-studentB7', '9999999999', 'parent_9thstudentB7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('9th-studentB7', '9thstudentB7@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_9TH_B_8', '9th-student', 'B8', '9th', 'B', 8, @session_id, 'Female', 'Parent of 9th-studentB8', '9999999999', 'parent_9thstudentB8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('9th-studentB8', '9thstudentB8@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_9TH_B_9', '9th-student', 'B9', '9th', 'B', 9, @session_id, 'Female', 'Parent of 9th-studentB9', '9999999999', 'parent_9thstudentB9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('9th-studentB9', '9thstudentB9@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_9TH_B_10', '9th-student', 'B10', '9th', 'B', 10, @session_id, 'Female', 'Parent of 9th-studentB10', '9999999999', 'parent_9thstudentB10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('9th-studentB10', '9thstudentB10@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- ==========================================
-- CLASS: 10th
-- ==========================================

-- Section A
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_10TH_A_1', '10th-Student', 'A1', '10th', 'A', 1, @session_id, 'Male', 'Parent of 10th-Student A1', '9999999999', 'parent_10thstudentA1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('10th-Student A1', '10thstudentA1@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_10TH_A_2', '10th-Student', 'A2', '10th', 'A', 2, @session_id, 'Male', 'Parent of 10th-Student A2', '9999999999', 'parent_10thstudentA2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('10th-Student A2', '10thstudentA2@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_10TH_A_3', '10th-Student', 'A3', '10th', 'A', 3, @session_id, 'Male', 'Parent of 10th-Student A3', '9999999999', 'parent_10thstudentA3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('10th-Student A3', '10thstudentA3@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_10TH_A_4', '10th-Student', 'A4', '10th', 'A', 4, @session_id, 'Male', 'Parent of 10th-Student A4', '9999999999', 'parent_10thstudentA4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('10th-Student A4', '10thstudentA4@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_10TH_A_5', '10th-Student', 'A5', '10th', 'A', 5, @session_id, 'Male', 'Parent of 10th-Student A5', '9999999999', 'parent_10thstudentA5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('10th-Student A5', '10thstudentA5@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_10TH_A_6', '10th-Student', 'A6', '10th', 'A', 6, @session_id, 'Male', 'Parent of 10th-Student A6', '9999999999', 'parent_10thstudentA6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('10th-Student A6', '10thstudentA6@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_10TH_A_7', '10th-Student', 'A7', '10th', 'A', 7, @session_id, 'Male', 'Parent of 10th-Student A7', '9999999999', 'parent_10thstudentA7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('10th-Student A7', '10thstudentA7@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_10TH_A_8', '10th-Student', 'A8', '10th', 'A', 8, @session_id, 'Male', 'Parent of 10th-Student A8', '9999999999', 'parent_10thstudentA8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('10th-Student A8', '10thstudentA8@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_10TH_A_9', '10th-Student', 'A9', '10th', 'A', 9, @session_id, 'Male', 'Parent of 10th-Student A9', '9999999999', 'parent_10thstudentA9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('10th-Student A9', '10thstudentA9@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_10TH_A_10', '10th-Student', 'A10', '10th', 'A', 10, @session_id, 'Male', 'Parent of 10th-Student A10', '9999999999', 'parent_10thstudentA10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('10th-Student A10', '10thstudentA10@school.com', '$2a$12$BIn/TEA9cGqYknUHNCsueeCg7JV8P7xAGRNEEUgu6tb9HJwHTaY8a', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

-- Section B
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_10TH_B_1', '10th-student', 'B1', '10th', 'B', 1, @session_id, 'Female', 'Parent of 10th-studentB1', '9999999999', 'parent_10thstudentB1@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('10th-studentB1', '10thstudentB1@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_10TH_B_2', '10th-student', 'B2', '10th', 'B', 2, @session_id, 'Female', 'Parent of 10th-studentB2', '9999999999', 'parent_10thstudentB2@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('10th-studentB2', '10thstudentB2@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_10TH_B_3', '10th-student', 'B3', '10th', 'B', 3, @session_id, 'Female', 'Parent of 10th-studentB3', '9999999999', 'parent_10thstudentB3@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('10th-studentB3', '10thstudentB3@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_10TH_B_4', '10th-student', 'B4', '10th', 'B', 4, @session_id, 'Female', 'Parent of 10th-studentB4', '9999999999', 'parent_10thstudentB4@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('10th-studentB4', '10thstudentB4@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_10TH_B_5', '10th-student', 'B5', '10th', 'B', 5, @session_id, 'Female', 'Parent of 10th-studentB5', '9999999999', 'parent_10thstudentB5@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('10th-studentB5', '10thstudentB5@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_10TH_B_6', '10th-student', 'B6', '10th', 'B', 6, @session_id, 'Female', 'Parent of 10th-studentB6', '9999999999', 'parent_10thstudentB6@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('10th-studentB6', '10thstudentB6@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_10TH_B_7', '10th-student', 'B7', '10th', 'B', 7, @session_id, 'Female', 'Parent of 10th-studentB7', '9999999999', 'parent_10thstudentB7@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('10th-studentB7', '10thstudentB7@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_10TH_B_8', '10th-student', 'B8', '10th', 'B', 8, @session_id, 'Female', 'Parent of 10th-studentB8', '9999999999', 'parent_10thstudentB8@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('10th-studentB8', '10thstudentB8@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_10TH_B_9', '10th-student', 'B9', '10th', 'B', 9, @session_id, 'Female', 'Parent of 10th-studentB9', '9999999999', 'parent_10thstudentB9@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('10th-studentB9', '10thstudentB9@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, session_id, gender, parent_name, parent_phone, parent_email, parent_address, admission_date, is_active, student_status, source, approval_status, created_at, updated_at)
VALUES ('STU_10TH_B_10', '10th-student', 'B10', '10th', 'B', 10, @session_id, 'Female', 'Parent of 10th-studentB10', '9999999999', 'parent_10thstudentB10@school.com', 'School Address', CURDATE(), TRUE, 'active', 'admin_created', 'approved', NOW(), NOW());

INSERT INTO users (name, email, password, role, linked_student_id, is_active, created_at, updated_at)
VALUES ('10th-studentB10', '10thstudentB10@school.com', '$2a$12$yaY9ilGNOwkRMAzdqiUAUeB6zVLMQn.9FdBh2y/Ms.IacxWXdfu3y', 'student', LAST_INSERT_ID(), TRUE, NOW(), NOW());

