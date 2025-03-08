const express = require("express");
require("dotenv").config();
const connectDB = require("./Db/connect");
const helmet = require("helmet");
const cors = require("cors");
const logger = require("./utils/logger");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const { rateLimit } = require("express-rate-limit");
const { errorHandler } = require("./middleware/error-handlor");
const { RedisStore } = require("rate-limit-redis");
const Redis = require("ioredis");
const app = express();
const port = process.env.PORT || 3001;
const redisClient = new Redis(process.env.REDIS_URL);

// middlwares
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received: ${req.method} request: ${req.url}`);
  next();
});

// DDOS protection
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 20,
  duration: 1,
  blockDuration: 60 * 5,
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn("Rate Limit exceeded for client " + req.ip);
      res.status(429).json({ message: "Too Many Requests", success: false });
    });
});

// IP based rate Limiting for sensitive endpoints
const sensitiveEndpointsRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(
      `Rate Limit exceeded for client ${req.ip} on sensitive endpoint ${req.url}`
    );
    res.status(429).json({ message: "Too Many Requests", success: false });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

// apply this sensitiveEndpointsRateLimiter to rotes
app.use("/api/auth/register", sensitiveEndpointsRateLimiter);

// imports of routes
const authIdentityService = require("./routes/identity-route");

// routes
app.use("/api/auth", authIdentityService);

// error handler
app.use(errorHandler)

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`listening at http://localhost:${port}`);
  });
});


process.on('unhandledRejection', (reason, promise)=>{
    logger.error(`Unhandled rejection at ${promise} with reason ${reason}`)
})