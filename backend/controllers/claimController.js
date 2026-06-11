const Claim = require("../models/Claim");
const Item = require("../models/Item");
const { calculateMatchPercentage } = require("../services/matchingService");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

exports.createClaim = asyncHandler(async (req, res) => {
  const { itemId, proofText } = req.body;

  if (!itemId) {
    throw new HttpError(400, "Item ID is required");
  }

  const item = await Item.findById(itemId);

  if (!item) {
    throw new HttpError(404, "Item not found");
  }

  if (item.postedBy.toString() === req.user._id.toString()) {
    throw new HttpError(400, "You cannot claim your own item");
  }

  const existingClaim = await Claim.findOne({
    item: itemId,
    claimedBy: req.user._id,
  });

  if (existingClaim) {
    throw new HttpError(400, "Already claimed");
  }

  const possibleMatch = await Item.findOne({
    type: item.type === "lost" ? "found" : "lost",
    category: item.category,
  });

  let percentage = 50;

  if (possibleMatch) {
    percentage = calculateMatchPercentage(item, possibleMatch);
  }

  const proofImage = req.file ? `/uploads/${req.file.filename}` : "";

  const claim = await Claim.create({
    item: itemId,
    claimedBy: req.user._id,
    proofText,
    proofImage,
    matchPercentage: percentage,
  });

  if (percentage >= 90) {
    claim.status = "approved";
    claim.autoApproved = true;
    item.status = "approved";
    await item.save();
    await claim.save();
  }

  res.status(201).json({
    message: "Claim submitted",
    claim,
  });
});

exports.updateClaimStatus = asyncHandler(async (req, res) => {
  const { claimId } = req.params;
  const { status, remark } = req.body;

  if (!["approved", "rejected", "pending"].includes(status)) {
    throw new HttpError(400, "Invalid claim status");
  }

  const claim = await Claim.findById(claimId).populate("item");

  if (!claim) {
    throw new HttpError(404, "Claim not found");
  }

  if (status === "approved") {
    const alreadyApproved = await Claim.findOne({
      item: claim.item._id,
      status: "approved",
    });

    if (alreadyApproved && alreadyApproved._id.toString() !== claim._id.toString()) {
      throw new HttpError(400, "Already approved claim exists");
    }

    claim.item.status = "approved";
    await claim.item.save();
  }

  claim.status = status;
  claim.adminRemark = remark;
  await claim.save();

  res.json({ message: "Updated", claim });
});

exports.getMyClaims = asyncHandler(async (req, res) => {
  const claims = await Claim.find({ claimedBy: req.user._id })
    .populate("item", "title location status")
    .sort({ createdAt: -1 });

  res.json(claims);
});

exports.getAllClaims = asyncHandler(async (req, res) => {
  const claims = await Claim.find()
    .populate("claimedBy", "name email")
    .populate("item", "title location status")
    .sort({ createdAt: -1 });

  res.json(claims);
});
