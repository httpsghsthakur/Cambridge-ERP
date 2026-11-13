const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function fix() {
  const p1 = await bcrypt.hash('fee123', 10);
  await User.update({password: p1}, {where: {email: 'feecollector@school.com'}});
  const p2 = await bcrypt.hash('admin123', 10);
  await User.update({password: p2}, {where: {email: 'admin@school.com'}});
  console.log('Fixed passwords to lowercase no special chars');
  process.exit(0);
}
fix();
