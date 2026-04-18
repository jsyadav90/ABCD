import { Role } from "../models/role.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import {
  MODULE_PERMISSIONS_MAP,
  getPermissionsForModules,
  getRemovedModules,
  getAddedModules,
} from "../constants/modulePermissionsMap.js";

export const listRoles = asyncHandler(async (req, res) => {
  const filter = { isDeleted: false };

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === "true";
  }

  if (req.query.organizationId) {
    filter.organizationId = req.query.organizationId;
  }

  const roles = await Role.find(filter).sort({ priority: 1, createdAt: -1 }).lean();

  return res
    .status(200)
    .json(new apiResponse(200, roles, "Roles retrieved successfully"));
});

export const getRoleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const role = await Role.findById(id).lean();

  if (!role || role.isDeleted) {
    throw new apiError(404, "Role not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, role, "Role retrieved successfully"));
});

export const createRole = asyncHandler(async (req, res) => {
  const {
    name,
    displayName,
    description,
    organizationId,
    priority,
    isActive,
    isDefault,
    permissionKeys,
    modules,
  } = req.body;

  if (!name || !displayName) {
    throw new apiError(400, "name and displayName are required");
  }

  if (!req.user?.id) {
    throw new apiError(401, "Authenticated user is required to create roles");
  }

  const existing = await Role.findOne({
    name: name.toLowerCase(),
    organizationId: organizationId || null,
    isDeleted: false,
  });

  if (existing) {
    throw new apiError(409, "A role with this name already exists");
  }

  // Check for duplicate displayName
  const existingDisplayName = await Role.findOne({
    displayName: displayName,
    organizationId: organizationId || null,
    isDeleted: false,
  });

  if (existingDisplayName) {
    throw new apiError(409, "A role with this display name already exists");
  }

  if (isDefault === true) {
    await Role.updateMany(
      {
        organizationId: organizationId || null,
        isDeleted: false,
        isDefault: true,
      },
      { isDefault: false }
    );
  }

  const moduleList = Array.isArray(modules)
    ? Array.from(new Set(modules.filter((m) => typeof m === "string").map((m) => m.trim().toLowerCase())))
    : ["module_1", "module_2"]; // Default to both modules if not specified

  const doc = await Role.create({
    name: name.toLowerCase(),
    displayName,
    description: description || "",
    organizationId: organizationId || null,
    category: organizationId ? "custom" : "system",
    priority: typeof priority === "number" ? priority : 100,
    isActive: isActive !== false,
    isDefault: isDefault === true,
    permissionKeys: Array.isArray(permissionKeys) ? permissionKeys : [],
    modules: moduleList,
    createdBy: req.user.id,
  });

  return res
    .status(201)
    .json(new apiResponse(201, doc, "Role created successfully"));
});

export const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    displayName,
    description,
    priority,
    isActive,
    isDefault,
    permissionKeys,
    modules,
    newDefaultRoleId,
    makeNewDefault,
    clearUsers,
  } = req.body;

  console.log("📥 updateRole called with:", {
    id,
    isActive,
    isDefault,
    newDefaultRoleId,
    makeNewDefault,
    clearUsers,
  });

  const role = await Role.findById(id);

  if (!role || role.isDeleted) {
    throw new apiError(404, "Role not found");
  }

  // Check for duplicate name if name is being changed
  if (role.category !== "system" && typeof name === "string" && name.trim()) {
    const existingName = await Role.findOne({
      name: name.toLowerCase(),
      organizationId: role.organizationId || null,
      isDeleted: false,
      _id: { $ne: role._id },
    });

    if (existingName) {
      throw new apiError(409, "A role with this name already exists");
    }
  }

  // Check for duplicate displayName if displayName is being changed
  if (typeof displayName === "string" && displayName.trim()) {
    const existingDisplayName = await Role.findOne({
      displayName: displayName,
      organizationId: role.organizationId || null,
      isDeleted: false,
      _id: { $ne: role._id },
    });

    if (existingDisplayName) {
      throw new apiError(409, "A role with this display name already exists");
    }
  }

  if (role.category !== "system" && typeof name === "string" && name.trim()) {
    role.name = name.toLowerCase();
  }

  if (typeof displayName === "string" && displayName.trim()) {
    role.displayName = displayName;
  }

  if (typeof description === "string") {
    role.description = description;
  }

  if (typeof priority === "number") {
    role.priority = priority;
  }

  const wasActive = role.isActive === true;
  const willBeInactive = typeof isActive === "boolean" ? isActive === false : false;

  let forcedDefaultToFalse = false;
  if (wasActive && willBeInactive && role.isDefault === true) {
    role.isDefault = false;
    forcedDefaultToFalse = true;
  }

  if (typeof isActive === "boolean") {
    role.isActive = isActive;
  }

  if (wasActive && willBeInactive) {
    let assignedToReplacement = false;

    if (newDefaultRoleId) {
      console.log("� NEW DEFAULT ROLE ID FOUND:", newDefaultRoleId, "makeNewDefault:", makeNewDefault);
      
      const replacementRole = await Role.findById(newDefaultRoleId);
      console.log("📝 Replacement role found:", !!replacementRole, "isActive:", replacementRole?.isActive, "isDeleted:", replacementRole?.isDeleted);
            if (!replacementRole || replacementRole.isDeleted) {
        throw new apiError(404, "Replacement role not found");
      }
      
      if (makeNewDefault === true && !replacementRole.isActive) {
        throw new apiError(400, "Cannot set an inactive role as the new default role");
      }
            if (replacementRole && replacementRole.isActive && !replacementRole.isDeleted) {
        // First: unset all other default roles in this organization
        if (makeNewDefault === true) {
          console.log("✅ YES! makeNewDefault === true, SETTING REPLACEMENT AS DEFAULT NOW");
          
          // Unset all other defaults FIRST
          await Role.updateMany(
            {
              _id: { $ne: newDefaultRoleId },
              organizationId: replacementRole.organizationId || null,
              isDeleted: false,
              isDefault: true,
            },
            { isDefault: false }
          );
          console.log("✅ Step 1: Unset all other defaults");
          
          // Use findByIdAndUpdate for atomic operation
          const updatedRole = await Role.findByIdAndUpdate(
            newDefaultRoleId,
            { isDefault: true },
            { new: true }
          );
          console.log("✅ Step 2: SET replacement as default. Result isDefault:", updatedRole.isDefault);
        } else {
          console.log("❌ makeNewDefault is NOT true (value:", makeNewDefault, "), skipping default assignment");
        }

        // Reassign users from deactivated role to replacement role
        await User.updateMany({ roleId: role._id }, { roleId: newDefaultRoleId });
        console.log("✅ Step 3: Users reassigned from", role._id, "to", newDefaultRoleId);
        assignedToReplacement = true;
      }
    }

    if (!assignedToReplacement) {
      if (clearUsers === true) {
        await User.updateMany({ roleId: role._id }, { roleId: null, canLogin: false });
      } else {
        const defaultRole = await Role.findOne({
          _id: { $ne: role._id },
          organizationId: role.organizationId || null,
          isDeleted: false,
          isDefault: true,
          isActive: true,
        }).lean();

        let fallbackRole = defaultRole;

        if (!fallbackRole) {
          fallbackRole = await Role.findOne({
            name: "user",
            organizationId: role.organizationId || null,
            isDeleted: false,
            isActive: true,
          }).lean();
        }

        if (!fallbackRole) {
          fallbackRole = await Role.findOne({
            _id: { $ne: role._id },
            organizationId: role.organizationId || null,
            isDeleted: false,
            isActive: true,
          }).sort({ priority: 1 }).lean();
        }

        if (fallbackRole) {
          await User.updateMany({ roleId: role._id }, { roleId: fallbackRole._id });
        } else {
          await User.updateMany({ roleId: role._id }, { roleId: null, canLogin: false });
        }
      }
    }
  }

  if (typeof isDefault === "boolean" && !forcedDefaultToFalse) {
    // Validate: Cannot set an inactive role as default
    if (isDefault === true && role.isActive === false) {
      throw new apiError(400, "Cannot set an inactive role as the default role. Please activate the role first.");
    }
    role.isDefault = isDefault;
  }

  if (isDefault === true) {
    // Double-check the role is active before unsetting other defaults
    if (role.isActive === false) {
      throw new apiError(400, "Cannot set an inactive role as the default role. Please activate the role first.");
    }

    await Role.updateMany(
      {
        _id: { $ne: role._id },
        organizationId: role.organizationId || null,
        isDeleted: false,
        isDefault: true,
      },
      { isDefault: false }
    );
  }

  if (Array.isArray(permissionKeys)) {
    role.permissionKeys = permissionKeys;
  }

  // Handle module changes: update permissions when modules are added/removed
  if (Array.isArray(modules)) {
    const oldModules = role.modules || [];
    let newModules = Array.from(new Set(modules
      .filter((m) => typeof m === "string")
      .map((m) => m.trim().toLowerCase())
      .filter(Boolean)
    ));
    
    // Ensure at least default modules if explicitly set to empty
    if (!newModules || newModules.length === 0) {
      newModules = ["module_1", "module_2"];
    }

    // Get removed modules
    const removedModulesList = getRemovedModules(oldModules, newModules);
    
    if (removedModulesList.length > 0) {
      // Get all permissions associated with removed modules
      const removedPermissions = getPermissionsForModules(removedModulesList);
      
      // 2a: Remove all permissions of removed modules from role's permissionKeys
      if (removedPermissions.length > 0) {
        role.permissionKeys = (role.permissionKeys || []).filter(
          (pk) => !removedPermissions.includes(pk)
        );
      }
      
      // 2b: For all users with this role, handle extraPermissions and modules
      if (removedPermissions.length > 0) {
        // First, remove those permissions from extraPermissions
        await User.updateMany(
          { roleId: role._id },
          {
            $pullAll: { extraPermissions: removedPermissions },
          }
        );

        // 2c: Check if users have extraPermissions for removed modules, if so, add those modules to user.modules
        for (const removedModule of removedModulesList) {
          const modulePermissions = getPermissionsForModules([removedModule]);
          
          // Find users who have extraPermissions for this module
          const usersWithExtraPerms = await User.find({
            roleId: role._id,
            extraPermissions: { $in: modulePermissions }
          });

          if (usersWithExtraPerms.length > 0) {
            // Add the removed module to these users' modules array
            await User.updateMany(
              {
                roleId: role._id,
                extraPermissions: { $in: modulePermissions }
              },
              {
                $addToSet: { modules: removedModule }
              }
            );
          }
        }
      }
    }

    role.modules = newModules;
  } else if (!role.modules || role.modules.length === 0) {
    // Ensure role has modules even if not provided in update
    role.modules = ["module_1", "module_2"];
  }

  if (role.name === "super_admin") {
    role.modules = ["module_1", "module_2"];
    if (!Array.isArray(role.permissionKeys) || !role.permissionKeys.includes("*")) {
      role.permissionKeys = ["*"];
    }
  }

  if (req.user?.id) {
    role.updatedBy = req.user.id;
  }
  
  // Ensure createdBy points to a valid user to avoid pre-save hook failures on legacy data
  try {
    if (!role.createdBy) {
      role.createdBy = req.user?.id || role.createdBy;
    } else {
      const creator = await User.findById(role.createdBy).select("_id");
      if (!creator && req.user?.id) {
        role.createdBy = req.user.id;
      }
    }
  } catch (_) {
    // Fallback: if lookup fails, at least set to current user if available
    if (req.user?.id) {
      role.createdBy = req.user.id;
    }
  }

  await role.save();

  return res
    .status(200)
    .json(new apiResponse(200, role, "Role updated successfully"));
});

export const deleteRole = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const role = await Role.findById(id);

  if (!role || role.isDeleted) {
    throw new apiError(404, "Role not found");
  }

  if (role.category === "system") {
    throw new apiError(400, "System roles cannot be deleted");
  }

  await role.softDelete(req.user?.id || null);

  return res
    .status(200)
    .json(new apiResponse(200, null, "Role deleted successfully"));
});
