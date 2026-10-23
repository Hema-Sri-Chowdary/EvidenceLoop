import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ObligationsPage from './pages/ObligationsPage.jsx';
import CreateObligationPage from './pages/CreateObligationPage.jsx';
import EditObligationPage from './pages/EditObligationPage.jsx';
import ObligationDetailsPage from './pages/ObligationDetailsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="obligations" element={<ObligationsPage />} />
          <Route path="obligations/new" element={<CreateObligationPage />} />
          <Route path="obligations/:id" element={<ObligationDetailsPage />} />
          <Route path="obligations/:id/edit" element={<EditObligationPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}

export default App;
