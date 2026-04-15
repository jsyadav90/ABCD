import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import { getSelectedAppModule } from '../utils/appModule'
import './MainLayout.css'

/**
 * @param {{ children: React.ReactNode }} props
 */
const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 992)
  const [selectedModule, setSelectedModule] = useState(getSelectedAppModule())
  const location = useLocation()

  // Check if we should show sidebar based on module selection and route
  const shouldShowSidebar = () => {
    if (location.pathname === '/dashboard') {
      return selectedModule === 'module_1' || selectedModule === 'module_2'
    }
    // Show sidebar on all other pages
    return true
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

  const handleToggle = () => setCollapsed(prev => !prev)

  // Close sidebar when clicking on main content (only on mobile)
  const handleMainContentClick = () => {
    if (collapsed && !isDesktop) {
      setCollapsed(false)
    }
  }

  return (
    <div className="main-layout">
      <Header onToggleSidebar={handleToggle} />
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
        <p>&copy; 2026 ABCD. All rights reserved.</p>
      </footer> */}
    </div>
  )
}

export default MainLayout
