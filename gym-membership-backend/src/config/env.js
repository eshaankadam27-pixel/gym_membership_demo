import "dotenv/config";

const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/gym-membership-db",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  JWT_SECRET: process.env.JWT_SECRET || "default_jwt_secret_change_me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  get isDevelopment() {
    return this.NODE_ENV === "development";
  },
  get isProduction() {
    return this.NODE_ENV === "production";
  },
  get isTest() {
    return this.NODE_ENV === "test";
  },
});

export default env;
