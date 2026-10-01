import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { SatellitePage } from './pages/SatellitePage';
import { ImageProcessingPage } from './pages/ImageProcessingPage';
import { LULCPage } from './pages/LULCPage';
import { ChangeDetectionPage } from './pages/ChangeDetectionPage';
import { GISPage } from './pages/GISPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { AskGeoVisionPage } from './pages/AskGeoVisionPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { GeoVisionAPI } from './services/api';

export const App: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<boolean>(true);

  useEffect(() => {
    // Initial health check
    GeoVisionAPI.checkHealth()
      .then(() => setSystemHealth(true))
      .catch(() => setSystemHealth(false));

    const interval = setInterval(() => {
      GeoVisionAPI.checkHealth()
        .then(() => setSystemHealth(true))
        .catch(() => setSystemHealth(false));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout systemHealth={systemHealth} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="satellite" element={<SatellitePage />} />
          <Route path="image-processing" element={<ImageProcessingPage />} />
          <Route path="lulc" element={<LULCPage />} />
          <Route path="change-detection" element={<ChangeDetectionPage />} />
          <Route path="gis" element={<GISPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="ask-geovision" element={<AskGeoVisionPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
