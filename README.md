# IoT-Based Patient Health Monitoring System - Detailed WBS

## Project Overview
This document serves as the master Work Breakdown Structure (WBS) for the IoT-Based Patient Health Monitoring System. It provides a granular roadmap for development, covering the IoT simulation, edge processing, rule-based alerting, and clinical visualization.

---

## Comprehensive Work Breakdown Structure (WBS)

### Phase 1: Project Management & Architecture Design
*   **1.1 System Architecture Blueprinting**
    *   1.1.1 Define Micro-service Boundaries: Decouple IoT Simulator, Backend API, and Frontend.
    *   1.1.2 WebSocket Strategy: Design room-based broadcasting (Room per Patient/Ward).
    *   1.1.3 PHI Data Modeling: Design Mongoose schemas for Patients, Vitals (Time-series), and Alerts.
    *   1.1.4 API Contract Definition: Document REST endpoints via Swagger/OpenAPI.
*   **1.2 Technical Governance & DevOps Setup**
    *   1.2.1 Environment Configuration: Setup `.env` templates for all three tiers.
    *   1.2.2 Monorepo/Multi-repo Structure: Define directory standards and cross-service types.
    *   1.2.3 CI/CD Pipeline: Configure automated linting and unit test runners.

### Phase 2: IoT Simulation & Edge Intelligence
*   **2.1 Advanced Physiological Data Engine**
    *   2.1.1 Heart Rate (HR) Logic: Implement sine-wave base with random "noise" and circadian drift.
    *   2.1.2 SpO2 & Respiratory Model: Correlate SpO2 drops with HR spikes for realism.
    *   2.1.3 Body Temp Simulation: Slow-moving fluctuations with fever-state triggers.
    *   2.1.4 Anomaly Injection API: Create endpoints to manually trigger "Crisis Events" (e.g., Cardiac Arrest).
*   **2.2 Edge Intelligence & Local Processing**
    *   2.2.1 Data Normalization: Map raw sensor values to standard medical units.
    *   2.2.2 Local Threshold Filtering: Implement "Silent Mode" for normal readings to save bandwidth.
    *   2.2.3 Edge Persistence: Local `db.json` logging for offline-resilience simulation.
    *   2.2.4 Message Batching: Optimize Edge-to-Cloud HTTP/MQTT payloads.

### Phase 3: Scalable Backend Infrastructure
*   **3.1 Core Backend Services**
    *   3.1.1 Vitals Ingestion Controller: High-frequency POST endpoint with validation.
    *   3.1.2 Historical Data Aggregator: MongoDB queries for 24h/7d trend views.
    *   3.1.3 Patient Registry: CRUD operations with encrypted PII fields.
*   **3.2 DSL Rule Engine (The "Brain")**
    *   3.2.1 Rule Parser: Logic to read `rules.json` and convert to executable JS conditions.
    *   3.2.2 Threshold Evaluator: Compare incoming vitals against JSON-defined Min/Max/Avg.
    *   3.2.3 Correlation Logic: Support complex rules (e.g., `IF HR > 120 AND SpO2 < 90 FOR 30s THEN ALERT`).
    *   3.2.4 Notification Dispatcher: Trigger database Alert records and Socket.io events simultaneously.
*   **3.3 Real-time Socket Server**
    *   3.3.1 Connection Manager: Handle Auth handshake and heartbeat.
    *   3.3.2 Selective Broadcasting: Emit vitals only to subscribed medical staff "rooms".

### Phase 4: Clinical Dashboard Development
*   **4.1 UI/UX Infrastructure**
    *   4.1.1 Medical Design System: Implement high-contrast, accessibility-compliant components.
    *   4.1.2 Dashboard Grid: Draggable/Resizable vitals cards for custom layouts.
    *   4.1.3 Navigation: Role-based sidebars (Admin vs. Clinician).
*   **4.2 Real-time Visualizations**
    *   4.2.1 Waveform Implementation: Smooth Recharts/Canvas rendering for ECG-like HR data.
    *   4.2.2 Status Indicators: Color-coded vitals (Green: Normal, Yellow: Warning, Red: Critical).
    *   4.2.3 Alert Panel: Infinite-scroll alert history with "Acknowledge" functionality.
*   **4.3 Frontend State Logic**
    *   4.3.1 Real-time Hook (`useVitals`): Abstract Socket.io logic into a reusable React hook.
    *   4.3.2 Global Store: Manage current active patient and system-wide alert counts.

### Phase 5: Security, Compliance & Data Privacy
*   **5.1 Authentication & Authorization**
    *   5.1.1 Secure Login: Argon2/Bcrypt hashing with JWT issuance.
    *   5.1.2 Refresh Token Logic: Implement secure rotation to prevent session hijacking.
    *   5.1.3 RBAC Middleware: Protect sensitive clinical routes from unauthorized users.
*   **5.2 HIPAA-Inspired Data Protection**
    *   5.2.1 Field-Level Encryption: Encrypt Patient Names/SSNs using AES-256 before DB write.
    *   5.2.2 Secure Transport: Enforce TLS for all traffic and use Helmet.js for header security.
    *   5.2.3 Rate Limiting: Prevent DDoS/Brute-force on IoT and Auth endpoints.
*   **5.3 Audit & Traceability**
    *   5.3.1 Clinical Logs: Record every time a user views a patient's historical data.
    *   5.3.2 System Health Monitoring: Winston/Morgan logging for error tracking.

### Phase 6: QA, Testing & Validation
*   **6.1 Technical Validation**
    *   6.1.1 IoT Load Testing: Script to simulate 500 concurrent patients posting vitals.
    *   6.1.2 Rule Engine Unit Tests: Verify 100% of DSL conditions trigger correctly.
    *   6.1.3 Socket Latency Profiling: Measure time from Edge-Trigger to Dashboard-Render.
*   **6.2 User Acceptance & Deployment**
    *   6.2.1 Clinical Flow Testing: End-to-end walkthrough from "Vitals Drop" to "Nurse Alert".
    *   6.2.2 Documentation: Finalize README, API Docs, and Deployment Guide.

---

## Earned Value Management (EVM) Framework

To ensure the project remains on track financially and chronologically, we utilize Earned Value Analysis (EVA). This provides a "Current State" snapshot of performance.

### 1. Budget Allocation (BAC - Budget at Completion)
*Total Project Budget: $100,000 (Allocated across 12 weeks)*

| Phase | Weightage | Budgeted Cost (PV) |
| :--- | :--- | :--- |
| **P1: Design & Arch** | 10% | $10,000 |
| **P2: IoT & Edge** | 20% | $20,000 |
| **P3: Backend & DSL** | 25% | $25,000 |
| **P4: Frontend & Viz** | 20% | $20,000 |
| **P5: Security & PHI** | 15% | $15,000 |
| **P6: QA & Deployment** | 10% | $10,000 |

### 2. Key Performance Indicators (KPIs)
*   **Planned Value (PV):** The budgeted cost of work scheduled to be completed by today.
*   **Earned Value (EV):** The budgeted cost of the work *actually* completed.
*   **Actual Cost (AC):** The actual money spent on the work completed.
*   **Schedule Variance (SV = EV - PV):** Positive means ahead of schedule.
*   **Cost Variance (CV = EV - AC):** Positive means under budget.
*   **Efficiency Indices:**
    *   **SPI (EV / PV):** Schedule Performance Index (> 1.0 is good).
    *   **CPI (EV / AC):** Cost Performance Index (> 1.0 is good).

### 3. Project Status Tracking Dashboard (Example: Week 4)
| Metric | Value | Interpretation |
| :--- | :--- | :--- |
| **PV (Planned)** | $30,000 | Expected to finish P1 & P2 by Week 4. |
| **EV (Earned)** | $28,000 | P1 is 100% done, P2 is 90% done. |
| **AC (Actual)** | $31,500 | Slightly higher spend on IoT sensor licensing. |
| **SV / SPI** | -$2,000 / 0.93 | **Behind Schedule:** Needs 7% more velocity. |
| **CV / CPI** | -$3,500 / 0.89 | **Over Budget:** Spending $1.12 to earn $1.00. |

---

## Technical Stack Summary
- **Runtime:** Node.js (v18+)
- **Backend:** Express, MongoDB (Atlas), Socket.io
- **Frontend:** React 18, Vite, Recharts, CSS Modules
- **IoT/Edge:** Node.js, Lowdb (JSON Storage)
- **Security:** JWT, CryptoJS, Bcrypt, Express-Rate-Limit

## Project Structure
```text
├── backend/                # Scalable Backend Infrastructure
│   ├── config/             # Database, Socket.io, & Env configurations
│   ├── controllers/        # Express controllers (Auth, Patient, Vitals, Alerts)
│   ├── data/               # DSL-based rules definition (rules.json)
│   ├── middleware/         # Security, Auth, Logging, & Validation middlewares
│   ├── models/             # Mongoose Schemas (User, Patient, Vitals, Alert)
│   ├── routes/             # RESTful API route definitions
│   ├── services/           # Business logic (Rule Engine, Vitals processing)
│   ├── utils/              # Encryption, Logger, & Error handling utilities
│   └── server.js           # Entry point for Express & Socket.io server
├── frontend/               # Clinical Dashboard (React)
│   ├── src/
│   │   ├── components/     # Medical UI components (Charts, Grids, Panels)
│   │   ├── hooks/          # Custom hooks (useRealtimeMonitor)
│   │   ├── pages/          # Dashboard, Login, & Registration pages
│   │   ├── services/       # API & Socket.io client integrations
│   │   ├── store/          # State management (Auth & Monitoring stores)
│   │   ├── utils/          # Medical calculation & Formatting utilities
│   │   ├── App.jsx         # Root application component
│   │   └── main.jsx        # React entry point
│   └── vite.config.js      # Build & Dev server configuration
├── iot-simulator/          # IoT & Edge Simulation Layer
│   ├── config/             # Simulator specific settings
│   ├── utils/              # Simulator logging & formatting
│   ├── db.json             # Edge-level local data storage
│   ├── edgeProcessor.js    # Local data filtering & anomaly detection
│   ├── rules.json          # Edge-side threshold definitions
│   └── simulator.js        # Vitals generation engine (HR, SpO2, Temp)
└── README.md               # Master WBS & System Architecture
```
