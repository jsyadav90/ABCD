import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import { getSelectedAppModule } from '../utils/appModule'
import './MainLayout.css'

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 992)
  const location = useLocation()

  // Check if we should show sidebar based on module selection and route
  const shouldShowSidebar = () => {
    // Only show sidebar on dashboard for Module 1
    if (location.pathname === '/dashboard') {
      const selectedModule = getSelectedAppModule()
      return selectedModule === 'module_1'
    }
    // Show sidebar on all other pages
    return true
  }
  
  const showSidebar = shouldShowSidebar()

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
        
        {showSidebar && <Sidebar collapsed={collapsed} onCloseSidebar={() => setCollapsed(false)} />}
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
