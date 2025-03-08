const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const REFRESH_TOKEN_MODEL = require("../models/refresh-token");

const generateToken = async (user) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    process.env.JWT_SEC,
    { expiresIn: "60m" }
  );

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date();

  expiresAt.setDate(expiresAt.getDate() + 7); // refresh token expires in 7 days

  await REFRESH_TOKEN_MODEL.create({
    token: refreshToken,
    user: user._id,
    expiresAt: expiresAt,
  });

  return { accessToken, refreshToken };
};

module.exports = generateToken;
