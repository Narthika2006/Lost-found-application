const express = require("express");
const router = express.Router();

const {
  getAdminStats,
  getMatchedItems,
  approveMatch,
  rejectMatch,
  manualMatch,
} = require("../controllers/adminController");

const { protect } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");

// 🛡 All admin routes require authentication + admin access
router.use(protect, isAdmin);


// 📊 Admin Dashboard Statistics
// GET /api/admin/stats
router.get("/stats", getAdminStats);


// 🔎 Get All Matched Items (Pending Admin Review)
// GET /api/admin/matches
router.get("/matches", getMatchedItems);


// ✅ Approve a Match
// PUT /api/admin/matches/:id/approve
router.put("/matches/:id/approve", approveMatch);


// ❌ Reject a Match
// PUT /api/admin/matches/:id/reject
router.put("/matches/:id/reject", rejectMatch);

// ✍️ Manual Match
// POST /api/admin/matches/manual
router.post("/matches/manual", manualMatch);


module.exports = router;
