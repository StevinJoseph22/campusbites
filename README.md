# 🍽️ CampusBites — Smart Multi-Campus Canteen Management System

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?logo=socket.io)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> **CampusBites** is an enterprise-grade, real-time university food court pre-ordering, zero-click automated thermal printing, smart multi-college registration, and accounting platform.

📖 **For detailed academic and architectural documentation, please see [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md).**

---

## 🌟 Key Features & Core Innovations

### 1. 🔍 Deep Mailbox Verification & Multi-College Registration
- **Direct SMTP Envelope Handshake**: Connects directly to institutional mail exchange servers (MX) on port 25 (`HELO`, `MAIL FROM`, `RCPT TO`) to detect non-existent student/faculty addresses (`550 5.1.1 NoSuchUser / Mailbox Not Found`) before issuing OTPs.
- **Roll Number & Batch Syntax Engine**: Validates institutional formats (e.g. `21bcaf59`, `22bca101`, `23cs42`) and rejects incomplete prefixes like `21bcaf` with actionable user guidance.
- **Zero-Default Typeahead**: Clean onboarding with zero pre-selected colleges; search popup reveals dynamically as the user types.
- **100% Strict Database OTP Security**: Zero demo code bypasses; verified against unexpired `prisma.otpVerification` records.
- **Already-Registered User Guidance**: 1-click password reset and sign-in shortcuts.

```mermaid
flowchart TD
    A["User enters Official ID / Roll No."] --> B["1. Syntax & Roll Number Pattern Check"]
    B -- "Incomplete (e.g. 21bcaf)" --> ERR1["Show Prompt: Add Roll Digits (e.g. 21bcaf59)"]
    B -- "Valid Format" --> C["2. Duplicate Account Check"]
    C -- "Already Registered" --> ERR2["Show 1-Click Reset / Sign-In Guide"]
    C -- "New User" --> D["3. DNS MX Lookup & Direct SMTP Envelope Handshake"]
    D --> E{"Mailbox Exists on College Server?"}
    E -- "Server returns 550 / NoSuchUser" --> ERR3["❌ 'Mailbox not found on college mail server'"]
    E -- "Mailbox Verified Active (250 OK)" --> F["4. Dispatch Branded HTML Email via Gmail SMTP"]
    F --> G{"Delivery Accepted?"}
    G -- "Accepted" --> H["5. Save OTP to Database & Start 60s Timer"]
```

---

### 2. 📶 Direct WebUSB / WebBluetooth Silent 0-Click Thermal Printing
- **Direct ESC/POS Driver**: Background silent printing over **WebSerial / WebUSB Virtual COM** and **WebBluetooth GATT** without opening browser print modals.
- **Universal Hardware Compatibility**: Works with **Essae PR-55**, **TVS RP 3200**, **Epson TM-T88/TM-T20**, **Posiflex**, **NGX**, and portable 58mm/80mm Bluetooth printers.
- **Automated KOT Dispatch**: Automatically prints kitchen order tickets (KOT) on order arrival (`PLACED`), acceptance (`CONFIRMED`), or cancellation (`REFUNDED`).
- **Kitchen-Optimized Format**: Large bold Token Number, Stall Name, Student Roll No, Pickup Slot, and Item List with special cooking notes (prices omitted for kitchen privacy).

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Server as CampusBites Backend
    participant VendorUI as Vendor Orders Portal
    participant HardwareDriver as WebUSB / WebBluetooth Driver
    participant ThermalPrinter as Thermal Printer (Essae / POS)

    Customer->>Server: Places Order & Completes Payment
    Server-->>VendorUI: Real-Time WebSocket Event (`NEW_ORDER`)
    VendorUI->>VendorUI: Play Sound Alert & Render Live Card
    VendorUI->>HardwareDriver: Dispatch Silent Print Job (Raw ESC/POS Binary)
    HardwareDriver->>ThermalPrinter: Stream Chunked Byte Stream (0-Click)
    ThermalPrinter-->>ThermalPrinter: Print Kitchen Order Ticket (KOT) Slip
```

---

### 3. ⚡ Zero-Lag Streaming Loaders & Food-Themed Skeletons
- **Next.js App Router Streaming Loaders (`loading.tsx`)**: Instant layout streaming across Student, Vendor, and Admin portals.
- **Component-Level Shimmer Skeletons**: Custom placeholders for dish cards, order queues, analytics cards, and stall directories to eliminate dark or frozen screens during navigation.

---

### 4. 🍽️ "Dine-In Only" (No Takeaway / Parcel) Enforcement
- **Menu Level Control**: Vendors can flag specific dishes (e.g. ice creams, sizzlers, hot soups) as **Dine-In Only**.
- **Cart & Checkout Guards**: Prevents parcel packaging fee calculation and restricts checkout if a student attempts to order Dine-In only items for takeaway.

---

### 5. 🔍 Smart Global Dish Search
- Searches across dish names, food categories, stall names, and descriptions with real-time highlight tags on canteen cards.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/Stevin5952/campusbites.git
cd campusbites
npm install
```

### 2. Configure Environment
Create a `.env.local` file (refer to `.env.example`):
```env
DATABASE_URL=postgresql://user:password@host:5432/campusbites
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secure_secret_key
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_MODE=TEST
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
RESEND_API_KEY=re_your_resend_key
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

## 👥 Default Roles & Portals

| Role | Portal Path | Description |
|---|---|---|
| **Super Admin** | `/admin` | University analytics, vendor onboarding, and global finance |
| **Vendor** | `/vendor/orders` | Live order queue, menu manager, sales report, printer settings |
| **Student** | `/student/dashboard` | Canteen exploration, menu ordering, multi-stall cart, and token tracker |

---

## 📄 Documentation

For full architectural diagrams, ER schemas, sequence flows, and methodology, view **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)**.

---

## 👤 Author

- **Stevin Joseph B** — [stevinjoseph2003@gmail.com](mailto:stevinjoseph2003@gmail.com)
- Institution: Kristu Jayanti University

