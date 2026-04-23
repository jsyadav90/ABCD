import React, { useState, useEffect, useRef } from "react";
import "./PageSidebar.css";

/**
 * @typedef {Object} MenuItem
 * @property {string} key
 * @property {string} label
 * @property {React.ReactNode} [icon]
 * @property {string} [description]
 * @property {() => void} [onClick]
 */

/**
 * @typedef {Object} PageSidebarProps
 * @property {string} activeTab
 * @property {(key: string) => void} onTabChange
 * @property {MenuItem[]} menuItems
 * @property {React.ReactNode} [header]
 * @property {React.ReactNode} [footer]
 * @property {string} [title="Menu"]
 * @property {string} [initials="?"]
 * @property {string} [storageKey="page-sidebar-pos"]
 * @property {string} [idPrefix="ps"]
 */

/**
 * PageSidebar Component
 * A reusable sidebar component with draggable mobile toggle and responsive behavior.
 * @param {PageSidebarProps} props
 */
const PageSidebar = ({
  activeTab,
  onTabChange,
  menuItems,
  header,
  footer,
  title = "Menu",
  initials = "?",
  storageKey = "page-sidebar-pos",
  idPrefix = "ps"
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [btnPosition, setBtnPosition] = useState({ x: 18, y: 65 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const [wasDragged, setWasDragged] = useState(false);

  // Load saved position from localStorage
  useEffect(() => {
    const savedPos = localStorage.getItem(storageKey);
    if (savedPos) {
      try {
        setBtnPosition(JSON.parse(savedPos));
      } catch (e) {
        console.error("Failed to parse saved position", e);
      }
    }
  }, [storageKey]);

  // Handle window resize to keep button in bounds
  useEffect(() => {
    const handleResize = () => {
      setBtnPosition(prev => {
        const padding = 10;
        const btnSize = 48;
        const newX = Math.max(padding, Math.min(window.innerWidth - btnSize - padding, prev.x));
        const newY = Math.max(padding, Math.min(window.innerHeight - btnSize - padding, prev.y));
        return { x: newX, y: newY };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Draggable Handlers
  const handleDragStart = (e) => {
    const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
    
    dragStartPos.current = {
      x: clientX - btnPosition.x,
      y: clientY - btnPosition.y
    };
    
    setIsDragging(true);
    setWasDragged(false);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;

    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;

    let newX = clientX - dragStartPos.current.x;
    let newY = clientY - dragStartPos.current.y;

    const padding = 10;
    const btnSize = 48;
    newX = Math.max(padding, Math.min(window.innerWidth - btnSize - padding, newX));
    newY = Math.max(padding, Math.min(window.innerHeight - btnSize - padding, newY));

    if (Math.abs(newX - btnPosition.x) > 5 || Math.abs(newY - btnPosition.y) > 5) {
      setWasDragged(true);
    }

    setBtnPosition({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      localStorage.setItem(storageKey, JSON.stringify(btnPosition));
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove, { passive: false });
      window.addEventListener("touchend", handleDragEnd);
    } else {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, btnPosition]);

  return (
    <>
      {/* Mobile Toggle Button */}
      <div 
        className={`${idPrefix}-sidebar-toggle page-sidebar-toggle ${sidebarOpen ? 'hidden' : ''}`}
        style={{ 
          left: `${btnPosition.x}px`, 
          top: `${btnPosition.y}px`,
          position: 'fixed',
          zIndex: 50,
          touchAction: 'none'
        }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <button 
          className={`page-sidebar-hamburger-btn ${isDragging ? 'dragging' : ''}`}
          onClick={() => {
            if (!wasDragged) {
              setSidebarOpen(true);
            }
          }}
          aria-label={`Open ${title} sidebar`}
          title={`Open ${title} sidebar`}
          style={{ 
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none'
          }}
        >
          <span>{initials}</span>
        </button>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="page-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar Aside */}
      <aside className={`page-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="page-sidebar-panel">
          {/* Close button - visible when sidebar is open on mobile */}
          <button 
            className="page-sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label={`Close ${title} sidebar`}
            title={`Close ${title} sidebar`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Header Section */}
          {header && <div className="page-sidebar-header-area">{header}</div>}

          {/* Navigation Menu */}
          <nav className="page-sidebar-nav">
            {menuItems.map((item) => (
              <button
                key={item.key}
                className={`page-sidebar-nav-item ${activeTab === item.key ? "active" : ""}`}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else {
                    onTabChange(item.key);
                  }
                  setSidebarOpen(false);
                }}
              >
                {item.icon && <span className="page-sidebar-nav-icon">{item.icon}</span>}
                <div className="page-sidebar-nav-text">
                  <span className="page-sidebar-nav-label">{item.label}</span>
                  {item.description && <span className="page-sidebar-nav-desc">{item.description}</span>}
                </div>
              </button>
            ))}
          </nav>

          {/* Footer Section (e.g., Stats, Extra Actions) */}
          {footer && <div className="page-sidebar-footer-area">{footer}</div>}
        </div>
      </aside>
    </>
  );
};

export default PageSidebar;
