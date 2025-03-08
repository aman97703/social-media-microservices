const SEARCH_POST_MODEL = require("../models/search");
const logger = require("../utils/logger");
const { invalidateCached } = require("./invalidateCached");

const handleDeletePostHandler = async (event, redisClient) => {
  const { postId } = event;
  try {
    await SEARCH_POST_MODEL.findOneAndDelete({ postId: postId });
    await invalidateCached(redisClient);

    logger.info("post index deleted successfully by rabbitmq event " + postId);
  } catch (error) {
    logger.error(
      "error occured while deleting the post index by rabbitmq event",
      error
    );
  }
};

module.exports = {
  handleDeletePostHandler,
};
