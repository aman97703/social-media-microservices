const express = require("express");
require("dotenv").config();
const helmet = require("helmet");
const cors = require("cors");

const logger = require("./utils/logger");
const mediaRoutes = require("./routes/media-routes");
const connectDB = require("./Db/connect");
const { connectRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const { errorHandler } = require("./middleware/error-handlor");
const { handlePostDeleted } = require("./eventHandlers/media-event-handler");
const port = process.env.PORT || 3003;

const app = express();

// middlwares
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received: ${req.method} request: ${req.url}`);
  next();
});

// routes
app.use("/api/media", mediaRoutes);

// error handler
app.use(errorHandler);

async function startServer() {
  try {
    await connectRabbitMQ();
    await connectDB();

    await consumeEvent('post.deleted', handlePostDeleted)

    app.listen(port, () => {
      logger.info(`listening at http://localhost:${port}`);
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}
startServer()
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled rejection at ${promise} with reason ${reason}`);
});
