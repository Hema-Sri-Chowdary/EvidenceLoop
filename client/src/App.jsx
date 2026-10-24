import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ObligationsPage from './pages/ObligationsPage.jsx';
import CreateObligationPage from './pages/CreateObligationPage.jsx';
import EditObligationPage from './pages/EditObligationPage.jsx';
import ObligationDetailsPage from './pages/ObligationDetailsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="obligations" element={<ObligationsPage />} />
            <Route
              path="obligations/new"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Auditor']}>
                  <CreateObligationPage />
                </ProtectedRoute>
              }
            />
            <Route path="obligations/:id" element={<ObligationDetailsPage />} />
            <Route
              path="obligations/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Auditor']}>
                  <EditObligationPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
