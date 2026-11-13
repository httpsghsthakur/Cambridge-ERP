-- SQL Script to undo/delete the 300 students and users inserted by the generator script
-- Safe to run in phpMyAdmin on Hostinger

-- 1. Delete the user accounts linked to the generated students
DELETE FROM users 
WHERE role = 'student' 
  AND linked_student_id IN (
    SELECT id FROM students WHERE student_id LIKE 'STU\\_%\\_%\\_%'
  );

-- 2. Delete the student records
DELETE FROM students 
WHERE student_id LIKE 'STU\\_%\\_%\\_%';
