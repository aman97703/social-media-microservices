const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");
const MEDIA_MODEL = require("../models/media");

const uploadMedia = async (req, res) => {
  logger.info("Media upload started");
  try {
    if (!req.file) {
      logger.error("No file found. please try again");
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { originalname, mimetype } = req.file;
    const userId = req.user.userId;

    logger.info("Uploaing to cloudinary...");

    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
    // console.log(cloudinaryUploadResult);
    logger.info(
      "Cloudinary upload successful Public Id",
      cloudinaryUploadResult.public_id
    );

    const newlyCreatedMedia = new MEDIA_MODEL({
      publicId: cloudinaryUploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      user: userId,
    });
    await newlyCreatedMedia.save();
    logger.info("Media uploaded successfully", newlyCreatedMedia._id);
    return res.status(201).json({
      success: true,
      message: "Media uploaded successfully",
      media: newlyCreatedMedia,
    });
  } catch (error) {
    logger.error("Error uploading media", error);
    res.status(500).json({
      success: false,
      message: "Error uploading media",
    });
  }
};

const getAllMedia = async (req, res) => {
  try {
    const medias = await MEDIA_MODEL.find({
      user: req.user.userId,
    });
    return res.status(201).json({
      success: true,
      data: medias,
    });
  } catch (error) {
    logger.error("Error fetching media", error);
    res.status(500).json({
      success: false,
      message: "Error fetching media",
    });
  }
};

module.exports = { uploadMedia , getAllMedia};
