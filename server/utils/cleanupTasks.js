const { Op } = require('sequelize');
const { Student, Fee, ClassFeeStructure, Notification } = require('../models');

const rejectOldPendingStudents = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [updatedCount] = await Student.update(
      { 
        approval_status: 'rejected',
        rejection_reason: 'Auto-rejected after 30 days of inactivity'
      },
      {
        where: {
          approval_status: 'pending',
          createdAt: {
            [Op.lt]: thirtyDaysAgo,
          },
        },
      }
    );
    if (updatedCount > 0) {
      console.log(`[Cleanup] Auto-rejected ${updatedCount} pending student(s) older than 30 days.`);
    }
  } catch (err) {
    console.error('[Cleanup] Error auto-rejecting students:', err);
  }
};

const calculateOverdueFees = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Find all unpaid/partial fees that are past due date and not yet marked overdue
    const overdueFees = await Fee.findAll({
      where: {
        status: { [Op.in]: ['unpaid', 'partial'] },
        due_date: { [Op.lt]: today }
      },
      include: [
        { model: Student, as: 'student', attributes: ['id', 'class', 'session_id'] }
      ]
    });

    if (overdueFees.length === 0) return;

    let updatedCount = 0;
    for (const fee of overdueFees) {
      const student = fee.student;
      if (!student) continue;

      // Find the fee structure to get the late_fee_per_day
      const structure = await ClassFeeStructure.findOne({
        where: { class: student.class, session_id: student.session_id }
      });

      const lateFeePerDay = parseFloat(structure?.late_fee_per_day || 0);

      // Calculate days overdue
      const dueDateObj = new Date(fee.due_date);
      const todayObj = new Date(today);
      const diffTime = Math.abs(todayObj - dueDateObj);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      const lateFeeAmount = diffDays * lateFeePerDay;
      const totalAmountWithLateFee = parseFloat(fee.total_amount) + lateFeeAmount;

      await fee.update({
        status: 'overdue',
        late_fee_amount: lateFeeAmount
      });
      
      // Dispatch notification if just became overdue today (diffDays === 1) or periodically.
      // For simplicity, we just send one when it hits overdue for the first time.
      if (diffDays === 1) {
        await Notification.create({
          title: 'Fee Overdue',
          message: `Your ${fee.month || fee.fee_type} fee is overdue by 1 day. A late fee may apply.`,
          type: 'warning',
          target_roles: ['parent', 'student'],
          target_users: [student.id], // Assuming target_users can take student IDs or we broadcast to class
          target_classes: [student.class],
          sent_by: null // System generated
        });
      }

      updatedCount++;
    }

    console.log(`[Cleanup] Marked ${updatedCount} fee(s) as overdue.`);
  } catch (err) {
    console.error('[Cleanup] Error calculating overdue fees:', err);
  }
};

module.exports = { rejectOldPendingStudents, calculateOverdueFees };
