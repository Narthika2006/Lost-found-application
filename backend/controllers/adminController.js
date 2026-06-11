const User = require("../models/User");
const Item = require("../models/Item");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

exports.getAdminStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalItems = await Item.countDocuments();
  const lostItems = await Item.countDocuments({ type: "lost" });
  const foundItems = await Item.countDocuments({ type: "found" });
  const pendingMatches = await Item.countDocuments({
    status: "matched",
    type: "lost",
  });

  res.json({
    totalUsers,
    totalItems,
    lostItems,
    foundItems,
    pendingMatches,
  });
});

exports.getMatchedItems = asyncHandler(async (req, res) => {
  const matchedItems = await Item.find({
    status: "matched",
    type: "lost",
  })
    .populate("postedBy", "name email")
    .populate({
      path: "matchedItem",
      populate: {
        path: "postedBy",
        select: "name email",
      },
    });

  res.json(matchedItems);
});

exports.approveMatch = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id)
    .populate("postedBy")
    .populate({
      path: "matchedItem",
      populate: { path: "postedBy" },
    });

  if (!item || !item.matchedItem) {
    throw new HttpError(404, "Match not found");
  }

  const matchedItem = item.matchedItem;

  item.status = "approved";
  matchedItem.status = "approved";

  await item.save();
  await matchedItem.save();

  const lostItem = item.type === "lost" ? item : matchedItem;
  const foundItem = item.type === "found" ? item : matchedItem;

  if (!lostItem || !foundItem) {
    throw new HttpError(400, "Invalid match data");
  }

  const notifications = [];

  if (lostItem.postedBy?._id) {
    notifications.push({
      user: lostItem.postedBy._id,
      message: `Great news! Your lost item "${lostItem.title}" has been matched and approved. Please visit the admin office to collect it.`,
    });
  }

  if (foundItem.postedBy?._id) {
    notifications.push({
      user: foundItem.postedBy._id,
      message: `The item you reported as found ("${foundItem.title}") has been matched with its owner. Thank you for your honesty!`,
    });
  }

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  res.json({ message: "Match approved successfully" });
});

exports.rejectMatch = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id).populate("matchedItem");

  if (!item || !item.matchedItem) {
    throw new HttpError(404, "Match not found");
  }

  const matchedItem = item.matchedItem;

  item.status = "pending";
  matchedItem.status = "pending";
  item.matchedItem = null;
  matchedItem.matchedItem = null;

  await item.save();
  await matchedItem.save();

  res.json({ message: "Match rejected successfully" });
});

exports.manualMatch = asyncHandler(async (req, res) => {
  const { lostId, foundId } = req.body || {};

  if (!lostId || !foundId) {
    throw new HttpError(400, "Lost and found item IDs are required");
  }

  if (lostId === foundId) {
    throw new HttpError(400, "Lost and found items must be different");
  }

  const lostItem = await Item.findById(lostId);
  const foundItem = await Item.findById(foundId);

  if (!lostItem || !foundItem) {
    throw new HttpError(404, "Item not found");
  }

  if (lostItem.type !== "lost" || foundItem.type !== "found") {
    throw new HttpError(400, "Incorrect item types");
  }

  if (
    (lostItem.matchedItem && lostItem.matchedItem.toString() !== foundItem._id.toString()) ||
    (foundItem.matchedItem && foundItem.matchedItem.toString() !== lostItem._id.toString())
  ) {
    throw new HttpError(400, "One of the items is already matched");
  }

  if (lostItem.status === "approved" || foundItem.status === "approved") {
    throw new HttpError(400, "Approved items cannot be rematched");
  }

  lostItem.status = "matched";
  foundItem.status = "matched";
  lostItem.matchedItem = foundItem._id;
  foundItem.matchedItem = lostItem._id;

  await lostItem.save();
  await foundItem.save();

  res.json({
    message: "Manual match created",
    matchId: lostItem._id,
    lostItem,
    foundItem,
  });
});
