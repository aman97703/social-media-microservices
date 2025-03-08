const SEARCH_POST_MODEL = require("../models/search");
const logger = require("../utils/logger");

const searchpost = async (req, res) => {
  logger.info("Search endpoint hit");

  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Please provide a search query",
      });
    }
    const cachedKey = `search:${query}`;
    const cachedData = await req.redisClient.get(cachedKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    } else {
      const results = await SEARCH_POST_MODEL.find(
        {
          $text: {
            $search: query,
          },
        },
        {
          score: { $meta: "textScore" },
        }
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(10);

      await req.redisClient.setex(
        cachedKey,
        1 * 60 * 60,
        JSON.stringify(results)
      );
      res.json(results);
    }
  } catch (error) {
    logger.error("Error searching post", error);
    res.status(500).json({
      success: false,
      message: "Error searching post",
    });
  }
};

module.exports = { searchpost };
