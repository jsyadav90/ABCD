/**
 * Utility: Active Status Management Helpers
 * Description: Helper functions to handle isActive status consistently across all models
 * Usage: Use these functions in controllers to activate/deactivate records
 * 
 * Benefits:
 * - Non-destructive: Records stay in DB but are hidden from users
 * - Audit trail: Track when and who deactivated records
 * - Easy reactivation: Can be re-enabled anytime
 */

/**
 * Deactivate a single document
 * @param {Model} Model - Mongoose model
 * @param {string} documentId - Document ID to deactivate
 * @param {string} userId - User ID performing the action
 * @returns {Promise<Object>} Updated document or null if not found
 */
export const deactivateOne = async (Model, documentId, userId) => {
  try {
    const result = await Model.findByIdAndUpdate(
      documentId,
      {
        isActive: false,
        inactiveAt: new Date(),
        inactiveBy: userId,
      },
      { new: true }
    );
    return result;
  } catch (error) {
    throw new Error(`Deactivation failed: ${error.message}`);
  }
};

/**
 * Activate a single document
 * @param {Model} Model - Mongoose model
 * @param {string} documentId - Document ID to activate
 * @param {string} userId - User ID performing the action
 * @returns {Promise<Object>} Updated document or null if not found
 */
export const activateOne = async (Model, documentId, userId) => {
  try {
    const result = await Model.findByIdAndUpdate(
      documentId,
      {
        isActive: true,
        inactiveAt: null,
        inactiveBy: null,
      },
      { new: true }
    );
    return result;
  } catch (error) {
    throw new Error(`Activation failed: ${error.message}`);
  }
};

/**
 * Toggle isActive status for a single document
 * @param {Model} Model - Mongoose model
 * @param {string} documentId - Document ID to toggle
 * @param {string} userId - User ID performing the action
 * @returns {Promise<Object>} Updated document or null if not found
 */
export const toggleActive = async (Model, documentId, userId) => {
  try {
    const doc = await Model.findById(documentId);
    if (!doc) return null;

    const updateData = { isActive: !doc.isActive };
    if (!doc.isActive) {
      // Activating
      updateData.inactiveAt = null;
      updateData.inactiveBy = null;
    } else {
      // Deactivating
      updateData.inactiveAt = new Date();
      updateData.inactiveBy = userId;
    }

    const result = await Model.findByIdAndUpdate(documentId, updateData, {
      new: true,
    });
    return result;
  } catch (error) {
    throw new Error(`Toggle status failed: ${error.message}`);
  }
};

/**
 * Deactivate multiple documents
 * @param {Model} Model - Mongoose model
 * @param {Array<string>} documentIds - Array of document IDs to deactivate
 * @param {string} userId - User ID performing the action
 * @returns {Promise<Object>} Updated count and result
 */
export const deactivateMany = async (Model, documentIds, userId) => {
  try {
    const result = await Model.updateMany(
      { _id: { $in: documentIds } },
      {
        isActive: false,
        inactiveAt: new Date(),
        inactiveBy: userId,
      }
    );
    return result;
  } catch (error) {
    throw new Error(`Batch deactivation failed: ${error.message}`);
  }
};

/**
 * Activate multiple documents
 * @param {Model} Model - Mongoose model
 * @param {Array<string>} documentIds - Array of document IDs to activate
 * @param {string} userId - User ID performing the action
 * @returns {Promise<Object>} Updated count and result
 */
export const activateMany = async (Model, documentIds, userId) => {
  try {
    const result = await Model.updateMany(
      { _id: { $in: documentIds } },
      {
        isActive: true,
        inactiveAt: null,
        inactiveBy: null,
      }
    );
    return result;
  } catch (error) {
    throw new Error(`Batch activation failed: ${error.message}`);
  }
};

/**
 * Deactivate documents by filter criteria
 * @param {Model} Model - Mongoose model
 * @param {Object} filter - MongoDB filter
 * @param {string} userId - User ID performing the action
 * @returns {Promise<Object>} Updated count and result
 */
export const deactivateByFilter = async (Model, filter, userId) => {
  try {
    const result = await Model.updateMany(
      filter,
      {
        isActive: false,
        inactiveAt: new Date(),
        inactiveBy: userId,
      }
    );
    return result;
  } catch (error) {
    throw new Error(`Deactivation by filter failed: ${error.message}`);
  }
};

/**
 * Activate documents by filter criteria
 * @param {Model} Model - Mongoose model
 * @param {Object} filter - MongoDB filter
 * @param {string} userId - User ID performing the action
 * @returns {Promise<Object>} Updated count and result
 */
export const activateByFilter = async (Model, filter, userId) => {
  try {
    const result = await Model.updateMany(
      filter,
      {
        isActive: true,
        inactiveAt: null,
        inactiveBy: null,
      }
    );
    return result;
  } catch (error) {
    throw new Error(`Activation by filter failed: ${error.message}`);
  }
};

/**
 * Query only active documents (isActive: true)
 * @param {Model} Model - Mongoose model
 * @param {Object} filter - Additional filter criteria (optional)
 * @returns {Query} Mongoose query object
 */
export const queryActive = (Model, filter = {}) => {
  return Model.find({ ...filter, isActive: true });
};

/**
 * Query only inactive documents (isActive: false)
 * @param {Model} Model - Mongoose model
 * @param {Object} filter - Additional filter criteria (optional)
 * @returns {Query} Mongoose query object
 */
export const queryInactive = (Model, filter = {}) => {
  return Model.find({ ...filter, isActive: false });
};

/**
 * Count only active documents
 * @param {Model} Model - Mongoose model
 * @param {Object} filter - Additional filter criteria (optional)
 * @returns {Promise<number>} Count of active documents
 */
export const countActive = async (Model, filter = {}) => {
  return await Model.countDocuments({ ...filter, isActive: true });
};

/**
 * Count only inactive documents
 * @param {Model} Model - Mongoose model
 * @param {Object} filter - Additional filter criteria (optional)
 * @returns {Promise<number>} Count of inactive documents
 */
export const countInactive = async (Model, filter = {}) => {
  return await Model.countDocuments({ ...filter, isActive: false });
};

/**
 * Get status info (active and inactive counts)
 * @param {Model} Model - Mongoose model
 * @param {Object} filter - Additional filter criteria (optional)
 * @returns {Promise<Object>} { active: number, inactive: number, total: number }
 */
export const getStatusInfo = async (Model, filter = {}) => {
  const active = await countActive(Model, filter);
  const inactive = await countInactive(Model, filter);
  
  return {
    active,
    inactive,
    total: active + inactive,
  };
};

export default {
  deactivateOne,
  activateOne,
  toggleActive,
  deactivateMany,
  activateMany,
  deactivateByFilter,
  activateByFilter,
  queryActive,
  queryInactive,
  countActive,
  countInactive,
  getStatusInfo,
};
