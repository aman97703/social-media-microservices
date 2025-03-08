const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const Redis = require("ioredis");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const proxy = require("express-http-proxy");
const logger = require("./utils/logger");
const { errorHandler } = require("./middlewares/errorHandler");
const { validateToken } = require("./middlewares/auth-middleware");

const app = express();
const port = process.env.PORT || 3000;

const redisClient = new Redis(process.env.REDIS_URL);

// rate limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
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

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimiter);
app.use((req, res, next) => {
  logger.info(`Received: ${req.method} request: ${req.url}`);
  next();
});

// proxy middleware
const proxyOptions = {
  proxyReqPathResolver: function (req) {
    return req.originalUrl.replace(/^\/v1/, "/api"); // localhost:3000/v1/auth/register --> localhost:3000/api/auth/register
  },
  proxyErrorHandler: function (err, res, next) {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({ message: "Internal Server Error", success: false });
  },
};

// for identidy service
app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpt, srcReq) => {
      proxyReqOpt.headers["Content-Type"] = "application/json";
      return proxyReqOpt;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        "Response received from indentity service: " + proxyRes.statusCode
      );

      return proxyResData;
    },
  })
);
// for post service
app.use(
  "/v1/posts",
  validateToken,
  proxy(process.env.POST_SERVICE, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpt, srcReq) => {
      proxyReqOpt.headers["Content-Type"] = "application/json";
      proxyReqOpt.headers["x-user-id"] = srcReq.user.userId;
      return proxyReqOpt;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        "Response received from indentity service: " + proxyRes.statusCode
      );

      return proxyResData;
    },
  })
);
// for media service
app.use(
  "/v1/media",
  validateToken,
  proxy(process.env.MEDIA_SERVICE, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpt, srcReq) => {
      proxyReqOpt.headers["x-user-id"] = srcReq.user.userId;
      if (!srcReq.headers["content-type"].startsWith("multipart/form-data")) {
        proxyReqOpt.headers["Content-Type"] = "application/json";
      }
      return proxyReqOpt;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        "Response received from indentity service: " + proxyRes.statusCode
      );

      return proxyResData;
    },
    parseReqBody: false
  })
);
// for post service
app.use(
  "/v1/search",
  validateToken,
  proxy(process.env.SEARCH_SERVICE, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpt, srcReq) => {
      proxyReqOpt.headers["Content-Type"] = "application/json";
      proxyReqOpt.headers["x-user-id"] = srcReq.user.userId;
      return proxyReqOpt;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        "Response received from indentity service: " + proxyRes.statusCode
      );

      return proxyResData;
    },
  })
);
// error handler
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Api Gateway is listening on ${port}`);
  logger.info(`Api Gateway is listening on ${port}`);
  logger.info(
    `Identity service is listening on ${process.env.IDENTITY_SERVICE}`
  );
  logger.info(`Post service is listening on ${process.env.POST_SERVICE}`);
  logger.info(`Media service is listening on ${process.env.MEDIA_SERVICE}`);
  logger.info(`Search service is listening on ${process.env.SEARCH_SERVICE}`);
  logger.info(`Redis is listening on ${process.env.REDIS_URL}`);
});
