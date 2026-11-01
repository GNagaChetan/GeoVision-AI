import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../common/Header';
import { Sidebar } from '../common/Sidebar';
import { ProjectSelectorModal, SAMPLE_PROJECTS } from '../common/ProjectSelectorModal';
import { NotificationDrawer } from '../common/NotificationDrawer';
import { CommandPalette } from '../common/CommandPalette';
import { DataUploadModal } from '../common/DataUploadModal';

import { useSelectedArea } from '../../context/SelectedAreaContext';

interface AppLayoutProps {
  systemHealth: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ systemHealth }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [projectsModalOpen, setProjectsModalOpen] = useState<boolean>(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [dataUploadModalOpen, setDataUploadModalOpen] = useState<boolean>(false);
  const { selectedArea, selectPreset } = useSelectedArea();

  const [activeProjectId, setActiveProjectId] = useState<string>('hyderabad_urban');

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    if (id.includes('bengaluru')) {
      selectPreset('bengaluru');
    } else if (id.includes('godavari')) {
      selectPreset('godavari');
    } else {
      selectPreset('hyderabad');
    }
  };

  const activeProject = SAMPLE_PROJECTS.find(p => p.id === activeProjectId) || SAMPLE_PROJECTS[0];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-sky-100 selection:text-sky-900">
      {/* Top Navigation Bar */}
      <Header
        systemHealth={systemHealth}
        activeProjectName={activeProject.name}
        onOpenProjects={() => setProjectsModalOpen(true)}
        onOpenNotifications={() => setNotificationDrawerOpen(true)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        unreadCount={2}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenProjects={() => setProjectsModalOpen(true)}
          activeProjectName={activeProject.name}
        />

        {/* Dynamic Route Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-1 sm:p-2">
          <Outlet />
        </main>
      </div>

      {/* Reusable Global Modals & Drawers */}
      <ProjectSelectorModal
        isOpen={projectsModalOpen}
        onClose={() => setProjectsModalOpen(false)}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onOpenUpload={() => setDataUploadModalOpen(true)}
      />

      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
      />

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenProjects={() => setProjectsModalOpen(true)}
        onOpenUpload={() => setDataUploadModalOpen(true)}
      />

      <DataUploadModal
        isOpen={dataUploadModalOpen}
        onClose={() => setDataUploadModalOpen(false)}
      />
    </div>
  );
};
