# Synchro Electricals Pvt. Ltd. — Production Tracking System

An enterprise-grade, mobile-first web application for electrical panel production tracking, real-time stage logging, automated stopwatch timers, camera QR code scanning, and manpower performance evaluation.

---

## 🚀 Key Features

### 1. 📱 Mobile-First Shop-Floor UI ("Next Next" Rapid Entry)
- Designed specifically for phone screens and tablets with touch-friendly tap targets and zero auto-zoom on iOS (`16px+` inputs).
- **Step-by-Step Production Wizard**:
  - Clear heading for each of the 11 industrial manufacturing stages.
  - Automatic system stopwatch recording (`started_at` and `completed_at` generated from clock).
  - Rapid **"✓ Complete & Next Stage ➔"** workflow to record operator signatures and bottleneck delays instantly.

### 2. 🔲 QR Code Serial Number & Live Tracking URL
- Every Job Card automatically receives a unique Serial Number (e.g., `SE26090450`) and a high-resolution QR code encoding the live public tracking URL (`/track/[serialNumber]`).
- **Printable Sticker Layout**:
  - Company branding (`SYNCHRO ELECTRICALS PVT. LTD.`), Job Card number, Assembly Line, Product description, Supervisor, and PPC names.
  - Direct 1-tap sharing via **WhatsApp** and **Email**.
- **Normal Smartphone Camera Scanning**:
  - When scanned by any normal phone camera app, opens the public live tracking view without requiring login to preview.
  - Displays panel status, live working stopwatch, stage completion velocity, and an interactive **Process Time Distribution Graph** showing how much time each process took.
  - If a Fitter or Supervisor uses the app or is logged in on that phone, tapping **"Update Status"** immediately unlocks the production stage wizard.

### 3. ⏱️ Live Stopwatch & Admin-Only Timestamp Protection
- When an operator starts a stage, clicking **"▶ Start Stage"** auto-records the live start time.
- When finished, clicking **"✓ Complete & Next Stage ➔"** calculates the exact duration in hours and advances to the next stage.
- **Admin Privilege Restriction**: Operators and supervisors cannot alter or tamper with recorded timestamps. Only users with the `admin` role can unlock manual date/time adjustments with a mandatory override justification, logged directly to the audit trail.

### 4. 📊 Comprehensive Dashboard & Analytics
- **Live KPI Metrics**: Active Panels, Completed & Dispatched Today, Delayed Panels, Average Lead Time per Panel, Rework Cases.
- **Assembly Lines 1 to 7 Workstation Grid**: Real-time workload, active vs completed panels, and completion rates.
- **Visual Trend Charts (Chart.js)**:
  - *Production Bottlenecks & Delay Causes* (Bar Chart).
  - *11 Industrial Stages Velocity* (Line Chart showing panel throughput).

### 5. 👥 Team & Manpower Performance Evaluation
- As requested, this module is kept separate from the main dashboard and accessible via the **Team Performance** tab.
- Evaluates individual operator metrics:
  - Leaderboard ranking & overall Efficiency Rating Score.
  - Total manufacturing stages completed.
  - Cumulative hours spent on the shop floor.
  - Average cycle time per stage.
  - On-time accuracy rate vs delay occurrences.
  - Stage-by-stage breakdown of panels handled.
  - CSV export and print-ready reporting.

### 6. 🔐 Admin Portal & Access Control
- Manage Fitter, Supervisor, PPC, and Admin accounts.
- 4-digit mobile security PINs for instant 1-tap staff switching on shop-floor phones.
- Full tamper-evident audit trail log.

---

## 🗄️ Database Architecture (Supabase PostgreSQL)

- **Dedicated Schema**: `synchro_production_tracking` (isolated from other schemas).
- **Tables**:
  - `synchro_production_tracking.app_users`: User credentials, roles (`admin`, `supervisor`, `fitter`, `ppc`), and PINs.
  - `synchro_production_tracking.job_cards`: Registered panels, customer codes, lot quantities, lines, and statuses.
  - `synchro_production_tracking.stage_logs`: 11 stages per panel, start/end timestamps, duration, delays, and admin overrides.
  - `synchro_production_tracking.rework_logs`: Rejection reasons, corrective actions, and supervisor sign-offs.
  - `synchro_production_tracking.audit_trail`: Tamper-evident system activity log.

---

## 🔑 Default Seed Logins

| Role | Username | Full Name | 4-Digit PIN | Password |
|---|---|---|---|---|
| **System Admin** | `admin` | Admin Manager | `1234` | `admin123` |
| **Supervisor** | `amit` | Amit Verma | `1234` | `sup123` |
| **Supervisor** | `sandeep` | Sandeep Kumar | `2345` | `sup123` |
| **Fitter** | `ramesh` | Ramesh K. | `1111` | `fitter123` |
| **Fitter** | `suresh` | Suresh P. | `2222` | `fitter123` |
| **PPC** | `rajesh` | Rajesh Sharma | `4444` | `ppc123` |
