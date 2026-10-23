import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from '../components/AppSidebar.jsx';
import AppHeader from '../components/AppHeader.jsx';
import { obligationService } from '../services/obligationService.js';
import { useToast } from '../context/ToastContext.jsx';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const toast = useToast();

  useEffect(() => {
    // Check initial API health
    obligationService
      .checkHealth()
      .then((res) => {
        setIsBackendOnline(res.online);
      })
      .catch(() => {
        setIsBackendOnline(false);
      });
  }, []);

  const handleResetDemo = () => {
    try {
      obligationService.resetDemoData();
      toast.success('Demo compliance obligations restored successfully.', 'Workspace Reset');
      window.location.reload();
    } catch {
      toast.error('Failed to reset demo dataset.');
    }
  };

  return (
    <div className="app-shell">
      {/* Sidebar (248px) */}
      <AppSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onResetDemo={handleResetDemo}
      />

      {/* Main App Content Area */}
      <div className="app-main-wrapper">
        <AppHeader
          onOpenSidebar={() => setSidebarOpen(true)}
          isBackendOnline={isBackendOnline}
        />

        <main className="app-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
