ALTER TABLE users
  MODIFY role ENUM('admin','admin2','teacher','student','parent','fee_collector') DEFAULT 'parent';

ALTER TABLE students
  ADD COLUMN created_by INT NULL AFTER admission_request_id,
  ADD COLUMN approval_status ENUM('pending','approved','rejected') DEFAULT 'approved' AFTER created_by,
  ADD COLUMN approved_by INT NULL AFTER approval_status,
  ADD COLUMN approved_at DATETIME NULL AFTER approved_by,
  ADD COLUMN rejection_reason TEXT NULL AFTER approved_at,
  ADD CONSTRAINT fk_students_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  ADD CONSTRAINT fk_students_approved_by FOREIGN KEY (approved_by) REFERENCES users(id);

UPDATE students
SET approval_status = 'approved'
WHERE approval_status IS NULL;
