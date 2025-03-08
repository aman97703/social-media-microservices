const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    mediaIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "media" }],
  },
  { timestamps: true }
);

postSchema.index({ content: "text" });

const POST_MODEL = mongoose.model("posts", postSchema);

module.exports = POST_MODEL;
