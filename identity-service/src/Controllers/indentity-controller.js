const REFRESH_TOKEN_MODEL = require("../models/refresh-token");
const { default: USER_MODEL } = require("../models/user");
const generateToken = require("../utils/generateToken");
const logger = require("../utils/logger");
const {
  validationRegistration,
  validationLogin,
} = require("../utils/validation");

// register user
const registerUser = async (req, res) => {
  logger.info("Registering user endpoint hit");
  try {
    // validate schema
    const { error } = validationRegistration(req.body);
    if (error) {
      logger.warn("Validation error: " + error.details[0].message);

      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const { username, password, email } = req.body;

    let user = await USER_MODEL.findOne({
      $or: [{ username }, { email }],
    });

    if (user) {
      logger.warn("User already exists");
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    user = new USER_MODEL({ username, password, email });
    await user.save();
    logger.info("User registered successfully ", user._id);
    const { accessToken, refreshToken } = await generateToken(user);
    return res.status(200).json({
      success: true,
      message: "User registered successfully",
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    logger.error("Registration error", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// user login
const loginUser = async (req, res) => {
  logger.info("Login user endpoint hit");
  try {
    const { error } = validationLogin(req.body);
    if (error) {
      logger.warn("Validation error: " + error.details[0].message);

      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const { password, email } = req.body;

    const user = await USER_MODEL.findOne({ email });
    if (!user) {
      logger.warn("User not found");
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn("Invalid credentials");
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = await generateToken(user);

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      accessToken: accessToken,
      refreshToken: refreshToken,
      userId: user._id,
    });
  } catch (error) {
    logger.error("Login error", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// refresh token
const refreshTokenUser = async (req, res) => {
  logger.info("refresh toekn endpoint hit");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("No refresh token provided");
      return res
        .status(403)
        .json({ success: false, message: "No refresh token provided" });
    }

    const storedToken = await REFRESH_TOKEN_MODEL.findOne({
      token: refreshToken,
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("Invalid or expired refresh token");
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired refresh token" });
    }

    const user = await USER_MODEL.findById(storedToken.user);
    if (!user) {
      logger.warn("User not found");
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateToken(user);

    await REFRESH_TOKEN_MODEL.findByIdAndDelete(storedToken._id);

    return res.status(200).json({
      success: true,
      message: "Refresh token successfully refreshed",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Refresh Token error", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// logout
const logoutUser = async (req, res) => {
  logger.info("Logged out endpoint hit");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("No refresh token provided");
      return res
        .status(403)
        .json({ success: false, message: "No refresh token provided" });
    }
    await REFRESH_TOKEN_MODEL.findOneAndDelete({token: refreshToken});
    logger.info("Refresh token deleted for logout");

    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });

  } catch (error) {
    logger.error("Logout error", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = { registerUser, loginUser, refreshTokenUser, logoutUser };
