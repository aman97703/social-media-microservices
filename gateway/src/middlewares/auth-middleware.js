const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");

const validateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    logger.warn("Access attemt without authorization header");
    return res.status(401).json({
      success: false,
      message: "Authentication required! Please login to continue",
    });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    logger.warn("Access attemt without valid token");
    return res.status(401).json({
      success: false,
      message: "Authentication required! Please login to continue",
    });
  }

  jwt.verify(token, process.env.JWT_SEC, (err, user) => {
    if (err) {
      logger.warn("Invalid token");
      return res.status(429).json({
        success: false,
        message: "Invalid token. Please login again",
      });
    }
    req.user = user;
    next();
  });
};
module.exports = {
  validateToken,
};
