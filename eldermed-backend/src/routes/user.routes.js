// src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  linkUserToCaretaker
} = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/', registerUser); // ✅ Register
router.post('/login', loginUser); // ✅ Login
router.post('/:id/link', authMiddleware, linkUserToCaretaker); // ✅ Link user to caretaker

module.exports = router;
