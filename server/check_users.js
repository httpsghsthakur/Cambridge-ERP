require('dotenv').config();
const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function check() {
  try {
    const users = await User.findAll();
    console.log(`Found ${users.length} user(s) in the database:\n`);
    
    for (const u of users) {
      const matchSeed = await bcrypt.compare('Admin@123', u.password);
      console.log(`- ID: ${u.id}`);
      console.log(`  Name: ${u.name}`);
      console.log(`  Email: ${u.email}`);
      console.log(`  Role: ${u.role}`);
      console.log(`  Is Active: ${u.is_active}`);
      console.log(`  Password matches "Admin@123": ${matchSeed}`);
      console.log('--------------------------------------------');
    }
  } catch (err) {
    console.error('Diagnostic failed:', err.message);
  }
  process.exit(0);
}

check();
