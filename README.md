### Prompt for Fuzayl Ameen

You are an IoT systems engineer. Build a data simulation and edge-processing module for an IoT-based Patient Health Monitoring System.

🎯 Goal
Simulate realistic patient vital data (without real sensors), process it at the “edge” level, detect abnormal conditions in real-time, and send structured data + alerts to a backend API.

🧱 Tech Stack
* Node.js (preferred) OR Python
* Axios / Requests (HTTP communication)
* MQTT (optional, if implementing IoT protocol)
* dotenv for configuration

📡 Core Requirements
1. Patient Data Simulation
Simulate vitals for multiple patients (at least 5–10):
Parameters:
* heartRate (60–120 bpm)
* temperature (36–39 °C)
* spo2 (85–100 %)
* bloodPressure (e.g., "120/80")

2. Realistic Data Patterns (IMPORTANT)
Do NOT generate purely random values.
Include:
* Day/Night variation (lower heart rate at night)
* Gradual changes instead of sudden jumps
* Occasional abnormal spikes (simulate emergencies)
* Patient-specific baseline differences
Example:
* Patient A → naturally higher heart rate
* Patient B → occasional low SpO2

3. Edge Processing Logic (Local Intelligence)
Before sending data to backend:
* Validate incoming data
* Apply rule-based checks locally
Example rules:
* IF heartRate > 110 → HIGH_HEART_RATE alert
* IF spo2 < 92 → LOW_OXYGEN alert
* IF temperature > 38 → FEVER alert

4. DSL-Based Rule Engine (Edge Level)
Support rules defined in JSON format:
Example: { "field": "heartRate", "operator": ">", "value": 110, "alert": "HIGH_HEART_RATE", "severity": "HIGH" }
Requirements:
* Parse rule dynamically
* Apply rules to each data point
* Allow multiple rules

5. Alert Generation
When a rule is triggered:
* Create alert object:
    * patientId
    * alertType
    * severity
    * message
    * timestamp
* Send alert immediately to backend

6. Data Transmission
Send data every 1–2 seconds per patient:
Endpoints:
* POST /api/vitals
* POST /api/alerts
Payload Example: { "patientId": "P1", "heartRate": 95, "temperature": 37.2, "spo2": 97, "bloodPressure": "120/80", "timestamp": "ISO format" }

7. Multi-Patient Simulation
* Simulate at least 5 patients simultaneously
* Use asynchronous loops / intervals
* Each patient should have unique behavior

8. Fault & Edge Cases
Simulate:
* Missing data fields
* Sensor noise
* Sudden extreme values

9. Logging
* Log generated data
* Log alerts
* Log errors

10. Project Structure
iot-simulator/ │── simulator.js │── edgeProcessor.js │── rules.json │── config/ │── utils/ │── .env

📦 Output Requirements
* Complete working code
* Modular structure (separate simulation and edge logic)
* Comments explaining logic
* Sample rules.json file
* Instructions to run the simulator

Build this as a realistic IoT simulation system suitable for a demo/hackathon project.

### Prompt for Jai Harish

You are a senior frontend engineer. Build a modern, responsive Patient Health Monitoring Dashboard using React.js and Tailwind CSS.

🎯 Goal
Create a real-time dashboard UI for an IoT-based healthcare system that displays patient vitals, alerts, and analytics using simulated data from a backend API.

🧱 Tech Stack
* React.js (Vite preferred)
* Tailwind CSS
* Axios (API calls)
* Socket.io-client (real-time updates)
* Recharts (charts & graphs)
* React Router (optional)

📊 Core Features
1. Dashboard Layout
* Clean medical UI (like hospital dashboards)
* Sidebar (Patients list)
* Main panel (Vitals + Charts)
* Top bar (App name + user info)

2. Patient List (Sidebar)
* Show list of patients
* Click to select patient
* Highlight active patient

3. Vitals Cards (Top Section)
Display:
* ❤️ Heart Rate
* 🌡 Temperature
* 🫁 SpO2
* 🩸 Blood Pressure
Each card should:
* Show current value
* Color indicators:
    * Green → Normal
    * Yellow → Warning
    * Red → Critical

4. Real-Time Updates
* Connect to backend using Socket.io
* Update vitals instantly when new data arrives

5. Charts Section
Use Recharts:
* Line chart for heart rate (last 30 records)
* Line chart for temperature
* Area chart for SpO2

6. Alerts Panel 🚨
* Show list of triggered alerts
* Include:
    * Alert type
    * Severity (color-coded)
    * Timestamp

7. API Integration
Backend endpoints:
* GET /api/patients
* GET /api/vitals/:patientId
* GET /api/alerts/:patientId

8. State Management
* Use React hooks (useState, useEffect)
* Optional: Context API for global state

9. Folder Structure
src/ │── components/ │ ├── Sidebar.jsx │ ├── VitalsCard.jsx │ ├── Charts.jsx │ ├── Alerts.jsx │── pages/ │ ├── Dashboard.jsx │── services/ │ ├── api.js │── App.jsx │── main.jsx

10. Styling Requirements
* Use Tailwind CSS
* Modern card UI
* Soft shadows, rounded corners
* Responsive design (mobile + desktop)

11. Extra Features (Optional)
* Dark mode toggle 🌙
* Search patient
* Filter alerts
* Loading skeletons

📦 Output Requirements
* Full working React code
* Tailwind setup instructions
* Example API integration
* Socket.io connection setup
* Clean, reusable components

Build a clean, production-like UI suitable for a hackathon/demo project.

### Prompt for Gokul Harish

You are a senior Data Engineer + Security Engineer. Build a module for an IoT-based Patient Health Monitoring System that performs Exploratory Data Analysis (EDA), DSL-based rule management, basic HIPAA-like security simulation, and automated report generation.

🎯 Goal
Analyze patient vitals data, extract meaningful insights, dynamically manage alert rules using a DSL, ensure secure handling of sensitive data, and generate structured reports for doctors/admins.

🧱 Tech Stack
* Python (Pandas, NumPy, Matplotlib / Seaborn)
* FastAPI or Flask (optional for APIs)
* JSON (for DSL rules)
* JWT (for security simulation)
* Cryptography / hashlib (basic encryption)
* Report generation: PDF (reportlab) or DOCX (python-docx)

📊 1. Exploratory Data Analysis (EDA)
Input:
* Patient vitals dataset (JSON/CSV from backend)
Tasks:
* Clean and preprocess data
* Handle missing values
* Convert timestamps
Analysis:
* Average heart rate per patient
* Max/min temperature
* SpO2 trends
* Alert frequency per patient
* Time-based trends (hourly/daily)
Visualization:
* Line charts (heart rate over time)
* Bar charts (alerts per patient)
* Heatmaps (optional)
Output:
* Graphs
* Summary insights like:
    * "Patient P2 shows frequent low SpO2 during night hours"

🧠 2. DSL (Domain-Specific Language) for Rules
Goal:
Allow dynamic creation and evaluation of alert rules.
Rule Format (JSON):
{ "field": "spo2", "operator": "<", "value": 92, "alert": "LOW_OXYGEN", "severity": "HIGH" }
Requirements:
* Parse rules dynamically
* Support operators: >, <, >=, <=, ==
* Apply rules to dataset
* Allow multiple rules
* Store rules in rules.json
Bonus:
* Support compound rules: "heartRate > 110 AND spo2 < 92"

🔐 3. Security (HIPAA-like Simulation)
Implement:
Authentication
* JWT-based login system
* Roles: Admin, Doctor
Data Protection
* Mask sensitive data (e.g., patient name → P***)
* Encrypt stored sensitive fields (basic level)
API Security (if API used)
* Token validation middleware
* Rate limiting (basic)
Logging
* Track access to patient data
* Log unauthorized attempts

📄 4. Report Generation
Generate Reports for:
* Individual patient
* Overall system
Report Contents:
* Patient details
* Vitals summary
* Graphs (EDA)
* Alerts summary
* Risk level (LOW / MEDIUM / HIGH)
Format:
* PDF or DOCX
Example Sections:
1. Patient Overview
2. Vitals Trends
3. Alert History
4. Risk Assessment
5. Recommendations

⚙️ 5. Integration
* Fetch data from backend API OR use sample dataset
* Allow exporting reports via API or file download
* Ensure compatibility with frontend dashboard

📁 Project Structure
eda-module/ │── analysis.py │── rules_engine.py │── security.py │── report_generator.py │── rules.json │── data/ │── outputs/

📦 Output Requirements
* Fully working Python code
* Sample dataset
* Sample rules.json
* Generated graphs
* At least one sample report file
* Clear comments and documentation

Build this as a modular, clean, and demo-ready system suitable for a student project with real-world relevance.


### Prompt for Janagiram

You are a senior backend engineer. Build a scalable backend system for an IoT-based Patient Health Monitoring Application using Node.js (Express).
🎯 Goal
Develop a backend that receives simulated IoT patient vitals, processes them in real-time, applies rule-based alerts (DSL), and serves data to a React dashboard.

🧱 Core Requirements
1. Tech Stack
* Node.js + Express
* MongoDB (Mongoose)
* Socket.io (for real-time updates)
* JWT Authentication
* dotenv for environment config

2. Data Model (MongoDB Schemas)
Patient Schema
* patientId (String, unique)
* name
* age
* gender
* bloodGroup
Vitals Schema
* patientId (ref)
* heartRate (Number)
* temperature (Number)
* spo2 (Number)
* bloodPressure (String)
* timestamp (Date)
Alerts Schema
* patientId
* alertType (HIGH_HEART_RATE, LOW_SPO2, etc.)
* message
* severity (LOW, MEDIUM, HIGH)
* timestamp

3. API Endpoints
Vitals
* POST /api/vitals → receive simulated IoT data
* GET /api/vitals/:patientId → fetch patient vitals history
Patients
* POST /api/patients → create patient
* GET /api/patients → list patients
Alerts
* GET /api/alerts → get all alerts
* GET /api/alerts/:patientId → alerts per patient

4. Real-Time System
* Use Socket.io
* Emit new vitals data to frontend
* Emit alerts instantly when triggered

5. Rule Engine (DSL Support)
Implement a simple DSL parser for rules like: "IF heartRate > 110 THEN alert = HIGH_HEART_RATE"
Requirements:
* Store rules in JSON
* Evaluate rules on every incoming vitals record
* Trigger alerts dynamically
Example Rule: { "field": "heartRate", "operator": ">", "value": 110, "alert": "HIGH_HEART_RATE", "severity": "HIGH" }

6. Edge Processing Logic
When new vitals arrive:
1. Validate data
2. Store in DB
3. Run rule engine
4. Generate alerts if conditions match
5. Emit via WebSocket

7. Fake Data Support
Ensure backend supports high-frequency incoming data (every 1–2 seconds per patient).

8. Security (HIPAA-like Simulation)
* JWT authentication middleware
* Input validation (Joi or express-validator)
* Basic encryption for sensitive data
* Rate limiting

9. Project Structure
backend/ │── models/ │── routes/ │── controllers/ │── services/ │── middleware/ │── utils/ │── config/ │── server.js

10. Extra Features (Optional but recommended)
* Pagination for vitals history
* Filtering by date range
* Logging (Winston or Morgan)
* Error handling middleware

📦 Output Requirements
* Provide complete working code
* Include comments for understanding
* Include sample .env file
* Include instructions to run the server

Build this as a production-ready but simple backend suitable for a student project/demo.
  
