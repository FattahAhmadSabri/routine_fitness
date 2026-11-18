
const express = require("express");
const router = express.Router();

const { chatWithAI } = require("../controller/aiController");
const authMiddleware = require("../middleware/authenticateMiddleware");

// Replace this with your actual authentication middleware.
// Enable authentication before exposing the API to users.
router.post("/chat",authMiddleware, chatWithAI);

module.exports = router;
