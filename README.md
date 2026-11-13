# International Cambridge School Kishtwar ERP — Enterprise Management Platform

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B%20%7C%20v20%2B-green.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.3-38B2AC.svg)](https://tailwindcss.com/)
[![Database](https://img.shields.io/badge/Database-MySQL%20%7C%20SQLite3-orange.svg)](https://sequelize.org/)
[![Security Status](https://img.shields.io/badge/Security-Enterprise%20WAF%20Hardened-success.svg)](#-cybersecurity-hardening--active-waf)
[![Test Suite](https://img.shields.io/badge/Automated%20Tests-32%2F32%20Passing-brightgreen.svg)](#-automated-testing-suites)
[![License](https://img.shields.io/badge/License-ISC-purple.svg)](LICENSE)

A modern, production-ready, full-stack **Enterprise Resource Planning (ERP)** platform designed for K-12 schools, academies, and educational institutions. 

Features seamless administration, role-scoped academic portals, automated marksheet and report PDF generators, an authoritative **Central Platform Connector**, a dedicated **Business Subscription & Monthly Billing Engine**, and enterprise-grade **Cybersecurity & Web Application Firewall (WAF)** defenses.

---

## 📑 Table of Contents

- [Architectural Overview](#-architectural-overview)
- [Core Functional Modules](#-core-functional-modules)
  - [1. Multi-Role Educational Portals](#1-multi-role-educational-portals)
  - [2. Student Performance & PDF Generation](#2-student-performance--pdf-generation)
  - [3. Central Management Platform Integration](#3-central-management-platform-integration)
  - [4. Business Subscription & Billing Module](#4-business-subscription--billing-module)
  - [5. Strict Non-Financial Data Isolation](#5-strict-non-financial-data-isolation)
- [Cybersecurity Hardening & Active WAF](#-cybersecurity-hardening--active-waf)
- [Project Directory Structure](#-project-directory-structure)
- [Installation & Quick Start](#-installation--quick-start)
- [cPanel & VPS Cron Configuration](#-cpanel--vps-cron-configuration)
- [Automated Testing Suites](#-automated-testing-suites)
- [API Reference Summary](#-api-reference-summary)
- [Git Repository & Author](#-git-repository--author)

---

## 🏛️ Architectural Overview

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Application (React 18 + Tailwind CSS)"]
        UI_ADMIN["Admin & Admin2 Portals"]
        UI_TEACHER["Teacher Portal (Class-Scoped)"]
        UI_STUDENT["Student & Parent Portals"]
        UI_FC["Fee Collector Portal"]
        UI_CENTRAL["Central Platform Onboarding & Billing Dashboard"]
        UI_SUSPEND["Red-Themed Service Suspension Screen"]
    end

    subgraph SecurityLayer["Security & Gateway Perimeter"]
        WAF["Enterprise WAF (securityLogger.js)"]
        HELMET["Hardened HTTP Headers (CSP, HSTS, Clickjacking Guard)"]
        RATE_LIMIT["Tiered Rate Limiters (Auth, Password, Admin, Fees)"]
        CSRF_GUARD["Double-Submit CSRF Protection"]
        ENTITLEMENT["Entitlement Check (Non-Destructive HTTP 423 Suspension)"]
    end

    subgraph ServiceLayer["Backend Engine (Node.js + Express + Sequelize)"]
        AUTH_SVC["Auth Service (Timing-Safe Login, Bcrypt Cost 12)"]
        ACADEMIC_SVC["Academic Engine (Marks, Attendance, Timetable, PDF Reports)"]
        FEE_SVC["School Fee Ledger (Strictly Air-Gapped)"]
        CENTRAL_SVC["Central Integration Connector (HMAC-SHA256, Replay Defense)"]
        BILLING_SVC["Business Subscription & Monthly Payment Register"]
    end

    subgraph DatabaseLayer["Persistence Layer (Sequelize ORM - MySQL / SQLite)"]
        DB_ACADEMICS[("Academic, Student & Teacher Tables")]
        DB_FEES[("Internal School Fee & Structure Tables")]
        DB_CENTRAL[("CentralConfig, SyncLogs, CommandLogs")]
        DB_BILLING[("CentralSubscriptions, BillingInvoices, PaymentRegister")]
    end

    ClientLayer --> SecurityLayer
    SecurityLayer --> ServiceLayer
    ServiceLayer --> DatabaseLayer
```

---

## 🚀 Core Functional Modules

### 1. Multi-Role Educational Portals

| Role | Access Level & Key Capabilities |
| :--- | :--- |
| **Super Admin (`admin`)** | Full system control: academic sessions, timetable generator, staff credentials, fees, logs, central integration, and business billing dashboard. |
| **Admin 2 (`admin2`)** | Secondary administration: result approvals, student admissions, class incharge assignments, datesheets, and staff attendance. |
| **Teacher (`teacher`)** | **Strictly scoped to assigned classes**: attendance marking, marks entry, subject analytics, leave applications, and student performance tracking. |
| **Student / Parent (`student`, `parent`)** | View personal academic marks, attendance %, exam timetables, download report cards, and check fee status (protected against IDOR). |
| **Fee Collector (`fee_collector`)** | Student fee collection, receipt generation, category management, admissions, and fee structure queries. |

---

### 2. Student Performance & PDF Generation

- **Role-Scoped Performance Analytics**: Administrators and Teachers can view detailed academic performance. Teachers are cryptographically and query-scoped to see **only students belonging to classes assigned to them**.
- **Comprehensive Exam History**: Tracks marks, total scores, grades ($A^+$ through $F$), class rank, and monthly attendance percentages.
- **Automated Document Generators**:
  - **Consolidated Marksheet PDF**: Generates multi-exam consolidated marksheets with subject marks, totals, percentages, and institution stamps.
  - **Comprehensive Student Performance Report PDF**: Formats student bio, complete attendance statistics, exam breakdowns, and remarks into a downloadable report card.

---

### 3. Central Management Platform Integration

Connects this ERP installation to our centralized multi-school management dashboard:

- **Permanent School ID**: Authority-issued immutable identifier (e.g. `SCH-2026-01001`) that persists across credential rotations, version upgrades, and reconnections.
- **Copy-and-Paste Pairing**: School Admin copies the School ID from `/admin/central-integration`, pastes it into the Central Dashboard, which issues an authenticated challenge token to complete pairing and provision permissions.
- **Non-Destructive Remote Management**: Executes whitelisted, auditable commands (`suspend`, `reactivate`, `extend_subscription`, `update_subscription`, `sync_now`, `health_check`, `diagnostics`, `rotate_credentials`). Arbitrary SQL, shell, or code execution is strictly prohibited.
- **Application-Level Suspension (HTTP 423)**: If a school's license expires or a central administrator issues a suspension, the ERP returns HTTP 423 Locked for normal users while leaving database records 100% intact and integration endpoints active for instant remote reactivation.
- **cPanel & CLI Cron Compatibility**: Background synchronization can be executed via cron (`node server/scripts/cronSync.js`) with built-in concurrency lock-file protection.

---

### 4. Business Subscription & Billing Module

Manages **our commercial ERP service revenue** (licensing fees schools pay to us):

- **School Subscription Profiles**: Configures plans (`Standard`, `Professional`, `Enterprise`, `Custom`), standard monthly charges, custom rates, validity dates, and grace periods.
- **Monthly Billing Register**: Generates monthly invoices for each school. Supports **full payments**, **partial payments**, **unpaid accounts**, and **overpayments** (advance credit).
- **Historical Charge Preservation**: Modifying future subscription charges preserves historical invoices and billing records.
- **Audited Payment Corrections**: Correcting payment records requires a mandatory reason and logs before/after values to `CentralBillingAuditLog`.
- **Centralized Suspension / Reactivation Workflow**: Central administrators can remotely pause or restore school access with confirmation dialogs, outstanding balance displays, and command acknowledgements.
- **Red-Themed Suspension Page (`/suspended`)**: Displays a mobile-responsive screen informing users of the temporary pause, providing billing support contacts, and guaranteeing that all school records are safe.
- **Business Dashboard & CSV Export**: Displays total connected schools, active/suspended subscriptions, monthly revenue, outstanding balances, and one-click CSV export.

---

### 5. Strict Non-Financial Data Isolation

> [!IMPORTANT]
> **STRICT ARCHITECTURAL AIR-GAP**:
> - The central connector and business billing modules **NEVER** collect, read, store, or transmit internal school finances (student fees, fee balances, fee structures, receipts, school bank accounts, expenses, or staff payroll).
> - Multi-layer enforcement:
>   1. **Model Layer**: `Fee` and `ClassFeeStructure` models are never imported into central sync routines.
>   2. **Runtime Scanner**: `securityService.assertNoFinancialData()` deeply inspects payloads prior to transmission and throws fatal exceptions if any financial keyword is detected.
>   3. **Automated Verification**: Negative automated tests verify that injecting fee data triggers instant security rejections.

---

## 🔒 Cybersecurity Hardening & Active WAF

The platform is fortified against the OWASP Top 10 vulnerabilities:

```
+---------------------------------------------------------------------------------------------------+
| THREAT VECTOR                 | DEFENSIVE IMPLEMENTATION IN CAMBRIDGE ERP                         |
+---------------------------------------------------------------------------------------------------+
| SQL Injection (SQLi)          | Parameterized Sequelize queries + Active WAF regex inspection     |
| Cross-Site Scripting (XSS)    | React auto-escaping + WAF script filter + Strict CSP headers       |
| Remote Command Injection      | Strict command whitelist; arbitrary shell execution blocked       |
| Prototype Pollution           | Deep object inspection blocking '__proto__' and 'constructor'     |
| Directory Traversal / LFI     | Path basename normalization + strict upload boundary validation   |
| Authentication Timing Attacks | Normalized dummy bcrypt compare on non-existent account lookups   |
| MIME-Type Spoofing / Polyglot | Binary magic-byte header validation (JPEG, PNG, WebP, GIF)        |
| Insecure Direct Object (IDOR) | Strict role guard: teachers denied access to student fee ledgers  |
| Brute Force / DDoS            | Tiered rate limiters (Auth, Password Change, Credentials, Fees)   |
| Clickjacking & Sniffing       | 'X-Frame-Options: DENY', 'X-Content-Type-Options: nosniff'        |
| Token Forgery                 | Strict JWT secret entropy check; fails safe in production         |
| Information Disclosure        | Production error handler sanitizes messages; stack traces hidden  |
+---------------------------------------------------------------------------------------------------+
```

---

## 📁 Project Directory Structure

```text
Cambridge-ERP/
├── package.json                   # Root workspace orchestrator & test runner
├── README.md                      # Comprehensive system documentation
├── client/                        # React frontend SPA
│   ├── public/                    # Static assets & HTML template
│   ├── src/
│   │   ├── components/            # Reusable UI (Sidebar, Navbar, Modals)
│   │   ├── context/               # AuthContext & SettingsContext
│   │   ├── pages/
│   │   │   ├── admin/             # Admin dashboard, settings, logs
│   │   │   │   ├── CentralIntegration.jsx       # Central platform onboarding UI
│   │   │   │   └── CentralBillingDashboard.jsx  # Revenue & payment register UI
│   │   │   ├── common/
│   │   │   │   ├── StudentPerformance.jsx       # Student analytics & marksheet PDF
│   │   │   │   └── SuspensionPage.jsx           # Red-themed service suspension page
│   │   │   ├── teacher/           # Teacher attendance & grading
│   │   │   └── parent/            # Student & parent portal screens
│   │   └── utils/api.js           # Axios interceptors (CSRF, 401, 423 redirect)
│   └── package.json
└── server/                        # Node.js Express backend API
    ├── server.js                  # App bootstrap, security headers, route mounting
    ├── config/                    # Database (MySQL/SQLite) and RBAC definitions
    ├── middleware/                # Security middleware stack
    │   ├── auth.js                # JWT verification, RBAC helpers
    │   ├── csrf.js                # Double-submit cookie CSRF guard
    │   ├── entitlementCheck.js    # Application-level suspension middleware (HTTP 423)
    │   ├── errorHandler.js        # Production error sanitizer
    │   ├── rateLimiters.js        # Multi-tier endpoint rate limiters
    │   ├── securityLogger.js      # Enterprise inline WAF threat scanner
    │   └── upload.js              # Multer + binary magic-byte validator
    ├── models/                    # Sequelize database models
    │   ├── CentralConfig.js       # School ID, connector secrets & status
    │   ├── CentralSyncLog.js      # Audit log for non-financial telemetry sync
    │   ├── CentralCommandLog.js   # Audit log for remote management commands
    │   ├── CentralSubscription.js # School subscription plans & custom charges
    │   ├── CentralBillingInvoice.js # Historical monthly billing invoices
    │   ├── CentralBillingPayment.js # Payment register with correction tracking
    │   └── CentralBillingAuditLog.js # Forensic audit trail for revenue changes
    ├── routes/                    # API endpoints
    │   ├── central.js             # Onboarding, pairing, diagnostics, and webhooks
    │   ├── centralBilling.js      # Revenue dashboard, subscriptions, payment register
    │   ├── students.js            # Student records & consolidated PDF generator
    │   ├── fees.js                # School internal fee ledger (RBAC hardened)
    │   └── auth.js                # Authentication, lockout, and password management
    ├── scripts/
    │   └── cronSync.js            # Standalone cPanel / VPS CLI cron sync runner
    ├── services/central/          # Core connector & billing engines
    │   ├── billingService.js      # Subscription & payment ledger management
    │   ├── commandProcessor.js    # Predefined remote command whitelist dispatcher
    │   ├── configService.js       # Permanent School ID and credential rotation
    │   ├── dataExtractor.js       # Non-financial operational data aggregator
    │   ├── httpClient.js          # Lightweight native fetch client
    │   ├── mockCentralPlatform.js # Built-in sandbox & fallback provider
    │   ├── pairingService.js      # Challenge-response pairing verification
    │   ├── registrationService.js # Authoritative registration handler
    │   ├── securityService.js     # HMAC-SHA256, timing-safe checks, assertNoFinancialData
    │   └── syncEngine.js          # Heartbeat telemetry and operational sync
    ├── tests/                     # Automated test suites
    │   ├── centralIntegration.test.js # 12-point connector verification suite
    │   ├── centralBilling.test.js     # 10-point revenue & billing verification suite
    │   └── securityHardening.test.js  # 10-point active WAF & attack verification suite
    └── package.json
```

---

## ⚙️ Installation & Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Database**: MySQL (Production) or SQLite3 (Development / Staging)

### Step-by-Step Setup

```bash
# 1. Clone the repository
git clone https://github.com/httpsghsthakur/Cambridge-ERP.git
cd Cambridge-ERP

# 2. Install dependencies for root, server, and client
npm run install:all

# 3. Configure backend environment
cp server/.env.example server/.env
# Edit server/.env with your JWT_SECRET, PORT, and database credentials

# 4. Seed the database with initial sessions and admin user
npm run seed

# 5. Start the production server (serves both API and React frontend)
npm start
```

### Development Mode (Concurrent Terminals)

```bash
# Terminal 1: Backend API with Nodemon auto-reload
npm run dev:server

# Terminal 2: React Development Server
npm run dev:client
```

---

## ⏱️ cPanel & VPS Cron Configuration

For production environments on cPanel, shared Linux hosting, or VPS deployments, scheduled non-financial operational synchronization can be configured via cron:

```bash
# Example cPanel Cron Job (runs every hour):
/usr/local/bin/node /home/username/public_html/server/scripts/cronSync.js >> /home/username/cron_sync.log 2>&1
```

- **Concurrency Lock**: Employs a file-based lock (`.cron_sync.lock`) with a 15-minute timeout to prevent overlapping executions.
- **Graceful Error Handling**: Automatically logs telemetry status, releases locks upon completion, and terminates with standard exit codes.

---

## 🧪 Automated Testing Suites

The platform includes **32 automated tests** across 3 test suites verifying integration, revenue management, and security defenses:

```bash
# Run all 3 test suites from root
npm test

# Or run directly inside server directory
npm test --prefix server
```

### Test Suite Summary

1. **Central Platform Integration (`centralIntegration.test.js`)**: 12 Tests
   - Permanent School ID assignment & duplicate protection
   - Challenge-response pairing & automatic permission provisioning
   - Aggregated operational telemetry extraction (zero PII)
   - Strict financial data exclusion assertion (`assertNoFinancialData`)
   - Predefined command whitelist & rejection of arbitrary SQL/shell code
   - HMAC-SHA256 signature verification & timestamp replay protection
   - Application-level suspension and instant reactivation
2. **Business Subscription & Billing (`centralBilling.test.js`)**: 10 Tests
   - Custom pricing, plans, and historical rate preservation
   - Full, partial, and overpayments in monthly payment register
   - Payment corrections with mandatory audit trail
   - Dashboard revenue metrics and balance calculations
   - Remote suspension with mandatory reasoning & data preservation proof
   - Remote reactivation and access restoration
   - Total financial air-gap from school internal fee tables
3. **Security Hardening & WAF (`securityHardening.test.js`)**: 10 Tests
   - Emergency route `/api/fix-db` locked behind SuperAdmin
   - Active WAF blocks SQL Injection, XSS, and Prototype Pollution
   - Active WAF blocks Path Traversal and Remote Command Injection
   - Automated penetration testing bot fingerprinting (`sqlmap`, `nikto`)
   - Binary magic-byte image validation rejecting spoofed files
   - Teacher role denied access to student fee ledgers (IDOR defense)
   - Error handler suppresses stack traces in production

---

## 📡 API Reference Summary

### Authentication & Core Endpoints
- `POST /api/auth/login` — Timing-attack protected login (sets `httpOnly` JWT cookie).
- `POST /api/auth/logout` — Secure cookie invalidation.
- `GET /api/auth/me` — Fetches authenticated user profile and permissions.
- `PUT /api/auth/change-password` — Rate-limited password updates.

### Central Platform Connector Endpoints (`server/routes/central.js`)
- `GET /api/central/status` — Connector state, permanent School ID, pairing token, and sync logs.
- `POST /api/central/register` — Initiates registration and acquires permanent School ID.
- `POST /api/central/pair` — Completes challenge-response pairing.
- `POST /api/central/sync` — Manually triggers non-financial operational data sync.
- `POST /api/central/heartbeat` — Sends technical telemetry and retrieves pending commands.
- `GET /api/central/diagnostics` — Runs comprehensive connector integrity checks.
- `GET /api/central/suspension-info` — Public status check for the suspension screen.
- `POST /api/central/webhook` — HMAC-SHA256 authenticated inbound management webhook.

### Business Billing & Subscription Endpoints (`server/routes/centralBilling.js`)
- `GET /api/central-billing/dashboard` — Revenue analytics, charges, and 6-month trends.
- `GET /api/central-billing/subscriptions` — List school subscriptions and balances.
- `PUT /api/central-billing/subscriptions/:school_id/charges` — Update subscription pricing.
- `POST /api/central-billing/subscriptions/:school_id/generate-invoice` — Generate monthly invoice.
- `POST /api/central-billing/payments` — Record payment in monthly register.
- `PUT /api/central-billing/payments/:payment_id` — Correct payment with mandatory audit reason.
- `POST /api/central-billing/subscriptions/:school_id/suspend` — Issue remote suspension command.
- `POST /api/central-billing/subscriptions/:school_id/reactivate` — Issue remote reactivation command.
- `GET /api/central-billing/audit-logs` — Complete billing and command audit history.

### Academic & Student Records Endpoints
- `GET /api/students` — Filtered student records (role-scoped for teachers).
- `GET /api/students/:id/consolidated-marksheet` — Generates consolidated marksheet PDF.
- `GET /api/students/:id/performance-report` — Generates comprehensive performance report PDF.
- `GET /api/fees/student/:studentId` — Student fee ledger (restricted to admin, fee collector, and student).

---

## 👤 Git Repository & Author

- **GitHub Repository**: [`https://github.com/httpsghsthakur/Cambridge-ERP.git`](https://github.com/httpsghsthakur/Cambridge-ERP.git)
- **Author Identity**: `httpsghsthakur <gt64384@gmail.com>`
- **Active Branch**: `main`
- **License**: ISC
