const express = require('express');
const router = express.Router();
const { signup, login, me } = require('../controllers/authController');
const authMiddleware = require('../utils/authMiddleware');
const { body } = require('express-validator');

// ========== SIGNUP ==========
router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be 6+ characters'),
  ],
  signup
);

// ========== LOGIN ==========
router.post('/login', login);

// ========== GET LOGGED-IN USER ==========
router.get('/me', authMiddleware, me);

module.exports = router;
