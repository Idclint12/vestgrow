import React, { useState } from 'react';
import { useApp } from '../components/AppContext';
import { auth, logAction } from '../lib/firebaseMock';
import { useNavigate } from 'react-router';
import { jsPDF } from 'jspdf';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { 
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
  UserCheck,
  Ban,
  DollarSign,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Check,
  X,
  CreditCard,
  Plus
} from 'lucide-react';

// ==========================================
// 1. ADMIN OVERVIEW MODULE
// ==========================================
export function AdminOverviewView() {
  const { usersList, investments, withdrawals, activityLogs, formatMoney, plans } = useApp();
  const navigate = useNavigate();

  // Metrics
  const totalInvestors = usersList.filter(u => u.role === 'user').length;
  
  const fundsUnderManagement = investments
    .filter(i => i.status === 'active' || i.status === 'matured')
    .reduce((sum, i) => sum + i.amount, 0);

  const pendingApprovalsCount = investments.filter(i => i.status === 'pending').length + 
    withdrawals.filter(w => w.status === 'pending').length +
    usersList.filter(u => u.status === 'kyc_pending').length;

  const returnsPaidOut = investments
    .filter(i => i.status === 'paid out')
    .reduce((sum, i) => sum + (i.amount + (i.amount * i.roi / 100)), 0);

  // Growth Chart Data
  const monthlyData = [
    { name: 'Month 1', FUM: fundsUnderManagement * 0.4 },
    { name: 'Month 2', FUM: fundsUnderManagement * 0.55 },
    { name: 'Month 3', FUM: fundsUnderManagement * 0.7 },
    { name: 'Month 4', FUM: fundsUnderManagement * 0.8 },
    { name: 'Month 5', FUM: fundsUnderManagement * 0.9 },
    { name: 'Month 6', FUM: fundsUnderManagement },
  ];

  // Plan Breakdown Data
  const planBreakdown = plans.map(p => {
    const count = investments.filter(i => i.planId === p.planId).length;
    return { name: p.name.substring(0, 12), count };
  });

  const COLORS = ['#0F6E56', '#1E293B', '#F59E0B', '#EF4444', '#10B981'];

  // Pending Approvals Widgets
  const pendingKyc = usersList.filter(u => u.status === 'kyc_pending').slice(0, 3);
  const pendingWd = withdrawals.filter(w => w.status === 'pending').slice(0, 3);

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Title block */}
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-white">Backoffice Dashboard</h1>
        <p className="text-xs text-slate-400 mt-1">Platform-level metrics, asset summaries, and pending approvals desk.</p>
      </div>

      {/* Metrics board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 shadow">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Investors</span>
            <Users className="text-[#0F6E56]" size={18} />
          </div>
          <h3 className="text-2xl font-display font-bold text-white mt-2">{totalInvestors}</h3>
          <p className="text-[10px] text-slate-500 mt-1">Registered clients in database</p>
        </div>

        <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 shadow">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Funds Under Management</span>
            <TrendingUp className="text-[#0F6E56]" size={18} />
          </div>
          <h3 className="text-2xl font-display font-bold text-[#0F6E56] mt-2">{formatMoney(fundsUnderManagement, 'NGN')}</h3>
          <p className="text-[10px] text-slate-500 mt-1">Combined active + matured deposits</p>
        </div>

        <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 shadow">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Actions required</span>
            <Clock className="text-amber-500" size={18} />
          </div>
          <h3 className="text-2xl font-display font-bold text-amber-500 mt-2">{pendingApprovalsCount}</h3>
          <p className="text-[10px] text-slate-500 mt-1">KYC + Payments + Withdrawals approvals</p>
        </div>

        <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 shadow">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Returns Paid Out</span>
            <DollarSign className="text-emerald-500" size={18} />
          </div>
          <h3 className="text-2xl font-display font-bold text-emerald-400 mt-2">{formatMoney(returnsPaidOut, 'NGN')}</h3>
          <p className="text-[10px] text-slate-500 mt-1">Settled matured investments principal + yield</p>
        </div>

      </div>

      {/* Charts division */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cumulative capitals chart */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 lg:col-span-2">
          <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider mb-4">Combined platform Assets growth (FUM)</h4>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <ChartTooltip 
                  contentStyle={{ background: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '11px', border: '1px solid #475569' }}
                  cursor={{ fill: 'rgba(51,65,85,0.4)' }}
                />
                <Bar dataKey="FUM" fill="#0F6E56" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Breakdowns chart */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-5">
          <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider mb-4">Investments plan selections</h4>
          <div className="h-64 sm:h-72 flex flex-col justify-between">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={planBreakdown} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={50} 
                    outerRadius={70} 
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {planBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip contentStyle={{ background: '#1e293b', color: '#fff', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend indicators */}
            <div className="space-y-1 text-xs">
              {planBreakdown.map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="flex justify-between items-center text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span>{item.name}</span>
                  </div>
                  <strong className="text-white font-mono">{item.count} program(s)</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Widgets row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        
        {/* Approvals widget */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Verifications Checkpoints Queue</h4>
            <button onClick={() => navigate('/admin/kyc')} className="text-xs text-[#0F6E56] hover:underline font-bold">Manage queue</button>
          </div>
          
          {pendingKyc.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No pending KYC verifications queued.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {pendingKyc.map(user => (
                <div key={user.userId} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-white font-semibold">{user.name}</strong>
                    <span className="block text-[10px] text-slate-400">{user.email}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-400 border border-amber-800 uppercase font-bold tracking-wider">KYC Pending</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Recent System Audit timeline</h4>
            <button onClick={() => navigate('/admin/activity')} className="text-xs text-[#0F6E56] hover:underline font-bold">View logs</button>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto">
            {activityLogs.slice(0, 5).map(log => (
              <div key={log.logId} className="text-xs flex gap-3 text-slate-300 font-medium leading-relaxed">
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <div>
                  <strong className="text-white font-bold">{log.actorName}</strong> ({log.actorRole}): <span className="text-slate-400">{log.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

// ==========================================
// 2. SEARCHABLE/FILTERABLE INVESTORS VIEW
// ==========================================
export function AdminInvestorsView() {
  const { usersList, suspendUser, activateUser, formatMoney } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'kyc_pending' | 'suspended'>('all');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const investors = usersList.filter(u => u.role === 'user');

  const filteredInvestors = investors.filter(inv => {
    const matchesSearch = inv.name.toLowerCase().includes(search.toLowerCase()) || 
      inv.email.toLowerCase().includes(search.toLowerCase()) ||
      inv.phone.includes(search);
    
    const matchesStatus = filterStatus === 'all' ? true : inv.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Investors Clearance register</h1>
        <p className="text-xs text-slate-400 mt-1">Manage KYC validations, suspension clearances, and profile audits.</p>
      </div>

      {/* filter panels */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-850 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or telephone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 text-xs pl-10 pr-4 py-2.5 rounded-lg border border-slate-800 focus:outline-[#0F6E56] text-white"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          {(['all', 'active', 'kyc_pending', 'suspended'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all select-none cursor-pointer flex-1 sm:flex-none text-center ${
                filterStatus === status 
                  ? 'bg-[#0F6E56] text-white' 
                  : 'bg-slate-900 border border-slate-800 text-slate-400'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* tables */}
      <div className="bg-slate-850 border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4">Investor Name</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">Referral Code</th>
                <th className="p-4">Authorization</th>
                <th className="p-4 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredInvestors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No investors matched filters.
                  </td>
                </tr>
              ) : (
                filteredInvestors.map(user => (
                  <tr key={user.userId} className="hover:bg-slate-800 transition-colors">
                    <td className="p-4 font-semibold text-white">
                      {user.name}
                      <span className="block text-[10px] font-mono text-slate-505 font-medium mt-0.5">{user.email}</span>
                    </td>
                    <td className="p-4 font-mono">{user.phone}</td>
                    <td className="p-4"><span className="font-mono bg-slate-900 text-slate-300 border border-slate-800 px-2 py-0.5 rounded">{user.referralCode}</span></td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        user.status === 'active' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                          : user.status === 'kyc_pending' 
                          ? 'bg-amber-950 text-amber-400 border border-amber-800' 
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded text-[10px] font-semibold cursor-pointer"
                      >
                        Profile
                      </button>
                      {user.status === 'suspended' ? (
                        <button
                          onClick={() => activateUser(user.userId)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer"
                        >
                          Activate
                        </button>
                      ) : (
                        <button
                          onClick={() => suspendUser(user.userId)}
                          className="bg-red-650/10 hover:bg-red-900 text-red-400 px-2.5 py-1 rounded text-[10px] font-semibold cursor-pointer border border-red-900/30"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* USER PROFILE MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 text-white rounded-2xl max-w-md w-full border border-slate-800 p-6 relative">
            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="font-display font-bold text-lg border-b border-slate-800 pb-3 mb-4">
              Detailed Investor Profile
            </h3>

            <div className="space-y-4 text-xs font-sans">
              <div className="flex gap-4">
                <div className="bg-[#0F6E56] border border-emerald-500 w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-lg">
                  {selectedUser.name[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{selectedUser.name}</h4>
                  <p className="text-slate-450 font-mono mt-0.5">UID: {selectedUser.userId}</p>
                  <p className="text-slate-500 mt-0.5">Email: {selectedUser.email}</p>
                </div>
              </div>

              <div className="border border-slate-800 rounded-lg p-3 space-y-1.5 bg-slate-950 font-mono text-[11px] leading-relaxed">
                <div>Phone: <strong className="text-white">{selectedUser.phone}</strong></div>
                <div>Platform Status: <strong className={selectedUser.status === 'active' ? 'text-emerald-400' : 'text-amber-500'}>{selectedUser.status.toUpperCase()}</strong></div>
                <div>NIN: <strong className="text-white">{selectedUser.kycDocNIN || 'None'}</strong></div>
                <div>Referred By code: <strong className="text-white">{selectedUser.referredBy || 'None'}</strong></div>
              </div>

              <div>
                <h5 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">Payout Accounts registered:</h5>
                {selectedUser.bankAccounts.length === 0 ? (
                  <p className="text-slate-500 text-[11px]">No settlement bank coordinates attached inside investor profile.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedUser.bankAccounts.map((b: any) => (
                      <div key={b.id} className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                        <strong className="text-white block text-xs">{b.bankName}</strong>
                        <div className="flex justify-between mt-1 text-[11px] text-slate-400">
                          <span>Acct: {b.accountNumber}</span>
                          <span>Holder: {b.accountName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end">
              <button 
                onClick={() => setSelectedUser(null)}
                className="bg-slate-800 text-white px-5 py-2 rounded text-xs font-semibold"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// 3. ALL INVESTMENTS AUDITS VIEW
// ==========================================
export function AdminInvestmentsView() {
  const { investments, payoutInvestment, formatMoney } = useApp();
  const [filter, setFilter] = useState<'all' | 'active' | 'matured' | 'paid out'>('all');

  const filteredInvestments = investments.filter(inv => {
    if (filter === 'all') return true;
    return inv.status === filter;
  });

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Investments ledger audits</h1>
          <p className="text-xs text-slate-400 mt-1">Timeline of active yielding packages across entire user portfolios.</p>
        </div>
        
        <div className="flex gap-2">
          {(['all', 'active', 'matured', 'paid out'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all select-none cursor-pointer ${
                filter === status 
                  ? 'bg-[#0F6E56] text-white' 
                  : 'bg-slate-900 border border-slate-800 text-slate-400'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-850 border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4">Investor ID / Name</th>
                <th className="p-4">Selections package</th>
                <th className="p-4">Threshold Principal</th>
                <th className="p-4">Contract yields</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
              {filteredInvestments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No yielding programs registered matching selected filters.
                  </td>
                </tr>
              ) : (
                filteredInvestments.map(inv => {
                  const estEarnings = inv.amount + (inv.amount * inv.roi / 100);
                  return (
                    <tr key={inv.investmentId} className="hover:bg-slate-800 transition-colors">
                      <td className="p-4 font-semibold text-white">
                        {inv.userName || 'Investor'}
                        <span className="block text-[10px] font-mono text-slate-450 mt-1">UID: {inv.userId}</span>
                      </td>
                      <td className="p-4">
                        {inv.planName}
                        <span className="block text-[10px] font-mono text-slate-505 mt-1">ID: {inv.investmentId}</span>
                      </td>
                      <td className="p-4 font-mono">{inv.currency === 'NGN' ? '₦' : '$'}{inv.amount.toLocaleString()}</td>
                      <td className="p-4">
                        <strong className="text-emerald-400 block">{inv.roi}% ROI</strong>
                        <span className="text-[10px] text-slate-505 block mt-0.5">Est. return: {inv.currency === 'NGN' ? '₦' : '$'}{estEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inv.status === 'active' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                            : inv.status === 'matured' 
                            ? 'bg-blue-950 text-blue-400 border border-blue-800' 
                            : inv.status === 'paid out' 
                            ? 'bg-slate-900 border border-slate-750 text-slate-505' 
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {inv.status === 'matured' ? (
                          <button
                            onClick={() => payoutInvestment(inv.investmentId)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded text-[10px] cursor-pointer"
                          >
                            Payout settled
                          </button>
                        ) : (
                          <span className="text-slate-505 text-[10px] font-bold">Lock clearance</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// ==========================================
// 4. PENDING PAYMENTS APPROVALS
// ==========================================
export function AdminPendingView() {
  const { investments, approveInvestment, rejectInvestment, formatMoney } = useApp();

  const pending = investments.filter(inv => inv.status === 'pending');

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Investments payment approvals</h1>
        <p className="text-xs text-slate-400 mt-1">Pending payments checks from Paystack authorizations logs.</p>
      </div>

      <div className="bg-slate-850 border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4">Investor name</th>
                <th className="p-4">Plan package</th>
                <th className="p-4">Payment Reference</th>
                <th className="p-4">Pending Capital</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-505">
                    No pending investments waiting approvals.
                  </td>
                </tr>
              ) : (
                pending.map(inv => (
                  <tr key={inv.investmentId} className="hover:bg-slate-800 transition-colors">
                    <td className="p-4 font-bold text-white">{inv.userName || 'New Client'}</td>
                    <td className="p-4">{inv.planName}</td>
                    <td className="p-4 font-mono text-[#0F6E56] font-bold">{inv.paystackRef}</td>
                    <td className="p-4 font-mono text-emerald-400">{inv.currency === 'NGN' ? '₦' : '$'}{inv.amount.toLocaleString()}</td>
                    <td className="p-4 text-right space-x-1">
                      <button
                        onClick={() => approveInvestment(inv.investmentId)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded text-[10px] cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectInvestment(inv.investmentId)}
                        className="bg-red-950/20 hover:bg-red-900 text-red-400 font-bold px-3 py-1.5 rounded text-[10px] cursor-pointer"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// ==========================================
// 5. GLOBAL AND SPECIFIC OVERRIDE ROI
// ==========================================
export function AdminRoiView() {
  const { plans, setGlobalROI, investments, setCustomROI } = useApp();

  // Selected state for overrides
  const [globalPlanId, setGlobalPlanId] = useState('');
  const [globalRoiValue, setGlobalRoiValue] = useState('');
  
  // Custom Override specific
  const [selectedInvId, setSelectedInvId] = useState('');
  const [customRoiValue, setCustomRoiValue] = useState('');

  const activeInvestments = investments.filter(i => i.status === 'active');

  const handleGlobalRoiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalPlanId || !globalRoiValue) return;
    try {
      await setGlobalROI(globalPlanId, Number(globalRoiValue));
      alert('Global default contract ROI updated successfully!');
      setGlobalRoiValue('');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCustomRoiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvId || !customRoiValue) return;
    try {
      await setCustomROI(selectedInvId, Number(customRoiValue));
      alert('Custom overrides yields successfully locked on investor portfolio!');
      setCustomRoiValue('');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">ROI Yield configurations</h1>
        <p className="text-xs text-slate-400 mt-1">Configure global default interest rates, or lock negotiable custom ROIs for VIP investors portfolios.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        
        {/* Global form */}
        <form onSubmit={handleGlobalRoiSubmit} className="bg-slate-850 border border-slate-800 p-5 rounded-xl space-y-4">
          <h3 className="font-display font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 mb-2 flex items-center gap-1.5">
            <Percent className="text-[#0F6E56]" size={16} /> Edit Global Plan Returns Rate
          </h3>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Select Targets Package Program</label>
            <select
              required
              value={globalPlanId}
              onChange={(e) => setGlobalPlanId(e.target.value)}
              className="w-full text-xs border border-slate-800 bg-slate-900 rounded p-2.5 text-white"
            >
              <option value="">-- Choose Plan --</option>
              {plans.map(p => (
                <option key={p.planId} value={p.planId}>{p.name} (Current: {p.defaultROI}%)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">New Default base ROI (%)</label>
            <input
              type="number"
              required
              value={globalRoiValue}
              onChange={(e) => setGlobalRoiValue(e.target.value)}
              placeholder="e.g. 18"
              className="w-full border border-slate-800 bg-slate-900 rounded p-2.5 font-mono text-white"
            />
          </div>

          <button
            type="submit"
            className="bg-[#0F6E56] hover:bg-[#0b5441] text-white px-5 py-2.5 rounded font-bold cursor-pointer"
          >
            Apply Global Changes
          </button>
        </form>

        {/* Custom VIP overriding form */}
        <form onSubmit={handleCustomRoiSubmit} className="bg-slate-850 border border-slate-800 p-5 rounded-xl space-y-4">
          <h3 className="font-display font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 mb-2 flex items-center gap-1.5">
            <UserCheck className="text-amber-500" size={16} /> Override Specific Investor Yield
          </h3>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Choose Active Portfolio Investment File</label>
            <select
              required
              value={selectedInvId}
              onChange={(e) => setSelectedInvId(e.target.value)}
              className="w-full text-xs border border-slate-800 bg-slate-900 rounded p-2.5 text-white"
            >
              <option value="">-- Choose Active Investment --</option>
              {activeInvestments.map(i => (
                <option key={i.investmentId} value={i.investmentId}>
                  {i.userName} - {i.planName} ({i.currency} {i.amount.toLocaleString()} | Rate: {i.roi}%)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Configure negotiated ROI (%)</label>
            <input
              type="number"
              required
              value={customRoiValue}
              onChange={(e) => setCustomRoiValue(e.target.value)}
              placeholder="e.g. 45"
              className="w-full border border-slate-800 bg-slate-900 rounded p-2.5 font-mono text-white"
            />
          </div>

          <button
            type="submit"
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded font-bold cursor-pointer"
          >
            Lock Overriding Rate
          </button>
        </form>

      </div>
    </div>
  );
}

// ==========================================
// 6. WITHDRAWALS PROCESSING DESTRUCTION
// ==========================================
export function AdminWithdrawalsView() {
  const { withdrawals, releaseWithdrawal, holdWithdrawal, formatMoney } = useApp();

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Withdrawal Extractions settlements</h1>
        <p className="text-xs text-slate-400 mt-1">Review ledger extractions placed. Authorize payout release or hold files.</p>
      </div>

      <div className="bg-slate-850 border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4">Investor Identification</th>
                <th className="p-4">Settlement Bank account</th>
                <th className="p-4">Request Date</th>
                <th className="p-4">Amount Asked</th>
                <th className="p-4">Authorization</th>
                <th className="p-4 text-right">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-505">
                    No withdrawals extraction logs queued inside platform desk.
                  </td>
                </tr>
              ) : (
                withdrawals.map(wd => (
                  <tr key={wd.withdrawalId} className="hover:bg-slate-800 transition-colors">
                    <td className="p-4 font-bold text-white">
                      {wd.userName || 'Investor Profile'}
                      <span className="block text-[10px] font-mono font-medium text-slate-505 mt-0.5">UID: {wd.userId}</span>
                    </td>
                    <td className="p-4">
                      <strong className="text-white font-semibold">{wd.bankDetails.bankName}</strong>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">Nuban: {wd.bankDetails.accountNumber} | Holder: {wd.bankDetails.accountName}</div>
                    </td>
                    <td className="p-4">{new Date(wd.requestDate).toLocaleDateString()}</td>
                    <td className="p-4 font-mono font-bold text-amber-500">{wd.currency === 'NGN' ? '₦' : '$'}{wd.amount.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        wd.status === 'released' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                          : wd.status === 'held' 
                          ? 'bg-slate-900 text-slate-505 border' 
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {wd.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1">
                      {wd.status === 'pending' || wd.status === 'held' ? (
                        <>
                          <button
                            onClick={() => releaseWithdrawal(wd.withdrawalId)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded text-[10px] cursor-pointer"
                          >
                            Release
                          </button>
                          {wd.status !== 'held' && (
                            <button
                              onClick={() => holdWithdrawal(wd.withdrawalId)}
                              className="bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-700 font-bold px-2.5 py-1 rounded text-[10px] cursor-pointer"
                            >
                              Hold
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-emerald-400 text-[10px] font-bold">Payout Complete✓</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// ==========================================
// 7. KYC APPROVAL QUEUES QUEUE
// ==========================================
export function AdminKycView() {
  const { usersList, approveKYC, rejectKYC } = useApp();
  const [rejectId, setRejectId] = useState('');
  const [reason, setReason] = useState('');

  const pendingUsers = usersList.filter(u => u.status === 'kyc_pending');

  const handleKycDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectId || !reason) return;
    try {
      await rejectKYC(rejectId, reason);
      setRejectId('');
      setReason('');
      alert('KYC verification rejected with logged explanation statement.');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">KYC Verification clearance queue</h1>
        <p className="text-xs text-slate-400 mt-1">Review provided identification NIN keys, selfie vectors, and address billing proofs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Verification Queue */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl overflow-hidden shadow lg:col-span-2">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Investor profile</th>
                  <th className="p-4">Verification Artifacts</th>
                  <th className="p-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                {pendingUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-505">
                      No investors queued for identity authorization logs.
                    </td>
                  </tr>
                ) : (
                  pendingUsers.map(user => (
                    <tr key={user.userId} className="hover:bg-slate-800 transition-colors">
                      <td className="p-4 font-bold text-white">
                        {user.name}
                        <span className="block text-[10px] text-slate-450 font-mono font-medium mt-0.5">UID: {user.userId}</span>
                        <span className="block text-[10px] text-slate-505 mt-0.5">{user.email}</span>
                      </td>
                      <td className="p-4 space-y-1.5 font-mono text-[10px]">
                        <div>• NIN Code: <span className="text-emerald-400 font-bold">{user.kycDocNIN || 'None'}</span></div>
                        <div className="flex gap-2">
                          <span className="bg-slate-905 px-1.5 py-0.5 rounded text-white border text-[9px] font-sans">Selfie File: {user.kycDocSelfie}</span>
                          <span className="bg-slate-905 px-1.5 py-0.5 rounded text-white border text-[9px] font-sans">Proof File: {user.kycDocAddress}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right space-x-1 shrink-0">
                        <button
                          onClick={() => approveKYC(user.userId)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded text-[10px] cursor-pointer"
                        >
                          Approve KYC
                        </button>
                        <button
                          onClick={() => setRejectId(user.userId)}
                          className="bg-red-950/20 hover:bg-red-900 text-red-400 border border-red-900/40 font-bold px-2.5 py-1.5 rounded text-[10px] cursor-pointer"
                        >
                          Decline
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Decline explain path */}
        {rejectId && (
          <form onSubmit={handleKycDecline} className="bg-slate-850 border border-slate-800 p-5 rounded-xl space-y-4 h-fit text-xs text-slate-300">
            <div className="flex justify-between items-center">
              <h4 className="font-display font-semibold text-white uppercase tracking-wider text-[11px] flex gap-1 items-center">
                <AlertTriangle className="text-red-500" size={14} /> Log KYC rejection reason
              </h4>
              <button type="button" onClick={() => setRejectId('')} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">State explanation for denial</label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Identity documents photo blurry, selfie image mismatches NIN parameters registry..."
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white text-xs focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="bg-red-650 hover:bg-red-700 text-white font-bold px-4 py-2 rounded text-xs cursor-pointer"
            >
              Log rejection
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

// ==========================================
// 8. INVESTMENT PLANS CREATOR
// ==========================================
export function AdminPlansView() {
  const { plans, createPlan, updatePlan } = useApp();

  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [defaultROI, setDefaultRoi] = useState('');
  const [currencyVal, setCurrencyVal] = useState<'NGN' | 'USD' | 'ANY'>('ANY');

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !duration || !minAmount || !defaultROI) return;
    try {
      await createPlan({
        name,
        duration: Number(duration),
        minAmount: Number(minAmount),
        defaultROI: Number(defaultROI),
        currency: currencyVal,
        status: 'active'
      });
      alert('Investment program registry created successfully!');
      setName('');
      setDuration('');
      setMinAmount('');
      setDefaultRoi('');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleTogglePlanStatus = async (planId: string, currentStatus: 'active' | 'inactive') => {
    try {
      const next = currentStatus === 'active' ? 'inactive' : 'active';
      await updatePlan(planId, { status: next });
      alert(`Plan set to ${next} status!`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Investment Plans registry</h1>
        <p className="text-xs text-slate-400 mt-1">Deploy new savings contracts duration speeds and threshold capitals levels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-slate-300">
        
        {/* Form create */}
        <form onSubmit={handleCreatePlan} className="bg-slate-850 border border-slate-800 p-5 rounded-xl space-y-4 h-fit">
          <h3 className="font-display font-bold text-white uppercase text-[11px] tracking-wider border-b border-slate-800 pb-3 block">
            Create Saving Contract Pack
          </h3>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Plan Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Real Estate Arbitrage (9M)"
              className="w-full border border-slate-800 bg-slate-900 rounded p-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Duration (Months)</label>
              <input
                type="number"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 9"
                className="w-full border border-slate-800 bg-slate-900 rounded p-2 text-white font-mono"
              />
            </div>
            
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Default Base ROI %</label>
              <input
                type="number"
                required
                value={defaultROI}
                onChange={(e) => setDefaultRoi(e.target.value)}
                placeholder="e.g. 35"
                className="w-full border border-slate-800 bg-slate-900 rounded p-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#0F6E56] font-bold mb-1">Platform currency</label>
              <select
                value={currencyVal}
                onChange={(e) => setCurrencyVal(e.target.value as any)}
                className="w-full border border-slate-800 bg-slate-900 rounded p-2 text-white"
              >
                <option value="ANY">Multi-Currency (ANY)</option>
                <option value="NGN">NGN (₦ Only)</option>
                <option value="USD">USD ($ Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Min. Capital NGN</label>
              <input
                type="number"
                required
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="e.g. 30000"
                className="w-full border border-slate-800 bg-slate-900 rounded p-2 text-white font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#0F6E56] hover:bg-[#0b5441] text-white py-2.5 rounded font-bold cursor-pointer transition-colors"
          >
            Deploy Saving Contract Package
          </button>
        </form>

        {/* Existing plans table */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl overflow-hidden shadow lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Contract Package Name</th>
                  <th className="p-4">Duration Range</th>
                  <th className="p-4">Base ROIs Rate</th>
                  <th className="p-4 text-right">Switch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {plans.map(p => (
                  <tr key={p.planId} className="hover:bg-slate-800 transition-colors">
                    <td className="p-4 font-bold text-white">{p.name}</td>
                    <td className="p-4 font-mono">{p.duration} Months</td>
                    <td className="p-4 font-semibold text-emerald-400">{p.defaultROI}% ROIs</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleTogglePlanStatus(p.planId, p.status)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase cursor-pointer ${
                          p.status === 'active' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                            : 'bg-slate-900 border text-slate-505'
                        }`}
                      >
                        {p.status}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// 9. COMPOSE NOTIFICATIONS BROADCASTS
// ==========================================
export function AdminNotificationsView() {
  const { composeNotification } = useApp();

  const [recipients, setRecipients] = useState<'all' | 'specific' | 'active' | 'matured'>('all');
  const [channel, setChannel] = useState<'email+SMS' | 'email' | 'SMS'>('email+SMS');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [specificUserId, setSpecificUserId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    setLoading(true);

    try {
      await composeNotification(
        recipients,
        channel,
        subject,
        message,
        recipients === 'specific' ? specificUserId || undefined : undefined
      );
      
      alert(`Broadcasting alert dispatched successfully via Termii SMS & SendGrid gateway channels integrations!`);
      setSubject('');
      setMessage('');
      setSpecificUserId('');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-slate-100 font-sans">
      
      <div className="bg-slate-850 border border-slate-800 rounded-xl p-6 shadow space-y-6">
        <div>
          <h2 className="text-xl font-display font-bold text-white flex gap-1.5 items-center">
            <BellRing size={20} className="text-[#0F6E56]" /> Create Multi-Channel Broadcast
          </h2>
          <p className="text-xs text-slate-400 mt-1">Compose newsletters or alerts, dispatched instantly via integrated SMS (Termii) & Email (SendGrid) servers.</p>
        </div>

        <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs text-slate-300 font-medium">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Target Audience</label>
              <select
                value={recipients}
                onChange={(e) => setRecipients(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white"
              >
                <option value="all">All Platform Users (Investors)</option>
                <option value="active">Investors with Active Holdings only</option>
                <option value="matured">Investors with Matured accounts only</option>
                <option value="specific">Specific Investor Profile UID</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Dispatch Channels Integrations</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white"
              >
                <option value="email+SMS">SendGrid (Email) + Termii (SMS)</option>
                <option value="email">SendGrid (Email) Only</option>
                <option value="SMS">Termii (SMS) Only</option>
              </select>
            </div>
          </div>

          {recipients === 'specific' && (
            <div>
              <label className="block text-slate-400 font-bold mb-1">Enter specific Investor profile ID (UID)</label>
              <input
                type="text"
                required
                value={specificUserId}
                onChange={(e) => setSpecificUserId(e.target.value)}
                placeholder="e.g. user_01"
                className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-400 font-bold mb-1">Message Subject / Title</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Asset Yield update statement instructions"
              className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Message Body</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message details here..."
              className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0F6E56] hover:bg-[#0b5441] text-white py-3 rounded font-bold transition-colors cursor-pointer text-xs"
          >
            {loading ? "Triggering APIs dispatches..." : "Release Broadcast Dispatch"}
          </button>

        </form>
      </div>

    </div>
  );
}

// ==========================================
// 10. AUDIT REPORTS EXPORTER
// ==========================================
export function AdminReportsView() {
  const { usersList, investments, referrals } = useApp();

  const handleExportCSV = (type: 'investors' | 'transactions' | 'referrals') => {
    let dataToExport: any[] = [];
    let fields: string[] = [];

    try {
      if (type === 'investors') {
        dataToExport = usersList.filter(u => u.role === 'user');
        fields = ['userId', 'name', 'email', 'phone', 'status', 'referralCode'];
      } else if (type === 'transactions') {
        dataToExport = investments;
        fields = ['investmentId', 'userId', 'amount', 'currency', 'roi', 'startDate', 'endDate', 'status', 'paystackRef'];
      } else if (type === 'referrals') {
        dataToExport = referrals;
        fields = ['referralId', 'referrerId', 'referredUserId', 'bonus', 'currency', 'status', 'date'];
      }

      // Build CSV output natively
      const header = fields.join(',');
      const rows = dataToExport.map(item => {
        return fields.map(field => {
          const val = item[field] !== undefined ? item[field] : '';
          const str = String(val).replace(/"/g, '""');
          return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
        }).join(',');
      });
      const csv = [header, ...rows].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `VestGrow_${type}_Export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(15, 110, 86);
      doc.text('VestGrow Backoffice Terminal', 14, 20);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Monthly Summary Audit Report • Timestamp: ${new Date().toLocaleString()}`, 14, 26);
      doc.line(14, 30, 196, 30);

      doc.setFontSize(12);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(30, 30, 30);

      const totalFUM = investments.filter(i => i.status === 'active').reduce((sum, i) => sum + i.amount, 0);
      const activeCount = investments.filter(i => i.status === 'active').length;
      const totalVerifications = usersList.filter(u => u.status === 'kyc_pending').length;

      doc.text('Key Summary Statistics Metrics:', 14, 43);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Active contracts running: ${activeCount}`, 14, 52);
      doc.text(`Platform active funds valuation: NGN ${totalFUM.toLocaleString()}`, 14, 58);
      doc.text(`Verification clearance pendings: ${totalVerifications}`, 14, 64);
      doc.text(`Affiliate connections payout settled: NGN ${referrals.filter(r => r.status === 'earned').reduce((sum, r) => sum + r.bonus, 0).toLocaleString()}`, 14, 70);

      doc.save(`VestGrow_Administrative_Executive_Summary_${Date.now()}.pdf`);
      alert('Executive Audit Report PDF generated successfully!');
    } catch (err: any) {
      alert(`PDF compiling failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-slate-100 font-sans">
      
      <div className="bg-slate-850 border border-slate-800 rounded-xl p-6 shadow space-y-6">
        <div>
          <h2 className="text-xl font-display font-bold text-white flex gap-1.5 items-center">
            <Download size={20} className="text-[#0F6E56]" /> Audit Reports Exporter
          </h2>
          <p className="text-xs text-slate-400 mt-1">Extract financial sheets, clients lists, and platform metrics parameters directly as CSV or compiled PDF structures.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
          
          <button
            onClick={() => handleExportCSV('investors')}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 p-4 border border-slate-800 rounded-xl cursor-pointer text-left font-medium"
          >
            <Download className="text-[#0F6E56]" size={18} />
            <div>
              <strong className="text-white block font-semibold text-xs">Exporters Investors ledger (CSV)</strong>
              <span className="text-[10px] text-slate-505 font-normal mt-0.5 font-sans">Details verification, balances, emails parameters.</span>
            </div>
          </button>

          <button
            onClick={() => handleExportCSV('transactions')}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 p-4 border border-slate-800 rounded-xl cursor-pointer text-left font-medium"
          >
            <Download className="text-[#0F6E56]" size={18} />
            <div>
              <strong className="text-white block font-semibold text-xs">Exporters Transactions History (CSV)</strong>
              <span className="text-[10px] text-slate-505 font-normal mt-0.5">Yield portfolio selections, paystack, starts/end values.</span>
            </div>
          </button>

          <button
            onClick={() => handleExportCSV('referrals')}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 p-4 border border-slate-800 rounded-xl cursor-pointer text-left font-medium"
          >
            <Download className="text-[#0F6E56]" size={18} />
            <div>
              <strong className="text-white block font-semibold text-xs">Exporters Affiliate database (CSV)</strong>
              <span className="text-[10px] text-slate-505 font-normal mt-0.5">Referral earnings payouts, referrers link logs.</span>
            </div>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-[#0F6E56] hover:bg-[#0b5441] p-4 rounded-xl cursor-pointer text-left font-medium"
          >
            <Download className="text-white" size={18} />
            <div>
              <strong className="text-white block font-semibold text-xs">Exporters Summary Analytics (PDF)</strong>
              <span className="text-emerald-200 font-normal mt-0.5">Platform executives dashboard statistics summary indicators.</span>
            </div>
          </button>

        </div>
      </div>

    </div>
  );
}

// ==========================================
// 11. TIMESTAMPED ACTIONS ACTIVITY LOGS
// ==========================================
export function AdminActivityView() {
  const { activityLogs } = useApp();

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Platform security audit log</h1>
        <p className="text-xs text-slate-400 mt-1">Complete immutable timestamped operations tracking of admin and investor events.</p>
      </div>

      <div className="bg-slate-850 border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4">Timestamp date</th>
                <th className="p-4">Staff / Investor actor</th>
                <th className="p-4">Platform Action</th>
                <th className="p-4">Targets ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-medium font-mono text-[10.5px]">
              {activityLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-505 font-sans text-xs">
                    No timeline operations recorded inside audit logs collection.
                  </td>
                </tr>
              ) : (
                activityLogs.map(log => (
                  <tr key={log.logId} className="hover:bg-slate-800 transition-colors">
                    <td className="p-4 text-slate-505">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-4">
                      <strong className="text-white font-semibold font-sans">{log.actorName}</strong>
                      <span className={`block text-[9px] uppercase font-bold mt-0.5 ${log.actorRole === 'admin' ? 'text-amber-500' : 'text-emerald-500'}`}>{log.actorRole}</span>
                    </td>
                    <td className="p-4 text-slate-350 font-sans font-medium">{log.action}</td>
                    <td className="p-4 text-[#0F6E56] font-bold">{log.targetId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
