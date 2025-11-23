# 🚀 Complex Backend Project

A robust and scalable Node.js backend application built with Express.js and MongoDB, featuring a video platform with user authentication, video management, subscriptions, likes, comments, playlists, and social features.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Structure](#-api-structure)
- [Database Models](#-database-models)
- [ER Diagram](#-er-diagram)
- [Scripts](#-scripts)
- [Author](#-author)

## ✨ Features

- 🔐 **JWT Authentication** - Secure user authentication with JSON Web Tokens and refresh tokens
- 🎥 **Video Management** - Complete video platform with upload, streaming, and metadata management
- 👥 **User Management** - User profiles with avatars, cover images, and watch history
- 💬 **Comments System** - Video comments and interactions
- 👍 **Likes System** - Like videos, comments, and tweets
- 📝 **Playlists** - Create and manage video playlists
- 🐦 **Tweets** - Social media integration with tweet functionality
- 📊 **Subscriptions** - Channel subscription system
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
│   │   ├── user.model.js  # User model with authentication
│   │   └── video..model.js # Video model with pagination
│   ├── middlewares/       # Custom middlewares
│   ├── db/                # Database configuration
│   │   └── index.js       # MongoDB connection
│   └── utils/             # Utility functions
│       ├── ApiError.js    # Custom error class
│       ├── ApiResponse.js # Standardized response
│       └── asyncHandler.js # Async handler wrapper
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

## 📊 Database Models

### 👤 User Model

The User model handles user authentication, profiles, and watch history.

**Schema Fields:**
- `username` (String, required, unique, indexed) - User's unique username
- `email` (String, required, unique, lowercase, trimmed) - User's email address
- `password` (String, required) - Hashed password using bcrypt
- `fullName` (String, required, indexed) - User's full name
- `avatar` (String, required) - URL to user's avatar image
- `coverImage` (String) - URL to user's cover image
- `watchHistory` (Array of ObjectIds, ref: Video) - Array of watched video IDs
- `refreshToken` (String) - JWT refresh token for authentication
- `createdAt` (Date) - Timestamp of creation
- `updatedAt` (Date) - Timestamp of last update

**Methods:**
- `isPasswordCorrect(password)` - Compares provided password with hashed password
- `getAccessToken()` - Generates JWT access token
- `getRefreshToken()` - Generates JWT refresh token

**Pre-save Hook:**
- Automatically hashes password before saving if password is modified

### 🎥 Video Model

The Video model manages video content, metadata, and ownership.

**Schema Fields:**
- `videoFile` (String, required) - URL/path to video file
- `thumbnail` (String, required) - URL/path to thumbnail image
- `title` (String, required) - Video title
- `description` (String, required) - Video description
- `duration` (Number, required) - Video duration in seconds
- `views` (Number, default: 0) - Number of views
- `isPublished` (Boolean, default: true) - Publication status
- `owner` (ObjectId, ref: User) - Reference to the user who owns the video
- `createdAt` (Date) - Timestamp of creation
- `updatedAt` (Date) - Timestamp of last update

**Plugins:**
- `mongoose-aggregate-paginate-v2` - Enables pagination for aggregate queries

## 🗺️ ER Diagram

The following Entity-Relationship diagram shows the database schema and relationships for the video platform:

![ER Diagram](./public/temp/ER-Diagram.png)

**Key Relationships:**
- Users can own multiple videos (one-to-many)
- Users can subscribe to multiple channels (many-to-many via subscriptions)
- Users can like videos, comments, and tweets (one-to-many)
- Users can create multiple comments (one-to-many)
- Users can create multiple playlists (one-to-many)
- Users can create multiple tweets (one-to-many)
- Videos can have multiple comments (one-to-many)
- Videos can be in multiple playlists (many-to-many)
- Users have a watch history array referencing videos (many-to-many)

## 📜 Scripts

- `npm run dev` - Start development server with nodemon and hot-reload

## 👤 Author

**Faisal**

---

⭐ If you find this project helpful, please consider giving it a star!
