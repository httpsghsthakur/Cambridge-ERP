const { Teacher, ClassIncharge, ClassSubject, Student } = require('../models');

const normalizeClass = (name) => {
  if (!name) return '';
  return String(name).trim().toLowerCase()
    .replace(/^class\s+/i, '')
    .replace(/^grade\s+/i, '')
    .replace(/(st|nd|rd|th)$/i, '')
    .trim();
};

const isClassMatch = (a, b) => {
  if (!a || !b) return false;
  if (String(a).trim().toLowerCase() === String(b).trim().toLowerCase()) return true;
  return normalizeClass(a) === normalizeClass(b);
};

const getTeacherAllowedClasses = async (linkedTeacherId) => {
  if (!linkedTeacherId) {
    // If unlinked, return all active classes so teacher is not blocked
    const students = await Student.findAll({
      attributes: ['class'],
      where: { is_active: true },
      group: ['class'],
      raw: true,
    });
    return students.map(s => s.class).filter(Boolean);
  }

  const teacher = await Teacher.findByPk(linkedTeacherId);
  const assigned = teacher?.assigned_classes ? teacher.assigned_classes.split(',').map(c => c.trim()).filter(Boolean) : [];
  const [incharges, classSubjects] = await Promise.all([
    ClassIncharge.findAll({ where: { teacher_id: linkedTeacherId, is_active: true } }),
    ClassSubject.findAll({ where: { teacher_id: linkedTeacherId } }),
  ]);

  const inchargeClasses = incharges.map(i => i.class).filter(Boolean);
  const subjectClasses = classSubjects.map(cs => cs.class).filter(Boolean);

  const combined = [...new Set([...assigned, ...inchargeClasses, ...subjectClasses])];

  // If teacher has 'all' or '*' in assigned_classes or has no restrictions configured,
  // return all active student classes in the school
  const hasWildcard = assigned.some(c => c.toLowerCase() === 'all' || c === '*');
  if (hasWildcard || combined.length === 0) {
    const students = await Student.findAll({
      attributes: ['class'],
      where: { is_active: true },
      group: ['class'],
      raw: true,
    });
    const schoolClasses = students.map(s => s.class).filter(Boolean);
    return schoolClasses.length > 0 ? schoolClasses : combined;
  }

  return combined;
};

module.exports = {
  getTeacherAllowedClasses,
  normalizeClass,
  isClassMatch,
};

