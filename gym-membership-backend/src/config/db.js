import mongoose from "mongoose";
import env from "./env.js";

/**
 * Connects to MongoDB using Mongoose.
 * Logs connection lifecycle events and exits gracefully on failure.
 */
const connectDB = async () => {
  try {
    console.log(env.MONGODB_URI);
    const conn = await mongoose.connect(env.MONGODB_URI);

    console.log(`✅  MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) => {
      console.error(`❌  MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected");
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑  ${signal} received — closing MongoDB connection…`);
      await mongoose.connection.close();
      process.exit(0);
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  } catch (error) {
    console.error(`❌  MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
