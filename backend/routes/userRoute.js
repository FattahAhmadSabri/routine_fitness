const express = require("express");
const { loginLimiter } = require("../middleware/rateLimitingMiddleware");
const authMiddleware = require("../middleware/authenticateMiddleware");
const {
  createUserController,
  loginController,
  forgotPasswordController,
  updatePasswordController,
  getUserByMeController,
  deleteUserController
} = require("../controller/userController");

const router = express.Router();

router.post("/user/register", createUserController);
router.post("/user/login", loginLimiter, loginController);
router.post("/user/password/forgotPassword", forgotPasswordController);
router.get("/user/me", authMiddleware, getUserByMeController);
router.patch("/user/password/reset/:id",authMiddleware, updatePasswordController);
router.delete("/user/delete",authMiddleware, deleteUserController);


module.exports = router;
