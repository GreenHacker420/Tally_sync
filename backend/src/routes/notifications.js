const express = require('express');
const { protect, checkCompanyAccess } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', checkCompanyAccess, async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Notifications endpoint - Coming soon'
  });
});

module.exports = router;
