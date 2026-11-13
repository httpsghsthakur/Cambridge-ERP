const path = require('path');
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const classSubjectRoutes = require('./routes/classSubjects');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const hpp = require('hpp');

// ── Load environment variables FIRST — before any other module reads process.env
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { sequelize } = require('./models');
const { protect, isSuperAdmin } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const auditLogger = require('./middleware/auditLogger');
const securityLogger = require('./middleware/securityLogger');

const app = express();
const port = parseInt(process.env.PORT, 10) || 5000;
const host = process.env.HOST || '0.0.0.0';
const isProd = process.env.NODE_ENV === 'production';

// ── Global Process Error Handlers ─────────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
  // Give the logger a moment to flush, then exit
  setTimeout(() => process.exit(1), 1000);
});

// Trust the first proxy hop (essential for rate limiting behind reverse proxies)
app.set('trust proxy', 1);

// ── Security Headers (L5) ─────────────────────────────────────────────────────
// Disable x-powered-by header
app.disable('x-powered-by');

// Configure Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://fcm.googleapis.com", "https://*.push.services.mozilla.com"],
      workerSrc: ["'self'"],
      childSrc: ["'self'", "blob:"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  xFrameOptions: { action: 'deny' },
  xContentTypeOptions: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Additional Security Headers (Permissions-Policy & Cross-Domain Policy)
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  next();
});

// ── Global Rate Limiter (Disabled to prevent blocking requests) ─────────────────
// Pass-through middleware so requests are never blocked
app.use((req, res, next) => next());

// ── CORS ───────────────────────────────────────────────────────────────────────
// Allow all origins (including cambridge-erp.ktwr.in, subdomains, and localhost)
app.use(cors({
  origin: true,
  credentials: true
}));

// ── Body Parsers with size limits (M9) ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(hpp()); // Protect against HTTP Parameter Pollution
app.use(compression());

// ── Global Audit Logger (A2) ──────────────────────────────────────────────────
app.use(auditLogger);

// ── Global Security Logger ────────────────────────────────────────────────────
app.use(securityLogger);

// ── Serve React static files (production) ────────────────────────────────────
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
app.use(express.static(clientBuildPath));

// ── Serve uploaded files (avatars, documents) ─────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
const csrfProtection = require('./middleware/csrf');
app.use('/api', csrfProtection);

const { entitlementCheck } = require('./middleware/entitlementCheck');
app.use(entitlementCheck);

app.use('/api/central', require('./routes/central'));
app.use('/api/central-billing', require('./routes/centralBilling'));
app.use('/api/v1/connector', require('./routes/connector'));

app.use('/api/class-subjects', classSubjectRoutes);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/results', require('./routes/results'));
app.use('/api/session', require('./routes/session'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/fc', require('./routes/feeCollector'));
app.use('/api/teacher-attendance', require('./routes/teacherAttendance'));
app.use('/api/staff-leaves', require('./routes/staffLeaves'));
app.use('/api/class-incharge', require('./routes/classIncharge'));
app.use('/api/class-fees', require('./routes/classFees'));
app.use('/api/credentials', require('./routes/credentials'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/events', require('./routes/events'));
app.use('/api/datesheets', require('./routes/datesheets'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/security-logs', require('./routes/securityLogs'));

// ── Emergency Database Fix Route (Restricted strictly to Super Admin) ─────────
app.get('/api/fix-db', protect, isSuperAdmin, async (req, res) => {
  try {
    await sequelize.sync({ alter: true });
    const { Session } = require('./models');
    let msg = 'Database sync successful. ';
    const count = await Session.count();
    if (count === 0) {
      await Session.create({ name: '2024-2025', start_date: '2024-04-01', end_date: '2025-03-31', is_active: true });
      msg += 'Created default session.';
    } else {
      msg += 'Session already exists.';
    }
    res.json({ success: true, message: msg });
  } catch (err) {
    console.error('[DATABASE FIX ERROR]', err);
    res.status(500).json({ success: false, message: 'Database synchronization failed.' });
  }
});

// ── Database status (shared between health and db-check) ──────────────────────
let dbStatus = { connected: false, error: null, checkedAt: null };
// ── Health check (quick — uses cached status) ─────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: dbStatus.connected ? 'OK' : 'ERROR',
    message: 'School ERP API running',
    database: dbStatus
  });
});

// ── Database check (live — runs a fresh authenticate()) ───────────────────────
app.get('/api/db-check', async (req, res) => {
  try {
    await sequelize.authenticate();
    dbStatus.connected = true;
    dbStatus.error = null;
    dbStatus.checkedAt = new Date().toISOString();
    res.json({
      status: 'OK',
      database: 'connected',
      checkedAt: dbStatus.checkedAt,
    });
  } catch (err) {
    dbStatus.connected = false;
    dbStatus.error = err.message;
    dbStatus.checkedAt = new Date().toISOString();
    res.status(503).json({
      status: 'ERROR',
      database: err.message,
      checkedAt: dbStatus.checkedAt,
    });
  }
});

app.get('/api/seed-demo-data', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { sequelize, User, Student, Teacher, Session, Fee, Notification, ClassFeeStructure } = require('./models');

    // Make sure we have a session
    let session = await Session.findOne({ where: { is_active: true } });
    if (!session) {
      session = await Session.create({ name: '2024-2025', start_date: '2024-06-01', end_date: '2025-05-31', is_active: true });
    }

    // Add demo teachers
    const teachers = await Teacher.bulkCreate([
      { teacher_id: 'TCH001', name: 'Mrs. Sunita Verma',  subject: 'Mathematics',    phone: '9901234567', status: 'active', assigned_classes: '8th,9th,10th' },
      { teacher_id: 'TCH002', name: 'Mr. Rakesh Joshi',   subject: 'Science',        phone: '9912345678', status: 'active', assigned_classes: '7th,8th,9th' },
      { teacher_id: 'TCH003', name: 'Ms. Anjali Dubey',   subject: 'English',        phone: '9923456789', status: 'active', assigned_classes: '8th,9th,10th' },
      { teacher_id: 'TCH004', name: 'Mr. Pankaj Tiwari',  subject: 'Social Studies', phone: '9934567890', status: 'active', assigned_classes: '7th,8th' }
    ], { ignoreDuplicates: true });

    // Add demo students
    const students = await Student.bulkCreate([
      { student_id: 'STU001', first_name: 'Aanya',  last_name: 'Sharma', class: '8th',  section: 'A', roll_number: 1, session_id: session.id, gender: 'Female', parent_name: 'Rajesh Sharma',  parent_phone: '9812345678', parent_email: 'rajesh@example.com' },
      { student_id: 'STU002', first_name: 'Ravi',   last_name: 'Kumar',  class: '8th',  section: 'A', roll_number: 2, session_id: session.id, gender: 'Male',   parent_name: 'Suresh Kumar',   parent_phone: '9823456789', parent_email: 'suresh@example.com' },
      { student_id: 'STU003', first_name: 'Priya',  last_name: 'Singh',  class: '9th',  section: 'B', roll_number: 1, session_id: session.id, gender: 'Female', parent_name: 'Mohan Singh',    parent_phone: '9834567890', parent_email: 'mohan@example.com' }
    ], { ignoreDuplicates: true });

    // Add fees
    await ClassFeeStructure.bulkCreate([
      { class: 'Playgroup', monthly_fee: 1200, admission_fee: 2500, annual_fee: 600,  promotion_fee: 0,   exam_fee: 100 },
      { class: '8th',       monthly_fee: 2500, admission_fee: 4500, annual_fee: 1200, promotion_fee: 500, exam_fee: 350 },
      { class: '9th',       monthly_fee: 2800, admission_fee: 5000, annual_fee: 1200, promotion_fee: 500, exam_fee: 400 }
    ], { ignoreDuplicates: true });

    // Make sure admin exists
    const adminPass = await bcrypt.hash('Admin@123', 12);
    await User.bulkCreate([
      { name: 'PBM Kishtwar Admin', email: 'pbm.kishtwar@gmail.com', password: adminPass, role: 'admin' },
      { name: 'Admin User', email: 'admin@school.com', password: adminPass, role: 'admin' },
      { name: 'Fee Collector', email: 'fees@school.com', password: adminPass, role: 'fee_collector' }
    ], { ignoreDuplicates: true });

    res.send('<h1>✅ Database Successfully Seeded!</h1><p>Demo data has been loaded into your Hostinger database.</p><p><a href="/login">Go back to login</a></p>');
  } catch (error) {
    res.status(500).send(`<h1>❌ Seeding Failed</h1><p>${error.message}</p>`);
  }
});

// ── React SPA catch-all (must be AFTER all /api routes) ──────────────────────
// Any request that doesn't match an API route gets the React app's index.html,
// allowing React Router to handle client-side routing.
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// ── Dedicated Error Handler (L6, M10) ──────────────────────────────────────────
app.use(errorHandler);

// ── Startup ───────────────────────────────────────────────────────────────────
// Start listening immediately so the server stays online and Hostinger doesn't
// return a 503. Database connection happens asynchronously in the background so


app.listen(port, host, () => {
  console.log('════════════════════════════════════════════════════════');
  console.log(`  School ERP Server started`);
  console.log(`  Host     : ${host}`);
  console.log(`  Port     : ${port}`);
  console.log(`  NODE_ENV : ${process.env.NODE_ENV || 'not set'}`);
  console.log('════════════════════════════════════════════════════════');

  // ── Connect to database asynchronously ──────────────────────────────────
  sequelize.authenticate()
    .then(async () => {
      console.log('[DB] ✅ MySQL connected successfully');
      dbStatus.connected = true;
      dbStatus.error = null;
      dbStatus.checkedAt = new Date().toISOString();



      // ── Schema sync strategy ────────────────────────────────────────────
      // PRODUCTION  → sync() with NO alter and NO force. Tables must already
      //               exist (created via schema.sql or migrations).
      // DEVELOPMENT → sync({ alter: true }) to auto-apply model changes.

      // Pre-sync fix: Add session_id to class_fee_structures to prevent sync crash
      try {
        await sequelize.query('ALTER TABLE `class_fee_structures` ADD COLUMN `session_id` INTEGER NOT NULL DEFAULT 1;');
      } catch (e) {}

      // NOTE: We no longer automatically clean duplicate indexes or force alter:true on every boot.
      // This caused severe startup delays and 503 timeouts on Hostinger.
      // If schema updates are needed, they should be applied via a dedicated route or script.

      if (isProd) {
        console.log('[DB] Production mode — running sync() without alter to prevent 503 timeouts');
        await sequelize.sync();
        
        // Run hotfixes for existing tables
        await sequelize.query('ALTER TABLE `settings` MODIFY COLUMN `value` LONGTEXT;').catch(err => {
          console.error('[DB] Failed to alter settings table to LONGTEXT:', err.message);
        });

        // Migration check: If tables were created with camelCase timestamps, drop them once to recreate with snake_case
        try {
          const [results] = await sequelize.query("SHOW COLUMNS FROM `document_submissions` LIKE 'createdAt'");
          if (results && results.length > 0) {
            console.log('[DB] Found outdated camelCase columns. Dropping tables to recreate with correct snake_case timestamps...');
            await sequelize.query("DROP TABLE IF EXISTS `document_submissions`");
            await sequelize.query("DROP TABLE IF EXISTS `document_requests`");
            await sequelize.query("DROP TABLE IF EXISTS `events`");
          }
        } catch (e) {
          // If table doesn't exist yet, it will throw an error, which is fine
        }

        // Auto-create any new tables that were added after initial deployment
        const newTableQueries = [
          `CREATE TABLE IF NOT EXISTS \`events\` (
            \`id\` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
            \`title\` VARCHAR(150) NOT NULL,
            \`description\` TEXT,
            \`event_date\` DATETIME NOT NULL,
            \`location\` VARCHAR(150),
            \`is_active\` TINYINT(1) DEFAULT 1,
            \`created_by\` INTEGER,
            \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB;`,
          `CREATE TABLE IF NOT EXISTS \`document_requests\` (
            \`id\` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
            \`title\` VARCHAR(255) NOT NULL,
            \`description\` TEXT,
            \`document_type\` ENUM('pdf','image','any') DEFAULT 'any',
            \`recipient_type\` ENUM('everyone','all_students','all_teachers','individual') NOT NULL,
            \`recipients\` JSON,
            \`custom_fields\` JSON,
            \`created_by\` INTEGER NOT NULL,
            \`deadline\` DATETIME,
            \`status\` ENUM('active','closed') DEFAULT 'active',
            \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB;`,
          `CREATE TABLE IF NOT EXISTS \`document_submissions\` (
            \`id\` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
            \`request_id\` INTEGER NOT NULL,
            \`user_id\` INTEGER NOT NULL,
            \`file_url\` VARCHAR(255) NOT NULL,
            \`custom_data\` JSON,
            \`status\` ENUM('pending','approved','rejected') DEFAULT 'pending',
            \`feedback\` TEXT,
            \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB;`
        ];
        for (const sql of newTableQueries) {
          try { await sequelize.query(sql); } catch (e) { console.error('[DB] Table creation warning:', e.message); }
        }
        console.log('[DB] ✅ New tables checked / created');

        // ── Add missing columns that models expect but production may lack ───
        const alterQueries = [
          // Login security columns on users table
          `ALTER TABLE \`users\` ADD COLUMN \`login_attempts\` INT DEFAULT 0;`,
          `ALTER TABLE \`users\` ADD COLUMN \`lock_until\` DATETIME NULL;`,
          `ALTER TABLE \`users\` ADD COLUMN \`password_changed_at\` DATETIME NULL;`,
          `ALTER TABLE \`users\` ADD COLUMN \`profile_photo\` VARCHAR(255) NULL;`,
          `ALTER TABLE \`users\` ADD COLUMN \`phone\` VARCHAR(15) NULL;`,
          // Teacher staff_type column
          `ALTER TABLE \`teachers\` ADD COLUMN \`staff_type\` VARCHAR(50) DEFAULT 'Teacher';`,
          `ALTER TABLE \`teachers\` ADD COLUMN \`document_type\` VARCHAR(50) NULL;`,
          `ALTER TABLE \`teachers\` ADD COLUMN \`document_number\` VARCHAR(100) NULL;`,
          `ALTER TABLE \`teachers\` ADD COLUMN \`teacher_id\` VARCHAR(20) NULL;`,
          // Student columns that may be missing
          `ALTER TABLE \`students\` ADD COLUMN \`student_status\` ENUM('active','inactive','alumni','transferred','suspended') DEFAULT 'active';`,
          `ALTER TABLE \`students\` ADD COLUMN \`source\` ENUM('admin_created','admission_approved') DEFAULT 'admin_created';`,
          `ALTER TABLE \`students\` ADD COLUMN \`admission_request_id\` INT NULL;`,
          `ALTER TABLE \`students\` ADD COLUMN \`created_by\` INT NULL;`,
          `ALTER TABLE \`students\` ADD COLUMN \`approval_status\` ENUM('pending','approved','rejected') DEFAULT 'approved';`,
          `ALTER TABLE \`students\` ADD COLUMN \`approved_by\` INT NULL;`,
          `ALTER TABLE \`students\` ADD COLUMN \`approved_at\` DATETIME NULL;`,
          `ALTER TABLE \`students\` ADD COLUMN \`rejection_reason\` TEXT NULL;`,
          `ALTER TABLE \`students\` ADD COLUMN \`student_id\` VARCHAR(20) NULL;`,
        ];
        for (const sql of alterQueries) {
          try { await sequelize.query(sql); } catch (e) {
            // ER_DUP_FIELDNAME (1060) = column already exists — safe to ignore
            if (!e.message.includes('Duplicate column name') && !e.message.includes('ER_DUP_FIELDNAME')) {
              console.error('[DB] ALTER warning:', e.message);
            }
          }
        }
        console.log('[DB] ✅ Column migrations checked');
      } else {
        console.log('[DB] Development mode — skipping automatic sync() to prevent 503 timeouts.');
        // We do not return sequelize.sync() here anymore.
        // If you need to sync in development, use a manual script or endpoint.
      }
    })
    .then(async () => {
      console.log('[DB] ✅ Database tables verified');
      try {
        const {
          migratePendingStudents,
          migrateFeeColumns,
          migrateTeacherSubjectColumn,
          migrateDatesheetAndAchievementTables,
          migrateSessionAttendanceAndPromotionColumns,
          migrateStudentMarksheetColumns,
        } = require('./utils/dbMigrator');
        await migratePendingStudents();
        await migrateFeeColumns();
        await migrateTeacherSubjectColumn();
        await migrateDatesheetAndAchievementTables();
        await migrateSessionAttendanceAndPromotionColumns();
        await migrateStudentMarksheetColumns();

        // Auto-create default session if none exists (Hotfix for Hostinger setup)
        const { Session, User } = require('./models');
        const sessionCount = await Session.count();
        if (sessionCount === 0) {
          await Session.create({
            name: '2024-2025',
            start_date: '2024-04-01',
            end_date: '2025-03-31',
            is_active: true
          });
          console.log('[DB] ✅ Default session 2024-2025 auto-created');
        }

        const { rejectOldPendingStudents, calculateOverdueFees } = require('./utils/cleanupTasks');
        // Run once on boot, then every 24 hours
        await rejectOldPendingStudents();
        await calculateOverdueFees();
        setInterval(rejectOldPendingStudents, 24 * 60 * 60 * 1000);
        setInterval(calculateOverdueFees, 24 * 60 * 60 * 1000);
      } catch (migrationErr) {
        console.error('[DB] ❌ Automatic migration of pending students failed:', migrationErr.message);
      }
    })
    .catch((err) => {
      console.error('════════════════════════════════════════════════════════');
      console.error('[DB] ❌ Database connection FAILED');
      console.error(`[DB] Error name    : ${err.name}`);
      console.error(`[DB] Error message : ${err.message}`);

      // Helpful diagnostics for common Hostinger errors
      if (err.message.includes('ECONNREFUSED')) {
        console.error('[DB] HINT: MySQL is not reachable. Check DB_HOST and DB_PORT.');
        console.error('[DB] HINT: On Hostinger, DB_HOST should be 127.0.0.1 and DB_PORT 3306.');
      } else if (err.message.includes('Access denied')) {
        console.error('[DB] HINT: Wrong DB_USER or DB_PASS. Check Hostinger → Databases → MySQL.');
      } else if (err.message.includes('Unknown database')) {
        console.error('[DB] HINT: DB_NAME is wrong. Verify the exact database name in Hostinger panel.');
      }

      console.error('════════════════════════════════════════════════════════');
      dbStatus.connected = false;
      dbStatus.error = err.message;
      dbStatus.checkedAt = new Date().toISOString();
    });
});