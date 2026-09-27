import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import env from "./config/env.js";
import routes from "./routes/index.js";
import notFoundHandler from "./middlewares/notFound.middleware.js";
import errorHandler from "./middlewares/error.middleware.js";

const app = express();

// ── Security ──────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// ── Body parsers ──────────────────────────────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// ── Request logging ───────────────────────────────────────
app.use(morgan(env.isDevelopment ? "dev" : "combined"));

// ── API routes ────────────────────────────────────────────
app.use("/api/v1", routes);

// ── Error handling (must be last) ─────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
