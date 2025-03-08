const mongoose = require("mongoose");

const serachPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "posts",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      required: true,
    }
  },
  { timestamps: true }
);

serachPostSchema.index({ content: "text" });
serachPostSchema.index({ createdAt: -1 });

const SEARCH_POST_MODEL = mongoose.model("searchPosts", serachPostSchema);

module.exports = SEARCH_POST_MODEL;
