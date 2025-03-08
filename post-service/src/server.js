const express = require("express");
require("dotenv").config();
const connectDB = require("./Db/connect");
const helmet = require("helmet");
const cors = require("cors");
const logger = require("./utils/logger");
const { errorHandler } = require("./middleware/error-handlor");
const Redis = require("ioredis");
const app = express();
const redisClient = new Redis(process.env.REDIS_URL);
const port = process.env.PORT || 3002;

// middlwares
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received: ${req.method} request: ${req.url}`);
  next();
});

// imports of routes
const postRoute = require("./routes/post-routes");
const { connectRabbitMQ } = require("./utils/rabbitmq");

// routes
app.use(
  "/api/posts",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRoute
);

// error handler
app.use(errorHandler);

async function startServer() {
  try {
    await connectRabbitMQ();
    await connectDB();
    app.listen(port, () => {
      logger.info(`listening at http://localhost:${port}`);
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

startServer();

process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled rejection at ${promise} with reason ${reason}`);
});
