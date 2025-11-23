# 🚀 Complex Backend Project

A robust and scalable Node.js backend application built with Express.js and MongoDB, featuring authentication, e-commerce functionality, and todo management capabilities.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Structure](#-api-structure)
- [Modules](#-modules)
- [Scripts](#-scripts)
- [Author](#-author)

## ✨ Features

- 🔐 **JWT Authentication** - Secure user authentication with JSON Web Tokens
- 🛒 **E-commerce Module** - Complete e-commerce functionality with products, orders, categories, and users
- ✅ **Todo Management** - Task management system with sub-todos
- 🎥 **Video Management** - Video content handling
- 🛡️ **Error Handling** - Centralized error handling with custom ApiError class
- 📦 **API Response** - Standardized API response format
- 🔄 **Async Handler** - Utility for handling async route handlers
- 🌐 **CORS Support** - Cross-origin resource sharing enabled
- 🍪 **Cookie Parser** - Cookie-based authentication support
- 📊 **MongoDB Integration** - Mongoose ODM with aggregation pagination

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB with Mongoose 8.19.4
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Security**: bcrypt 6.0.0 for password hashing
- **Middleware**: 
  - cors 2.8.5
  - cookie-parser 1.4.7
- **Development**: 
  - nodemon 3.1.11
  - prettier 3.6.2
- **Additional**: mongoose-aggregate-paginate-v2 1.1.4

## 📁 Project Structure

```
Backend/
├── src/                    # Main application source
│   ├── app.js             # Express app configuration
│   ├── index.js           # Application entry point
│   ├── constants.js       # Application constants
│   ├── controllers/       # Route controllers
│   ├── routes/            # API routes
│   ├── models/            # Database models
│   │   ├── user.model.js
│   │   └── video..model.js
│   ├── middlewares/       # Custom middlewares
│   ├── db/                # Database configuration
│   │   └── index.js       # MongoDB connection
│   └── utils/             # Utility functions
│       ├── ApiError.js    # Custom error class
│       ├── ApiResponse.js # Standardized response
│       └── asyncHandler.js # Async handler wrapper
├── DataModeling/          # Data model definitions
│   └── models/
│       ├── ecommerce/     # E-commerce models
│       │   ├── category.models.js
│       │   ├── order.models.js
│       │   ├── product.models.js
│       │   └── user.models.js
│       └── todos/         # Todo models
│           ├── sub_todo.model.js
│           ├── todo.models.js
│           └── user.models.js
├── public/                # Static files
│   └── temp/              # Temporary files
├── package.json           # Project dependencies
└── Readme.md             # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory (see [Environment Variables](#-environment-variables))

4. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:8000` (or the port specified in your environment variables).

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=8000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# JWT Configuration (if needed)
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d
```

## 📡 API Structure

The application follows RESTful API principles with:

- **Standardized Responses**: All API responses follow a consistent format using `ApiResponse` class
- **Error Handling**: Centralized error handling with `ApiError` class
- **Async Support**: Async route handlers wrapped with `asyncHandler` utility

### Response Format

**Success Response:**
```json
{
  "statusCode": 200,
  "data": {...},
  "message": "Success",
  "success": true
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Error message",
  "errors": [],
  "data": null,
  "success": false
}
```

## 📜 Scripts

- `npm run dev` - Start development server with nodemon and hot-reload

## 👤 Author

**Faisal**

---

⭐ If you find this project helpful, please consider giving it a star!
