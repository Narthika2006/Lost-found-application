require("dotenv").config();
const http = require("http");
const connectDB = require("./config/db");
const app = require("./app");

const requiredEnvVars = ["MONGO_URI", "JWT_SECRET"];

for (const envName of requiredEnvVars) {
  if (!process.env[envName]) {
    console.error(`Missing required environment variable: ${envName}`);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 5000;
let server;

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      try {
        await require("mongoose").connection.close();
      } finally {
        process.exit(0);
      }
    });
    return;
  }

  process.exit(0);
};

const startServer = async () => {
  await connectDB();
  server = http.createServer(app);
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
