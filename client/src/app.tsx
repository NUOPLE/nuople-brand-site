import './platform-polyfill';
import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

import { AuthProvider } from './hooks/use-auth';
import { useWatermarkRemover } from './hooks/use-watermark-remover';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound/NotFound';
import LoginPage from './pages/LoginPage/LoginPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import WorksPage from './pages/WorksPage/WorksPage';
import WorkEditPage from './pages/WorkEditPage/WorkEditPage';
import MessagesPage from './pages/MessagesPage/MessagesPage';
import KeywordRulesPage from './pages/KeywordRulesPage/KeywordRulesPage';
import SiteSettingsPage from './pages/SiteSettingsPage/SiteSettingsPage';
import HomePage from './pages/HomePage/HomePage';
import WorkDetailPage from './pages/HomePage/WorkDetailPage';

const RoutesComponent = () => {
  useWatermarkRemover();

  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/work/:id" element={<WorkDetailPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="works" element={<WorksPage />} />
          <Route path="works/new" element={<WorkEditPage />} />
          <Route path="works/:id/edit" element={<WorkEditPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="keyword-rules" element={<KeywordRulesPage />} />
          <Route path="site-settings" element={<SiteSettingsPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
};

export default RoutesComponent;
