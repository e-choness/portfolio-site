---
layout: post
title: "Building Scalable REST APIs with Node.js"
date: 2025-01-08 14:30:00 -0000
category: backend
tags: [nodejs, api, rest, backend, scalability]
author: "Echo Yin"
image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop"
excerpt: "A comprehensive guide to building robust and scalable REST APIs using Node.js, Express, and modern best practices for enterprise applications."
---

Building scalable REST APIs is a cornerstone skill for modern backend developers. In this comprehensive guide, we'll explore how to create robust, maintainable, and scalable APIs using Node.js and Express, following industry best practices.

## Table of Contents

1. [Project Setup and Architecture](#project-setup)
2. [Database Design and Models](#database-design)
3. [Authentication and Authorization](#authentication)
4. [API Design Principles](#api-design)
5. [Error Handling and Validation](#error-handling)
6. [Performance Optimization](#performance)
7. [Testing Strategies](#testing)
8. [Deployment and Monitoring](#deployment)

## Project Setup and Architecture {#project-setup}

### Folder Structure

A well-organized project structure is crucial for maintainability:

```
src/
├── controllers/     # Request handlers
├── models/         # Database models
├── middleware/     # Custom middleware
├── routes/         # Route definitions
├── services/       # Business logic
├── utils/          # Utility functions
├── config/         # Configuration files
├── validators/     # Input validation
└── tests/          # Test files
```

### Environment Configuration

```javascript
// config/database.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### Express Application Setup

```javascript
// app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
});
app.use("/api/", limiter);

// Performance middleware
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/posts", require("./routes/posts"));

module.exports = app;
```

## Database Design and Models {#database-design}

### User Model with Mongoose

```javascript
// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Invalid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    profile: {
      firstName: String,
      lastName: String,
      avatar: String,
      bio: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    refreshTokens: [
      {
        token: String,
        createdAt: {
          type: Date,
          default: Date.now,
          expires: 604800, // 7 days
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.profile?.firstName || ""} ${
    this.profile?.lastName || ""
  }`.trim();
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateToken = function () {
  return jwt.sign(
    {
      id: this._id,
      username: this.username,
      role: this.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "1h" }
  );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function () {
  const refreshToken = jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  this.refreshTokens.push({ token: refreshToken });
  return refreshToken;
};

module.exports = mongoose.model("User", userSchema);
```

## Authentication and Authorization {#authentication}

### JWT Authentication Middleware

```javascript
// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid token or user not found.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
```

### Authentication Controller

```javascript
// controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");

class AuthController {
  // Register new user
  async register(req, res) {
    try {
      const { username, email, password, profile } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this email or username",
        });
      }

      // Create new user
      const user = new User({
        username,
        email,
        password,
        profile,
      });

      await user.save();

      // Generate tokens
      const token = user.generateToken();
      const refreshToken = user.generateRefreshToken();
      await user.save();

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile: user.profile,
        },
        tokens: {
          accessToken: token,
          refreshToken: refreshToken,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Registration failed",
        error: error.message,
      });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user and include password
      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Update last login
      user.lastLogin = new Date();

      // Generate tokens
      const token = user.generateToken();
      const refreshToken = user.generateRefreshToken();
      await user.save();

      res.json({
        success: true,
        message: "Login successful",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile: user.profile,
        },
        tokens: {
          accessToken: token,
          refreshToken: refreshToken,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Login failed",
        error: error.message,
      });
    }
  }

  // Refresh token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Refresh token required",
        });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || !user.refreshTokens.some((t) => t.token === refreshToken)) {
        return res.status(401).json({
          success: false,
          message: "Invalid refresh token",
        });
      }

      // Remove old refresh token and generate new ones
      user.refreshTokens = user.refreshTokens.filter(
        (t) => t.token !== refreshToken
      );
      const newAccessToken = user.generateToken();
      const newRefreshToken = user.generateRefreshToken();
      await user.save();

      res.json({
        success: true,
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
  }

  // Logout user
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      const user = req.user;

      if (refreshToken) {
        user.refreshTokens = user.refreshTokens.filter(
          (t) => t.token !== refreshToken
        );
        await user.save();
      }

      res.json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Logout failed",
        error: error.message,
      });
    }
  }
}

module.exports = new AuthController();
```

## API Design Principles {#api-design}

### RESTful Resource Controllers

```javascript
// controllers/postController.js
const Post = require("../models/Post");

class PostController {
  // GET /api/posts - Get all posts with pagination and filtering
  async getPosts(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = "-createdAt",
        category,
        author,
        search,
      } = req.query;

      // Build query
      const query = { isPublished: true };

      if (category) query.category = category;
      if (author) query.author = author;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ];
      }

      // Execute query with pagination
      const posts = await Post.find(query)
        .populate("author", "username profile.firstName profile.lastName")
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await Post.countDocuments(query);

      res.json({
        success: true,
        data: posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch posts",
        error: error.message,
      });
    }
  }

  // GET /api/posts/:id - Get single post
  async getPost(req, res) {
    try {
      const post = await Post.findById(req.params.id)
        .populate("author", "username profile")
        .populate(
          "comments.author",
          "username profile.firstName profile.lastName"
        );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Increment view count
      post.views += 1;
      await post.save();

      res.json({
        success: true,
        data: post,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch post",
        error: error.message,
      });
    }
  }

  // POST /api/posts - Create new post
  async createPost(req, res) {
    try {
      const postData = {
        ...req.body,
        author: req.user._id,
      };

      const post = new Post(postData);
      await post.save();
      await post.populate("author", "username profile");

      res.status(201).json({
        success: true,
        message: "Post created successfully",
        data: post,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to create post",
        error: error.message,
      });
    }
  }

  // PUT /api/posts/:id - Update post
  async updatePost(req, res) {
    try {
      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Check ownership or admin role
      if (
        post.author.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this post",
        });
      }

      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate("author", "username profile");

      res.json({
        success: true,
        message: "Post updated successfully",
        data: updatedPost,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to update post",
        error: error.message,
      });
    }
  }

  // DELETE /api/posts/:id - Delete post
  async deletePost(req, res) {
    try {
      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Check ownership or admin role
      if (
        post.author.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this post",
        });
      }

      await Post.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: "Post deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete post",
        error: error.message,
      });
    }
  }
}

module.exports = new PostController();
```

## Error Handling and Validation {#error-handling}

### Global Error Handler

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = { message, statusCode: 401 };
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = { message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
```

### Input Validation Middleware

```javascript
// validators/postValidator.js
const { body, param, query, validationResult } = require("express-validator");

const createPostValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters"),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ min: 10 })
    .withMessage("Content must be at least 10 characters"),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .isIn(["technology", "lifestyle", "business", "health", "education"])
    .withMessage("Invalid category"),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array")
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error("Maximum 10 tags allowed");
      }
      return true;
    }),

  body("isPublished")
    .optional()
    .isBoolean()
    .withMessage("isPublished must be a boolean"),
];

const updatePostValidation = [
  param("id").isMongoId().withMessage("Invalid post ID"),

  body("title")
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters"),

  body("content")
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage("Content must be at least 10 characters"),

  body("category")
    .optional()
    .trim()
    .isIn(["technology", "lifestyle", "business", "health", "education"])
    .withMessage("Invalid category"),
];

const getPostsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("sort")
    .optional()
    .isIn([
      "-createdAt",
      "createdAt",
      "-updatedAt",
      "updatedAt",
      "title",
      "-title",
    ])
    .withMessage("Invalid sort parameter"),
];

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  next();
};

module.exports = {
  createPostValidation,
  updatePostValidation,
  getPostsValidation,
  handleValidationErrors,
};
```

## Performance Optimization {#performance}

### Caching with Redis

```javascript
// middleware/cache.js
const redis = require("redis");
const client = redis.createClient(process.env.REDIS_URL);

client.on("error", (err) => {
  console.error("Redis Client Error", err);
});

const cache = (duration = 300) => {
  return async (req, res, next) => {
    // Skip cache for authenticated requests with user-specific data
    if (req.user) {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedData = await client.get(key);

      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      // Store original json method
      const originalJson = res.json;

      // Override json method to cache response
      res.json = function (data) {
        // Cache successful responses only
        if (res.statusCode === 200) {
          client.setex(key, duration, JSON.stringify(data));
        }

        // Call original json method
        originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error("Cache error:", error);
      next();
    }
  };
};

module.exports = { cache };
```

### Database Query Optimization

```javascript
// services/postService.js
class PostService {
  async getPopularPosts(limit = 10) {
    return await Post.aggregate([
      { $match: { isPublished: true } },
      {
        $addFields: {
          popularity: {
            $add: [
              "$views",
              { $multiply: ["$likes", 2] },
              { $multiply: [{ $size: "$comments" }, 3] },
            ],
          },
        },
      },
      { $sort: { popularity: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
          pipeline: [
            {
              $project: {
                username: 1,
                "profile.firstName": 1,
                "profile.lastName": 1,
              },
            },
          ],
        },
      },
      { $unwind: "$author" },
    ]);
  }

  async getPostsByCategory(category, options = {}) {
    const { page = 1, limit = 10, sort = "-createdAt" } = options;

    return await Post.find({ category, isPublished: true })
      .populate("author", "username profile.firstName profile.lastName")
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit)
      .lean()
      .cache(300); // Cache for 5 minutes
  }
}

module.exports = new PostService();
```

## Testing Strategies {#testing}

### Unit Tests with Jest

```javascript
// tests/controllers/authController.test.js
const request = require("supertest");
const app = require("../../app");
const User = require("../../models/User");
const connectDB = require("../../config/database");

describe("Auth Controller", () => {
  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("POST /api/auth/register", () => {
    const validUserData = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
      profile: {
        firstName: "Test",
        lastName: "User",
      },
    };

    it("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(validUserData.email);
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();
    });

    it("should not register user with invalid email", async () => {
      const invalidData = { ...validUserData, email: "invalid-email" };

      const response = await request(app)
        .post("/api/auth/register")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should not register user with duplicate email", async () => {
      // Create first user
      await request(app).post("/api/auth/register").send(validUserData);

      // Try to create second user with same email
      const response = await request(app)
        .post("/api/auth/register")
        .send(validUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already exists");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Create a test user
      await request(app).post("/api/auth/register").send({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should login user with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tokens.accessToken).toBeDefined();
    });

    it("should not login user with invalid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
```

### Integration Tests

```javascript
// tests/integration/posts.test.js
const request = require("supertest");
const app = require("../../app");
const User = require("../../models/User");
const Post = require("../../models/Post");

describe("Posts API", () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    // Clean database
    await User.deleteMany({});
    await Post.deleteMany({});

    // Create test user and get auth token
    const userData = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    };

    const authResponse = await request(app)
      .post("/api/auth/register")
      .send(userData);

    authToken = authResponse.body.tokens.accessToken;
    testUser = authResponse.body.user;
  });

  describe("POST /api/posts", () => {
    const validPostData = {
      title: "Test Post Title",
      content: "This is test post content with enough characters",
      category: "technology",
      tags: ["test", "api"],
      isPublished: true,
    };

    it("should create a new post", async () => {
      const response = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validPostData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(validPostData.title);
      expect(response.body.data.author._id).toBe(testUser.id);
    });

    it("should not create post without authentication", async () => {
      const response = await request(app)
        .post("/api/posts")
        .send(validPostData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/posts", () => {
    beforeEach(async () => {
      // Create test posts
      const posts = [
        {
          title: "First Post",
          content: "Content of first post",
          category: "technology",
          author: testUser.id,
          isPublished: true,
        },
        {
          title: "Second Post",
          content: "Content of second post",
          category: "lifestyle",
          author: testUser.id,
          isPublished: true,
        },
      ];

      await Post.insertMany(posts);
    });

    it("should get all posts", async () => {
      const response = await request(app).get("/api/posts").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it("should filter posts by category", async () => {
      const response = await request(app)
        .get("/api/posts?category=technology")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe("technology");
    });
  });
});
```

## Deployment and Monitoring {#deployment}

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
```

### Docker Compose for Development

```yaml
# docker-compose.yml
version: "3.8"

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo:27017/myapp
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-jwt-secret
      - JWT_REFRESH_SECRET=your-refresh-secret
    depends_on:
      - mongo
      - redis
    volumes:
      - .:/app
      - /app/node_modules

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mongo_data:
```

### Health Check Endpoint

```javascript
// routes/health.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

router.get("/", async (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    status: "OK",
    services: {
      database: "OK",
      redis: "OK",
    },
  };

  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      healthCheck.services.database = "ERROR";
      healthCheck.status = "ERROR";
    }

    // Check Redis connection
    // Add Redis health check here

    res.status(healthCheck.status === "OK" ? 200 : 503).json(healthCheck);
  } catch (error) {
    healthCheck.status = "ERROR";
    healthCheck.error = error.message;
    res.status(503).json(healthCheck);
  }
});

module.exports = router;
```

## Conclusion

Building scalable REST APIs requires careful consideration of architecture, security, performance, and maintainability. The patterns and practices shown in this guide provide a solid foundation for creating robust APIs that can grow with your application's needs.

Key takeaways:

1. **Structure matters**: Organize your code for maintainability
2. **Security first**: Implement proper authentication and authorization
3. **Validate everything**: Never trust user input
4. **Plan for scale**: Use caching, pagination, and efficient queries
5. **Test thoroughly**: Write comprehensive tests for all endpoints
6. **Monitor constantly**: Implement health checks and logging

Remember that building scalable APIs is an iterative process. Start with solid foundations and continuously improve based on real-world usage and performance metrics.

What challenges have you faced when building REST APIs? Share your experiences and questions in the comments below!
