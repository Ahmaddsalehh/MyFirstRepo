const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};

  const validUsername = username === process.env.ADMIN_USERNAME;

  let validPassword = false;
  if (process.env.ADMIN_PASSWORD_HASH) {
    validPassword = await bcrypt.compare(password || "", process.env.ADMIN_PASSWORD_HASH);
  } else if (process.env.ADMIN_PASSWORD) {
    validPassword = password === process.env.ADMIN_PASSWORD;
  }

  if (!validUsername || !validPassword) {
    return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
  }

  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "2d" });
  res.json({ token });
});

module.exports = router;
