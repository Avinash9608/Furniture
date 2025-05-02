const express = require("express");
const {
  register,
  login,
  getMe,
  logout,
  adminLogin,
} = require("../controllers/auth");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const { protect } = require("../middleware/auth");

// Disable rate limiting in development mode
const adminLimiter =
  process.env.NODE_ENV === "development"
    ? (req, res, next) => next() // Pass-through middleware in development
    : rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // limit each IP to 5 login attempts
        message: "Too many login attempts, please try again later",
      });
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.get("/logout", protect, logout);
router.post("/admin/login", adminLimiter, adminLogin);
module.exports = router;
