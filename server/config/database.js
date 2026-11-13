const path = require('path');
const { Sequelize } = require('sequelize');

// ── Ensure .env is loaded even when this file is imported directly ────────────
// (e.g. from check_users.js or seed.js). If dotenv already ran, this is a no-op
// because dotenv never overwrites existing process.env values.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ── Validate required env vars ────────────────────────────────────────────────
const isProd = process.env.NODE_ENV === 'production';
const hasMySqlEnv = process.env.DB_NAME && process.env.DB_USER;

let sequelize;

if (hasMySqlEnv) {
  // MySQL Configuration (Production or explicit Dev)
  const dbHost = !process.env.DB_HOST || process.env.DB_HOST === 'localhost' ? '127.0.0.1' : process.env.DB_HOST;
  const dbPort = parseInt(process.env.DB_PORT, 10) || 3306;

  console.log('[DB CONFIG] Initialising Sequelize with MySQL');
  console.log(`[DB CONFIG]   Host     : ${dbHost}`);
  
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS || '',
    {
      host: dbHost,
      port: dbPort,
      dialect: 'mysql',
      logging: isProd ? false : console.log,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      dialectOptions: {
        connectTimeout: 20000,
        supportBigNumbers: true,
        bigNumberStrings: false,
      },
      define: { timestamps: true, underscored: true, freezeTableName: false },
      retry: { max: 3 },
    }
  );
} else {
  // SQLite Fallback (Local Development)
  console.log('[DB CONFIG] ⚠️ MySQL env variables missing. Falling back to SQLite.');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: false, // keep it quiet
    define: { timestamps: true, underscored: true, freezeTableName: false }
  });
}

module.exports = sequelize;
