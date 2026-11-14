const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { User, sequelize } = require('../models');

async function addUser() {
  const [,, email, password, role = 'admin', name = 'Admin User'] = process.argv;

  if (!email || !password) {
    console.log('Usage: node server/scripts/createLocalUser.js <email> <password> [role] [name]');
    console.log('Example: node server/scripts/createLocalUser.js myadmin@school.com MyPass123 admin "My Name"');
    process.exit(1);
  }

  try {
    const existing = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    const hashedPassword = await bcrypt.hash(password.trim(), 12);

    if (existing) {
      existing.password = password.trim();
      existing.role = role;
      existing.name = name;
      existing.is_active = true;
      await existing.save();
      console.log(`✅ User ${email} already existed; updated password, role (${role}), and set active!`);
    } else {
      await User.create({
        name,
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role,
        is_active: true
      });
      console.log(`✅ New user ${email} successfully created with role: ${role}!`);
    }
    console.log('👉 You can now log in on localhost with these credentials.');
  } catch (err) {
    console.error('❌ Failed to create/update user:', err.message);
  } finally {
    await sequelize.close();
  }
}

addUser();

