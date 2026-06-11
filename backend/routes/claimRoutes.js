const express = require('express');
const router = express.Router();

const {
  createClaim,
  updateClaimStatus,
  getMyClaims,
  getAllClaims
} = require('../controllers/claimController');

const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');
const upload = require('../middleware/upload');

// 🔥 Add upload here
router.post('/', protect, upload.single("proofImage"), createClaim);

router.get('/my-claims', protect, getMyClaims);

router.get('/', protect, admin, getAllClaims);

router.put('/:claimId', protect, admin, updateClaimStatus);

module.exports = router;