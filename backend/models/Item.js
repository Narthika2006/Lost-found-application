const mongoose = require("mongoose");

const ITEM_TYPES = ["lost", "found"];
const ITEM_STATUSES = ["pending", "matched", "approved", "rejected"];

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    type: { type: String, enum: ITEM_TYPES, required: true },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    images: [{ type: String, trim: true }],
    location: { type: String, required: true, trim: true, maxlength: 160 },
    status: {
      type: String,
      enum: ITEM_STATUSES,
      default: "pending",
    },
    matchedItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      default: null,
    },
    locationLat: {
      type: Number,
      default: null,
      min: -90,
      max: 90,
    },
    locationLng: {
      type: Number,
      default: null,
      min: -180,
      max: 180,
    },
    locationCoordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: undefined,
      },
      coordinates: {
        type: [Number],
        default: undefined,
        validate: {
          validator: (coords) =>
            coords == null ||
            (coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90),
          message: "Coordinates must be [lng, lat]",
        },
      },
    },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

itemSchema.pre("validate", function syncGeoFields(next) {
  const hasCoords =
    Number.isFinite(this.locationLat) && Number.isFinite(this.locationLng);

  if (hasCoords) {
    this.locationCoordinates = {
      type: "Point",
      coordinates: [this.locationLng, this.locationLat],
    };
  } else {
    this.locationCoordinates = undefined;
  }

  next();
});

itemSchema.index({ locationCoordinates: "2dsphere" });
itemSchema.index({ type: 1, status: 1, category: 1, createdAt: -1 });
itemSchema.index({ postedBy: 1, createdAt: -1 });

module.exports = mongoose.model("Item", itemSchema);
