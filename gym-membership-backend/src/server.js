import app from "./app.js";
import env from "./config/env.js";
import connectDB from "./config/db.js";

/**
 * Bootstrap the application:
 * 1. Connect to MongoDB
 * 2. Start the Express HTTP server
 */
const startServer = async () => {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`\n🚀  Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    console.log(`📡  Health check → http://localhost:${env.PORT}/api/v1/health\n`);
  });
};

// ── Process-level safety nets ─────────────────────────────
process.on("unhandledRejection", (reason) => {
  console.error("❌  Unhandled Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("❌  Uncaught Exception:", error);
  process.exit(1);
});

startServer();
