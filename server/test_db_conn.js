require('dotenv').config();
const sequelize = require('./config/database');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL!');
    
    const [rows] = await sequelize.query('SELECT id, email, role, password FROM users LIMIT 10');
    console.log('Total users found:', rows.length);
    
    rows.forEach(u => {
      const hashed = u.password && (u.password.startsWith('$2a$') || u.password.startsWith('$2b$'));
      console.log('[' + u.id + '] ' + u.email + ' | role: ' + u.role + ' | hashed: ' + hashed + ' | pw_len: ' + (u.password ? u.password.length : 0));
    });
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
  process.exit(0);
}

test();
