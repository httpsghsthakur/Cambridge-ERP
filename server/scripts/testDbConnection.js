const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Sequelize } = require('sequelize');

async function testConnection() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 Testing Database Connection from .env');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Host    :', process.env.DB_HOST);
  console.log('Port    :', process.env.DB_PORT || 3306);
  console.log('Database:', process.env.DB_NAME);
  console.log('User    :', process.env.DB_USER);
  console.log('───────────────────────────────────────────────────────');

  if (!process.env.DB_HOST || process.env.DB_HOST.includes('XXX')) {
    console.error('❌ ERROR: "sqlXXX.hostinger.com" is a placeholder!');
    console.error('👉 Open Hostinger hPanel → Databases → Remote MySQL.');
    console.error('👉 Copy the actual MySQL Host IP or hostname and update DB_HOST in server/.env.');
    process.exit(1);
  }

  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS || process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        connectTimeout: 10000
      }
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Connection to Hostinger MySQL SUCCESSFUL!');

    // Query tables and user columns
    const [tables] = await sequelize.query('SHOW TABLES;');
    console.log('\n📋 Tables in database:');
    console.log(tables.map(t => Object.values(t)[0]).join(', '));

    const [cols] = await sequelize.query('DESCRIBE users;');
    console.log('\n📋 Columns in `users` table:');
    console.table(cols.map(c => ({ Field: c.Field, Type: c.Type })));

    const [users] = await sequelize.query('SELECT * FROM users LIMIT 10;');
    console.log(`\n📋 Found ${users.length} user(s) in Hostinger database:`);
    console.table(users.map(u => {
      const copy = { ...u };
      delete copy.password;
      delete copy.password_hash;
      return copy;
    }));
  } catch (err) {
    console.error('\n❌ Connection FAILED:', err.message);
    if (err.message.includes('ENOTFOUND')) {
      console.error('👉 The hostname could not be found. Check the spelling of DB_HOST.');
    } else if (err.message.includes('ETIMEDOUT') || err.message.includes('ECONNREFUSED')) {
      console.error('👉 Connection blocked by Hostinger firewall.');
      console.error('👉 In Hostinger hPanel: Go to Databases → Remote MySQL, select your database and enter "%" under IP to allow external connections.');
    } else if (err.message.includes('Access denied')) {
      console.error('👉 Wrong username or password. Verify DB_USER and DB_PASSWORD.');
    }
  } finally {
    await sequelize.close();
  }
}

testConnection();

