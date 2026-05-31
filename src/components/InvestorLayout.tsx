import React, { useState } from 'react';
import { useApp } from './AppContext';
import { auth } from '../lib/firebaseMock';
import { useNavigate, useLocation } from 'react-router';
import { 
  Home, 
  TrendingUp, 
  ArrowUpRight, 
  Users, 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  CheckCircle, 
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';

interface InvestorLayoutProps {
  children: React.ReactNode;
}

export default function InvestorLayout({ children }: InvestorLayoutProps) {
  const { currentUser, currency, toggleCurrency, notifications, markNotificationRead, formatMoney, investments } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { label: 'Home', path: '/home', icon: Home },
    { label: 'Invest', path: '/invest', icon: ArrowUpRight },
    { label: 'Portfolio', path: '/portfolio', icon: TrendingUp },
    { label: 'Referrals', path: '/referral', icon: Users },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  // Filter notifications for the current logged-in investor
  const userNotifications = notifications.filter(n => n.userId === currentUser?.userId);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  // Compute portfolio values
  const activeInvestments = investments.filter(i => i.userId === currentUser?.userId && i.status === 'active');
  const portfolioBalance = activeInvestments.reduce((sum, inv) => {
    const amt = inv.amount;
    // Keep internal currency conversion active
    if (inv.currency === 'NGN' && currency === 'USD') {
      return sum + (amt / 1600);
    } else if (inv.currency === 'USD' && currency === 'NGN') {
      return sum + (amt * 1600);
    }
    return sum + amt;
  }, 0);

  const handleNotificationClick = async (id: string) => {
    await markNotificationRead(id);
    navigate('/notifications');
    setShowNotifications(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-gray-800">
      {/* 1. Header Banner */}
      <header className="sticky top-0 z-40 bg-[#0F6E56]/90 text-white backdrop-blur-md border-b border-[#0F6E56]/20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-2">
            <button 
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-2 rounded-lg hover:bg-[#0b5441] md:hidden focus:outline-none"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div 
              id="app-brand"
              onClick={() => navigate('/home')} 
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <div className="bg-white/15 backdrop-blur-md border border-white/20 text-white rounded-md px-2.5 py-1 font-display font-extrabold text-lg tracking-tight">
                VG
              </div>
              <span className="font-display font-bold text-xl tracking-tight hidden sm:inline">VestGrow</span>
            </div>
          </div>

          {/* Quick Account Health Indicator */}
          <div className="hidden md:flex items-center gap-3 bg-emerald-950/40 border border-white/10 rounded-lg px-3 py-1 text-xs backdrop-blur-xs">
            <span className="text-emerald-300 font-medium font-sans">KYC Status:</span>
            {currentUser?.status === 'active' ? (
              <span className="flex items-center gap-1 text-emerald-100 font-semibold uppercase">
                <CheckCircle size={12} className="text-emerald-400" /> Active Verified
              </span>
            ) : currentUser?.status === 'kyc_pending' ? (
              <span className="flex items-center gap-1 text-amber-200 font-semibold uppercase animate-pulse">
                <AlertTriangle size={12} className="text-amber-300" /> Pending Review
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-200 font-semibold uppercase">
                <AlertTriangle size={12} className="text-rose-400" /> Action Required
              </span>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* ₦ / $ Currency Toggle */}
            <button
              id="currency-toggle"
              onClick={toggleCurrency}
              className="flex items-center bg-emerald-950/40 border border-white/10 rounded-full p-0.5 relative hover:bg-emerald-900/40 cursor-pointer text-xs font-mono font-bold select-none backdrop-blur-xs"
              title="Toggle Display Currency (₦/$)"
            >
              <span className={`px-2.5 py-1 rounded-full transition-all flex items-center justify-center ${currency === 'NGN' ? 'bg-[#0F6E56] text-white shadow-sm' : 'text-emerald-200'}`}>
                ₦ NGN
              </span>
              <span className={`px-2.5 py-1 rounded-full transition-all flex items-center justify-center ${currency === 'USD' ? 'bg-[#0F6E56] text-white shadow-sm' : 'text-emerald-200'}`}>
                $ USD
              </span>
            </button>

            {/* Notifications Overlay Bell */}
            <div className="relative">
              <button
                id="notification-bell-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-white/10 relative cursor-pointer focus:outline-none"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold animate-bounce font-mono">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popup Modal */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white/80 backdrop-blur-xl rounded-xl shadow-xl border border-white/40 z-50 text-gray-800 overflow-hidden glass-dropdown">
                  <div className="bg-white/65 px-4 py-3 border-b border-gray-150 flex items-center justify-between">
                    <span className="font-semibold text-sm">Notifications</span>
                    <button 
                      onClick={() => navigate('/notifications')} 
                      className="text-xs text-[#0F6E56] hover:underline font-semibold"
                    >
                      View all
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                    {userNotifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-xs">
                        No notifications found.
                      </div>
                    ) : (
                      userNotifications.slice(0, 5).map((notif) => (
                        <div 
                          key={notif.notificationId}
                          onClick={() => handleNotificationClick(notif.notificationId)}
                          className={`p-3 text-xs hover:bg-white/45 cursor-pointer transition-colors ${!notif.read ? 'bg-[#0F6E56]/5 relative font-semibold' : ''}`}
                        >
                          {!notif.read && <span className="absolute left-1.5 top-4.5 w-1.5 h-1.5 bg-[#0F6E56] rounded-full" />}
                          <div className="font-semibold text-gray-900 pr-4">{notif.title}</div>
                          <div className="text-gray-500 line-clamp-2 mt-0.5">{notif.message}</div>
                          <div className="text-[9px] text-gray-400 mt-1 font-mono">
                            {new Date(notif.sentAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown or Initials */}
            <div 
              id="profile-badge-summary"
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 hidden sm:flex border-l border-white/15 pl-3 ml-1"
            >
              <div className="bg-emerald-950/40 border border-white/10 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                {currentUser?.name ? currentUser.name[0].toUpperCase() : 'U'}
              </div>
              <div className="text-left text-xs leading-none">
                <div className="font-bold max-w-[100px] truncate">{currentUser?.name}</div>
                <span className="text-[10px] text-emerald-200">Investor</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto relative">
        
        {/* Navigation Sidebar (Desktop) */}
        <aside className="w-64 bg-[#0F6E56] text-white p-4 shrink-0 hidden md:flex flex-col gap-1 justify-between shadow-xl border-r border-[#117C62]/10">
          <div className="space-y-1">
            <div className="px-3 py-4 mb-4 bg-white/10 border border-white/10 rounded-xl backdrop-blur-sm">
              <span className="text-[10px] text-emerald-200 uppercase tracking-widest font-bold">Total Portfolio Value</span>
              <h2 className="text-xl font-display font-bold text-white tracking-tight truncate mt-0.5">
                {formatMoney(portfolioBalance, currency)}
              </h2>
            </div>
            
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-white/15 text-white shadow-xs font-semibold' 
                        : 'text-emerald-100/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : 'text-emerald-200/60'} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-white/10">
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-amber-200 bg-amber-500/20 hover:bg-amber-500/35 transition-colors mb-2 cursor-pointer border border-amber-500/30"
              >
                <Settings size={14} className="text-amber-300" />
                Go to Admin Panel
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-200 hover:bg-red-500/15 transition-colors cursor-pointer"
            >
              <LogOut size={18} className="text-red-300" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Navigation Sidebar (Mobile Overlay) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 h-full bg-[#0F6E56] text-white p-4 flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-1.5">
                    <div className="bg-white/15 text-white border border-white/10 rounded-md px-2 py-0.5 font-display font-extrabold text-sm">
                      VG
                    </div>
                    <span className="font-display font-bold text-base text-white">VestGrow</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-emerald-300 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <div className="px-3 py-3 bg-white/10 rounded-lg border border-white/10">
                  <span className="text-[9px] text-emerald-200 uppercase tracking-widest font-bold">Portfolio Balance</span>
                  <div className="text-lg font-display font-bold text-white truncate">
                    {formatMoney(portfolioBalance, currency)}
                  </div>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          isActive 
                            ? 'bg-white/15 text-white font-semibold' 
                            : 'text-emerald-100/70 hover:bg-white/5'
                        }`}
                      >
                        <Icon size={18} />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-2 border-t border-white/10 pt-4">
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => {
                      navigate('/admin');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-amber-200 bg-amber-500/20 border border-amber-500/35"
                  >
                    <Settings size={14} />
                    Admin Panel
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-200 hover:bg-red-500/10"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Central Working Page Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          
          {/* Global Alert for pending KYC */}
          {currentUser && currentUser.status !== 'active' && (
            <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs backdrop-blur-md">
              <div className="flex gap-3">
                <AlertTriangle className="text-amber-800 shrink-0 select-none animate-pulse" size={20} />
                <div className="text-xs">
                  <h4 className="font-bold text-amber-900 font-display">Verify your investor identity (KYC)</h4>
                  <p className="text-amber-800 mt-0.5">
                    {currentUser.status === 'kyc_pending'
                      ? "Your documents are currently waiting for admin authorization. You can track progress here."
                      : currentUser.status === 'kyc_rejected'
                      ? `Your docs were rejected: "${currentUser.kycRejectionReason || 'Invalid documents'}". Click settings to re-upload.`
                      : "Upload your ID proof and selfie to get verified and start initiating investment plans."
                    }
                  </p>
                </div>
              </div>
              {currentUser.status !== 'kyc_pending' && (
                <button 
                  onClick={() => navigate('/settings')}
                  className="bg-[#0F6E56] hover:bg-[#0b5441] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Update Profile
                </button>
              )}
            </div>
          )}

          {children}
        </main>
      </div>

      {/* Footer Branding */}
      <footer className="bg-white/40 backdrop-blur-sm border-t border-white/30 py-4 text-center text-xs text-gray-500 font-medium mt-auto">
        VestGrow © {new Date().getFullYear()} • Secure Investment & Savings Operations
      </footer>
    </div>
  );
}
