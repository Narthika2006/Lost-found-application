const express = require("express");

const {
  createItem,
  getItems,
  getMyItems,
  deleteItem,
  updateItem,
  
  getItemStats
} = require("../controllers/itemController");

const { protect } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");
const upload = require("../middleware/upload");


const router = express.Router();


// ============================
// PUBLIC ROUTES
// ============================
// Get stats
router.get("/stats", protect, isAdmin, getItemStats);
// Get all approved items
router.route("/")
  .get(getItems)
  .post(protect, upload.array("images", 5), createItem);




// ============================
// USER ROUTES
// ============================

// Get logged-in user's items
router.get("/my-items", protect, getMyItems);

// Update item
router.put("/:id", protect, updateItem);

// Delete item
router.delete("/:id", protect, deleteItem);




module.exports = router;
