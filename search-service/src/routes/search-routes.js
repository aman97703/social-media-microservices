const { searchpost } = require("../controllers/search-controller");
const { authenticateRequest } = require("../middleware/auth-middleware");

const router = require("express").Router();

router.use(authenticateRequest);

router.get("/", searchpost);

module.exports = router;
