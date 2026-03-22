/**
 * Branch Utilities
 *
 * Logics:
 * - getBranchName(branchId, branches):
 *   Returns branch name for given ID from branches array, or 'Unknown' if not found.
 * - This utility is reusable across components for displaying branch names.
 */

export const getBranchName = (branchId, branches) => {
  if (!branchId || !branches || branches.length === 0) return '--'

  // If branchId is string, find by _id
  if (typeof branchId === 'string') {
    const branch = branches.find(b => b._id === branchId)
    return branch ? branch.branchName : 'Unknown'
  }

  // If branchId is object with _id
  if (typeof branchId === 'object' && branchId._id) {
    const branch = branches.find(b => b._id === branchId._id)
    return branch ? branch.branchName : 'Unknown'
  }

  // If branchId is object with branchName
  if (typeof branchId === 'object' && branchId.branchName) {
    return branchId.branchName
  }

  return 'Unknown'
}