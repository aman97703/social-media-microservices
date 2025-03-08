const POST_MODEL = require("../models/post");
const logger = require("../utils/logger");
const { publishEvent } = require("../utils/rabbitmq");
const { validationCratePost } = require("../utils/validation");

async function invalidateCached(req, input) {
  if (input) {
    const cachedKey = `post:${input}`;
    await req.redisClient.del(cachedKey);
  }
  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
}

const createPost = async (req, res) => {
  try {
    const { content, mediaIds } = req.body;

    const { error } = validationCratePost(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const newPost = new POST_MODEL({
      content: content,
      mediaIds,
      user: req.user.userId,
    });

    await newPost.save();
    await invalidateCached(req, newPost._id.toString());
    // publish a event for search index
    await publishEvent("post.created", {
      postId: newPost._id.toString(),
      userId: req.user.userId,
      content: newPost.content,
      createdAt: newPost.createdAt,
    });
    logger.info("Post created successfully", newPost._id);
    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    logger.error("Error creating post", error);
    res.status(500).json({
      success: false,
      message: "Error creating post",
    });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const startIndex = (page - 1) * limit;

    const cacheKey = `posts:${page}:${limit}`;
    const cacheData = await req.redisClient.get(cacheKey);
    // console.log(cacheKey)
    // console.log(cacheData)

    if (cacheData) {
      // console.log("cached posts");
      return res.json(JSON.parse(cacheData));
    } else {
      const posts = await POST_MODEL.find()
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit);
      const totalPosts = await POST_MODEL.countDocuments();

      const result = {
        data: posts,
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts: totalPosts,
      };

      await req.redisClient.setex(cacheKey, 5 * 60, JSON.stringify(result));

      return res.json(result);
    }
  } catch (error) {
    logger.error("Error fetching posts", error);
    res.status(500).json({
      success: false,
      message: "Error fetching posts",
    });
  }
};

const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const cachedKey = `post:${postId}`;
    const cachedPost = await req.redisClient.get(cachedKey);
    if (cachedPost) {
      return res.json(JSON.parse(cachedPost));
    } else {
      const post = await POST_MODEL.findById(postId);
      if (!post) {
        logger.warn("Post not found");
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }
      await req.redisClient.setex(cachedKey, 1 * 60 * 60, JSON.stringify(post));
      return res.json(post);
    }
  } catch (error) {
    logger.error("Error fetching post by id", error);
    res.status(500).json({
      success: false,
      message: "Error fetching post by id",
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await POST_MODEL.findOneAndDelete({
      _id: postId,
      user: req.user.userId,
    });
    if (!post) {
      logger.warn("Post not found or not owned by user");
      return res.status(404).json({
        success: false,
        message: "Post not found or not owned by user",
      });
    }

    // publish event post deleted
    await publishEvent("post.deleted", {
      postId: post._id,
      userId: req.user.userId,
      mediaIds: post.mediaIds,
    });

    await invalidateCached(req, postId.toString());
    logger.info("Post deleted successfully", postId);
    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting post by id", error);
    res.status(500).json({
      success: false,
      message: "Error deleting post by id",
    });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
};
