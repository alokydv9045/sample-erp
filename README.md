<div align="center">

# 🏫 EduSphere ERP
**The Complete School Workspace**

[![Status](https://img.shields.io/badge/status-PRODUCTION-success.svg)](#)
[![Stack](https://img.shields.io/badge/stack-Next.js%2015%20%7C%20Express%20%7C%20Prisma-blue)](#)

A centralized, responsive dashboard empowering teachers, administrators, and staff to run their school efficiently in isolation.

</div>

---

## 🌟 Core Features

EduSphere ERP is built for intuitive user experiences, comprehensive tracking, and enterprise-grade scale.

- **📊 Responsive Dashboards**: A unified interface seamlessly adapting to desktops, tablets, and mobile devices.
- **🎓 Academics & Admissions**: Manage the entire student lifecycle—from initial enrollment to daily classes, automated exams, and insightful report cards.
- **👔 Human Resources (HR)**: Built-in staff directory, attendance handling, leave tracking, and integrated payroll processing.
- **📚 Assets & Services**: Track library book issues, manage general school inventory, transport logistics, and hostel assignments.
- **📢 Real-Time Communications**: A dynamic global notification system and instant modal pop-ups for critical school-wide alerts.

---

## 🛠 Architecture

The school workspace is divided into two robust components:

- **Frontend (Client)**: Next.js 15 (App Router), React 19, TailwindCSS, and shadcn/ui.
- **Backend (Server)**: Express.js REST API backed by Prisma ORM connected to an isolated PostgreSQL instance per school.

---

## 🚀 Quick Start

Ensure you have Node.js 20+ and your PostgreSQL instance running.

### 1. Launch the API Server
```bash
# Navigate to the server folder, install dependencies, and run
cd server
npm install
npm run dev
# Running on http://localhost:5001
```

### 2. Launch the Client Dashboard
```bash
# In a new terminal, navigate to the client folder, install, and run
cd client
npm install
npm run dev
# Running on http://localhost:3001
```

---

## 📦 Production Deployment

Easily compile optimized assets for production environments.

**Server**:
```bash
cd server
npm run build # Automatically generates the optimized Prisma client
```

**Client**:
```bash
cd client
npm run build # Generates the Next.js production build bundle
```

<br>
<div align="center">
Made with ❤️ as part of the <b>EduSphere</b> suite.
</div>
