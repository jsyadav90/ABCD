/**
 * User Routes
 * 
 * Logics:
 * - All routes require verifyJWT (authenticated).
 * - Dropdowns:
 *   /dropdown/roles, /dropdown/branches, /dropdown/users for form population.
 * - Creation:
 *   POST / → createUser (server generates userId/seqId).
 * - Preview Next ID:
 *   GET /next-id → next userId without mutating sequence (for UI preview).
 * - Listing & Details:
 *   GET / → listUsers (with branch scoping); GET /:id → user by id.
 * - Updates:
 *   PUT /:id → general updates; toggle isActive, canLogin, role change;
 *   change-password bound to a user id.
 * - Deletion:
 *   soft-delete, restore, permanent delete endpoints.
 */

import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import {
  createUser,
  getUserById,
  listUsers,
  updateUser,
  toggleCanLogin,
  toggleIsActive,
  changeUserRole,
  softDeleteUser,
  restoreUser,
  deleteUserPermanent,
  getRolesForDropdown,
  getBranchesForDropdown,
  getUsersForDropdown,
  changeUserPassword,
  getNextUserId,
} from "../controllers/user.controller.js";

const router = express.Router();

// All user routes require authentication
router.use(verifyJWT);

// Get dropdown data for roles - Required for Add/Edit forms
router.get("/dropdown/roles", verifyPermission("users:access"), getRolesForDropdown);

// Get dropdown data for branches
router.get("/dropdown/branches", getBranchesForDropdown);

// Get dropdown data for users (managers)
router.get("/dropdown/users", verifyPermission("users:access"), getUsersForDropdown);

// Create a new user
router.post("/", verifyPermission("users:page_buttons:add"), createUser);

// Preview next userId (readonly, non-mutating)
router.get("/next-id", verifyPermission("users:page_buttons:add"), getNextUserId);

// List all users with filters and pagination
router.get("/", verifyPermission("users:access"), listUsers);

// Get user by ID
router.get("/:id", verifyPermission("users:access"), getUserById);

// Update user (general fields, not canLogin/isActive)
router.put("/:id", verifyPermission("users:rows_buttons:edit"), updateUser);

// Toggle canLogin - enable/disable login credentials
router.post("/:id/toggle-can-login", verifyPermission("users:rows_buttons:edit"), toggleCanLogin);

// Toggle isActive - enable/disable user account
// Request body: { enable: boolean, inactiveReason: string }
router.post("/:id/toggle-is-active", verifyPermission("users:rows_buttons:edit"), toggleIsActive);

// Change user role
router.post("/:id/change-role", verifyPermission("users:rows_buttons:edit_role"), changeUserRole);

// Change user password
router.post("/:id/change-password", verifyPermission("users:rows_buttons:change_password"), changeUserPassword);

// Soft-delete user (deactivate)
router.post("/:id/soft-delete", verifyPermission("users:rows_buttons:edit"), softDeleteUser);

// Restore user
router.post("/:id/restore", verifyPermission("users:rows_buttons:edit"), restoreUser);

// Permanently delete user
router.delete("/:id", verifyPermission("users:rows_buttons:edit"), deleteUserPermanent);

export default router;
