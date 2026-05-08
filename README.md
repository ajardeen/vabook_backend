# 🚀 VABook Backend

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-Backend-green?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express.js-API-black?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?style=for-the-badge&logo=mongodb)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-black?style=for-the-badge&logo=socket.io)

**Central backend API powering the Lunchbox Legends ecosystem**

</div>

---

# 📖 About

`vabook_backend` is the core backend service for the Lunchbox Legends brand platform handle the vabook and mobile app.

This backend manages:

- Business admin portal
- Customer mobile app
- Subscription system
- Kitchen workflow
- Delivery rider operations
- Real-time order tracking

The system is designed for cloud kitchens and meal subscription businesses using a multi-tenant architecture.

---

# 🏗 System Overview

```text
Admin Portal
      │
Customer Mobile App
      │
Kitchen Dashboard
      │
Delivery Rider System
      │
──────── Backend API ────────
      │
 MongoDB Database
```

---

# ✨ Core Features

## 👨‍💼 Admin Management
- Organization management
- Branch management
- Menu & bundle creation
- Staff & rider management
- Subscription approval workflow

---

## 👤 Customer System
- Registration & login
- OTP verification
- Address management
- Subscription purchase
- Order tracking

---

## 🍱 Subscription Engine
- Weekly meal plans
- Bundle subscriptions
- Nutrition & calorie data
- Delivery scheduling

---

## 👨‍🍳 Kitchen Workflow
- Live kitchen order queue
- Order preparation stages
- Kitchen approval system
- Real-time order updates

---

## 🛵 Delivery System
- Rider assignment
- Delivery tracking
- Order status updates
- Delivery completion flow

---

## ⚡ Real-Time Features
Powered using Socket.io:

- Live kitchen updates
- Order tracking
- Delivery status sync

---

# 📂 Project Structure

```bash
src/
│
├── configs/        # Database configuration
├── controllers/    # Route controllers
├── middleware/     # Auth, error & upload middleware
├── models/         # MongoDB models
├── routes/         # API routes
├── utils/          # JWT, OTP & helper utilities
├── validations/    # Joi validation schemas
│
├── app.js          # Express app setup
└── server.js       # Main server entry
```

---

# 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT |
| Realtime | Socket.io |
| Validation | Joi |
| File Upload | Multer |
| Email Service | Nodemailer |

---

# 📦 Important Dependencies

```json
{
  "express": "^5.1.0",
  "mongoose": "^8.19.3",
  "jsonwebtoken": "^9.0.2",
  "socket.io": "^4.8.1",
  "bcryptjs": "^3.0.3",
  "joi": "^18.0.1",
  "multer": "^2.1.1",
  "nodemailer": "^7.0.13"
}
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/ajardeen/vabook_backend.git
cd vabook_backend
```

---

## Install Dependencies

```bash
npm install
```

---

## Setup Environment Variables

Create a `.env` file:

```env
PORT=3000

MONGO_URI=

JWT_SECRET=
JWT_EXPIRE=1d

MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASS=
MAIL_FROM=
```

---

## Run Development Server

```bash
npm run dev
```

---

## Run Production Server

```bash
npm start
```

---

# 🔐 Authentication

The backend uses:

- JWT Authentication
- Protected routes
- Role-based middleware
- Admin authorization
- Customer authentication

---

# ⚠️ Developer Note

SMTP services are disabled on Render free tier deployment.

For demo/testing purposes, OTP values may be directly displayed in the frontend UI instead of being delivered through email services.

This backend is intended for technical demonstration and portfolio purposes.

---

# 📡 API Modules

Main API modules include:

- Authentication
- Organizations
- Branches
- Customers
- Staff
- Riders
- Menus
- Bundles
- Orders
- Subscriptions
- Deliveries

---

# 🌐 Related Projects

| Repository | Description |
|---|---|
| `lbl_business_portal` | Admin/business dashboard |
| `LunchboxLegendsMobile` | Customer mobile application |
| `LunchBox` | Landing page |
| `vabook_backend` | Backend API server |

---

# 📄 License

MIT License

---

<div align="center">

Made with ❤️ by Ajardeen

</div>