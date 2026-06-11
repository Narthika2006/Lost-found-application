const Item = require("../models/Item");
const User = require("../models/User");
const { findBestMatchForItem } = require("../services/matchingService");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

const EDITABLE_FIELDS = ["title", "description", "category", "location"];
const ALLOWED_SORT_FIELDS = new Set(["createdAt", "updatedAt", "title"]);
const DEFAULT_PAGE_SIZE = 10;

exports.createItem = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    location,
    type,
    locationLat,
    locationLng,
  } = req.body;

  if (!title || !type || !category || !location) {
    throw new HttpError(400, "Title, type, category, and location are required");
  }

  if (!["lost", "found"].includes(type)) {
    throw new HttpError(400, "Invalid item type");
  }

  const lat = Number(locationLat);
  const lng = Number(locationLng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const imagePaths = req.files
    ? req.files.map((file) => `/uploads/${file.filename}`)
    : [];

  const normalizedCategory = category.trim();
  const newItem = await Item.create({
    title: title.trim(),
    description: description?.trim(),
    category: normalizedCategory,
    location: location.trim(),
    type,
    locationLat: hasCoords ? lat : undefined,
    locationLng: hasCoords ? lng : undefined,
    locationCoordinates: hasCoords
      ? {
          type: "Point",
          coordinates: [lng, lat],
        }
      : undefined,
    images: imagePaths,
    postedBy: req.user._id,
    status: "pending",
  });

  const bestMatch = hasCoords
    ? await findBestMatchForItem({
        itemId: newItem._id,
        type,
        category: normalizedCategory,
        description,
        lat,
        lng,
      })
    : null;

  if (bestMatch) {
    newItem.status = "matched";
    newItem.matchedItem = bestMatch._id;
    bestMatch.status = "matched";
    bestMatch.matchedItem = newItem._id;

    await newItem.save();
    await bestMatch.save();
  }

  res.status(201).json(newItem);
});

exports.getItems = asyncHandler(async (req, res) => {
  const {
    search,
    type,
    category,
    status,
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    sort = "createdAt",
    order = "desc",
  } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }

  if (type) query.type = type;
  if (category) query.category = category;
  if (status) query.status = status;

  const pageNumber = Math.max(Number.parseInt(page, 10) || 1, 1);
  const pageSize = Math.min(
    Math.max(Number.parseInt(limit, 10) || DEFAULT_PAGE_SIZE, 1),
    50
  );
  const sortField = ALLOWED_SORT_FIELDS.has(sort) ? sort : "createdAt";
  const sortDirection = order === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    Item.find(query)
      .populate("postedBy", "name email")
      .sort({ [sortField]: sortDirection })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize),
    Item.countDocuments(query),
  ]);

  res.json({
    items,
    pagination: {
      total,
      page: pageNumber,
      limit: pageSize,
      pages: Math.ceil(total / pageSize),
    },
  });
});

exports.getMyItems = asyncHandler(async (req, res) => {
  const items = await Item.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
  res.json(items);
});

exports.deleteItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);

  if (!item) {
    throw new HttpError(404, "Not found");
  }

  if (item.postedBy.toString() !== req.user._id.toString()) {
    throw new HttpError(403, "Unauthorized");
  }

  await item.deleteOne();
  res.json({ message: "Deleted" });
});

exports.updateItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);

  if (!item) {
    throw new HttpError(404, "Not found");
  }

  const isOwner = item.postedBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new HttpError(403, "Unauthorized");
  }

  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => EDITABLE_FIELDS.includes(key))
  );

  if (Object.keys(updates).length === 0) {
    throw new HttpError(400, "No valid fields to update");
  }

  const updated = await Item.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  res.json(updated);
});

exports.getItemStats = asyncHandler(async (req, res) => {
  const total = await Item.countDocuments();
  const lost = await Item.countDocuments({ type: "lost" });
  const found = await Item.countDocuments({ type: "found" });
  const matched = await Item.countDocuments({ status: "matched" });
  const users = await User.countDocuments();

  res.json({
    total,
    lost,
    found,
    matched,
    users,
  });
});
