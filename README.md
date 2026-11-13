# ERP - School Management System

A comprehensive, full-stack Enterprise Resource Planning (ERP) platform for School Management. Built using modern web technologies to streamline administrative workflows, enhance teacher-student-parent collaboration, and provide clean dashboard analytics.

## 🚀 Features

- **Admin Dashboard**: Comprehensive statistics, user management (Students, Teachers, Parents), and system configuration.
- **Student Portal**: Access to attendance records, assignments, grades, and schedules.
- **Teacher Portal**: Attendance marking, grade inputs, schedule management, and performance tracking.
- **Parent Portal**: Monitor child's attendance, fees, and performance.
- **Interactive UI**: Fully responsive interface built with Tailwind CSS.

---

## 🛠️ Tech Stack

**Frontend:** React.js, Tailwind CSS, React Router  
**Backend:** Node.js, Express.js, Sequelize ORM  
**Database:** MySQL  
**Deployment:** Hostinger Node.js (via GitHub)

---

## 📁 Project Structure

```text
ERP/
├── package.json         # Root orchestrator (install + build scripts)
├── .gitignore           # Git ignore rules
├── client/              # React frontend application
│   ├── src/             # React source code
│   ├── public/          # Static assets
│   ├── build/           # Production build (auto-generated)
│   └── package.json     # Client dependencies
└── server/              # Node/Express backend API
    ├── server.js         # Entry point (serves API + React build)
    ├── routes/           # API route handlers
    ├── models/           # Sequelize database models
    ├── middleware/        # Auth, RBAC, rate limiting
    └── package.json      # Server dependencies
```

---

## ⚙️ Local Development

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- MySQL database

### Quick Start
```bash
# Clone the repository
git clone https://github.com/your-username/ERP.git
cd ERP

# Install all dependencies (client + server)
npm run build

# Create environment files
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit both .env files with your actual database credentials and secrets

# Seed the database (first time only)
npm run seed

# Start the server (serves both API + React frontend)
npm start
```

### Development Mode (separate terminals)
```bash
# Terminal 1: Start backend with auto-reload
npm run dev:server

# Terminal 2: Start React dev server
npm run dev:client
```

---

## 🔒 Security Features & Best Practices

The application is built with security as a primary concern:

- **Environment Variables**: `.env` files are **never committed** to Git. Safe templates (`.env.example`) are provided.
- **Authentication**: All API routes are protected with JWT (JSON Web Tokens) with secure expiration policies.
- **Authorization**: Role-Based Access Control (RBAC) ensures users (Admin, Teacher, Student, Parent, Fee Collector) can only access appropriate endpoints.
- **Data Protection**: 
  - Passwords are cryptographically hashed using `bcrypt` before storage.
  - SQL Injection prevention is handled natively by the Sequelize ORM using parameterized queries.
  - Cross-Site Scripting (XSS) is mitigated by React's automatic string escaping.
- **Network Security**:
  - `Helmet.js` enforces strict HTTP security headers (CSP, HSTS, X-Frame-Options).
  - Strict CORS policies are implemented to restrict API access to trusted origins.
  - Global Rate Limiting is active (e.g., 200 requests per 15 minutes per IP) to prevent brute-force and DDoS attacks.
- **Error Handling**: Production mode suppresses stack traces to prevent leaking sensitive infrastructure details.

---

## 📜 Available Scripts

| Script | Description |
|---|---|
| `npm start` | Start the production server |
| `npm run build` | Install all deps + build React client |
| `npm run dev:server` | Start backend with nodemon (auto-reload) |
| `npm run dev:client` | Start React dev server on port 3001 |
| `npm run seed` | Seed the database with initial data |
| `npm run install:all` | Install both client and server dependencies |
