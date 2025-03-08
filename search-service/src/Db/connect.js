const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  // try {
  await mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
      logger.info("Connected to database");
    })
    .catch((err) => {
      logger.info("Failed to connect to database", err);
    });
  // }
};

module.exports = connectDB;
