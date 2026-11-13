/**
 * LOGIN DIAGNOSTIC SCRIPT
 * Run: node debug_login.js
 * This tests every single step of the login pipeline.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('\n========================================');
console.log('  LOGIN DIAGNOSTIC TOOL');
console.log('========================================\n');

// Step 1: Check environment variables
console.log('--- STEP 1: Environment Variables ---');
console.log('  DB_NAME     :', process.env.DB_NAME || '❌ MISSING');
console.log('  DB_USER     :', process.env.DB_USER || '❌ MISSING');
console.log('  DB_PASS     :', process.env.DB_PASS ? '✅ SET' : '❌ MISSING');
console.log('  DB_HOST     :', process.env.DB_HOST || '(not set, will use 127.0.0.1)');
console.log('  JWT_SECRET  :', process.env.JWT_SECRET ? '✅ SET' : '❌ MISSING');
console.log('  JWT_EXPIRE  :', process.env.JWT_EXPIRE || '❌ MISSING');
console.log('');

async function run() {
  try {
    // Step 2: Test database connection
    console.log('--- STEP 2: Database Connection ---');
    const sequelize = require('./config/database');
    await sequelize.authenticate();
    console.log('  ✅ Database connected successfully');
    console.log('  Dialect:', sequelize.getDialect());
    console.log('');

    // Step 3: Sync tables (dev mode)
    console.log('--- STEP 3: Syncing tables ---');
    await sequelize.sync({ alter: true });
    console.log('  ✅ Tables synced');
    console.log('');

    // Step 4: Check users table
    console.log('--- STEP 4: Checking users in DB ---');
    const { User } = require('./models');
    const allUsers = await User.findAll({ raw: true });
    console.log(`  Total users in DB: ${allUsers.length}`);
    
    if (allUsers.length === 0) {
      console.log('  ❌ NO USERS FOUND IN DATABASE!');
      console.log('  Creating admin user...');
      
      const newAdmin = await User.create({
        name: 'Admin User',
        email: 'admin@school.com',
        password: 'Admin@123',
        role: 'admin',
        is_active: true
      });
      console.log('  ✅ Admin created with ID:', newAdmin.id);
      console.log('  Email: admin@school.com');
      console.log('  Password: Admin@123');
    } else {
      for (const u of allUsers) {
        const isBcrypt = u.password && (u.password.startsWith('$2a$') || u.password.startsWith('$2b$'));
        console.log(`  [${u.id}] ${u.email} | role: ${u.role} | active: ${u.is_active} | password_hashed: ${isBcrypt} | lock_until: ${u.lock_until || 'none'} | login_attempts: ${u.login_attempts}`);
      }
    }
    console.log('');

    // Step 5: Test password comparison for admin
    console.log('--- STEP 5: Testing password comparison ---');
    const admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      console.log('  ❌ No admin user found!');
    } else {
      console.log('  Admin found:', admin.email);
      console.log('  Password field length:', admin.password ? admin.password.length : 'NULL');
      console.log('  Password starts with $2:', admin.password ? admin.password.substring(0, 4) : 'NULL');
      
      // Test common passwords
      const testPasswords = ['Admin@123', 'admin123', 'admin', 'password', '12345678'];
      for (const pw of testPasswords) {
        try {
          const result = await admin.comparePassword(pw);
          console.log(`  Testing "${pw}": ${result ? '✅ MATCH' : '❌ no match'}`);
          if (result) break;
        } catch (err) {
          console.log(`  Testing "${pw}": ❌ ERROR - ${err.message}`);
        }
      }
    }
    console.log('');

    // Step 6: Test JWT signing
    console.log('--- STEP 6: Testing JWT ---');
    const jwt = require('jsonwebtoken');
    if (!process.env.JWT_SECRET) {
      console.log('  ❌ JWT_SECRET is missing! Login will ALWAYS fail!');
      console.log('  Fix: Add JWT_SECRET=any-random-string-here to your .env file');
    } else {
      try {
        const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
        console.log('  ✅ JWT signing works. Token:', token.substring(0, 30) + '...');
      } catch (err) {
        console.log('  ❌ JWT signing FAILED:', err.message);
      }
    }
    console.log('');

    // Step 7: Check if CSRF is blocking login
    console.log('--- STEP 7: CSRF Check ---');
    const csrfFile = path.join(__dirname, 'middleware', 'csrf.js');
    const csrfCode = require('fs').readFileSync(csrfFile, 'utf8');
    if (csrfCode.includes('/api/auth/login')) {
      console.log('  ✅ Login route is excluded from CSRF protection');
    } else {
      console.log('  ❌ Login route may be blocked by CSRF middleware!');
    }
    console.log('');

    console.log('========================================');
    console.log('  DIAGNOSTIC COMPLETE');
    console.log('========================================');

  } catch (err) {
    console.error('\n❌ FATAL ERROR:', err.message);
    console.error(err.stack);
  }
  
  process.exit(0);
}

run();
