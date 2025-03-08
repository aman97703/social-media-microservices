const router = require("express").Router();
const multer = require("multer");
const { authenticateRequest } = require("../middleware/auth-middleware");
const logger = require("../utils/logger");
const { uploadMedia, getAllMedia } = require("../controllers/media-controller");

// configure for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("file");

router.post(
  "/upload",
  authenticateRequest,
  (req, res, next) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        logger.error("Multer error while uploading", err);
        return res
          .status(400)
          .json({ error: err.message, success: false, stack: err.stack });
      } else if (err) {
        logger.error("Unknown error while uploading", err);
        return res.status(500).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
      }
      next();
    });
  },
  uploadMedia
);

router.get("/all", authenticateRequest, getAllMedia);

module.exports = router;
