const { Teacher, ClassIncharge } = require('../models');

const getTeacherAllowedClasses = async (linkedTeacherId) => {
  if (!linkedTeacherId) return [];
  const teacher = await Teacher.findByPk(linkedTeacherId);
  const assigned = teacher?.assigned_classes ? teacher.assigned_classes.split(',').map(c => c.trim()).filter(Boolean) : [];
  const incharges = await ClassIncharge.findAll({ where: { teacher_id: linkedTeacherId, is_active: true } });
  const inchargeClasses = incharges.map(i => i.class);
  return [...new Set([...assigned, ...inchargeClasses])];
};

module.exports = {
  getTeacherAllowedClasses
};
