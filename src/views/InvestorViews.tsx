import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../components/AppContext';
import { auth, logAction, supabase } from '../lib/firebaseMock';
import { useNavigate } from 'react-router';
import CountdownTimer from '../components/CountdownTimer';
import InvestmentProgressBar from '../components/InvestmentProgressBar';
import { jsPDF } from 'jspdf';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer 
} from 'recharts';

import { 
  TrendingUp, 
  ArrowUpRight, 
  DollarSign, 
  CreditCard, 
  Users, 
  Bell, 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Briefcase, 
  CheckCircle, 
  AlertTriangle, 
  Copy, 
  Plus, 
  Download, 
  ShieldAlert,
  ArrowRight,
  Eye,
  Trash2,
  Chrome
} from 'lucide-react';

// ==========================================
// 1. SIGNUP VIEW
// ==========================================
export function SignUpView() {
  const { submitKycDocuments } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: Form, Step 2: KYC

  // Step 1 Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 2 KYC States
  const [nin, setNin] = useState('');
  const [selfie, setSelfie] = useState(''); // File Name or base64 representation
  const [addressProof, setAddressProof] = useState('');
  
  // Drag & drop triggers
  const [dragActiveSelfie, setDragActiveSelfie] = useState(false);
  const [dragActiveBill, setDragActiveBill] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      setError('Please fill in all standard credentials');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await auth.createUserWithEmailAndPassword(email, name, phone, referralCode || undefined, password);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nin) {
      setError('Your legal NIN Number is required to activate trading clearance');
      return;
    }
    setLoading(true);
    try {
      await submitKycDocuments(
        nin,
        selfie || 'simulated_selfie_image.jpg',
        addressProof || 'simulated_utility_bill.pdf'
      );
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'KYC submission failed');
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent, type: 'selfie' | 'bill') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      type === 'selfie' ? setDragActiveSelfie(true) : setDragActiveBill(true);
    } else if (e.type === "dragleave") {
      type === 'selfie' ? setDragActiveSelfie(false) : setDragActiveBill(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'selfie' | 'bill') => {
    e.preventDefault();
    e.stopPropagation();
    type === 'selfie' ? setDragActiveSelfie(false) : setDragActiveBill(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const fileName = e.dataTransfer.files[0].name;
      type === 'selfie' ? setSelfie(fileName) : setAddressProof(fileName);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 glass-card shadow-2xl text-gray-805">
      <div className="text-center mb-8">
        <div className="inline-flex bg-emerald-50 text-[#0F6E56] font-display font-extrabold text-2xl px-4 py-2 rounded-xl mb-3">
          VG
        </div>
        <h2 className="font-display font-bold text-2xl text-gray-900 tracking-tight">Create your account</h2>
        <p className="text-sm text-gray-500 mt-1.5">Start compounding multi-currency assets today.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2">
          <ShieldAlert size={14} className="shrink-0" />
          {error}
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-650 uppercase tracking-wider mb-1">Full Legal Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#0F6E56] font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-650 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#0F6E56]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-650 uppercase tracking-wider mb-1">Mobile Phone Number</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#0F6E56]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-650 uppercase tracking-wider mb-1">Secure Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#0F6E56]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-650 uppercase tracking-wider mb-1">Referral Code (Optional)</label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="e.g. AMINA23"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#0F6E56]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0F6E56] hover:bg-[#0b5441] text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer"
          >
            {loading ? "Registering..." : "Continue"}
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            Already have an investor account?{' '}
            <button type="button" onClick={() => navigate('/login')} className="text-[#0F6E56] font-bold hover:underline">
              Log in
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleKycSubmit} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <strong>KYC Step required:</strong> Provide details to activate full limits and secure funds under custody.
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-650 uppercase tracking-wider mb-1">NIN (National Identification Number)</label>
            <input
              type="text"
              required
              maxLength={11}
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
              placeholder="11-digit identity number"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 font-mono text-sm focus:outline-none focus:border-[#0F6E56]"
            />
          </div>

          {/* Selfie Uploader with Drag-and-Drop */}
          <div>
            <label className="block text-xs font-bold text-gray-650 uppercase tracking-wider mb-1">Selfie Verification Photograph</label>
            <div 
              onDragEnter={(e) => handleDrag(e, 'selfie')}
              onDragOver={(e) => handleDrag(e, 'selfie')}
              onDragLeave={(e) => handleDrag(e, 'selfie')}
              onDrop={(e) => handleDrop(e, 'selfie')}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${dragActiveSelfie ? 'border-[#0F6E56] bg-emerald-50/20' : 'border-gray-300 hover:border-[#0F6E56]'}`}
            >
              <input 
                type="file" 
                id="selfie-file" 
                className="hidden" 
                onChange={(e) => e.target.files?.[0] && setSelfie(e.target.files[0].name)} 
              />
              <label htmlFor="selfie-file" className="cursor-pointer">
                {selfie ? (
                  <div className="text-xs text-[#0F6E56] font-semibold">{selfie} Selected ✓</div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-600">Drag & drop your selfie photo here, or <span className="text-[#0F6E56] font-bold">browse files</span></p>
                    <p className="text-[10px] text-gray-400 mt-1">Supports JPEG, PNG up to 5MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Address Proof Uploader with Drag-and-Drop */}
          <div>
            <label className="block text-xs font-bold text-gray-650 uppercase tracking-wider mb-1">Proof of Address (Utility bill, statement)</label>
            <div 
              onDragEnter={(e) => handleDrag(e, 'bill')}
              onDragOver={(e) => handleDrag(e, 'bill')}
              onDragLeave={(e) => handleDrag(e, 'bill')}
              onDrop={(e) => handleDrop(e, 'bill')}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${dragActiveBill ? 'border-[#0F6E56] bg-emerald-50/20' : 'border-gray-300 hover:border-[#0F6E56]'}`}
            >
              <input 
                type="file" 
                id="bill-file" 
                className="hidden" 
                onChange={(e) => e.target.files?.[0] && setAddressProof(e.target.files[0].name)} 
              />
              <label htmlFor="bill-file" className="cursor-pointer">
                {addressProof ? (
                  <div className="text-xs text-[#0F6E56] font-semibold">{addressProof} Selected ✓</div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-600">Drag & drop utility receipt here, or <span className="text-[#0F6E56] font-bold">browse files</span></p>
                    <p className="text-[10px] text-gray-400 mt-1">PDF or image of latest 3 months document</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0F6E56] hover:bg-[#0b5441] text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer"
          >
            {loading ? "Uploading KYC..." : "Submit and Go Home"}
          </button>
        </form>
      )}
    </div>
  );
}

// ==========================================
// 2. LOGIN VIEW
// ==========================================
export function LoginView() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in password fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await auth.signInWithEmailAndPassword(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      setError(err.message || 'Verification rejected');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { data, error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true
        }
      });

      if (oauthErr) throw oauthErr;
      if (!data?.url) throw new Error('Could not establish third-party sign-in handshake.');

      // Open OAuth window directly in a popup (required for iframe preview)
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        data.url,
        'google_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
      );

      if (!popup) {
        setError('Popup was blocked by your browser. Please allow popups to sign in with Google.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'OAuth sign-in failed');
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setLoading(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const isUserAdmin = user.email === 'paypalwash007@gmail.com' || user.email?.toLowerCase().includes('admin');
            if (isUserAdmin) {
              navigate('/admin');
            } else {
              navigate('/home');
            }
          }
        } catch (err: any) {
          setError('Failed to load user profile: ' + (err.message || err));
        } finally {
          setLoading(false);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  return (
    <div className="max-w-md mx-auto my-12 p-8 glass-card shadow-2xl text-gray-805" id="login_card">
      <div className="text-center mb-8" id="login_header">
        <div className="inline-flex bg-emerald-50 text-[#0F6E56] font-display font-extrabold text-2xl px-4 py-2 rounded-xl mb-3" id="login_logo">
          VG
        </div>
        <h2 className="font-display font-bold text-2xl text-gray-900 tracking-tight" id="login_title">Welcome Back</h2>
        <p className="text-sm text-gray-500 mt-1.5 font-medium" id="login_subtitle">Log into your secure modern investor portal.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2" id="login_error">
          <ShieldAlert size={14} className="shrink-0" id="login_error_icon" />
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4" id="login_form">
        <div>
          <label className="block text-xs font-bold text-gray-650 uppercase tracking-wider mb-1" id="login_email_label">Email Address</label>
          <div className="relative" id="login_email_container">
            <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" id="login_email_icon" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@vestgrow.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#0F6E56]"
              id="login_email_input"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-650 uppercase tracking-wider mb-1" id="login_password_label">Password</label>
          <div className="relative" id="login_password_container">
            <Lock size={16} className="absolute left-3 top-3.5 text-gray-450" id="login_password_icon" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#0F6E56]"
              id="login_password_input"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0F6E56] hover:bg-[#0b5441] text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer"
          id="login_submit_btn"
        >
          {loading ? "Authenticating..." : "Log In"}
        </button>

        <div className="relative flex py-2 items-center" id="login_divider_container">
          <div className="flex-grow border-t border-gray-200" id="login_divider_left"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-xs font-medium" id="login_divider_text">or</span>
          <div className="flex-grow border-t border-gray-200" id="login_divider_right"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
          id="login_google_btn"
        >
          {loading ? (
            <div className="animate-spin w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full" id="google_loading_spinner"></div>
          ) : (
            <Chrome size={18} className="text-red-500" id="login_google_icon" />
          )}
          Continue with Google
        </button>

        <p className="text-center text-xs text-gray-500 mt-6" id="login_signup_prompt">
          Don't have an account?{' '}
          <button type="button" onClick={() => navigate('/signup')} className="text-[#0F6E56] font-bold hover:underline" id="login_signup_btn">
            Register as investor
          </button>
        </p>
      </form>
    </div>
  );
}

// ==========================================
// 3. HOME VIEW
// ==========================================
export function HomeView() {
  const { currentUser, formatMoney, currency, plans, investments, requestWithdrawal, convertAmount } = useApp();
  const navigate = useNavigate();

  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Filter investments
  const userInvestments = investments.filter(i => i.userId === currentUser?.userId);
  const activeInvestments = userInvestments.filter(i => i.status === 'active');
  const maturedInvestments = userInvestments.filter(i => i.status === 'matured');

  // Greeting selection
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good morning ✨";
    if (hrs < 17) return "Good afternoon ☀️";
    return "Good evening 🌙";
  };

  // Portfolio calculations
  const activeSumSource = activeInvestments.reduce((sum, inv) => {
    return sum + (inv.currency === currency ? inv.amount : inv.amount); // Let AppContext formatMoney calculate exchange rate conversion organically
  }, 0);

  const totalSumUSD = userInvestments.reduce((sum, inv) => {
    if (inv.status !== 'active' && inv.status !== 'matured') return sum;
    const value = inv.amount;
    if (inv.currency === 'NGN') return sum + (value / 1600);
    return sum + value;
  }, 0);

  const portfolioValueDisplay = currency === 'USD' ? totalSumUSD : totalSumUSD * 1600;

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess(false);

    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
      setWithdrawError('Please define a valid positive extraction amount.');
      return;
    }

    if (!selectedBank) {
      setWithdrawError('Connect or select a settlement bank account in Settings.');
      return;
    }

    const amt = Number(withdrawAmount);
    // Convert current selected total value of portfolio to withdrawal currency for validation
    if (amt > portfolioValueDisplay) {
      setWithdrawError(`Insufficient funds. Your total withdrawable limit is ${formatMoney(portfolioValueDisplay, currency)}`);
      return;
    }

    try {
      const bank = currentUser?.bankAccounts.find(b => b.id === selectedBank);
      if (!bank) throw new Error('Bank selection failed');
      
      await requestWithdrawal(
        amt,
        currency,
        bank.bankName,
        bank.accountNumber,
        bank.accountName
      );
      
      setWithdrawSuccess(true);
      setWithdrawAmount('');
    } catch (err: any) {
      setWithdrawError(err.message || 'Withdrawal failed');
    }
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Dynamic Greetings Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            {getGreeting()}, {currentUser?.name}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here is a summary of your yields and savings programs today.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/invest')} 
            className="flex items-center gap-1 bg-[#0F6E56] hover:bg-[#0b5441] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-transform hover:-translate-y-0.5 shadow-sm cursor-pointer"
          >
            <ArrowUpRight size={14} /> New Investment
          </button>
          
          <button 
            onClick={() => setWithdrawModalOpen(true)}
            className="flex items-center gap-1 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200 text-xs font-bold px-4 py-2.5 rounded-lg transition-transform hover:-translate-y-0.5 cursor-pointer"
          >
            <DollarSign size={14} className="text-emerald-700" /> Withdraw Funds
          </button>
        </div>
      </div>

      {/* Main Asset Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Portfolio Valuation Card */}
        <div className="bg-[#0F6E56] text-white rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-emerald-950/10">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <TrendingUp size={240} />
          </div>
          <span className="text-xs uppercase tracking-widest text-emerald-200 font-bold">Total Portfolio Assets</span>
          <h2 className="text-4xl font-display font-black mt-2 tracking-tight">
            {formatMoney(portfolioValueDisplay, currency)}
          </h2>
          <div className="mt-4 flex items-center gap-2 text-xs bg-[#0b5441] border border-[#117C62] rounded-lg px-2.5 py-1 w-fit">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            <span>Dual Wallet toggled to: <strong className="font-mono">{currency}</strong></span>
          </div>
        </div>

        {/* Matured Savings Info */}
        <div className="glass-card p-6 flex flex-col justify-between shadow-xs text-gray-805">
          <div>
            <span className="text-xs text-slate-550 uppercase tracking-widest font-bold">Matured Balance</span>
            <h3 className="text-2xl font-display font-bold text-gray-900 mt-2">
              {formatMoney(
                maturedInvestments.reduce((sum, i) => sum + (i.currency === currency ? i.amount : convertAmount(i.amount, i.currency, currency)), 0),
                currency
              )}
            </h3>
            <p className="text-xs text-gray-600 mt-1">Ready for immediate reinvestment or payout extraction.</p>
          </div>
          <div className="text-xs font-semibold text-emerald-800 mt-3 flex items-center gap-1">
            {maturedInvestments.length} Matured Package(s)
          </div>
        </div>

        {/* Affiliate Bonus Stats */}
        <div className="glass-card p-6 flex flex-col justify-between shadow-xs text-gray-805">
          <div>
            <span className="text-xs text-slate-550 uppercase tracking-widest font-bold font-sans">Affiliate Code</span>
            <div className="flex items-center justify-between bg-white/40 border border-white/50 rounded-lg p-2 mt-2">
              <span className="font-mono font-bold text-gray-800 tracking-wider text-sm">{currentUser?.referralCode}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(currentUser?.referralCode || '');
                  alert('Referral code copied to clipboard!');
                }}
                className="text-[#0F6E56] hover:text-[#0b5441] cursor-pointer"
              >
                <Copy size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Share rules: earn ₦5,000 for every successfully funded account.</p>
          </div>
          <button 
            onClick={() => navigate('/referral')} 
            className="text-xs font-bold text-[#0F6E56] hover:underline flex items-center gap-1"
          >
            View referrals details <ArrowRight size={12} />
          </button>
        </div>

      </div>

      {/* active portfolios grid */}
      <div className="glass-card p-6 shadow-xs text-gray-800">
        <h3 className="font-display font-bold text-lg text-gray-900 tracking-tight">Active Investments ({activeInvestments.length})</h3>
        
        {activeInvestments.length === 0 ? (
          <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-xl mt-4">
            <TrendingUp size={36} className="mx-auto text-gray-300 stroke-1" />
            <p className="text-xs font-semibold mt-3">You do not have any active investment programs running.</p>
            <button 
              onClick={() => navigate('/invest')} 
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold bg-[#0F6E56] hover:bg-[#0b5441] text-white px-4 py-2 rounded-lg cursor-pointer"
            >
              Get Started <Plus size={12} />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {activeInvestments.map(inv => (
              <div key={inv.investmentId} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{inv.planName}</h4>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">Ref: {inv.paystackRef}</p>
                    </div>
                    <span className="font-mono text-sm font-bold text-[#0F6E56]">
                      {inv.currency === 'NGN' ? '₦' : '$'}{inv.amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-white rounded-lg p-2.5 border border-slate-100">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Yield ROI</span>
                      <strong className="text-[#0F6E56] font-display font-medium text-sm">{inv.roi}% Return</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Estimated Return</span>
                      <strong className="text-gray-800 font-display font-medium text-sm">
                        {inv.currency === 'NGN' ? '₦' : '$'}{(inv.amount + (inv.amount * inv.roi / 100)).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <InvestmentProgressBar startDate={inv.startDate} endDate={inv.endDate} />
                  
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                    <span className="text-gray-400">Yield target: {new Date(inv.endDate).toLocaleDateString()}</span>
                    <CountdownTimer endDate={inv.endDate} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invest plan models */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-lg text-gray-900 tracking-tight">Standard Investment Plans</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {plans.filter(p => p.status === 'active').map(plan => (
            <div key={plan.planId} className="glass-card p-5 hover:border-[#0F6E56] hover:shadow-md hover:translate-y-[-2pt] transition-all flex flex-col justify-between shadow-xs text-gray-805">
              <div>
                <span className="bg-brand-green-light text-[#0F6E56] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#e6f1ee]">
                  {plan.duration === 3 ? 'Short Term' : plan.duration === 6 ? 'Medium Term' : 'Long Term'}
                </span>
                <h4 className="font-display font-bold text-base text-gray-900 mt-2.5">{plan.name}</h4>
                <div className="my-4 text-center bg-gray-50 rounded-xl py-3 border border-gray-100">
                  <span className="text-3xl font-display font-extrabold text-[#0F6E56]">{plan.defaultROI}%</span>
                  <span className="text-xs text-gray-500 font-bold block mt-0.5">ESTIMATED COMPENSATING ROI</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-2 mt-4 font-medium">
                  <li className="flex justify-between"><span>Duration:</span> <strong className="text-gray-800">{plan.duration} Calendar Months</strong></li>
                  <li className="flex justify-between"><span>Min threshold:</span> <strong className="text-gray-800">₦{plan.minAmount.toLocaleString()} / ${(plan.minAmount / 1600).toFixed(0)}</strong></li>
                  <li className="flex justify-between"><span>Payout strategy:</span> <strong className="text-gray-800">Principal + ROI at maturity</strong></li>
                </ul>
              </div>
              <button 
                onClick={() => navigate('/invest', { state: { selectedPlanId: plan.planId } })}
                className="w-full bg-[#0F6E56] hover:bg-[#0b5441] text-white font-bold py-2 rounded-lg text-xs mt-5 transition-colors cursor-pointer"
              >
                Select {plan.name}
              </button>
            </div>
          ))}
          
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <span className="bg-amber-100 text-amber-805 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Custom Plan</span>
              <h4 className="font-display font-bold text-base text-gray-900 mt-2.5">Pro Custom yield</h4>
              <p className="text-xs text-gray-500 mt-2">Have specific requirements? Configure a flexible duration and capital plan with tailored yields.</p>
              <div className="my-4 bg-white rounded-xl py-3 text-center border">
                <span className="text-lg font-bold text-[#0F6E56]">Negotiated ROI</span>
              </div>
            </div>
            <button 
              onClick={() => navigate('/invest')} 
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer"
            >
              Configure Custom Plan
            </button>
          </div>
        </div>
      </div>

      {/* WITHDRAWAL MODAL */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-card max-w-md w-full p-6 text-gray-800 relative shadow-2xl bg-white/80 backdrop-blur-xl border-white/50">
            <button 
              onClick={() => setWithdrawModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 block focus:outline-none"
            >
              ✕
            </button>
            <h3 className="font-display font-bold text-lg border-b pb-3 mb-4 flex items-center gap-1.5 text-gray-900">
              <DollarSign className="text-emerald-700" size={20} /> Withdrawal Extraction Request
            </h3>

            {withdrawSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="bg-emerald-50 text-emerald-700 p-2 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                  ✓
                </div>
                <h4 className="font-bold text-emerald-950">Extraction request lodged!</h4>
                <p className="text-xs text-gray-500">Your withdrawal was registered and is waiting for administrator release authorization.</p>
                <button 
                  onClick={() => { setWithdrawModalOpen(false); setWithdrawSuccess(false); }}
                  className="bg-[#0F6E56] text-white px-4 py-2 rounded-lg text-xs font-bold"
                >
                  Great, thanks!
                </button>
              </div>
            ) : (
              <form onSubmit={handleWithdrawalRequest} className="space-y-4">
                {withdrawError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-semibold">
                    {withdrawError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Select Target Bank Account
                  </label>
                  {currentUser?.bankAccounts.length === 0 ? (
                    <div className="text-xs text-amber-800 bg-amber-50 rounded-lg p-2.5 border">
                      You haven't connected any payout accounts yet.
                      <button 
                        type="button" 
                        onClick={() => { setWithdrawModalOpen(false); navigate('/settings'); }}
                        className="text-[#0F6E56] font-bold block hover:underline mt-1 cursor-pointer"
                      >
                        Click here to setup Bank Details
                      </button>
                    </div>
                  ) : (
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      required
                      className="w-full text-xs border rounded-lg p-2.5 bg-white text-gray-700 focus:outline-[#0F6E56]"
                    >
                      <option value="">-- Choose Account --</option>
                      {currentUser?.bankAccounts.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} - {b.accountNumber} ({b.accountName})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Amount ({currency})
                  </label>
                  <input
                    type="number"
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-[#0F6E56] font-mono"
                  />
                  <div className="text-[10px] text-gray-400 mt-1 font-medium">
                    Available balance value: <strong className="font-semibold text-gray-700">{formatMoney(portfolioValueDisplay, currency)}</strong>
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setWithdrawModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-xs font-bold text-gray-500 bg-white"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={currentUser?.bankAccounts.length === 0}
                    className="px-5 py-2 rounded-lg text-xs font-bold bg-[#0F6E56] text-white hover:bg-[#0b5441]"
                  >
                    Request Extraction
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// 4. INVEST FLOW VIEW
// ==========================================
export function InvestView() {
  const { plans, initiateInvestment, currentUser, formatMoney } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: choose plan, 2: set amount, 3: simulated paystack checkout, 4: confirmation
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [amount, setAmount] = useState('');
  const [investCurrency, setInvestCurrency] = useState<'NGN' | 'USD'>('NGN');
  
  // Paystack credit card simulation
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [payError, setPayError] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [createdInvId, setCreatedInvId] = useState('');

  // Handle plan prepopulation from state (if redirecting from clicking card on home)
  useEffect(() => {
    // Standard react router router location handling
    const planFromState = (window.history.state as any)?.usr?.selectedPlanId;
    if (planFromState) {
      setSelectedPlanId(planFromState);
      setStep(2);
    }
  }, []);

  const activePlan = plans.find(p => p.planId === selectedPlanId);

  const handleChoosePlan = (planId: string) => {
    setSelectedPlanId(planId);
    setStep(2);
  };

  const handleSetAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setPayError('Define a valid investment principal.');
      return;
    }

    const numAmt = Number(amount);
    if (activePlan) {
      // Validate minimum threshold based on selected currency
      const minLimit = investCurrency === 'NGN' ? activePlan.minAmount : activePlan.minAmount / 1600;
      if (numAmt < minLimit) {
        setPayError(`Minimum threshold capital required for this plan is ${investCurrency === 'NGN' ? '₦' : '$'}${minLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
        return;
      }
    }

    setStep(3); // Route to Paystack Simulated Popup
  };

  const handleSimulatedPayment = async (status: 'success' | 'failed') => {
    if (status === 'failed') {
      setPayError('Simulated Paystack authorization declined. Card check failure.');
      return;
    }
    
    setPayLoading(true);
    setPayError('');

    try {
      const paystackRef = 'PSTK-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const numAmt = Number(amount);
      
      // 1. Submit investment as pending to Firestore
      const invId = await initiateInvestment(selectedPlanId, numAmt, investCurrency, paystackRef);
      setCreatedInvId(invId);

      // 2. Trigger Express full-stack API route /api/paystack/webhook to verify payment reference
      // Simulates system-to-system webhook operation
      const response = await fetch('/api/paystack/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: paystackRef,
          status: 'success',
          amount: numAmt,
          currency: investCurrency,
          userId: currentUser?.userId
        })
      });

      if (!response.ok) {
        throw new Error('Error processed during database webhook alignment.');
      }

      // 3. Webhook simulation success: Update pending investment to status: 'active'
      const { db } = await import('../lib/firebaseMock');
      await db.doc('investments', invId).update({ status: 'active' });
      
      // Log Success Activity
      logAction(
        currentUser?.userId || 'system',
        'user',
        `Paystack Webhook validated and activated investment: ${paystackRef}`,
        invId,
        currentUser?.name || ''
      );

      setStep(4); // Move to final receipt screen
    } catch (err: any) {
      setPayError(err.message || 'Payment processor failed to update status');
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-6 p-6 glass-card shadow-xl text-gray-850">
      
      {/* Visual step breadcrumbs */}
      <div className="flex items-center justify-center gap-2 mb-8 select-none text-xs">
        <span className={`px-2.5 py-1 rounded-full font-bold ${step === 1 ? 'bg-[#0F6E56] text-white' : 'bg-gray-150 text-gray-500'}`}>1. Select Plan</span>
        <span className="text-gray-300">→</span>
        <span className={`px-2.5 py-1 rounded-full font-bold ${step === 2 ? 'bg-[#0F6E56] text-white' : 'bg-gray-150 text-gray-500'}`}>2. Details</span>
        <span className="text-gray-300">→</span>
        <span className={`px-2.5 py-1 rounded-full font-bold ${step === 3 ? 'bg-[#0F6E56] text-white' : 'bg-gray-150 text-gray-500'}`}>3. Checkout</span>
        <span className="text-gray-300">→</span>
        <span className={`px-2.5 py-1 rounded-full font-bold ${step === 4 ? 'bg-emerald-600 text-white animate-pulse' : 'bg-gray-150 text-gray-500'}`}>4. Receipt</span>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-display font-bold text-gray-900 tracking-tight">Select your investment plan</h2>
            <p className="text-sm text-gray-500 mt-1">Grow your multi-currency capitals safely with backed ROIs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.filter(p => p.status === 'active').map(p => (
              <div 
                key={p.planId} 
                onClick={() => handleChoosePlan(p.planId)} 
                className="bg-slate-50 border border-slate-200 hover:border-[#0F6E56] rounded-xl p-5 cursor-pointer hover:shadow-md transition-all text-center flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-display font-bold text-gray-900 leading-tight block">{p.name}</h3>
                  <div className="my-3 font-display font-black text-2xl text-[#0F6E56]">
                    {p.defaultROI}%
                  </div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Fixed rate ROI</span>
                </div>
                <div className="border-t border-slate-200 mt-4 pt-3 text-left space-y-1 text-[11px] text-gray-500 font-medium">
                  <p>Duration: <strong className="text-gray-800">{p.duration} Months</strong></p>
                  <p>Min principal: <strong className="text-gray-800">₦{p.minAmount.toLocaleString()}</strong></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && activePlan && (
        <div className="space-y-6">
          <button 
            type="button" 
            onClick={() => setStep(1)} 
            className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
          >
            ← Back to Plans list
          </button>
          
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-emerald-950 text-base">{activePlan.name}</h3>
              <p className="text-xs mt-0.5">{activePlan.duration} Months Program • {activePlan.defaultROI}% Compound ROI</p>
            </div>
            <span className="text-3xl font-display font-extrabold text-[#0F6E56]">{activePlan.defaultROI}%</span>
          </div>

          {payError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">{payError}</div>
          )}

          <form onSubmit={handleSetAmountSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Select Investment Currency</label>
                <select
                  value={investCurrency}
                  onChange={(e) => setInvestCurrency(e.target.value as 'NGN' | 'USD')}
                  className="w-full border rounded-lg p-3 bg-white text-sm font-semibold focus:outline-none focus:border-[#0F6E56]"
                >
                  <option value="NGN">NGN (Nigerian Naira - ₦)</option>
                  <option value="USD">USD (US Dollar - $)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Enter Capital Amount</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full border rounded-lg p-3 text-sm focus:outline-[#0F6E56] font-mono"
                />
              </div>
            </div>

            <div className="bg-slate-50 border p-4 rounded-lg space-y-1 text-xs">
              <div className="flex justify-between"><span>Minimum Required threshold:</span> <strong>{investCurrency === 'NGN' ? '₦' : '$'}{(investCurrency === 'NGN' ? activePlan.minAmount : activePlan.minAmount / 1600).toLocaleString()}</strong></div>
              <div className="flex justify-between"><span>Yield Returns percentage:</span> <strong className="text-[#0F6E56]">{activePlan.defaultROI}% Return</strong></div>
              <div className="flex justify-between border-t pt-1.5 mt-1 text-sm font-extrabold text-gray-800">
                <span>Estimated Returns yield:</span> 
                <span>
                  {investCurrency === 'NGN' ? '₦' : '$'}{(Number(amount || 0) + (Number(amount || 0) * activePlan.defaultROI / 100)).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#0F6E56] hover:bg-[#0b5441] text-white font-bold py-3 rounded-lg text-sm transition-transform cursor-pointer"
            >
              Continue to Paystack checkout screen
            </button>
          </form>
        </div>
      )}

      {step === 3 && activePlan && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-display font-medium text-gray-900">Checkout gateway: Paystack checkout</h3>
            <p className="text-xs text-gray-500 mt-1">We utilize Paystack secure servers for cards and deposits authorization.</p>
          </div>

          {payError && (
            <div className="p-3 bg-rose-550/10 border border-red-200 text-rose-800 rounded-lg text-xs font-semibold">{payError}</div>
          )}

          {/* Secure simulated card entry field */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden font-mono text-sm max-w-sm mx-auto select-none">
            <span className="text-xs font-bold tracking-widest text-[#0F6E56]">SECURE CHECKOUT TERMINAL</span>
            <div className="text-lg tracking-widest mt-6 font-bold">{cardNumber || "••••  ••••  ••••  ••••"}</div>
            <div className="flex justify-between items-center mt-6 text-xs text-slate-350">
              <div>
                <p className="text-[9px] text-gray-500 uppercase">Card Holder</p>
                <p className="font-sans font-semibold text-white">{currentUser?.name}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 uppercase">ExpiryDate</p>
                <p>{cardExpiry || "MM/YY"}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-w-sm mx-auto">
            <div className="grid grid-cols-1 gap-2.5">
              <input
                type="text"
                placeholder="Card Number"
                maxLength={19}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                className="border p-2 rounded text-xs select-none focus:outline-[#0F6E56] placeholder-gray-300 font-mono"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Expiry MM/YY"
                  maxLength={5}
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="border p-2 rounded text-xs focus:outline-[#0F6E56] placeholder-gray-300 font-mono"
                />
                <input
                  type="password"
                  placeholder="CVV"
                  maxLength={3}
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                  className="border p-2 rounded text-xs focus:outline-[#0F6E56] placeholder-gray-300 font-mono"
                />
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-2">
              <button
                onClick={() => handleSimulatedPayment('success')}
                disabled={payLoading}
                className="bg-[#0F6E56] hover:bg-[#0b5441] text-white font-bold p-3 rounded text-xs transition-colors cursor-pointer"
              >
                {payLoading ? "Validating Paystack Reference..." : `Charge Now (${investCurrency === 'NGN' ? '₦' : '$'}${Number(amount).toLocaleString()})`}
              </button>
              
              <button
                onClick={() => handleSimulatedPayment('failed')}
                disabled={payLoading}
                className="bg-gray-150 hover:bg-gray-200 text-gray-700 font-bold p-2.5 rounded text-xs transition-colors cursor-pointer"
              >
                Simulate Declined Card Check
              </button>

              <button
                onClick={() => setStep(2)}
                className="text-xs text-gray-500 hover:underline text-center"
              >
                Go back to details
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && activePlan && (
        <div className="space-y-6 text-center py-6">
          <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-full w-14 h-14 flex items-center justify-center mx-auto shadow border border-emerald-150">
            <CheckCircle size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900 tracking-tight">Investment Created Successfully!</h2>
            <p className="text-xs text-gray-500 mt-1">Paystack references and webhooks have successfully activated your savings program.</p>
          </div>

          {/* Simulated receipt template */}
          <div className="border border-gray-100 rounded-xl p-5 bg-slate-50 text-left text-xs space-y-2 max-w-sm mx-auto font-sans leading-relaxed">
            <div className="text-center font-bold text-slate-400 uppercase tracking-widest mb-3">OFFICIAL RECEIPT</div>
            <div className="flex justify-between"><span>Investor name:</span> <strong className="text-gray-800">{currentUser?.name}</strong></div>
            <div className="flex justify-between"><span>Yield Package:</span> <strong className="text-gray-800">{activePlan.name}</strong></div>
            <div className="flex justify-between"><span>Capital Capitalized:</span> <strong className="text-[#0F6E56] font-bold">{investCurrency === 'NGN' ? '₦' : '$'}{Number(amount).toLocaleString()}</strong></div>
            <div className="flex justify-between"><span>Duration time:</span> <strong className="text-gray-800">{activePlan.duration} Months</strong></div>
            <div className="flex justify-between"><span>Guaranteed Returns:</span> <strong className="text-gray-850 font-semibold">{activePlan.defaultROI}% Rates</strong></div>
            <div className="flex justify-between border-t pt-2 mt-2 font-mono text-[9px] text-[#0F6E56]">
              <span>Paystack Reference:</span> <span>{createdInvId}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={() => navigate('/portfolio')}
              className="bg-[#0F6E56] hover:bg-[#0b5441] text-white font-bold px-6 py-2 rounded-lg text-xs"
            >
              My Portfolio view
            </button>
            <button
              onClick={() => navigate('/home')}
              className="px-6 py-2 border rounded-lg text-xs hover:bg-slate-50"
            >
              Investor dashboard
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// 5. PORTFOLIO VIEW
// ==========================================
export function PortfolioView() {
  const { investments, formatMoney, currency, currentUser, plans } = useApp();
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'matured' | 'paid out'>('all');

  const userInvestments = investments.filter(i => i.userId === currentUser?.userId);
  const activeInvestments = userInvestments.filter(i => i.status === 'active');
  
  // Calculate historical growth details for Charting (Accumulated Capital + Return by Month)
  const growthByMonth = [
    { name: 'Month 1', Capital: 0 },
    { name: 'Month 2', Capital: 0 },
    { name: 'Month 3', Capital: 0 },
    { name: 'Month 4', Capital: 0 },
    { name: 'Month 5', Capital: 0 },
    { name: 'Month 6', Capital: 0 },
  ];

  // Map investment data points onto growth chart
  userInvestments.forEach((inv) => {
    const value = inv.currency === currency ? inv.amount : inv.amount;
    const estimatedReturnsValue = value + (value * inv.roi / 100);
    if (inv.status === 'active') {
      growthByMonth[1].Capital += value;
      growthByMonth[3].Capital += value * 1.1;
      growthByMonth[5].Capital += estimatedReturnsValue;
    } else if (inv.status === 'matured' || inv.status === 'paid out') {
      growthByMonth[0].Capital += value;
      growthByMonth[2].Capital += estimatedReturnsValue;
      growthByMonth[4].Capital += estimatedReturnsValue;
    }
  });

  // Base data seed if completely empty
  const isPortfolioEmpty = userInvestments.length === 0;
  const chartData = isPortfolioEmpty ? [
    { name: 'Jan', Capital: 10000 },
    { name: 'Feb', Capital: 25000 },
    { name: 'Mar', Capital: 25000 },
    { name: 'Apr', Capital: 45000 },
    { name: 'May', Capital: 45000 },
    { name: 'Jun', Capital: 75000 },
  ] : growthByMonth;

  // Filter list of investments to display
  const dispInvestments = userInvestments.filter(inv => {
    if (filterStatus === 'all') return true;
    return inv.status === filterStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">Portfolio Analysis</h1>
        <p className="text-xs text-gray-500 mt-1">Inspect your assets accumulation models, active periods, and log schedules.</p>
      </div>

      {/* chart board */}
      <div className="glass-card text-gray-800 p-6 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <span className="font-display font-semibold text-gray-950 text-sm">Target Compound Growth Timeline</span>
          <span className="text-[10px] uppercase font-bold text-[#0F6E56] bg-emerald-50 px-2 py-1 rounded">Asset Projection</span>
        </div>
        <div className="h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <ChartTooltip 
                contentStyle={{ background: '#0F6E56', color: '#fff', borderRadius: '8px', fontSize: '11px', border: 'none' }}
                cursor={{ fill: 'rgba(230,241,238,0.3)' }}
              />
              <Bar dataKey="Capital" fill="#0F6E56" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* historical list of investments */}
      <div className="bg-white border rounded-2xl p-6 shadow-xs text-gray-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="font-display font-semibold text-gray-950 text-sm">Portfolio Log history</h3>
          
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'matured', 'paid out'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all select-none cursor-pointer ${
                  filterStatus === status 
                    ? 'bg-[#0F6E56] text-white' 
                    : 'bg-slate-50 border text-gray-500 hover:text-gray-900 shadow-sm'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {dispInvestments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No investments found matching filter.
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-xl divide-y divide-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fcfcfc] text-slate-500 uppercase font-bold tracking-wider py-3 border-b text-[10px]">
                <tr>
                  <th className="p-3">Plan Package</th>
                  <th className="p-3">Capital Principal</th>
                  <th className="p-3">Yield ROI</th>
                  <th className="p-3">Target Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium text-gray-700">
                {dispInvestments.map(inv => (
                  <tr key={inv.investmentId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-semibold text-gray-950">
                      {inv.planName}
                      <span className="block text-[9px] text-gray-400 font-mono mt-0.5">{inv.investmentId}</span>
                    </td>
                    <td className="p-3 font-mono">{inv.currency === 'NGN' ? '₦' : '$'}{inv.amount.toLocaleString()}</td>
                    <td className="p-3 font-semibold text-[#0F6E56]">{inv.roi}% Return</td>
                    <td className="p-3">{new Date(inv.endDate).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        inv.status === 'active' 
                          ? 'bg-emerald-50 text-[#0F6E56] border border-emerald-250' 
                          : inv.status === 'matured' 
                          ? 'bg-blue-50 text-blue-800' 
                          : inv.status === 'paid out' 
                          ? 'bg-gray-100 text-gray-600' 
                          : 'bg-amber-50 text-amber-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

// ==========================================
// 6. REFERRAL VIEW
// ==========================================
export function ReferralView() {
  const { currentUser, referrals, formatMoney, currency } = useApp();

  const userReferrals = referrals.filter(r => r.referrerId === currentUser?.userId);
  
  // Stats
  const earnedBonus = userReferrals
    .filter(r => r.status === 'earned')
    .reduce((sum, r) => sum + r.bonus, 0);

  const pendingBonus = userReferrals
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.bonus, 0);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">Referral Clearing Desk</h1>
        <p className="text-xs text-gray-500 mt-1">Compound yields with our affiliate programs. Grow together.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 shadow-xs">
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Total Referrals</span>
          <h3 className="text-3xl font-display font-extrabold text-[#0F6E56] mt-2">{userReferrals.length}</h3>
          <p className="text-[10px] text-gray-500 mt-1">Successfully registered accounts</p>
        </div>

        <div className="glass-card p-5 shadow-xs">
          <span className="text-xs text-slate-500 font-bold uppercase block tracking-wider">Earned Bonuses</span>
          <h3 className="text-3xl font-display font-extrabold text-gray-900 mt-2">
            {formatMoney(earnedBonus, 'NGN')}
          </h3>
          <p className="text-[10px] text-gray-500 mt-1">Credited to matured wallet</p>
        </div>

        <div className="glass-card p-5 shadow-xs">
          <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Pending Release</span>
          <h3 className="text-3xl font-display font-extrabold mt-2 text-amber-800">
            {formatMoney(pendingBonus, 'NGN')}
          </h3>
          <p className="text-[10px] text-gray-500 mt-1">Referred users waiting funding confirmation</p>
        </div>
      </div>

      {/* sharing parameters */}
      <div className="bg-white border rounded-2xl p-6 shadow-xs text-gray-800">
        <h3 className="font-display font-semibold text-[#0F6E56] text-sm mb-4">Affiliate Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl leading-relaxed">
              <h4 className="font-bold text-emerald-950 text-xs">VestGrow Joint Alliance rules:</h4>
              <p className="text-[11px] text-gray-600 mt-1.5">
                Share your affiliate codes below. When a friend signs up and funds an account with a minimum of ₦10,000, 
                you instantly earn a fixed bonus of <strong className="text-[#0F6E56]">₦5,000 / $5</strong>. There are no caps on total connections!
              </p>
            </div>

            <div className="p-4 border rounded-xl space-y-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">My Personal unique Referral Code</span>
              <div className="flex gap-2 items-center mt-2">
                <input 
                  type="text" 
                  readOnly 
                  value={currentUser?.referralCode}
                  className="bg-slate-50 border p-2.5 rounded-lg font-mono font-bold tracking-wider text-sm flex-1 text-center text-gray-900"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentUser?.referralCode || '');
                    alert('Referral Code copied!');
                  }}
                  className="bg-[#0F6E56] hover:bg-[#0b5441] text-white p-2.5 rounded-lg cursor-pointer"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-gray-900 text-xs mb-3">Referred Friends List ({userReferrals.length})</h4>
            {userReferrals.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs">
                You have not referred any friends to VestGrow yet.
              </div>
            ) : (
              <div className="border rounded-xl divide-y overflow-hidden text-xs max-h-56 overflow-y-auto">
                {userReferrals.map((ref) => (
                  <div key={ref.referralId} className="p-3 flex justify-between items-center bg-[#fcfcfc] font-medium text-gray-700">
                    <div>
                      <strong className="text-gray-950 font-semibold">{ref.referredUserName || 'New Investor'}</strong>
                      <span className="block text-[10px] text-gray-400">{new Date(ref.date).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right">
                      <strong className="text-gray-905">{formatMoney(ref.bonus, 'NGN')}</strong>
                      <span className={`block text-[9px] font-bold uppercase mt-0.5 ${ref.status === 'earned' ? 'text-emerald-700' : 'text-amber-805'}`}>
                        {ref.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

// ==========================================
// 7. NOTIFICATIONS FEED VIEW
// ==========================================
export function NotificationsView() {
  const { notifications, currentUser, markNotificationRead } = useApp();

  const userNotifications = notifications.filter(n => n.userId === currentUser?.userId);

  const handleMarkAllRead = async () => {
    const unread = userNotifications.filter(n => !n.read);
    for (const notif of unread) {
      await markNotificationRead(notif.notificationId);
    }
    alert('All notifications cleared!');
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">Inbox Notifications</h1>
          <p className="text-xs text-gray-500 mt-1">Audit messages, updates, and maturity receipts alerts.</p>
        </div>
        
        {userNotifications.filter(n => !n.read).length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-[#0F6E56] font-bold hover:underline cursor-pointer"
          >
            Mark all clear
          </button>
        )}
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-xs text-gray-800 divide-y">
        {userNotifications.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No notification dispatch logs recorded inside account desk.
          </div>
        ) : (
          userNotifications.map(notif => (
            <div 
              key={notif.notificationId} 
              onClick={() => !notif.read && markNotificationRead(notif.notificationId)}
              className={`py-4 flex gap-4 cursor-pointer first:pt-0 last:pb-0 ${!notif.read ? 'bg-slate-50/50 px-3 -mx-3 rounded-lg relative font-medium' : ''}`}
            >
              {!notif.read && <span className="absolute left-1.5 top-5 w-2 h-2 bg-[#0F6E56] rounded-full" />}
              <div className="bg-emerald-550/10 text-[#0F6E56] h-10 w-10 flex items-center justify-center rounded-full shrink-0">
                <Bell size={18} />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-xs text-gray-950 pr-4">{notif.title}</h4>
                  <span className="font-mono text-[9px] text-gray-400 shrink-0 mt-0.5">{new Date(notif.sentAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{notif.message}</p>
                <div className="text-[9px] text-slate-400 font-mono flex gap-2">
                  <span>Dispatch channel: {notif.channel}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

// ==========================================
// 8. SETTINGS VIEW
// ==========================================
export function SettingsView() {
  const { currentUser, db, addBankAccount, investments, formatMoney } = useApp();

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [loading, setLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Bank Add State
  const [bankName, setBankName] = useState('Access Bank');
  const [acctNum, setAcctNum] = useState('');
  const [acctName, setAcctName] = useState(currentUser?.name || '');
  const [bankSuccess, setBankSuccess] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProfileSuccess(false);

    try {
      await auth.updateProfile({ name, email, phone });
      setProfileSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBankAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (acctNum.length !== 10) {
      alert('Nigerian Nuban accountNumber must be exactly 10-digits.');
      return;
    }
    setBankSuccess(false);
    try {
      await addBankAccount(bankName, acctNum, acctName);
      setBankSuccess(true);
      setAcctNum('');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleNotificationToggle = async (type: 'email' | 'sms') => {
    if (!currentUser) return;
    const currentVal = currentUser.notificationPrefs[type];
    const updatedPrefs = { ...currentUser.notificationPrefs, [type]: !currentVal };
    
    // Save to Firestore
    await db.doc('users', currentUser.userId).update({ notificationPrefs: updatedPrefs });
    logAction(currentUser.userId, currentUser.role, `Configured notification preferences: ${type} = ${!currentVal}`, currentUser.userId, currentUser.name);
  };

  // Statement PDF builder with jsPDF
  const handleDownloadStatement = () => {
    const doc = new jsPDF();
    const userInv = investments.filter(i => i.userId === currentUser?.userId);

    // Styling
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 110, 86); // #0F6E56 Brand Color
    doc.text('VestGrow Investments', 14, 20);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Official Account Summary and Asset Valuation Statement', 14, 26);
    doc.text(`Generated At: ${new Date().toLocaleString()}`, 14, 30);
    doc.line(14, 34, 196, 34);

    // Investor Info
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text('Client Identification:', 14, 43);
    doc.text('Summary Metrics:', 120, 43);

    doc.setFont('Helvetica', 'normal');
    doc.text(`Legal Name: ${currentUser?.name}`, 14, 49);
    doc.text(`Email Address: ${currentUser?.email}`, 14, 54);
    doc.text(`Mobile Phone: ${currentUser?.phone}`, 14, 59);
    doc.text(`Account status: ${currentUser?.status.toUpperCase()}`, 14, 64);

    const totalActiveAmount = userInv.filter(i => i.status === 'active').reduce((sum, i) => sum + i.amount, 0);
    const totalYieldAmount = userInv.filter(i => i.status === 'matured').reduce((sum, i) => sum + i.amount, 0);

    doc.text(`Active Portfolio: NGN ${totalActiveAmount.toLocaleString()}`, 120, 49);
    doc.text(`Matured Capitals: NGN ${totalYieldAmount.toLocaleString()}`, 120, 54);
    doc.text(`Total Holdings: NGN ${(totalActiveAmount + totalYieldAmount).toLocaleString()}`, 120, 59);

    doc.line(14, 72, 196, 72);

    // Logs Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Compounded Assets Ledger', 14, 82);

    // Set Table headers
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('Investment ID', 14, 91);
    doc.text('Package', 48, 91);
    doc.text('Principal', 105, 91);
    doc.text('Returns %', 135, 91);
    doc.text('Target/Maturity', 158, 91);
    doc.line(14, 94, 196, 94);

    // Records
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(30,30,30);
    let y = 101;
    
    if (userInv.length === 0) {
      doc.text('No active record files found inside investor profile portfolio desk.', 14, y);
    } else {
      userInv.forEach((inv) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(inv.investmentId, 14, y);
        doc.text(inv.planName.substring(0, 18), 48, y);
        doc.text(`${inv.currency} ${inv.amount.toLocaleString()}`, 105, y);
        doc.text(`${inv.roi}%`, 135, y);
        doc.text(new Date(inv.endDate).toLocaleDateString(), 158, y);
        y += 8;
      });
    }

    // Save
    doc.save(`VestGrow_Statement_${currentUser?.name.replace(/\s+/g, '_')}.pdf`);
    alert('Investment statement downloaded successfully!');
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">Profile & Operations settings</h1>
        <p className="text-xs text-gray-500 mt-1">Configure security credentials, bank wire coordinates, and dispatch configurations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-850">
        
        {/* Personal Details */}
        <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-display font-semibold text-gray-950 text-sm flex items-center gap-1.5"><User size={18} className="text-[#0F6E56]" /> Personal Credentials</h3>
          
          {profileSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded text-xs font-semibold">✓ Profile successfully updated.</div>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-4 text-xs font-medium text-gray-600">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Legal Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs font-semibold text-gray-800 bg-white border rounded-lg p-2.5 focus:outline-[#0F6E56]"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs font-semibold text-[#0F6E56] bg-slate-50 border rounded-lg p-2.5 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Mobile Phone</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs font-semibold text-gray-800 bg-white border rounded-lg p-2.5 focus:outline-[#0F6E56]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#0F6E56] hover:bg-[#0b5441] text-white px-5 py-2 rounded-lg text-xs font-bold cursor-pointer"
            >
              {loading ? "Saving changes..." : "Save Profile details"}
            </button>
          </form>
        </div>

        {/* Bank Wire settlement Accounts */}
        <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-display font-semibold text-gray-950 text-sm flex items-center gap-1.5"><CreditCard size={18} className="text-[#0F6E56]" /> Settlement Bank Coordinates</h3>
          
          {bankSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded text-xs font-semibold">✓ Settlement account loaded!</div>
          )}

          <form onSubmit={handleBankAdd} className="space-y-4 text-xs font-medium text-gray-600">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Select Bank</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full text-xs border rounded-lg p-2.5 bg-white text-gray-700"
                >
                  <option value="Access Bank">Access Bank</option>
                  <option value="Zenith Bank">Zenith Bank</option>
                  <option value="Guaranty Trust Bank">Guaranty Trust Bank (GTB)</option>
                  <option value="United Bank for Africa">UBA</option>
                  <option value="First Bank">First Bank</option>
                  <option value="Sterling Bank">Sterling Bank</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Account Number (NUBAN)</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={acctNum}
                  onChange={(e) => setAcctNum(e.target.value.replace(/\D/g, ''))}
                  placeholder="10 digit Nuban"
                  className="w-full border rounded-lg p-2.5 text-xs text-gray-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Account Holder Name</label>
              <input
                type="text"
                required
                value={acctName}
                onChange={(e) => setAcctName(e.target.value)}
                className="w-full border rounded-lg p-2.5 text-xs text-gray-800"
              />
            </div>

            <button
              type="submit"
              className="bg-[#0F6E56] hover:bg-[#0b5441] text-white px-5 py-2 rounded-lg text-xs font-bold cursor-pointer"
            >
              Attach Settlement Account
            </button>
          </form>

          {/* Connected wire coordinate links */}
          <div className="border-t pt-4">
            <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Connected settlement lines:</h4>
            {currentUser?.bankAccounts.length === 0 ? (
              <p className="text-[11px] text-gray-400">No bank coordinates registered inside the portfolio profile desk.</p>
            ) : (
              <div className="space-y-1.5">
                {currentUser?.bankAccounts.map(b => (
                  <div key={b.id} className="bg-slate-50 border rounded-lg p-2 text-xs flex justify-between items-center bg-[#fcfcfc] border-slate-100 font-medium">
                    <div>
                      <strong className="text-gray-905">{b.bankName}</strong> • <span className="font-mono">{b.accountNumber}</span>
                      <p className="text-[9px] text-gray-400">Holder: {b.accountName}</p>
                    </div>
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded uppercase font-semibold">Active settlement</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alert Dispatch preferences / Statements */}
        <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-5">
          <h3 className="font-display font-semibold text-gray-950 text-sm flex items-center gap-1.5"><Bell size={18} className="text-[#0F6E56]" /> Dispatch Alerts Controls</h3>
          
          <div className="space-y-3.5 text-xs font-medium">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <strong className="text-gray-905 font-semibold text-xs">Email Yield Confirmations</strong>
                <p className="text-[11px] text-gray-500 mt-0.5">Dispatches statements, ROIs schedules, and maturity logs directly via SendGrid.</p>
              </div>
              <button
                onClick={() => handleNotificationToggle('email')}
                className={`w-12 h-6 rounded-full p-1 transition-all ${currentUser?.notificationPrefs.email ? 'bg-[#0F6E56]' : 'bg-gray-200'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full transition-transform ${currentUser?.notificationPrefs.email ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <strong className="text-gray-905 font-semibold text-xs">SMS Dispatches</strong>
                <p className="text-[11px] text-gray-500 mt-0.5">SMS updates on fund release logs, transactions confirmation alerts via Termii gateway.</p>
              </div>
              <button
                onClick={() => handleNotificationToggle('sms')}
                className={`w-12 h-6 rounded-full p-1 transition-all ${currentUser?.notificationPrefs.sms ? 'bg-[#0F6E56]' : 'bg-gray-200'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full transition-transform ${currentUser?.notificationPrefs.sms ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-display font-semibold text-gray-950 text-sm flex items-center gap-1.5"><Download size={18} className="text-[#0F6E56]" /> Download Account Reports</h3>
          <p className="text-xs text-gray-500 font-medium">Extract high-fidelity ledger statements representing active portfolio assets valuations, transactions references, and ROIs schedule logs.</p>
          
          <button
            onClick={handleDownloadStatement}
            className="w-full bg-[#0F6E56] hover:bg-[#0b5441] text-white py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer mt-4"
          >
            <Download size={16} /> Compile and Download Statement (PDF)
          </button>
        </div>

      </div>
    </div>
  );
}
