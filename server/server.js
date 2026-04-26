if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
const authRoutes = require("./routes/authRoutes");
const tracksRoutes = require("./routes/tracksRoutes");
const playlistsRoutes = require("./routes/playlistsRoutes");
const favoritesRoutes = require("./routes/favoritesRoutes");
const youtubeRoutes = require("./routes/youtubeRoutes");
const { initializeSpotify } = require("./helpers/externalApis");

const app = express();

// Middleware
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/music", tracksRoutes);
app.use("/api/playlists", playlistsRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/youtube", youtubeRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running", timestamp: new Date() });
});

// Error handler
app.use((err, req, res, next) => {
  const errorDetails = {
    message: err.message,
    stack: err.stack,
    name: err.name,
    endpoint: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  };

  console.error("❌ [ERROR]", JSON.stringify(errorDetails, null, 2));

  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      error: "Validation error",
      details: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      error: "Duplicate entry",
      details: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  if (err.status && err.message) {
    return res.status(err.status).json({ error: err.message });
  }

  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
    ...(process.env.NODE_ENV === "development" && { details: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Database initialization
sequelize
  .sync({ alter: false })
  .then(async () => {
    console.log("Database synchronized successfully");

    // Initialize Spotify API
    try {
      await initializeSpotify();
      console.log("Spotify API initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Spotify API:", error);
    }
  })
  .catch((err) => {
    console.error("Failed to sync database:", err);
    process.exit(1);
  });

module.exports = app;
