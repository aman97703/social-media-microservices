const SEARCH_POST_MODEL = require("../models/search");
const logger = require("../utils/logger");
const { invalidateCached } = require("./invalidateCached");

const handleCreatePostHandler = async (event, redisClient) => {
  const { postId, userId, content, createdAt } = event;
  try {
    const newSearchPost = new SEARCH_POST_MODEL({
      postId: postId,
      userId: userId,
      content: content,
      createdAt: createdAt,
    });

    await newSearchPost.save();
    await invalidateCached(redisClient);
    logger.info("post index created successfully by rabbitmq event " + postId);
  } catch (error) {
    logger.error(
      "error occured while creating the post index by rabbitmq event",
      error
    );
  }
};

module.exports = {
  handleCreatePostHandler,
};
