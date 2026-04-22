import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import { getSelectedAppModule, setSelectedAppModule } from '../utils/appModule'
import { authAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import ChangePasswordModal from '../components/ChangePasswordModal/ChangePasswordModal'
import './MainLayout.css'

/**
 * @param {{ children: React.ReactNode }} props
 */
const MainLayout = ({ children }) => {
  const { forcePasswordChange } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 992)
  const [selectedModule, setSelectedModule] = useState(getSelectedAppModule())
  const location = useLocation()

  // Check if we should show sidebar based on module selection and route
  const shouldShowSidebar = () => {
    // Always show sidebar on non-dashboard routes
    if (location.pathname !== '/dashboard') {
      return true
    }
    // On dashboard, show sidebar if user has a valid module selected
    // (sidebar will handle rendering no items if user has no modules)
    return selectedModule === 'module_1' || selectedModule === 'module_2'
  }
  
  const showSidebar = shouldShowSidebar()

  useEffect(() => {
    const handleModuleChange = () => setSelectedModule(getSelectedAppModule())
    window.addEventListener('appModuleChanged', handleModuleChange)
    window.addEventListener('storage', handleModuleChange)
    return () => {
      window.removeEventListener('appModuleChanged', handleModuleChange)
      window.removeEventListener('storage', handleModuleChange)
    }
  }, [])

  // Handle window resize to detect screen size
  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 992)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Sync app module selection when rights change while the user is active.
  const lastModuleSyncRef = useRef(0)
  React.useEffect(() => {
    const normalizeModuleId = (moduleId) => {
      if (!moduleId) return moduleId
      return String(moduleId).replace(/^module([12])$/, 'module_$1')
    }

    const syncModuleSelection = async () => {
      try {
        const response = await authAPI.getProfile()
        const user = response.data?.data?.user || {}
        const rawModules = Array.isArray(user.modules) ? user.modules : []
        const normalizedModules = rawModules
          .map(normalizeModuleId)
          .filter((m) => typeof m === 'string' && m)

        const currentModule = getSelectedAppModule()
        const availableModules = normalizedModules.length > 0 ? normalizedModules : [currentModule || 'module_1']

        if (!availableModules.includes(currentModule)) {
          const newModule = availableModules[0]
          setSelectedModule(newModule)
          setSelectedAppModule(newModule)
        }
      } catch (err) {
        // Ignore profile fetch failures here; do not break UI
        console.warn('[MainLayout] Module sync failed:', err?.message || err)
      }
    }

    const scheduleSync = () => {
      const now = Date.now()
      if (now - lastModuleSyncRef.current < 10000) return
      lastModuleSyncRef.current = now
      syncModuleSelection()
    }

    const events = ['click', 'keydown', 'touchstart']
    events.forEach((eventName) => window.addEventListener(eventName, scheduleSync, true))
    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, scheduleSync, true))
    }
  }, [])

  const handleToggle = () => setCollapsed(prev => !prev)

  // Close sidebar when clicking on main content (only on mobile)
  const handleMainContentClick = () => {
    if (collapsed && !isDesktop) {
      setCollapsed(false)
    }
  }

  return (
    <div className="main-layout">
      {forcePasswordChange && (
        <ChangePasswordModal 
          isOpen={true} 
          onClose={() => {}} 
          isForceChange={true} 
        />
      )}
      <Header 
        onToggleSidebar={handleToggle} />
      <div className={`layout-body ${collapsed ? 'sidebar-open' : ''} ${!isDesktop ? 'mobile' : 'desktop'}`}>
        {/* Overlay backdrop for mobile only */}
        {showSidebar && collapsed && !isDesktop && <div className="sidebar-overlay" onClick={() => setCollapsed(false)} />}
        
        {showSidebar && (
          <Sidebar
            selectedModule={selectedModule}
            collapsed={collapsed}
            onCloseSidebar={() => setCollapsed(false)}
          />
        )}
        <main className="main-content" onClick={handleMainContentClick}>
          <div className="main-container">
            {children}
          </div>
        </main>
      </div>
      {/* <footer className="main-footer">
        <p>&copy; 2026 {import.meta.env.VITE_APP_NAME || "ABCD"}. All rights reserved.</p>
      </footer> */}
    </div>
  )
}

export default MainLayout
