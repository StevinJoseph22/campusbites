# 🍽️ CampusBites — Smart Multi-Campus Canteen Management System

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?logo=socket.io)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> **CampusBites** is an enterprise-grade, real-time food court ordering, token dispatching, and accounting system built for multi-campus university environments (Central Campus & Airport Road Campus).

📖 **For detailed academic and architectural documentation, please see [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md).**

---

## 🌟 Key Features

- 🏢 **Multi-Campus Support**: Seamless location switching between **Central Campus (CC)** and **Airport Road Campus (ARC)** with persistent preferences.
- 🏷️ **Swiggy-Style Promotional Offers**: Real-time percentage & flat discount engine with attractive badges and live home dashboard showcases.
- ⚡ **Live Real-Time Sync**: Instant socket-driven updates for menu changes, stock levels, item availability, and kitchen statuses.
- ⏰ **15-Minute Pickup Slot Scheduler**: Smart queue management with live Kitchen Rush buffer estimators (`Rush Less`, `Moderate`, `High Rush`).
- 🛒 **Unified Multi-Vendor Cart**: Order dishes from multiple campus stalls in a single checkout session.
- 💳 **Razorpay Payment Gateway**: Integrated UPI, Card, Net Banking, and QR payment support.
- 📊 **Super Admin Financial Ledger**: Real-time sales, takeaway parcel fees, and platform commission breakdown with 100% mathematical reconciliation.
- 📥 **Multi-Sheet Excel Audit Reports**: Export detailed period summaries and token-level dish records (`.xlsx`).
- 🔄 **Partial Order Hold Resolution**: Interactive customer decision modals (Refund vs. Substitute) when items run out in the kitchen.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/stevinjoseph2003/campusbites.git
cd campusbites
npm install
```

### 2. Configure Environment
Create a `.env` file (refer to `.env.example`):
```env
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=campusbites_secure_secret_key_2026
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_campusbites
RAZORPAY_KEY_SECRET=rzp_test_secret_key_campusbites
PORT=3000
```

### 3. Initialize Database
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Default Roles & Credentials

| Role | Username | Password |
|---|---|---|
| **Super Admin** | `admin` | `admin123` |
| **Vendor (ARC)** | `southexpressARC` | Vendor Passcode |
| **Vendor (CC)** | `campusgrillCC` | Vendor Passcode |
| **Student** | University Register No. | Student Password |

---

## 📄 Documentation

For full architectural diagrams, problem statement analysis, ER diagrams, sequence flows, and methodology, view **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)**.

---

## 👤 Author

- **Stevin Joseph B** — [stevinjoseph2003@gmail.com](mailto:stevinjoseph2003@gmail.com)
- Institution: Kristu Jayanti University
