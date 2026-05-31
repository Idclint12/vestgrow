/**
 * Database collection definitions for VestGrow
 */

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'user';
  status: 'active' | 'kyc_pending' | 'kyc_rejected' | 'suspended';
  kycDocNIN?: string;
  kycDocSelfie?: string;
  kycDocAddress?: string;
  kycRejectionReason?: string;
  referralCode: string;
  referredBy?: string;
  bankAccounts: BankAccount[];
  notificationPrefs: {
    email: boolean;
    sms: boolean;
  };
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface Investment {
  investmentId: string;
  userId: string;
  userName?: string; // Cache for easy displays
  planId: string;
  planName: string;
  amount: number;
  currency: 'NGN' | 'USD';
  roi: number; // e.g. 15 for 15%
  startDate: string; // ISO String
  endDate: string; // ISO String
  status: 'pending' | 'active' | 'matured' | 'paid out' | 'rejected';
  paystackRef: string;
  customRoiApplied?: boolean;
}

export interface InvestmentPlan {
  planId: string;
  name: string;
  duration: number; // in months
  minAmount: number;
  defaultROI: number; // e.g., 15 for 15%
  currency: 'NGN' | 'USD' | 'ANY';
  status: 'active' | 'inactive';
}

export interface WithdrawalRequest {
  withdrawalId: string;
  userId: string;
  userName?: string;
  amount: number;
  currency: 'NGN' | 'USD';
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  status: 'pending' | 'released' | 'held';
  requestDate: string; // ISO String
}

export interface Referral {
  referralId: string;
  referrerId: string;
  referredUserId: string;
  referredUserName?: string;
  bonus: number; // e.g. 500 NGN or 5 USD
  currency: 'NGN' | 'USD';
  status: 'pending' | 'earned';
  date: string; // ISO String
}

export interface SystemNotification {
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  channel: 'email+SMS' | 'email' | 'SMS';
  read: boolean;
  sentAt: string; // ISO String
}

export interface ActivityLog {
  logId: string;
  actorId: string;
  actorName: string;
  actorRole: 'admin' | 'user';
  action: string;
  targetId: string;
  timestamp: string; // ISO String
}
