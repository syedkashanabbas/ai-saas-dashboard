import React, { createContext, useContext } from 'react';
import { create } from 'zustand';

// Zustand store for sidebar state
const useSidebarStore = create((set, get) => ({
  isCollapsed: false,
  isMobile: false,
  
  // Actions
  toggleSidebar: () => {
    const newState = !get().isCollapsed;
    set({ isCollapsed: newState });
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  },

  setSidebarCollapsed: (collapsed) => {
    set({ isCollapsed: collapsed });
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  },

  setMobile: (isMobile) => {
    set({ isMobile });
    // Auto-collapse on mobile
    if (isMobile) {
      set({ isCollapsed: true });
    }
  },

  initializeSidebar: () => {
    // Check for saved sidebar state
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      set({ isCollapsed: JSON.parse(savedState) });
    }

    // Check if mobile
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      get().setMobile(isMobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  },
}));

// React Context for providing sidebar state
const SidebarContext = createContext(null);

export const SidebarProvider = ({ children }) => {
  const sidebarStore = useSidebarStore();

  React.useEffect(() => {
    const cleanup = sidebarStore.initializeSidebar();
    return cleanup;
  }, []);

  return (
    <SidebarContext.Provider value={sidebarStore}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

