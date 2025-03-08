const express = require("express");
const { authenticateRequest } = require("../middleware/auth-middleware");
const {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
} = require("../controllers/post_controller");
const router = express.Router();

router.use(authenticateRequest);

router.post("/create-post", createPost);
router.get("/all", getAllPosts);
router.get("/:id", getPost);
router.delete("/:id", deletePost);

module.exports = router;