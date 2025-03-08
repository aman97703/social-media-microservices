const express = require("express");
require("dotenv").config();
const connectDB = require("./Db/connect");
const helmet = require("helmet");
const cors = require("cors");
const logger = require("./utils/logger");
const { errorHandler } = require("./middleware/error-handlor");
const { connectRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const searchRoute = require("./routes/search-routes");
const {
  handleCreatePostHandler,
} = require("./eventHandlers/create-post-handler");
const {
  handleDeletePostHandler,
} = require("./eventHandlers/delete-post-handler");
const Redis = require("ioredis");
const redisClient = new Redis(process.env.REDIS_URL);
const app = express();
const port = process.env.PORT || 3004;

// middlwares
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received: ${req.method} request: ${req.url}`);
  next();
});

app.use(
  "/api/search",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  searchRoute
);

// error handler
app.use(errorHandler);

async function startServer() {
  try {
    await connectRabbitMQ();
    await connectDB();

    await consumeEvent("post.created", (event) =>
      handleCreatePostHandler(event, redisClient)
    );
    await consumeEvent("post.deleted", (event) =>
      handleDeletePostHandler(event, redisClient)
    );
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
