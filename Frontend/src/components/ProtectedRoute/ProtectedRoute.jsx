import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Loading } from '../index'
import { hasPermission, getCurrentUserModules } from '../../utils/permissionHelper'
import { getModuleForPermission, getPermissionKeyFromFullPermission } from '../../constants/modulePermissionsMap'
import NotFound from '../../pages/NotFound/NotFound'

const ProtectedRoute = ({ children, requiredPermission }) => {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loading type="spinner" fullScreen text="Loading..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // NEW: Check if user has required permission AND the module for that permission
  if (requiredPermission) {
    // First check if user has the permission
    if (!hasPermission(requiredPermission)) {
      console.log(`[ROUTE GUARD] User doesn't have permission: ${requiredPermission}`);
      return <NotFound />
    }

    // NEW: Check if user's modules include the module for this permission
    const permissionKey = getPermissionKeyFromFullPermission(requiredPermission)
    const requiredModule = getModuleForPermission(permissionKey)
    
    if (requiredModule) {
      const userModules = getCurrentUserModules()
      if (!userModules.includes(requiredModule)) {
        console.log(
          `[ROUTE GUARD] User has permission "${requiredPermission}" but missing module "${requiredModule}". User modules:`,
          userModules
        );
        return <NotFound />
      }
    }
  }

  return children
}

export default ProtectedRoute
