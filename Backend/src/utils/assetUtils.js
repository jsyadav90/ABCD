/**
 * Asset Utilities
 * Purpose: Repeated helper logic ko centralize karna taa ki handlers aur controllers simple aur readable rahein.
 */

export const norm = (val) => (val == null ? "" : String(val).trim());

export const toNumberOrNull = (val) => {
  if (val == null || String(val).trim() === "") return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
};

/**
 * Query se common filters build karta hai
 * - isDeleted false
 * - isActive, branchId, itemCategory, itemType normalize
 * - organization scope apply (agar req.user.organizationId ho)
 */
export const buildAssetListFilter = (req) => {
  const q = req?.query || {};
  const filter = { isDeleted: false };
  // Default to showing only active assets unless caller explicitly requests otherwise
  if (q.isActive !== undefined) filter.isActive = String(q.isActive) === "true";
  else filter.isActive = true;
  if (q.branchId) filter.branchId = q.branchId;
  if (q.itemCategory) filter.itemCategory = norm(q.itemCategory).toLowerCase();
  if (q.itemType) filter.itemType = norm(q.itemType).toLowerCase();
  if (req?.user?.organizationId) filter.organizationId = req.user.organizationId;
  return filter;
};

/**
 * Body se branchId nikalta hai (form compatibility)
 */
export const extractBranchIdFromBody = (body) => body?.branch || body?.branchId || null;

/**
 * Org and audit fields user se set karta hai
 */
export const ensureOrgAndAudit = (req) => ({
  organizationId: req.user?.organizationId || null,
  createdBy: req.user?._id || req.user?.id,
  updatedBy: null,
});

