const mongoose = require("mongoose");

const connectDB = async () => {
  // try {
  await mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
      console.log("Connected to database");
    })
    .catch((err) => {
      console.log("Failed to connect to database", err);
    });
  // }
};

module.exports = connectDB;
