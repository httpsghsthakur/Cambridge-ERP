const fs = require('fs');
let f = fs.readFileSync('server/server.js', 'utf8');
f = f.replace(/app\.listen\(/, `app.get('/api/fix-db-users', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { User } = require('./models');
    const adminPass = await bcrypt.hash('admin123', 10);
    await User.update({ password: adminPass }, { where: { email: 'admin@school.com' } });
    const feePass = await bcrypt.hash('fee123', 10);
    let feeCollector = await User.findOne({ where: { email: 'feecollector@school.com' } });
    if (feeCollector) {
      await User.update({ password: feePass }, { where: { email: 'feecollector@school.com' } });
    } else {
      await User.create({ name: 'Fee Collector', email: 'feecollector@school.com', password: feePass, role: 'fee_collector', is_active: true });
    }
    res.json({ success: true, message: 'Users reset successfully. Passwords are: admin123 and fee123 (lowercase).' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(`);
fs.writeFileSync('server/server.js', f);
console.log('Appended fix route');
