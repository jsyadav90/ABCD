/**
 * Utility: Soft Delete Helpers
 * Description: Helper functions to handle soft deletes consistently across all models
 * Usage: Use these functions in controllers to soft delete records
 */

/**
 * Soft delete a single document
 * @param {Model} Model - Mongoose model
 * @param {string} documentId - Document ID to delete
 * @param {string} userId - User ID performing the deletion
 * @returns {Promise<Object>} Updated document or null if not found
 */
export const softDeleteOne = async (Model, documentId, userId) => {
  try {
    const result = await Model.findByIdAndUpdate(
      documentId,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
      { new: true }
    );
    return result;
  } catch (error) {
    throw new Error(`Soft delete failed: ${error.message}`);
  }
};

/**
 * Soft delete multiple documents
 * @param {Model} Model - Mongoose model
 * @param {Array<string>} documentIds - Array of document IDs to delete
 * @param {string} userId - User ID performing the deletion
 * @returns {Promise<Object>} Updated count and result
 */
export const softDeleteMany = async (Model, documentIds, userId) => {
  try {
    const result = await Model.updateMany(
      { _id: { $in: documentIds } },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      }
    );
    return result;
  } catch (error) {
    throw new Error(`Batch soft delete failed: ${error.message}`);
  }
};

/**
 * Soft delete by filter criteria
 * @param {Model} Model - Mongoose model
 * @param {Object} filter - MongoDB filter
 * @param {string} userId - User ID performing the deletion
 * @returns {Promise<Object>} Updated count and result
 */
export const softDeleteByFilter = async (Model, filter, userId) => {
  try {
    const result = await Model.updateMany(
      filter,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      }
    );
    return result;
  } catch (error) {
    throw new Error(`Soft delete by filter failed: ${error.message}`);
  }
};

/**
 * Restore a soft deleted document
 * @param {Model} Model - Mongoose model
 * @param {string} documentId - Document ID to restore
 * @returns {Promise<Object>} Restored document or null if not found
 */
export const restoreOne = async (Model, documentId) => {
  try {
    const result = await Model.findByIdAndUpdate(
      documentId,
      {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      },
      { new: true }
    );
    return result;
  } catch (error) {
    throw new Error(`Restoration failed: ${error.message}`);
  }
};

/**
 * Restore multiple soft deleted documents
 * @param {Model} Model - Mongoose model
 * @param {Array<string>} documentIds - Array of document IDs to restore
 * @returns {Promise<Object>} Updated count and result
 */
export const restoreMany = async (Model, documentIds) => {
  try {
    const result = await Model.updateMany(
      { _id: { $in: documentIds } },
      {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      }
    );
    return result;
  } catch (error) {
    throw new Error(`Batch restoration failed: ${error.message}`);
  }
};

/**
 * Query only non-deleted documents (excludes soft deleted records)
 * @param {Model} Model - Mongoose model
 * @param {Object} filter - Additional filter criteria (optional)
 * @returns {Query} Mongoose query object
 */
export const queryActive = (Model, filter = {}) => {
  return Model.find({ ...filter, isDeleted: false });
};

/**
 * Query only soft deleted documents
 * @param {Model} Model - Mongoose model
 * @param {Object} filter - Additional filter criteria (optional)
 * @returns {Query} Mongoose query object
 */
export const queryDeleted = (Model, filter = {}) => {
  return Model.find({ ...filter, isDeleted: true });
};

/**
 * Count only active (non-deleted) documents
 * @param {Model} Model - Mongoose model
 * @param {Object} filter - Additional filter criteria (optional)
 * @returns {Promise<number>} Count of active documents
 */
export const countActive = async (Model, filter = {}) => {
  return await Model.countDocuments({ ...filter, isDeleted: false });
};

/**
 * Permanently delete soft deleted documents (hard delete)
 * WARNING: This is irreversible! Use cautiously.
 * @param {Model} Model - Mongoose model
 * @param {Object} filter - Filter for documents to permanently delete
 * @returns {Promise<Object>} Deletion result
 */
export const hardDelete = async (Model, filter = {}) => {
  try {
    const result = await Model.deleteMany(filter);
    return result;
  } catch (error) {
    throw new Error(`Hard delete failed: ${error.message}`);
  }
};

/**
 * Permanently delete all soft deleted documents older than specified days
 * WARNING: This is irreversible! Use cautiously.
 * @param {Model} Model - Mongoose model
 * @param {number} daysOld - Delete records deleted more than X days ago
 * @returns {Promise<Object>} Deletion result
 */
export const hardDeleteOldRecords = async (Model, daysOld = 30) => {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    const result = await Model.deleteMany({
      isDeleted: true,
      deletedAt: { $lt: cutoffDate },
    });
    return result;
  } catch (error) {
    throw new Error(`Hard delete old records failed: ${error.message}`);
  }
};

export default {
  softDeleteOne,
  softDeleteMany,
  softDeleteByFilter,
  restoreOne,
  restoreMany,
  queryActive,
  queryDeleted,
  countActive,
  hardDelete,
  hardDeleteOldRecords,
};
