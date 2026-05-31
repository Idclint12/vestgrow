import React, { useState } from 'react';
import { useApp } from './AppContext';
import { useNavigate, useLocation } from 'react-router';
import { 
  Shield, 
  Users, 
  TrendingUp, 
  Clock, 
  Percent, 
  ArrowDownLeft, 
  FileCheck, 
  Layers, 
  BellRing, 
  Download, 
  Activity,
  ArrowLeft,
  Menu,
  X,
  FastForward
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { currentUser, fastForward, triggerMaturityCheck } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ffDays, setFfDays] = useState('7');

  const navItems = [
    { label: 'Overview', path: '/admin', icon: Shield },
    { label: 'Investors', path: '/admin/investors', icon: Users },
    { label: 'Investments', path: '/admin/investments', icon: TrendingUp },
    { label: 'Pending Approval', path: '/admin/pending', icon: Clock },
    { label: 'ROI Configuration', path: '/admin/roi', icon: Percent },
    { label: 'Withdrawal Queue', path: '/admin/withdrawals', icon: ArrowDownLeft },
    { label: 'KYC Verification', path: '/admin/kyc', icon: FileCheck },
    { label: 'Plans Manager', path: '/admin/plans', icon: Layers },
    { label: 'Compose Broadcast', path: '/admin/notifications', icon: BellRing },
    { label: 'Audit Reports', path: '/admin/reports', icon: Download },
    { label: 'Activity Logs', path: '/admin/activity', icon: Activity },
  ];

  const handleFastForward = () => {
    const days = parseInt(ffDays, 10);
    if (!isNaN(days) && days > 0) {
      fastForward(days);
      alert(`Successfully fast-forwarded time by ${days} days! Countdowns and yields have updated.`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F1D] text-slate-100 font-sans" style={{
      backgroundImage: 'radial-gradient(at 0% 0%, rgba(15, 110, 86, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, #0A0F1D 0px, transparent 75%)',
      backgroundAttachment: 'fixed'
    }}>
      
      {/* 1. Header Admin Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/70 backdrop-blur-md border-b border-white/5 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-lg">
        <div className="flex items-center gap-3">
          <button 
            id="admin-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-slate-800 md:hidden text-slate-300"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => navigate('/admin')}>
            <div className="bg-[#0F6E56] text-white rounded-md px-2 py-1 font-display font-black text-sm shadow-sm">
              VG
            </div>
            <span className="font-display font-bold text-lg tracking-tight hidden sm:inline">VestGrow Admin</span>
            <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 px-1.5 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase hidden lg:inline ml-2">
              Backoffice Terminal
            </span>
          </div>
        </div>

        {/* Calendar Fast Forward Sandbox controls */}
        <div className="flex items-center gap-2 bg-slate-900/60 border border-white/5 rounded-lg p-1.5 text-xs backdrop-blur-xs">
          <div className="flex items-center gap-1 text-slate-450">
            <FastForward size={14} className="text-amber-500" />
            <span className="hidden xl:inline font-semibold">Sandbox Calendar:</span>
          </div>
          <select 
            value={ffDays}
            onChange={(e) => setFfDays(e.target.value)}
            className="bg-slate-800/80 border border-white/5 text-slate-200 px-2 py-0.5 rounded text-xs select-none focus:outline-none"
          >
            <option value="1">1 Day</option>
            <option value="7">7 Days</option>
            <option value="30">30 Days</option>
            <option value="90">90 Days</option>
          </select>
          <button
            onClick={handleFastForward}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer"
          >
            Fast Forward
          </button>
        </div>

        {/* Navigation Action Back to Investor Site */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Investor Portal</span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="bg-[#0F6E56] border border-emerald-500/50 w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-sm shadow">
              {currentUser?.name ? currentUser.name[0].toUpperCase() : 'A'}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex w-full relative">
        
        {/* Navigation Sidebar (Desktop) */}
        <aside className="w-68 bg-slate-950/40 backdrop-blur-md border-r border-white/5 p-4 shrink-0 hidden md:flex flex-col gap-2">
          <div className="px-3 py-2 mb-2 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">System Actor</p>
            <h4 className="text-sm font-semibold truncate text-white mt-1">{currentUser?.name}</h4>
          </div>

          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive 
                      ? 'bg-[#0F6E56] text-white border border-emerald-700/50 font-bold shadow-md' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500'} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-white/5">
            <p className="text-[9px] text-slate-500 text-center font-mono py-1">
              VestGrow Backoffice Terminal v1.1.0
            </p>
          </div>
        </aside>

        {/* Mobile Sidebar overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/70 z-30 md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-68 h-full bg-slate-900 border-r border-white/5 p-4 flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-1.5">
                    <div className="bg-[#0F6E56] text-white rounded-md px-2 py-0.5 font-display font-extrabold text-sm">
                      VG
                    </div>
                    <span className="font-display font-bold text-base text-white">VestGrow Admin</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-250">
                    <X size={20} />
                  </button>
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
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-left ${
                          isActive 
                            ? 'bg-[#0F6E56] text-white' 
                            : 'text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <Icon size={16} />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={() => navigate('/home')}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 text-[#0F6E56] py-2.5 rounded text-xs font-bold"
                >
                  <ArrowLeft size={14} />
                  Back to Investor Portal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Central Working Page Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-transparent overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
