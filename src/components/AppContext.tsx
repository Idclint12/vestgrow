import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Investment, InvestmentPlan, WithdrawalRequest, Referral, SystemNotification, ActivityLog } from '../types';
import { auth, db, logAction, sendSystemNotification, checkAndMatureInvestments, fastForwardTime } from '../lib/firebaseMock';

interface AppContextType {
  currentUser: UserProfile | null;
  currency: 'NGN' | 'USD';
  toggleCurrency: () => void;
  formatMoney: (amount: number, inputCurrency?: 'NGN' | 'USD') => string;
  usdToNgnRate: number; // 1 USD = 1500 NGN standard rate
  convertAmount: (amount: number, from: 'NGN' | 'USD', to: 'NGN' | 'USD') => number;
  
  // Real-time Firestore Collections
  usersList: UserProfile[];
  investments: Investment[];
  plans: InvestmentPlan[];
  withdrawals: WithdrawalRequest[];
  referrals: Referral[];
  notifications: SystemNotification[];
  activityLogs: ActivityLog[];
  
  // Database Operations
  initiateInvestment: (planId: string, amount: number, selectedCurrency: 'NGN' | 'USD', paystackRef: string) => Promise<string>;
  submitKycDocuments: (nin: string, selfieData: string, addressData: string) => Promise<void>;
  requestWithdrawal: (amount: number, currency: 'NGN' | 'USD', bankName: string, acctNum: string, acctName: string) => Promise<void>;
  markNotificationRead: (notifId: string) => Promise<void>;
  addBankAccount: (bankName: string, acctNum: string, acctName: string) => Promise<void>;
  
  // Admin Operations
  approveKYC: (userId: string) => Promise<void>;
  rejectKYC: (userId: string, reason: string) => Promise<void>;
  releaseWithdrawal: (withdrawalId: string) => Promise<void>;
  holdWithdrawal: (withdrawalId: string) => Promise<void>;
  approveInvestment: (investmentId: string) => Promise<void>;
  rejectInvestment: (investmentId: string) => Promise<void>;
  payoutInvestment: (investmentId: string) => Promise<void>;
  createPlan: (plan: Omit<InvestmentPlan, 'planId'>) => Promise<void>;
  updatePlan: (planId: string, updates: Partial<InvestmentPlan>) => Promise<void>;
  setCustomROI: (investmentId: string, roi: number) => Promise<void>;
  setGlobalROI: (planId: string, roi: number) => Promise<void>;
  composeNotification: (recipients: 'all' | 'specific' | 'active' | 'matured', channel: 'email+SMS' | 'email' | 'SMS', subject: string, message: string, specificUserId?: string) => Promise<void>;
  suspendUser: (userId: string) => Promise<void>;
  activateUser: (userId: string) => Promise<void>;
  
  // Utilities
  fastForward: (days: number) => void;
  triggerMaturityCheck: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const usdToNgnRate = 1600; // Standard Naira/Dollar peg for conversions

  // Collection States
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // 1. Listen for Auth State Changes
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsubAuth;
  }, []);

  // 2. Synchronize real-time listeners for database collections only when logged in and based on role
  useEffect(() => {
    // Plans list is marketing / public configuration - anyone can read
    const unsubPlans = db.onSnapshot('plans', (data) => setPlans(data));

    if (!currentUser) {
      setUsersList([]);
      setInvestments([]);
      setWithdrawals([]);
      setReferrals([]);
      setNotifications([]);
      setActivityLogs([]);
      return () => {
        unsubPlans();
      };
    }

    let unsubUsers = () => {};
    let unsubInvestments = () => {};
    let unsubWithdrawals = () => {};
    let unsubReferrals = () => {};
    let unsubNotifications = () => {};
    let unsubActivity = () => {};

    if (currentUser.role === 'admin') {
      unsubUsers = db.onSnapshot('users', (data) => setUsersList(data));
      unsubInvestments = db.onSnapshot('investments', (data) => setInvestments(data));
      unsubWithdrawals = db.onSnapshot('withdrawals', (data) => setWithdrawals(data));
      unsubReferrals = db.onSnapshot('referrals', (data) => setReferrals(data));
      unsubNotifications = db.onSnapshot('notifications', (data) => setNotifications(data));
      unsubActivity = db.onSnapshot('activityLog', (data) => setActivityLogs(data));
    } else {
      // Secure Role-restricted subscriptions - only query matching owner ID fields
      unsubInvestments = db.onSnapshot('investments', (data) => setInvestments(data), undefined, 'userId', currentUser.userId);
      unsubWithdrawals = db.onSnapshot('withdrawals', (data) => setWithdrawals(data), undefined, 'userId', currentUser.userId);
      unsubReferrals = db.onSnapshot('referrals', (data) => setReferrals(data), undefined, 'referrerId', currentUser.userId);
      unsubNotifications = db.onSnapshot('notifications', (data) => setNotifications(data), undefined, 'userId', currentUser.userId);
    }

    return () => {
      unsubPlans();
      unsubUsers();
      unsubInvestments();
      unsubWithdrawals();
      unsubReferrals();
      unsubNotifications();
      unsubActivity();
    };
  }, [currentUser?.userId, currentUser?.role]);

  // Check maturities dynamically on initial startup and user changes
  useEffect(() => {
    checkAndMatureInvestments();
    const matInterval = setInterval(() => {
      checkAndMatureInvestments();
    }, 15000); // Check every 15 seconds in background
    return () => clearInterval(matInterval);
  }, []);

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === 'NGN' ? 'USD' : 'NGN'));
  };

  const convertAmount = (amount: number, from: 'NGN' | 'USD', to: 'NGN' | 'USD'): number => {
    if (from === to) return amount;
    if (from === 'USD' && to === 'NGN') {
      return amount * usdToNgnRate;
    }
    // NGN to USD
    return amount / usdToNgnRate;
  };

  const formatMoney = (amount: number, inputCurrency?: 'NGN' | 'USD') => {
    const targetCurrency = currency; // Global toggle layout state
    const sourceCurrency = inputCurrency || targetCurrency;
    
    // Convert to whatever the display currency is
    const converted = convertAmount(amount, sourceCurrency, targetCurrency);
    
    if (targetCurrency === 'NGN') {
      return '₦' + converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    } else {
      return '$' + converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }
  };

  // ---------------- USER PORTAL ACTIONS ----------------

  const initiateInvestment = async (planId: string, amount: number, selectedCurrency: 'NGN' | 'USD', paystackRef: string): Promise<string> => {
    if (!currentUser) throw new Error('You must be logged in to invest');
    const selectedPlan = plans.find(p => p.planId === planId);
    if (!selectedPlan) throw new Error('Selected investment plan not found');

    const investmentId = 'inv_' + Math.random().toString(36).substring(2, 9);
    
    // Duration in months -> convert to milliseconds
    const durationMonths = selectedPlan.duration;
    // For demo purposes: 1 month is mapped to 5 minutes so users can see live timers easily!
    // But wait, we can calculate standard dates for real timelines and also offer real-time seconds.
    // Let's create a robust standard date formula:
    const startDateNow = new Date();
    const endDateDue = new Date();
    // Simulate real months or compressed for interactive validation:
    // We will use real months, but since we have a "Fast-forward" button in settings, this is PERFECT!
    // It keeps it architecturally integer and beautiful.
    endDateDue.setMonth(startDateNow.getMonth() + durationMonths);

    const newInvestment: Investment = {
      investmentId,
      userId: currentUser.userId,
      userName: currentUser.name,
      planId,
      planName: selectedPlan.name,
      amount,
      currency: selectedCurrency,
      roi: selectedPlan.defaultROI,
      startDate: startDateNow.toISOString(),
      endDate: endDateDue.toISOString(),
      status: 'pending', // Pending approval status until Paystack hooks activates it
      paystackRef
    };

    // Store to DB
    const currentList = [...investments];
    currentList.unshift(newInvestment);
    db.collection('investments').addDoc(newInvestment);

    logAction(
      currentUser.userId,
      currentUser.role,
      `Initiated investment of ${selectedCurrency === 'NGN' ? '₦' : '$'}${amount.toLocaleString()} in ${selectedPlan.name}`,
      investmentId,
      currentUser.name
    );

    return investmentId;
  };

  const submitKycDocuments = async (nin: string, selfieData: string, addressData: string) => {
    if (!currentUser) throw new Error('Session required');
    
    const users = [...usersList];
    const userIdx = users.findIndex(u => u.userId === currentUser.userId);
    if (userIdx === -1) return;

    users[userIdx].status = 'kyc_pending';
    users[userIdx].kycDocNIN = nin;
    users[userIdx].kycDocSelfie = selfieData;
    users[userIdx].kycDocAddress = addressData;

    setUsersList(users);
    db.doc('users', currentUser.userId).update({
      status: 'kyc_pending',
      kycDocNIN: nin,
      kycDocSelfie: selfieData,
      kycDocAddress: addressData,
      kycRejectionReason: ''
    });

    logAction(
      currentUser.userId,
      currentUser.role,
      'Submitted KYC Verification Documents',
      currentUser.userId,
      currentUser.name
    );
  };

  const requestWithdrawal = async (amount: number, selectedCurrency: 'NGN' | 'USD', bankName: string, acctNum: string, acctName: string) => {
    if (!currentUser) throw new Error('Authentication required');
    
    const withdrawalId = 'wd_' + Math.random().toString(36).substring(2, 9);
    const newRequest: WithdrawalRequest = {
      withdrawalId,
      userId: currentUser.userId,
      userName: currentUser.name,
      amount,
      currency: selectedCurrency,
      bankDetails: {
        bankName,
        accountNumber: acctNum,
        accountName: acctName
      },
      status: 'pending',
      requestDate: new Date().toISOString()
    };

    db.collection('withdrawals').addDoc(newRequest);
    logAction(
      currentUser.userId,
      currentUser.role,
      `Requested withdrawal of ${selectedCurrency === 'NGN' ? '₦' : '$'}${amount.toLocaleString()}`,
      withdrawalId,
      currentUser.name
    );

    // Send visual notification
    sendSystemNotification(
      currentUser.userId,
      'Withdrawal Initiated',
      `Your withdrawal request of ${selectedCurrency === 'NGN' ? '₦' : '$'}${amount.toLocaleString()} has been placed. Admin review is pending.`,
      'email'
    );
  };

  const markNotificationRead = async (notifId: string) => {
    if (!currentUser) return;
    db.doc('notifications', notifId).update({ read: true });
  };

  const addBankAccount = async (bankName: string, acctNum: string, acctName: string) => {
    if (!currentUser) return;
    const key = 'b_' + Math.random().toString(36).substring(2, 5);
    const updatedAccounts = [...currentUser.bankAccounts, { id: key, bankName, accountNumber: acctNum, accountName: acctName }];
    
    db.doc('users', currentUser.userId).update({ bankAccounts: updatedAccounts });
    logAction(currentUser.userId, currentUser.role, `Added bank account: ${bankName}`, currentUser.userId, currentUser.name);
  };


  // ---------------- ADMINISTRATIVE PORTAL ACTIONS ----------------

  const approveKYC = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Unauthorized admin resource');
    
    db.doc('users', userId).update({ status: 'active' });
    
    // Log Activity
    logAction(currentUser.userId, 'admin', `Approved KYC documents for investor`, userId, currentUser.name);
    
    // Notify customer
    sendSystemNotification(
      userId,
      'KYC Approved!',
      'Congratulations! Your identity verification (KYC) is successful. Your account restrictions have been lifted.',
      'email+SMS'
    );
  };

  const rejectKYC = async (userId: string, reason: string) => {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Unauthorized');
    
    db.doc('users', userId).update({
      status: 'kyc_rejected',
      kycRejectionReason: reason
    });
    
    logAction(currentUser.userId, 'admin', `Rejected KYC documents: ${reason}`, userId, currentUser.name);
    
    sendSystemNotification(
      userId,
      'KYC Rejected',
      `Your KYC document verification was rejected. Reason: ${reason}. Please visit Settings to re-upload documents.`,
      'email'
    );
  };

  const releaseWithdrawal = async (withdrawalId: string) => {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Unauthorized');
    
    db.doc('withdrawals', withdrawalId).update({ status: 'released' });
    const wd = withdrawals.find(w => w.withdrawalId === withdrawalId);
    
    logAction(currentUser.userId, 'admin', `Approved and released fund withdrawal`, withdrawalId, currentUser.name);
    
    if (wd) {
      sendSystemNotification(
        wd.userId,
        'Withdrawal Approved & Released',
        `Your withdrawal of ${wd.currency === 'NGN' ? '₦' : '$'}${wd.amount.toLocaleString()} was processed. Funds are on the way to your bank account: ${wd.bankDetails.bankName}.`,
        'email+SMS'
      );
    }
  };

  const holdWithdrawal = async (withdrawalId: string) => {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Unauthorized');
    
    db.doc('withdrawals', withdrawalId).update({ status: 'held' });
    logAction(currentUser.userId, 'admin', `Placed withdrawal request on hold`, withdrawalId, currentUser.name);
    
    const wd = withdrawals.find(w => w.withdrawalId === withdrawalId);
    if (wd) {
      sendSystemNotification(
        wd.userId,
        'Withdrawal Request Placed on Hold',
        `Your withdrawal request of ${wd.currency === 'NGN' ? '₦' : '$'}${wd.amount.toLocaleString()} is currently on hold. Please contact audit department.`,
        'email'
      );
    }
  };

  const approveInvestment = async (investmentId: string) => {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Unauthorized');
    
    db.doc('investments', investmentId).update({ status: 'active' });
    
    const inv = investments.find(i => i.investmentId === investmentId);
    
    logAction(currentUser.userId, 'admin', `Approved and activated investment`, investmentId, currentUser.name);
    
    if (inv) {
      sendSystemNotification(
        inv.userId,
        'Investment Activated Successfully!',
        `Your investment of ${inv.currency === 'NGN' ? '₦' : '$'}${inv.amount.toLocaleString()} in the ${inv.planName} is now Active! Countdown to maturity has commenced.`,
        'email+SMS'
      );
    }
  };

  const rejectInvestment = async (investmentId: string) => {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Unauthorized');
    
    db.doc('investments', investmentId).update({ status: 'rejected' });
    
    const inv = investments.find(i => i.investmentId === investmentId);
    
    logAction(currentUser.userId, 'admin', `Rejected investment`, investmentId, currentUser.name);
    
    if (inv) {
      sendSystemNotification(
        inv.userId,
        'Investment Payment Declined',
        `The Paystack validation or reference for your ${inv.currency === 'NGN' ? '₦' : '$'}${inv.amount.toLocaleString()} investment was rejected by System Operations.`,
        'email'
      );
    }
  };

  const payoutInvestment = async (investmentId: string) => {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Unauthorized');
    
    db.doc('investments', investmentId).update({ status: 'paid out' });
    
    const inv = investments.find(i => i.investmentId === investmentId);
    
    logAction(currentUser.userId, 'admin', `Marked investment as paid out`, investmentId, currentUser.name);
    
    if (inv) {
      sendSystemNotification(
        inv.userId,
        'Investment Yield Paid Out!',
        `Your matured investment of ${inv.currency === 'NGN' ? '₦' : '$'}${inv.amount.toLocaleString()} + returns has been logged as fully paid out to your bank account.`,
        'email+SMS'
      );
    }
  };

  const createPlan = async (newPlan: Omit<InvestmentPlan, 'planId'>) => {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Unauthorized');
    
    const planId = 'pl_' + Math.random().toString(36).substring(2, 7);
    const finalPlan: InvestmentPlan = { ...newPlan, planId };
    
    db.collection('plans').addDoc(finalPlan);
    logAction(currentUser.userId, 'admin', `Registered new investment plan: ${newPlan.name}`, planId, currentUser.name);
  };

  const updatePlan = async (planId: string, updates: Partial<InvestmentPlan>) => {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Unauthorized');
    
    db.doc('plans', planId).update(updates);
    logAction(currentUser.userId, 'admin', `Updated details of investment plan`, planId, currentUser.name);
  };

  const setCustomROI = async (investmentId: string, roi: number) => {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Unauthorized');
    
    db.doc('investments', investmentId).update({
      roi,
      customRoiApplied: true
    });
    
    const inv = investments.find(i => i.investmentId === investmentId);
    logAction(currentUser.userId, 'admin', `Overrode and configured custom ROI of ${roi}%`, investmentId, currentUser.name);
    
    if (inv) {
      sendSystemNotification(
        inv.userId,
        'Custom ROI Applied!',
        `Awesome! The yield rate of your active investment (${inv.planName}) has been set to a custom ROI of ${roi}% by the team.`,
        'email'
      );
    }
  };

  const setGlobalROI = async (planId: string, roi: number) => {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Unauthorized');
    
    db.doc('plans', planId).update({ defaultROI: roi });
    const plan = plans.find(p => p.planId === planId);
    
    logAction(currentUser.userId, 'admin', `Updated default base ROI for plan to: ${roi}%`, planId, currentUser.name);
  };

  const composeNotification = async (recipients: 'all' | 'specific' | 'active' | 'matured', channel: 'email+SMS' | 'email' | 'SMS', subject: string, message: string, specificUserId?: string) => {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Unauthorized');
    
    // Determine target users
    let targets: UserProfile[] = [];
    if (recipients === 'all') {
      targets = usersList.filter(u => u.role === 'user');
    } else if (recipients === 'specific' && specificUserId) {
      const specificUser = usersList.find(u => u.userId === specificUserId);
      if (specificUser) targets = [specificUser];
    } else if (recipients === 'active') {
      const activeUserIds = Array.from(new Set(investments.filter(i => i.status === 'active').map(i => i.userId)));
      targets = usersList.filter(u => activeUserIds.includes(u.userId));
    } else if (recipients === 'matured') {
      const maturedUserIds = Array.from(new Set(investments.filter(i => i.status === 'matured').map(i => i.userId)));
      targets = usersList.filter(u => maturedUserIds.includes(u.userId));
    }

    // Trigger notification writes simulating Termii and SendGrid API triggers
    targets.forEach(target => {
      sendSystemNotification(target.userId, subject, message, channel);
    });

    logAction(
      currentUser.userId,
      'admin',
      `Sent notification broadcast to ${targets.length} investors via channel: ${channel} using Termii & SendGrid`,
      'system',
      currentUser.name
    );
  };

  const suspendUser = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Unauthorized');
    db.doc('users', userId).update({ status: 'suspended' });
    logAction(currentUser.userId, 'admin', `Suspended user account access`, userId, currentUser.name);
  };

  const activateUser = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Unauthorized');
    db.doc('users', userId).update({ status: 'active' });
    logAction(currentUser.userId, 'admin', `Re-activated user account access`, userId, currentUser.name);
  };

  // Fast forward simulation helper
  const fastForward = (days: number) => {
    fastForwardTime(days);
    logAction(
      currentUser?.userId || 'system',
      currentUser?.role || 'admin',
      `Simulated fast-forwarding calendar clocks by ${days} days`,
      'clocks',
      currentUser?.name || 'System Simulator'
    );
  };

  const triggerMaturityCheck = () => {
    checkAndMatureInvestments();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currency,
        toggleCurrency,
        formatMoney,
        usdToNgnRate,
        convertAmount,
        usersList,
        investments,
        plans,
        withdrawals,
        referrals,
        notifications,
        activityLogs,
        initiateInvestment,
        submitKycDocuments,
        requestWithdrawal,
        markNotificationRead,
        addBankAccount,
        approveKYC,
        rejectKYC,
        releaseWithdrawal,
        holdWithdrawal,
        approveInvestment,
        rejectInvestment,
        payoutInvestment,
        createPlan,
        updatePlan,
        setCustomROI,
        setGlobalROI,
        composeNotification,
        suspendUser,
        activateUser,
        fastForward,
        triggerMaturityCheck
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used inside an AppProvider');
  }
  return context;
}
