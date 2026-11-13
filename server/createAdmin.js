/**
 * One-time script to create the admin user.
 * Run: node createAdmin.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { sequelize } = require('./models');
const User = require('./models/User');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('[DB] Connected successfully.');

    // Sync tables (in case they don't exist yet)
    await sequelize.sync();

    const email = 'pbm.kishtwar@gmail.com';

    // Check if user already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log(`[ADMIN] User with email "${email}" already exists (id: ${existing.id}, role: ${existing.role}).`);
      console.log('[ADMIN] Updating password and ensuring role is admin...');
      existing.password = 'PBM@182204';
      existing.role = 'admin';
      existing.is_active = true;
      await existing.save();
      console.log('[ADMIN] ✅ Password updated and role set to admin.');
    } else {
      const user = await User.create({
        name: 'Admin',
        email,
        password: 'PBM@182204',
        role: 'admin',
        is_active: true,
      });
      console.log(`[ADMIN] ✅ Admin user created successfully (id: ${user.id}).`);
    }

    // Verify the password works
    const admin = await User.findOne({ where: { email } });
    const match = await admin.comparePassword('PBM@182204');
    console.log(`[ADMIN] Password verification: ${match ? '✅ PASS' : '❌ FAIL'}`);

    process.exit(0);
  } catch (err) {
    console.error('[ADMIN] ❌ Failed:', err.message);
    process.exit(1);
  }
})();
