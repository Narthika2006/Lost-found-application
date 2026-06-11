const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");
const Item = require("../models/Item");
const { getDistance } = require("../utils/geo");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

router.get("/", protect, asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(notifications);
}));

router.put("/:id/read", protect, asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new HttpError(404, "Not found");
  }

  if (notification.user.toString() !== req.user._id.toString()) {
    throw new HttpError(403, "Unauthorized");
  }

  notification.isRead = true;
  await notification.save();

  res.json({ message: "Notification marked as read" });
}));

router.post("/nearby", protect, asyncHandler(async (req, res) => {
  const { itemId, userLat, userLng, distanceKm } = req.body || {};

  if (!itemId || userLat == null || userLng == null) {
    throw new HttpError(400, "Missing location or item data");
  }

  const item = await Item.findById(itemId);
  if (!item || item.type !== "lost" || item.status === "approved") {
    throw new HttpError(404, "Lost item not found");
  }

  const radius = Number.isFinite(Number(distanceKm)) ? Number(distanceKm) : 1;
  const distance = getDistance(Number(userLat), Number(userLng), item.locationLat, item.locationLng);

  if (!Number.isFinite(distance) || distance > radius) {
    throw new HttpError(400, "User not within range");
  }

  const existing = await Notification.findOne({ user: req.user._id, item: item._id });
  if (existing) {
    return res.json({ message: "Notification already sent" });
  }

  await Notification.create({
    user: req.user._id,
    item: item._id,
    message: `Nearby alert: A lost item "${item.title}" was reported ${distance.toFixed(2)} km away.`,
  });

  res.json({ message: "Notification created" });
}));

module.exports = router;
