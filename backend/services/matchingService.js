const Item = require("../models/Item");
const { getDistance } = require("../utils/geo");

const MAX_AUTO_MATCH_DISTANCE_KM = 1;

const normalizeText = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const getTextSimilarity = (firstText = "", secondText = "") => {
  const firstTokens = new Set(normalizeText(firstText));
  const secondTokens = new Set(normalizeText(secondText));

  if (!firstTokens.size || !secondTokens.size) {
    return 0;
  }

  const overlap = [...firstTokens].filter((token) => secondTokens.has(token)).length;
  const union = new Set([...firstTokens, ...secondTokens]).size;

  return union ? overlap / union : 0;
};

const calculateMatchPercentage = (lostItem, foundItem) => {
  let score = 0;

  if (lostItem.category === foundItem.category) {
    score += 35;
  }

  score += getTextSimilarity(lostItem.title, foundItem.title) * 25;
  score += getTextSimilarity(lostItem.description, foundItem.description) * 25;

  if (
    Number.isFinite(lostItem.locationLat) &&
    Number.isFinite(lostItem.locationLng) &&
    Number.isFinite(foundItem.locationLat) &&
    Number.isFinite(foundItem.locationLng)
  ) {
    const distance = getDistance(
      lostItem.locationLat,
      lostItem.locationLng,
      foundItem.locationLat,
      foundItem.locationLng
    );

    if (Number.isFinite(distance)) {
      score += Math.max(0, 15 - distance * 10);
    }
  }

  return Math.round(Math.min(score, 100));
};

const findBestMatchForItem = async ({ itemId = null, type, category, description, lat, lng }) => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const oppositeType = type === "lost" ? "found" : "lost";
  const candidates = await Item.find({
    _id: itemId ? { $ne: itemId } : { $exists: true },
    type: oppositeType,
    category,
    status: "pending",
    locationLat: { $exists: true, $ne: null },
    locationLng: { $exists: true, $ne: null },
  });

  let bestMatch = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const distance = getDistance(lat, lng, candidate.locationLat, candidate.locationLng);
    if (!Number.isFinite(distance) || distance > MAX_AUTO_MATCH_DISTANCE_KM) {
      continue;
    }

    const descriptionSimilarity = getTextSimilarity(description, candidate.description);
    const score = (MAX_AUTO_MATCH_DISTANCE_KM - distance) + descriptionSimilarity;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  return bestMatch;
};

module.exports = {
  MAX_AUTO_MATCH_DISTANCE_KM,
  calculateMatchPercentage,
  findBestMatchForItem,
  getTextSimilarity,
};
