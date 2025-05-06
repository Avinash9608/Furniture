const express = require("express");
const {
  register,
  login,
  getMe,
  logout,
  adminLogin,
} = require("../controllers/auth");

// Import the direct auth controller for fallback
const directAuth = require("../controllers/directAuth");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const { protect } = require("../middleware/auth");
const {
  registerFallback,
  loginFallback,
} = require("../middleware/mongoFallback");

// Disable rate limiting in development mode
const adminLimiter =
  process.env.NODE_ENV === "development"
    ? (req, res, next) => next() // Pass-through middleware in development
    : rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // limit each IP to 5 login attempts
        message: "Too many login attempts, please try again later",
      });
// Standard routes with fallback middleware
router.post("/register", registerFallback, register);
router.post("/login", loginFallback, login);

// Direct routes that bypass Mongoose
router.post("/direct/register", directAuth.register);
router.post("/direct/login", directAuth.login);

// Other routes
router.get("/me", protect, getMe);
router.get("/logout", protect, logout);
router.post("/admin/login", adminLimiter, adminLogin);
module.exports = router;
