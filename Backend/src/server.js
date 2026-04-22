import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import { getEnvConfig, validateEnv } from "./config/env.js";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Load environment variables
dotenv.config();

// Validate environment variables
try {
  validateEnv();
} catch (error) {
  console.error("Environment validation failed:", error.message);
  process.exit(1);
}

const envConfig = getEnvConfig();

connectDB()
  .then(async () => {
    const PORT = envConfig.port;
    app.listen(PORT, () => {
      console.log(`[OK] Server started successfully`);
      const appName = process.env.APP_NAME || "ABCD";
      console.log(`
        ================================================================================
        =     ${appName} Backend Server Running       =
        ================================================================================
        = Environment: ${envConfig.nodeEnv.padEnd(25)} =
        = Port: ${PORT.toString().padEnd(31)}  =
        = API: http://localhost:${PORT}/api         =
        ================================================================================
      `);
    });
  })
  .catch((err) => {
    console.error("[X] Failed to start server", err.message);
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
