
# 🛒 Express Shop API

A complete, secure, and scalable Backend API for an e-commerce/educational platform built with **Node.js**, **Express.js**, **TypeScript**, and **Prisma ORM**. The project follows a modular **Layered Architecture** to ensure clean code, maintainability, and scalability.

---

## 📌 Key Features

- 🔐 **Secure Authentication:** JWT-based authentication, password hashing with Bcrypt, and a secure Logout mechanism using a **Redis** Blacklist.
- 📧 **2-Step Verification & Password Reset:** OTP (One-Time Password) delivery via Email using Nodemailer with beautiful HTML templates.
- 👥 **Role-Based Access Control (RBAC):** Three user roles (USER, TEACHER, ADMIN) with dedicated middlewares for route protection.
- 🎓 **Course Management:** Course purchasing via wallet, student enrollments, likes, and nested comments.
- 🎙️ **Podcast Management:** Audio and cover image uploads (using Multer & Sharp), play statistics tracking, and multi-level comments.
- 📰 **News & Articles:** Full CRUD for news with a nested comment system.
- 💳 **Wallet & Payments:** Wallet charging and transaction history integrated with the **Zarinpal** payment gateway (Sandbox mode).
- 🗂️ **Category Management:** Bilingual (Fa/En) category management with visibility toggle.
- 🛡️ **Security & Optimization:** Helmet, Express Rate Limiting, CORS, and robust input validation with Zod.
- 📊 **Admin Dashboard:** Advanced user search, filtering, sorting, pagination, and user statistics.
- 📚 **Full Documentation:** Live Swagger UI for testing all endpoints interactively.

---

## 🛠️ Tech Stack

### Backend Core
- **Runtime:** Node.js
- **Framework:** Express.js (TypeScript)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Cache & Blacklist:** Redis (`ioredis`)
- **Validation:** Zod
- **Documentation:** Swagger (OpenAPI 3.0)

### Security & Utilities
- **Auth:** JSON Web Tokens (JWT), bcrypt
- **File Upload:** Multer, Sharp (image resizing & processing)
- **Email:** Nodemailer
- **Logging:** Winston, Morgan
- **Security:** Helmet, Express Rate Limit, CORS

---

## 📁 Project Structure

```text
src/
 ├── config/         # Swagger configuration
 ├── lib/            # External service clients (Prisma, Redis, Mailer, Zarinpal)
 ├── middlewares/    # Security middlewares (Auth, ErrorHandler, RateLimit, Upload, ...)
 ├── modules/        # Core modules (Layered Architecture)
 │    ├── auth/      # Authentication (Login, Register, Reset Password)
 │    ├── user/      # User profiles
 │    ├── admin/     # User management (Admin only)
 │    ├── course/    # Course management
 │    ├── podcast/   # Podcast management
 │    ├── news/      # News & Articles
 │    ├── wallet/    # Wallet & Transactions
 │    ├── category/  # Categories
 │    └── shared/    # Shared logic (Comments, Likes, Ratings)
 ├── utils/          # Helper functions (JWT, ImageProcessor)
 ├── app.ts          # Express app configuration
 └── server.ts       # Server entry point
prisma/
 └── schema.prisma   # Database schema


---

## ⚙️ Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- PostgreSQL
- Redis (On Windows, you can use WSL or Memurai)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/backend-summer-1405/express_shop.git
cd express_shop
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and configure the following:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/express_shop"

# JWT
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="7d"

# Redis
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379

# SMTP (Email)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Express Shop <your-email@gmail.com>"

# Zarinpal
ZARINPAL_MERCHANT_ID="your-merchant-id"
```

### 4. Database Setup
Sync the database schema and generate the Prisma Client:
```bash
npx prisma db push
npx prisma generate
```

### 5. Running the Application
For development:
```bash
npm run dev
```
For production:
```bash
npm run build
npm start
```

---

## 📚 API Documentation

Once the server is running, you can access the interactive Swagger UI to explore and test all endpoints at:
👉 **`http://localhost:3000/api-docs`**

---

## 🧪 Testing
The project is equipped with Jest and Supertest for integration testing:
```bash
npm run test
```

---

## ✍️ Author
**Mardin**
- [GitHub Profile](https://github.com/backend-summer-1405)

---
⭐ If you find this project useful, please consider giving it a star!
```
