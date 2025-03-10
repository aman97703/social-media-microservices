const logger = require("../utils/logger");

const authenticateRequest = async (req, res, next) => {
  const userId = req.headers["x-user-id"];

  if (!userId) {
    logger.warn("Accesss attempted without user id");
    return res.status(401).json({
      success: false,
      message: "Authentication required! Please login to continue",
    });
  }
  req.user = { userId };
  next();
};
module.exports = {
  authenticateRequest,
};
