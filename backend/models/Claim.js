const mongoose = require("mongoose");

const CLAIM_STATUSES = ["pending", "approved", "rejected"];

const claimSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    matchPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    proofText: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    proofImage: {
      type: String,
      trim: true,
      default: "",
    },
    adminRemark: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    status: {
      type: String,
      enum: CLAIM_STATUSES,
      default: "pending",
    },
    autoApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

claimSchema.index({ item: 1, claimedBy: 1 }, { unique: true });
claimSchema.index({ status: 1, createdAt: -1 });
claimSchema.index({ claimedBy: 1, createdAt: -1 });

module.exports = mongoose.model("Claim", claimSchema);
