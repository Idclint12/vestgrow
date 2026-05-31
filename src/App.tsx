import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './components/AppContext';

// Layout wraps
import InvestorLayout from './components/InvestorLayout';
import AdminLayout from './components/AdminLayout';

// Investor subviews
import { 
  SignUpView, 
  LoginView, 
  HomeView, 
  InvestView, 
  PortfolioView, 
  ReferralView, 
  NotificationsView, 
  SettingsView 
} from './views/InvestorViews';
import { AuthCallbackView } from './views/AuthCallbackView';

// Backoffice administrative subviews
import {
  AdminOverviewView,
  AdminInvestorsView,
  AdminInvestmentsView,
  AdminPendingView,
  AdminRoiView,
  AdminWithdrawalsView,
  AdminKycView,
  AdminPlansView,
  AdminNotificationsView,
  AdminReportsView,
  AdminActivityView
} from './views/AdminViews';

// ==========================================
// ROUTE PROTECTION ENGINES
// ==========================================

function PublicRouteWrapper() {
  const { currentUser } = useApp();
  if (currentUser) {
    return currentUser.role === 'admin' 
      ? <Navigate to="/admin" replace /> 
      : <Navigate to="/home" replace />;
  }
  return <Outlet />;
}

function InvestorRouteWrapper() {
  const { currentUser } = useApp();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return (
    <InvestorLayout>
      <Outlet />
    </InvestorLayout>
  );
}

function AdminRouteWrapper() {
  const { currentUser } = useApp();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  // Allow system testers to view admin sheets, but keep gates active
  if (currentUser.role !== 'admin') {
    return <Navigate to="/home" replace />;
  }
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

function RootRedirector() {
  const { currentUser } = useApp();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return currentUser.role === 'admin' 
    ? <Navigate to="/admin" replace /> 
    : <Navigate to="/home" replace />;
}

// ==========================================
// MAIN INSTRUMENTED APP FRAME
// ==========================================

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          
          {/* Public authentication steps (Redirects if already active) */}
          <Route element={<PublicRouteWrapper />}>
            <Route path="/login" element={<LoginView />} />
            <Route path="/signup" element={<SignUpView />} />
          </Route>

          <Route path="/auth/callback" element={<AuthCallbackView />} />

          {/* Secure Client / Investor Views */}
          <Route element={<InvestorRouteWrapper />}>
            <Route path="/home" element={<HomeView />} />
            <Route path="/invest" element={<InvestView />} />
            <Route path="/portfolio" element={<PortfolioView />} />
            <Route path="/referral" element={<ReferralView />} />
            <Route path="/notifications" element={<NotificationsView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Route>

          {/* Secure Back-office Admin Views */}
          <Route element={<AdminRouteWrapper />}>
            <Route path="/admin" element={<AdminOverviewView />} />
            <Route path="/admin/investors" element={<AdminInvestorsView />} />
            <Route path="/admin/investments" element={<AdminInvestmentsView />} />
            <Route path="/admin/pending" element={<AdminPendingView />} />
            <Route path="/admin/roi" element={<AdminRoiView />} />
            <Route path="/admin/withdrawals" element={<AdminWithdrawalsView />} />
            <Route path="/admin/kyc" element={<AdminKycView />} />
            <Route path="/admin/plans" element={<AdminPlansView />} />
            <Route path="/admin/notifications" element={<AdminNotificationsView />} />
            <Route path="/admin/reports" element={<AdminReportsView />} />
            <Route path="/admin/activity" element={<AdminActivityView />} />
          </Route>

          {/* General routes fallbacks */}
          <Route path="/" element={<RootRedirector />} />
          <Route path="*" element={<RootRedirector />} />

        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
