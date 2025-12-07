const express = require("express");
const cors = require("cors");
require("dotenv").config();
const passport = require("passport");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");
const aiRoutes = require("./routes/ai");
const promptRoutes = require("./routes/prompts");
const promptTrendingRoutes = require("./routes/promptTrending");
const announcementRoutes = require("./routes/announcementRoutes");
const profileRoutes = require("./routes/profileRoutes");
const topupRoutes = require("./routes/topup");
const historyRoutes = require("./routes/history");
const premiumRoutes = require("./routes/premium");
const adminRoutes = require("./routes/admin");
const outfitStyleRoutes = require("./routes/outfitStyles");
const chatRoutes = require("./routes/chat");
const trendsRoutes = require("./routes/trends");
const collectionsRoutes = require("./routes/collections");
const contentManagementRoutes = require("./routes/contentManagement");
const debugContentRoutes = require("./routes/debugContent");
const shareRoutes = require("./routes/share");
const sessionRoutes = require("./routes/sessionRoutes");
const serviceConfigRoutes = require("./routes/serviceConfig");
const app = express();

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:8080", "http://localhost:3000", "http://localhost:5000"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json());

connectDB();

require("./config/passport")(passport);
app.use(passport.initialize());

// Swagger API Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "EternaPicSHT API Documentation",
  })
);

app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/prompts", promptRoutes);
app.use("/api/prompts-trending", promptTrendingRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/topup", topupRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/outfit-styles", outfitStyleRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/trends", trendsRoutes);
app.use("/api/collections", collectionsRoutes);
app.use("/api/admin/content-management", contentManagementRoutes);
app.use("/api/debug/content", debugContentRoutes);
app.use("/share", shareRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/service-config", serviceConfigRoutes);
app.use("/outputs", express.static(path.join(__dirname, "outputs")));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Root endpoint - API only
app.get("/", (req, res) => {
  res.json({ 
    message: "EternaPic API Server",
    version: "1.0.0",
    docs: "/api-docs",
    health: "/api/health"
  });
});

// Debug route for testing content management
app.get("/api/admin/content-management/debug-check", async (req, res) => {
  console.log("DEBUG: Debug route called!");
  try {
    const History = require("./models/History");
    const totalCount = await History.countDocuments();
    const successCount = await History.countDocuments({ status: "success" });

    console.log(
      "DEBUG: Found",
      totalCount,
      "total records,",
      successCount,
      "success records"
    );
    res.json({
      totalCount,
      successCount,
      message: "Debug route working",
    });
  } catch (error) {
    console.error("DEBUG: Error in debug route:", error);
    res.status(500).json({ error: error.message });
  }
});


app.use((req, res, next) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.originalUrl,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
