const MEDIA_MODEL = require("../models/media");
const { deleteMediaFromCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

const handlePostDeleted = async (event) => {
  const { postId, mediaIds } = event;
  try {
    const mediaToDelete = await MEDIA_MODEL.find({
      _id: {
        $in: mediaIds,
      },
    });

    const deleteMediaPromise = mediaToDelete.map(async (media) => {
      try {
        await deleteMediaFromCloudinary(media.publicId);
        await MEDIA_MODEL.findByIdAndDelete(media._id);

        logger.info("Deleted media with id", media._id);
      } catch (error) {
        logger.error(
          `Error occurred while deleting media with id: ${media._id}`,
          error
        );
      }
    });

    await Promise.all(deleteMediaPromise);

    logger.info(`Finished processing media deletions for postId: ${postId}`);
  } catch (error) {
    logger.error(
      "error occured while deleting the media by rabbitmq event",
      error
    );
  }
};

module.exports = {
  handlePostDeleted,
};
