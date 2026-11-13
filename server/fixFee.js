require('dotenv').config();
const { Fee, Student } = require('./models');
async function run() {
  const s = await Student.findOne({ where: { first_name: 'Ghanshyam mini' } });
  if (s) {
    await Fee.update({ paid_amount: 0, status: 'unpaid' }, { where: { student_id: s.id, fee_type: 'admission' } });
    console.log('Fixed paid_amount to 0 for Ghanshyam mini');
  }
}
run();
