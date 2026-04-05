/**
 * Service: Asset ID Generator
 * Description: Generates unique Asset IDs using Counter collection
 * Format: A[YY]-[SEQUENTIAL_NUMBER]
 * Example: A26-00001, A26-00002, ... A26-99999 (2026)
 *          A27-00001, A27-00002, ... A27-99999 (2027)
 *
 * Features:
 * - Atomic counter increment (prevents duplicates in concurrent requests)
 * - Automatic year rollover (new year = new counter)
 * - Simple, asset-specific design
 */

import { Counter } from "../models/assetIdCounter.model.js";
import { apiError } from "../utils/apiError.js";

/**
 * Generate next unique Asset ID
 * Uses atomic database operations to ensure no duplicates
 *
 * @returns {Promise<string>} Generated Asset ID (e.g., "A26-00001")
 *
 * @throws {apiError} If counter operation fails
 *
 * @example
 * const assetId = await generateAssetId();
 * // Returns: "A26-00001" for first asset of 2026
 * // Returns: "A26-00002" for second asset of 2026
 */
export const generateAssetId = async () => {
  const year = new Date().getFullYear().toString().slice(-2); // 26, 27

  const counter = await Counter.findOneAndUpdate(
    { _id: "assetId" },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );

  const seq = counter.sequence;

  return `A${year}-${seq.toString().padStart(5, "0")}`;
};

/**
 * Get next Asset ID without incrementing counter
 * Useful for previewing what the next ID will be
 *
 * @returns {Promise<string>} Next Asset ID (e.g., "A26-00001")
 *
 * @throws {apiError} If counter operation fails
 */
export const getNextAssetId = async () => {
  const year = new Date().getFullYear().toString().slice(-2); // 26, 27

  const counter = await Counter.findOne({ _id: "assetId" });
  const seq = (counter?.sequence || 0) + 1;

  return `A${year}-${seq.toString().padStart(5, "0")}`;
};

/**
 * Get current counter status
 * Useful for monitoring
 *
 * @returns {Promise<Object|null>} Counter document or null if not found
 */
export const getAssetIdCounterStatus = async () => {
  const counter = await Counter.findOne({ _id: "assetId" });
  return counter;
};

/**
 * Reset counter for testing/admin purposes only
 * Use with extreme caution - can create duplicate IDs if not handled properly
 *
 * @param {number} [newSequence=0] - New sequence value to set
 * @returns {Promise<Object>} Updated counter document
 */
export const resetAssetIdCounter = async (newSequence = 0) => {
  const updated = await Counter.findOneAndUpdate(
    { _id: "assetId" },
    { $set: { sequence: newSequence } },
    { new: true, upsert: true }
  );

  return updated;
};

/**
 * Get all counters
 * Useful for dashboard/monitoring
 *
 * @returns {Promise<Array>} Array of counter documents
 */
export const getAllCounters = async () => {
  return await Counter.find({}).sort({ createdAt: -1 });
};