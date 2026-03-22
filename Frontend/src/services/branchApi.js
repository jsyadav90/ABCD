/**
 * branchApi
 *
 * Logics:
 * - fetchAllBranches(organizationId, status, type):
 *   GET /branches with optional filters; returns list of branches.
 * - fetchBranchById(id):
 *   GET /branches/:id for single branch details.
 */

import API from './api'

export const fetchAllBranches = async (organizationId = null, status = null, type = null) => {
  try {
    const params = {}
    if (organizationId) params.organizationId = organizationId
    if (status) params.status = status
    if (type) params.type = type

    const response = await API.get('/branches', { params })
    return response.data?.data || []
  } catch (error) {
    console.error('Failed to fetch branches:', error)
    throw new Error(error.response?.data?.message || 'Failed to fetch branches')
  }
}

export const fetchBranchById = async (id) => {
  try {
    const response = await API.get(`/branches/${id}`)
    return response.data?.data || null
  } catch (error) {
    console.error('Failed to fetch branch:', error)
    throw new Error(error.response?.data?.message || 'Failed to fetch branch')
  }
}