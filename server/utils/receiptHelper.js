const generateReceiptData = (fee, student) => ({
  receipt_number: fee.receipt_number,
  student_name:   `${student?.first_name || ''} ${student?.last_name || ''}`,
  student_id:     student?.student_id,
  class:          `${student?.class || ''} - ${student?.section || ''}`,
  parent_name:    student?.parent_name,
  month:          fee.month,
  total_amount:   fee.total_amount,
  paid_amount:    fee.paid_amount,
  payment_mode:   fee.payment_mode,
  paid_date:      fee.paid_date,
  fee_type:       fee.fee_type,
  generated_at:   new Date().toISOString(),
});

module.exports = { generateReceiptData };