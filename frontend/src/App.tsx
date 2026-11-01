import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SelectedAreaProvider } from './context/SelectedAreaContext';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { SatellitePage } from './pages/SatellitePage';
import { ImageProcessingPage } from './pages/ImageProcessingPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ChangeDetectionPage } from './pages/ChangeDetectionPage';
import { AskGeoVisionPage } from './pages/AskGeoVisionPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuthPortalPage } from './pages/auth/AuthPortalPage';
import { UserLoginPage } from './pages/auth/UserLoginPage';
import { UserSignupPage } from './pages/auth/UserSignupPage';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { GeoVisionAPI } from './services/api';

export const App: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<boolean>(true);

  useEffect(() => {
    // Initial health check with silent fallback
    GeoVisionAPI.checkHealth()
      .then((res) => {
        setSystemHealth(res?.status === 'healthy');
      })
      .catch(() => {
        setSystemHealth(true);
      });
  }, []);

  return (
    <AuthProvider>
      <SelectedAreaProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />

            {/* Authentication Suite */}
            <Route path="/auth" element={<AuthPortalPage />} />
            <Route path="/auth/user/login" element={<UserLoginPage />} />
            <Route path="/auth/user/signup" element={<UserSignupPage />} />
            <Route path="/auth/admin/login" element={<AdminLoginPage />} />

            {/* Administrator Console (Protected by AuthContext) */}
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

            {/* Main User Application Shell */}
            <Route element={<AppLayout systemHealth={systemHealth} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/satellite" element={<SatellitePage />} />
              <Route path="/map" element={<SatellitePage />} />
              <Route path="/gis" element={<SatellitePage />} />
              <Route path="/image-processing" element={<ImageProcessingPage />} />
              <Route path="/change-detection" element={<ChangeDetectionPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/ask-geovision" element={<AskGeoVisionPage />} />
              <Route path="/reports" element={<ReportsPage />} />

              {/* Aliases for legacy routes */}
              <Route path="/lulc" element={<Navigate to="/analytics" replace />} />
              <Route path="/analysis/lulc" element={<Navigate to="/analytics" replace />} />
              <Route path="/analysis/change-detection" element={<Navigate to="/change-detection" replace />} />
              <Route path="/knowledge-base" element={<Navigate to="/ask-geovision" replace />} />
              <Route path="/settings" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SelectedAreaProvider>
    </AuthProvider>
  );
};

export default App;
