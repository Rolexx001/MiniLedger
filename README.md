# MiniLedger — Full Stack Mobile Application

**MiniLedger** is a full-stack personal finance application designed for tracking money lent to friends without the awkwardness. Built with **React Native (Expo)**, **Node.js / Express**, **TypeScript**, **PostgreSQL**, and **Prisma ORM**, it provides real-time financial summaries, overdue tracking, and a streamlined mock OTP authentication workflow.

---

## 1. Project Overview

Loaning money to friends often creates friction and forgotten debts. MiniLedger solves this with:
- **Phone-Based Authentication**: Seamless 2-step mock OTP authentication with 0 external SMS costs.
- **Financial Health Dashboard**: Real-time aggregation of Total Lent, Total Repaid, Outstanding Balance, and Overdue debt.
- **Automated Overdue Detection**: Immediate visual flags and status alerts for loans whose agreed return date has passed.
- **One-Tap Settlement**: Safe, atomic loan status updates (`PENDING` -> `REPAID`) with repayment timestamps.
- **Multi-Tenant User Isolation**: Strict database scoping ensuring users can only view and manage their own loans.

---

## 2. Features

- **Mock OTP Login**:
  - Validation of standard 10-digit Indian mobile numbers (`/^[6-9]\d{9}$/`).
  - Secure in-memory OTP generator with a 5-minute expiry and 30-second resend cooldown.
  - Formatted terminal output for quick copy-pasting during development.
  - JWT token issuance (30-day session) stored persistently via AsyncStorage.
- **Financial Dashboard**:
  - Top summary cards powered by PostgreSQL database aggregation.
  - Interactive filter chips: `All`, `Pending`, `Overdue`, and `Repaid`.
  - Prioritized loan ordering: Overdue and pending loans appear before settled loans.
  - Pull-to-refresh (`RefreshControl`) synchronization.
- **Add Loan Experience**:
  - Clean input fields with inline validation.
  - Quick amount pills (`+₹500`, `+₹1000`, `+₹2000`, `+₹5000`).
  - Preset due date chips (`In 3 Days`, `In 1 Week`, `In 15 Days`, `In 1 Month`) or custom date input.
  - Concurrency lock preventing double submission.
- **Loan Details & Settlement**:
  - Detailed metadata including borrower name, amount, loan date, due date, and settlement timestamp.
  - Overdue warning banners.
  - Confirmation prompt before marking a loan as repaid.
  - Conflict prevention for duplicate repayments.

---

## 3. Technology Stack

### Mobile Application
- **Framework**: [React Native](https://reactnative.dev/) with [Expo SDK 52](https://expo.dev/)
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **HTTP Client**: Axios with automatic JWT injection & 401 response interceptors
- **Icons**: Lucide Icons (`lucide-react-native`)
- **Storage**: `@react-native-async-storage/async-storage`
- **UI Architecture**: Vanilla React Native `StyleSheet` with clean design tokens (dark navy `#0F172A`, emerald green `#059669`, coral red `#DC2626`).

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (v16)
- **ORM**: Prisma ORM (v5)
- **Authentication**: JWT (`jsonwebtoken`)
- **Validation**: Zod schema validation

### Testing & Tooling
- **Test Runner**: Jest (`ts-jest`)
- **API Testing**: Supertest
- **Process Manager**: TSX / Docker Compose

---

## 4. Layered Backend Architecture & Folder Structure

MiniLedger implements a strict, clean **Layered Architecture**:

`Routes → Controllers → Services → Repositories → Prisma/PostgreSQL`

Each layer maintains a single, decoupled responsibility:
- **Routes (`src/routes/`)**: Define endpoints, bind validation middleware, and mount controllers.
- **Controllers (`src/controllers/`)**: Extract validated request data, invoke the appropriate service, and return HTTP status codes and JSON responses.
- **Services (`src/services/`)**: Implement business rules, enforce ownership, perform calculations, format responses, and coordinate repository queries.
- **Repositories (`src/repositories/`)**: Encapsulate all Prisma queries and database interactions with user isolation.
- **Validators (`src/validators/`)**: Define Zod schemas for request validation.
- **Middleware (`src/middleware/`)**: Reusable request validation, JWT authentication, and centralized error handling.
- **Config & Utils (`src/config/`, `src/utils/`)**: Validated environment configuration, custom `AppError`, and JWT utilities.

```text
MiniLedger/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Database schema, models, enums & indexes
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts           # Zod-validated environment configuration
│   │   ├── lib/
│   │   │   └── prisma.ts        # Prisma client singleton
│   │   ├── routes/
│   │   │   ├── index.ts         # Central route aggregator
│   │   │   ├── auth.routes.ts   # Authentication routes
│   │   │   └── loan.routes.ts   # Loan management routes
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts # Auth request-response handling
│   │   │   └── loan.controller.ts # Loan request-response handling
│   │   ├── services/
│   │   │   ├── auth.service.ts  # OTP & authentication business logic
│   │   │   └── loan.service.ts  # Loan business rules & summary calculations
│   │   ├── repositories/
│   │   │   ├── user.repository.ts # User database queries
│   │   │   └── loan.repository.ts # Loan database queries & aggregations
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts # JWT verification middleware
│   │   │   ├── validate.middleware.ts # Zod request validation middleware
│   │   │   └── error.middleware.ts # Centralized error handler
│   │   ├── validators/
│   │   │   ├── auth.validator.ts # Auth Zod schemas
│   │   │   └── loan.validator.ts # Loan Zod schemas
│   │   ├── types/
│   │   │   └── express.d.ts     # Express Request type extensions
│   │   ├── utils/
│   │   │   ├── jwt.ts           # JWT sign & verify functions
│   │   │   └── errors.ts        # Standard AppError class
│   │   ├── app.ts               # Express configuration, cors & error handling
│   │   └── server.ts            # Server entrypoint and port listener
│   ├── tests/
│   │   ├── auth.test.ts         # OTP & JWT authentication tests
│   │   ├── loans.test.ts        # Loan CRUD & user isolation tests
│   │   └── summary.test.ts      # Financial aggregate & overdue calculation tests
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── mobile/
│   ├── app/
│   │   ├── _layout.tsx          # Root Stack & AuthProvider wrapper
│   │   ├── index.tsx            # Initial auth gatekeeper / splash router
│   │   ├── login.tsx            # 2-step OTP authentication screen
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx      # Tab bar, header & user logout action
│   │   │   └── index.tsx        # Dashboard, summary cards & loan list
│   │   ├── add-loan.tsx         # Loan creation modal with React Hook Form + Zod
│   │   └── loan/
│   │       └── [id].tsx         # Loan details & settlement screen
│   ├── components/
│   │   ├── Badge.tsx            # Status pills (Pending, Repaid, Overdue)
│   │   ├── Button.tsx           # Standard buttons with loading states
│   │   ├── Card.tsx             # Surface card with border & elevation
│   │   └── Input.tsx            # Text input with labels & error states
│   ├── hooks/
│   │   └── useLoans.ts          # Reusable data-fetching and mutation hook
│   ├── lib/
│   │   ├── api.ts               # Axios instance, interceptors & API functions
│   │   └── auth.tsx             # AuthContext, AsyncStorage persistence
│   ├── types/
│   │   └── index.ts             # TypeScript definitions
│   ├── assets/                  # App icons & images
│   ├── app.json                 # Expo configuration
│   ├── .env.example
│   └── package.json
├── docker-compose.yml           # Pre-configured PostgreSQL 16 container
├── .gitignore
└── README.md
```

### Why this structure works:
- **No Controller/Service/Repository sprawl**: Route handlers contain the validation, database query, and response logic together, making the complete request-response cycle readable in one file.
- **Co-located logic**: Related backend operations live in `routes/auth.ts` and `routes/loans.ts`.
- **Zero empty files**: Every file serves a specific, documented purpose.

---

## 5. Prerequisites

Before running the project, ensure you have:
1. **Node.js**: `v18.0.0` or higher (tested on Node v24).
2. **npm**: `v9.0.0` or higher.
3. **PostgreSQL**: Local PostgreSQL server OR Docker Desktop to run the included `docker-compose.yml`.
4. **Expo Go** (optional): Installed on your physical Android/iOS phone if testing on hardware.

---

## 6. Installation Instructions

Clone the repository and install dependencies in both projects:

```bash
# 1. Clone repository
git clone https://github.com/your-username/MiniLedger.git
cd MiniLedger

# 2. Install backend dependencies
cd backend
npm install

# 3. Install mobile dependencies
cd ../mobile
npm install
```

---

## 7. PostgreSQL Setup

You can run PostgreSQL either using Docker or a local PostgreSQL installation.

### Option A: Using Docker (Recommended)
From the root directory of `MiniLedger`, run:
```bash
docker compose up -d
```
This spins up PostgreSQL 16 on port `5432` with username `postgres`, password `postgres`, and database `miniledger`.

### Option B: Local PostgreSQL Installation
If you already have PostgreSQL installed natively:
1. Open `psql` or pgAdmin:
   ```sql
   CREATE DATABASE miniledger;
   ```
2. Note your database username, password, and port (default: 5432).

---

## 8. Environment Configuration

### Backend Environment (`backend/.env`)
Copy the example file:
```bash
cd backend
cp .env.example .env
```
Default `.env` values:
```env
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/miniledger?schema=public"

# JWT secret key
JWT_SECRET="miniledger_jwt_secret_dev_key_2026"

# Port
PORT=5000

# Environment mode
NODE_ENV=development
```

### Mobile Environment (`mobile/.env`)
Copy the example file:
```bash
cd mobile
cp .env.example .env
```
Default `.env` values:
```env
# Point to your backend API
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```
*(See Section 15 for Android Emulator or Physical Device networking).*

---

## 9. Prisma Migration Commands

Synchronize your PostgreSQL database schema with Prisma:

```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Push schema directly to PostgreSQL
npm run prisma:push
```

---

## 10. Backend Startup Commands

Run the backend in development watch mode:

```bash
cd backend
npm run dev
```

Output:
```text
======================================================
  MiniLedger Backend Server Started Successfully
  Listening on: http://localhost:5000
  Environment:  development
  Database:     Connected to PostgreSQL via Prisma
======================================================
```

To build and run the production compiled bundle:
```bash
npm run build
npm start
```

---

## 11. Mobile App Startup Commands

To start the Expo development server:

```bash
cd mobile
npm start
```

From the Expo CLI menu:
- Press `w` to open in **Web browser**.
- Press `a` to open in an active **Android Emulator**.
- Scan the QR code using the **Expo Go** app on your physical Android or iPhone.

To run type checks without starting the server:
```bash
npm run check
```

---

## 12. API Endpoint Documentation

All protected endpoints require the header:  
`Authorization: Bearer <JWT_TOKEN>`

### Authentication Endpoints

#### 1. Send OTP
- **URL**: `POST /api/auth/send-otp`
- **Body**:
  ```json
  {
    "phone": "9876543210"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "OTP sent successfully. Please check the backend terminal for the 6-digit code.",
    "cooldownSeconds": 30
  }
  ```
- **Rate Limit Response** (`429 Too Many Requests`):
  ```json
  {
    "error": "Too Many Requests",
    "message": "Please wait 24 seconds before requesting a new OTP.",
    "retryAfter": 24
  }
  ```

#### 2. Verify OTP
- **URL**: `POST /api/auth/verify-otp`
- **Body**:
  ```json
  {
    "phone": "9876543210",
    "otp": "123456"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "OTP verified successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "e2a4a713-7b4f-4a0b-9df2-51a812df713c",
      "phone": "9876543210",
      "createdAt": "2026-10-23T08:15:00.000Z"
    }
  }
  ```

#### 3. Current User Context
- **URL**: `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response** (`200 OK`):
  ```json
  {
    "user": {
      "id": "e2a4a713-7b4f-4a0b-9df2-51a812df713c",
      "phone": "9876543210",
      "createdAt": "2026-10-23T08:15:00.000Z"
    }
  }
  ```

---

### Loan Endpoints

#### 4. Create Loan
- **URL**: `POST /api/loans`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Body**:
  ```json
  {
    "friendName": "Rahul Sharma",
    "amount": 1500,
    "dueDate": "2026-10-30"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Loan created successfully",
    "loan": {
      "id": "83cfca28-b0e5-47d3-9844-4f81014a4805",
      "userId": "e2a4a713-7b4f-4a0b-9df2-51a812df713c",
      "friendName": "Rahul Sharma",
      "amount": "1500.00",
      "dueDate": "2026-10-30T00:00:00.000Z",
      "status": "PENDING",
      "repaidAt": null,
      "receiptUrl": null,
      "createdAt": "2026-10-23T08:16:00.000Z",
      "updatedAt": "2026-10-23T08:16:00.000Z",
      "isOverdue": false
    }
  }
  ```

#### 5. List Loans
- **URL**: `GET /api/loans`
- **Optional Query**: `?status=PENDING` or `?status=REPAID`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "count": 1,
    "loans": [
      {
        "id": "83cfca28-b0e5-47d3-9844-4f81014a4805",
        "friendName": "Rahul Sharma",
        "amount": "1500.00",
        "dueDate": "2026-10-30T00:00:00.000Z",
        "status": "PENDING",
        "repaidAt": null,
        "isOverdue": false
      }
    ]
  }
  ```

#### 6. Get Loan Details
- **URL**: `GET /api/loans/:id`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "loan": {
      "id": "83cfca28-b0e5-47d3-9844-4f81014a4805",
      "friendName": "Rahul Sharma",
      "amount": "1500.00",
      "dueDate": "2026-10-30T00:00:00.000Z",
      "status": "PENDING",
      "repaidAt": null,
      "isOverdue": false
    }
  }
  ```

#### 7. Mark Loan as Repaid
- **URL**: `PATCH /api/loans/:id/repay`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Loan marked as repaid successfully",
    "loan": {
      "id": "83cfca28-b0e5-47d3-9844-4f81014a4805",
      "friendName": "Rahul Sharma",
      "amount": "1500.00",
      "status": "REPAID",
      "repaidAt": "2026-10-23T08:20:00.000Z",
      "isOverdue": false
    }
  }
  ```

#### 8. Financial Summary
- **URL**: `GET /api/loans/summary`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response** (`200 OK`):
  ```json
  {
    "totalLent": "12500.00",
    "totalRepaid": "4500.00",
    "outstandingAmount": "8000.00",
    "overdueAmount": "2000.00",
    "pendingCount": 4,
    "repaidCount": 3,
    "overdueCount": 1
  }
  ```

---

## 13. Mock OTP Instructions

Because MiniLedger avoids expensive SMS gateways for this internship assignment:
1. In the mobile app, enter any valid 10-digit Indian mobile number (e.g. `9876543210`) and tap **Send Verification Code**.
2. Look at the terminal running the backend server (`npm run dev`).
3. You will see an ASCII box clearly displaying your OTP:

```text
======================================================
 [MiniLedger Mock OTP Service]
 Target Phone: +91 9876543210
 Mock OTP:     >>> 337652 <<<
 Expires in:   5 minutes
======================================================
```

4. Type that 6-digit code into the mobile app and tap **Verify & Continue**.

---

## 14. Test Commands

Run the full backend test suite:

```bash
cd backend
npm test
```

Test Results:
- **18 out of 18 tests passing**:
  - Valid and invalid Indian phone validation
  - Resend cooldown enforcement
  - Expired and wrong OTP rejection
  - OTP consumption & JWT issuance
  - Protected route validation & unauthorized access checks
  - Input validation (empty name, negative amounts, invalid dates)
  - Loan ownership & strict multi-tenant isolation (User B cannot view or settle User A's loan)
  - Atomic repayment and duplicate repayment conflict rejection
  - Accurate financial summary calculations (`totalLent`, `totalRepaid`, `outstandingAmount`, `overdueAmount`)
  - Exclusion of repaid loans from overdue calculations

---

## 15. Networking: Android Emulator vs Physical Device

When developing with mobile apps, `localhost` on the mobile device refers to the mobile device itself, NOT your computer.

### A. Web Browser
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

### B. Android Emulator
The Android emulator uses the special alias `10.0.2.2` to refer to your development machine's loopback interface:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api
```

### C. Physical Phone (Expo Go)
Your phone and computer must be connected to the same Wi-Fi network. Find your computer's local IP address:
- **Windows**: Run `ipconfig` (look for IPv4 Address, e.g. `192.168.1.15`).
- **Mac / Linux**: Run `ifconfig` or `ip a`.
Set in `mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.15:5000/api
```
*(Ensure your Windows Firewall allows inbound connections on port 5000).*

---

## 16. Technical Architecture & Explanations

### 1. Authentication Architecture
1. **Mock OTP**: Stored in a lightweight server-side in-memory `Map<string, OtpRecord>` with `expiresAt`, `attempts`, and `lastSentAt`.
2. **Session Persistence**: On verification, a JWT payload `{ userId, phone }` is signed with `JWT_SECRET` (30 days validity) and sent to the client.
3. **Client Storage**: The mobile app persists the JWT and user profile in `@react-native-async-storage/async-storage`.
4. **Auto-Restoration**: On app startup, `lib/auth.tsx` restores the session and validates it against `/api/auth/me`. If a `401 Unauthorized` is ever returned by the API, an Axios interceptor immediately clears storage and redirects the user to `/login`.

### 2. Database Access & Financial Calculations
- Financial calculations use **Prisma Decimal** (`@db.Decimal(12, 2)`) to avoid binary floating-point roundoff errors (e.g. `0.1 + 0.2 = 0.30000000000000004`).
- Summary totals are computed directly in PostgreSQL using `prisma.loan.groupBy` and `prisma.loan.aggregate`.

### 3. Overdue Calculations
- A loan is deemed **overdue** if and only if:
  1. Its status is `PENDING`.
  2. Its `dueDate` timestamp is strictly less than the current UTC timestamp (`Date.now()`).
- Repaid loans are **strictly excluded** from the overdue calculation regardless of when they were due or settled.

---

## 17. Known Limitations & Production Enhancements

1. **In-Memory OTP Store**: In-memory OTP storage is used for development simplicity. In production, pending OTPs would be stored in Redis with TTLs, paired with an SMS provider like Twilio or AWS SNS.
2. **Push Notifications**: In production, automated Expo push notifications would be sent to remind borrowers when a loan due date is 24 hours away.
3. **Receipt Photos**: The database model includes an optional `receiptUrl` column, ready for integration with AWS S3 / Cloudinary multipart image uploads.
