import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardLayout = () => {
  const { isCollapsed, isMobile } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div 
        className={`transition-all duration-300 ${
          isMobile 
            ? 'ml-0' 
            : isCollapsed 
              ? 'ml-16' 
              : 'ml-64'
        }`}
      >
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => {
            const { setSidebarCollapsed } = useSidebar.getState();
            setSidebarCollapsed(true);
          }}
        />
      )}
    </div>
  );
};

export default DashboardLayout;

