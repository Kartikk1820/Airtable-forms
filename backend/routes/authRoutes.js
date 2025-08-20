const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");

router.get("/login", auth.login);
router.get("/callback", auth.callback);
router.get("/me", auth.me);

module.exports = router;
