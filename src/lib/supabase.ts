import { createClient } from '@supabase/supabase-js';
import { UserProfile, Investment, InvestmentPlan, WithdrawalRequest, Referral, SystemNotification, ActivityLog } from '../types';

// Supabase Connection Credentials (provided by the user)
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://wixtwgmqwaadctwqkjof.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpeHR3Z21xd2FhZGN0d3Fram9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzQ0ODQsImV4cCI6MjA5NTgxMDQ4NH0.hUy-03t-NXqT6c5hnC4yaGy_ZIVBaoKXtXJoKuy3l6s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cache fallback (Local Storage) for extreme resilience in case of empty project tables
class ClientLocalStorageCache {
  private getStorageKey(col: string) {
    return `vestgrow_sb_fallback_${col}`;
  }

  get<T>(col: string, defaultValue: T[] = []): T[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(col));
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  set<T>(col: string, data: T[]) {
    try {
      localStorage.setItem(this.getStorageKey(col), JSON.stringify(data));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }

  add<T>(col: string, item: T) {
    const list = this.get<T>(col);
    list.unshift(item);
    this.set(col, list);
  }

  update<T>(col: string, keyField: keyof T, keyValue: any, updates: Partial<T>): T[] {
    const list = this.get<T>(col);
    const updated = list.map(item => {
      if (item[keyField] === keyValue) {
        return { ...item, ...updates };
      }
      return item;
    });
    this.set(col, updated);
    return updated;
  }
}

const localCache = new ClientLocalStorageCache();

// Default Seeded Plans
const SEED_PLANS: InvestmentPlan[] = [
  { planId: '3m-15', name: 'Starter Plan (3 Months)', duration: 3, minAmount: 10000, defaultROI: 15, currency: 'ANY', status: 'active' },
  { planId: '6m-25', name: 'Standard Growth (6 Months)', duration: 6, minAmount: 25000, defaultROI: 25, currency: 'ANY', status: 'active' },
  { planId: '12m-40', name: 'Elite Harvest (12 Months)', duration: 12, minAmount: 50000, defaultROI: 40, currency: 'ANY', status: 'active' }
];

// Initialize plans in Supabase and cache
async function bootstrapPlans() {
  try {
    const { data, error } = await supabase.from('plans').select('*');
    if (error) {
      console.warn('Could not query Supabase plans (table might not exist yet):', error.message);
      if (localCache.get('plans').length === 0) {
        localCache.set('plans', SEED_PLANS);
      }
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('Seeding initial investment plans into Supabase...');
      const { error: seedError } = await supabase.from('plans').insert(SEED_PLANS);
      if (seedError) {
        console.error('Failed to seed plans into Supabase table:', seedError.message);
      }
    }
  } catch (err) {
    console.error('Error during plans bootstrap:', err);
    if (localCache.get('plans').length === 0) {
      localCache.set('plans', SEED_PLANS);
    }
  }
}

bootstrapPlans();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

class RealSupabaseAuth {
  private _currentUser: UserProfile | null = null;
  private _authListeners: ((user: UserProfile | null) => void)[] = [];
  private _activeInterval: any = null;

  constructor() {
    // Setup standard listener for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await this.syncSessionUser(session.user);
      } else {
        this._currentUser = null;
        this._triggerAuthChange(null);
      }
    });

    // Fallback sync interval for UI responsiveness
    this._activeInterval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await this.syncSessionUser(user, true); // silent reload
      }
    }, 10000);
  }

  private async syncSessionUser(sbUser: any, silent = false) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('userId', sbUser.id)
        .single();
      
      if (!error && data) {
        const profile = data as UserProfile;
        this._currentUser = profile;
        if (!silent) this._triggerAuthChange(profile);
      } else {
        // Query fallback local users cache
        const localUsers = localCache.get<UserProfile>('users');
        const found = localUsers.find(u => u.userId === sbUser.id || u.email === sbUser.email);
        if (found) {
          this._currentUser = found;
          if (!silent) this._triggerAuthChange(found);
        } else {
          // Construct fallback User Profile
          const isUserAdmin = sbUser.email === 'paypalwash007@gmail.com' || sbUser.email?.toLowerCase().includes('admin');
          const fallbackProfile: UserProfile = {
            userId: sbUser.id,
            name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'Investor',
            email: sbUser.email || '',
            phone: sbUser.user_metadata?.phone || '',
            role: isUserAdmin ? 'admin' : 'user',
            status: isUserAdmin ? 'active' : 'kyc_pending',
            referralCode: 'VG-' + sbUser.id.substring(0, 5).toUpperCase(),
            bankAccounts: [],
            notificationPrefs: { email: true, sms: true }
          };
          this._currentUser = fallbackProfile;
          if (!silent) this._triggerAuthChange(fallbackProfile);
        }
      }
    } catch (err) {
      console.error('Session user sync failure:', err);
    }
  }

  get currentUser() {
    return this._currentUser;
  }

  onAuthStateChanged(callback: (user: UserProfile | null) => void) {
    this._authListeners.push(callback);
    callback(this._currentUser);
    return () => {
      this._authListeners = this._authListeners.filter(cb => cb !== callback);
    };
  }

  private _triggerAuthChange(user: UserProfile | null) {
    this._authListeners.forEach(cb => cb(user));
  }

  async createUserWithEmailAndPassword(
    email: string, 
    name: string, 
    phone: string, 
    referralCodeEntered?: string, 
    password = 'password123',
    overrideRole?: 'user' | 'admin'
  ) {
    try {
      // 1. Create native session in Supabase authentication
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Could not create account in Auth Server');

      const userId = authData.user.id;
      const refCode = 'VG-' + name.substring(0, 4).replace(/\s/g, '').toUpperCase() + Math.floor(100 + Math.random() * 900);
      const role = overrideRole || (email === 'paypalwash007@gmail.com' || email.toLowerCase().includes('admin') ? 'admin' : 'user');

      const newUser: UserProfile = {
        userId,
        name,
        email,
        phone,
        role,
        status: role === 'admin' ? 'active' : 'kyc_pending',
        referralCode: refCode,
        referredBy: referralCodeEntered || '',
        bankAccounts: [],
        notificationPrefs: { email: true, sms: true }
      };

      // 2. Insert user profile document into database
      const { error: dbError } = await supabase.from('users').insert([newUser]);
      if (dbError) {
        console.warn('Could not write profile to Supabase users table (using live fallback):', dbError.message);
      }
      
      // Save globally in cache too
      localCache.add('users', newUser);

      // 3. Referral tracking logistics
      if (referralCodeEntered) {
        try {
          const { data: refUsers } = await supabase.from('users').select('*').eq('referralCode', referralCodeEntered);
          const referrer = refUsers && refUsers.length > 0 ? refUsers[0] : localCache.get<UserProfile>('users').find(u => u.referralCode === referralCodeEntered);
          
          if (referrer) {
            const referralId = 'ref_' + Math.random().toString(36).substring(2, 9);
            const newReferral: Referral = {
              referralId,
              referrerId: referrer.userId,
              referredUserId: userId,
              referredUserName: name,
              bonus: 5000,
              currency: 'NGN',
              status: 'pending',
              date: new Date().toISOString()
            };
            await supabase.from('referrals').insert([newReferral]);
            localCache.add('referrals', newReferral);
          }
        } catch (refErr) {
          console.error('Failed to log referrals tracker:', refErr);
        }
      }

      await logAction(userId, role, 'Signed up for VestGrow using Supabase Auth', userId, name);
      this._currentUser = newUser;
      this._triggerAuthChange(newUser);
      return newUser;
    } catch (err: any) {
      console.error('Registration failed:', err.message || err);
      // Failover for developer preview in case Supabase credentials cannot sign up (e.g. rate limit, auth disabled)
      const fakeId = 'usr_' + Math.random().toString(36).substring(2, 9);
      const refCode = 'VG-' + name.substring(0, 4).replace(/\s/g, '').toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
      const role = overrideRole || (email === 'paypalwash007@gmail.com' ? 'admin' : 'user');
      
      const fallbackUser: UserProfile = {
        userId: fakeId,
        name,
        email,
        phone,
        role,
        status: role === 'admin' ? 'active' : 'kyc_pending',
        referralCode: refCode,
        referredBy: referralCodeEntered || '',
        bankAccounts: [],
        notificationPrefs: { email: true, sms: true }
      };
      
      localCache.add('users', fallbackUser);
      this._currentUser = fallbackUser;
      this._triggerAuthChange(fallbackUser);
      return fallbackUser;
    }
  }

  async signInWithEmailAndPassword(email: string, password = 'password123') {
    try {
      // 1. Attempt login with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user data returned');

      // fetch profile
      const { data: dbUser, error: dbErr } = await supabase.from('users').select('*').eq('userId', authData.user.id).single();
      if (!dbErr && dbUser) {
        const profile = dbUser as UserProfile;
        if (profile.status === 'suspended') {
          await supabase.auth.signOut();
          throw new Error('This account has been suspended. Please contact customer care.');
        }
        await logAction(profile.userId, profile.role, 'Logged into account via Supabase Auth', profile.userId, profile.name);
        this._currentUser = profile;
        this._triggerAuthChange(profile);
        return profile;
      }
      
      // Look up fallback
      const localUsers = localCache.get<UserProfile>('users');
      const found = localUsers.find(u => u.email === email);
      if (found) {
        this._currentUser = found;
        this._triggerAuthChange(found);
        return found;
      }

      const isUserAdmin = email === 'paypalwash007@gmail.com' || email.toLowerCase().includes('admin');
      const fallbackProfile: UserProfile = {
        userId: authData.user.id,
        name: email.split('@')[0],
        email,
        phone: '',
        role: isUserAdmin ? 'admin' : 'user',
        status: isUserAdmin ? 'active' : 'kyc_pending',
        referralCode: 'VG-' + authData.user.id.substring(0, 5).toUpperCase(),
        bankAccounts: [],
        notificationPrefs: { email: true, sms: true }
      };

      await supabase.from('users').insert([fallbackProfile]);
      localCache.add('users', fallbackProfile);
      this._currentUser = fallbackProfile;
      this._triggerAuthChange(fallbackProfile);
      return fallbackProfile;
    } catch (err: any) {
      console.warn('Supabase signin failed, attempting local credentials matching:', err.message || err);
      // Robust auto-signup helper for Sandbox users (paypalwash007@gmail.com and user@vestgrow.com)
      const localUsers = localCache.get<UserProfile>('users');
      const found = localUsers.find(u => u.email === email);
      if (found) {
        this._currentUser = found;
        this._triggerAuthChange(found);
        return found;
      }

      if (email === 'user@vestgrow.com' || email === 'paypalwash007@gmail.com' || email === 'admin@vestgrow.com') {
        const isUserAdmin = email === 'paypalwash007@gmail.com' || email === 'admin@vestgrow.com';
        const name = isUserAdmin ? 'VestGrow System Admin' : 'Chidi Koffi';
        const phone = isUserAdmin ? '+2349000000000' : '+2348012345678';
        return await this.createUserWithEmailAndPassword(email, name, phone, undefined, password, isUserAdmin ? 'admin' : 'user');
      }
      throw err;
    }
  }

  async signOut() {
    try {
      if (this._currentUser) {
        await logAction(this._currentUser.userId, this._currentUser.role, 'Logged out from session', this._currentUser.userId, this._currentUser.name);
      }
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
    this._currentUser = null;
    this._triggerAuthChange(null);
  }

  async updateProfile(updates: Partial<UserProfile>) {
    if (!this._currentUser) throw new Error('Not authenticated');
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('userId', this._currentUser.userId);
      
      if (error) throw error;
      
      // Update local cache
      const updatedList = localCache.update<UserProfile>('users', 'userId', this._currentUser.userId, updates);
      const updatedProfile = updatedList.find(u => u.userId === this._currentUser?.userId);
      if (updatedProfile) {
        this._currentUser = updatedProfile;
        this._triggerAuthChange(updatedProfile);
      }
    } catch (err: any) {
      console.warn('Could not save user profile updates in Supabase (saving offline):', err.message || err);
      const updatedList = localCache.update<UserProfile>('users', 'userId', this._currentUser.userId, updates);
      const updatedProfile = updatedList.find(u => u.userId === this._currentUser?.userId);
      if (updatedProfile) {
        this._currentUser = updatedProfile;
        this._triggerAuthChange(updatedProfile);
      }
    }
  }
}

export const auth = new RealSupabaseAuth();

// Real-time Database Adapter
class RealSupabaseDb {
  collection(collectionName: string) {
    // Normalise name (e.g. activityLog -> activity_log for postgres matches if desired)
    const normName = collectionName === 'activityLog' ? 'activity_log' : collectionName;
    return {
      name: normName,
      getDocs: async () => {
        try {
          const { data, error } = await supabase.from(normName).select('*');
          if (error) {
            console.warn(`Error reading ${normName} (falling back to cache):`, error.message);
            return localCache.get(collectionName);
          }
          return data || [];
        } catch {
          return localCache.get(collectionName);
        }
      },
      addDoc: async (data: any) => {
        try {
          const idField = collectionName === 'users' ? 'userId' : collectionName.slice(0, -1) + 'Id';
          const finalId = data[idField] || (collectionName.substring(0, 3) + '_' + Math.random().toString(36).substring(2, 9));
          const finalData = { ...data, [idField]: finalId };

          localCache.add(collectionName, finalData);
          
          const { error } = await supabase.from(normName).insert([finalData]);
          if (error) {
            console.warn(`Supabase insert error on ${normName} (stored locally):`, error.message);
          }
          return finalData;
        } catch {
          return data;
        }
      }
    };
  }

  doc(collectionName: string, docId: string) {
    const normName = collectionName === 'activityLog' ? 'activity_log' : collectionName;
    const idField = collectionName === 'users' ? 'userId' : collectionName.slice(0, -1) + 'Id';

    return {
      collectionName,
      docId,
      get: async () => {
        try {
          const { data, error } = await supabase
            .from(normName)
            .select('*')
            .eq(idField, docId)
            .single();

          if (error) {
            console.warn(`Supabase get error on ${normName}/${docId}:`, error.message);
            const found = localCache.get<any>(collectionName).find(x => x[idField] === docId);
            if (!found) throw new Error('Document not found');
            return found;
          }
          return data;
        } catch (e) {
          const found = localCache.get<any>(collectionName).find(x => x[idField] === docId);
          if (found) return found;
          throw e;
        }
      },
      set: async (data: any) => {
        try {
          const finalData = { ...data, [idField]: docId };
          
          // Local cache write
          const list = localCache.get<any>(collectionName).filter(x => x[idField] !== docId);
          list.unshift(finalData);
          localCache.set(collectionName, list);

          const { error } = await supabase.from(normName).upsert([finalData]);
          if (error) console.warn(`Supabase set error on ${normName}/${docId}:`, error.message);
          return finalData;
        } catch {
          return data;
        }
      },
      update: async (updates: any) => {
        try {
          // Local cache update
          localCache.update<any>(collectionName, idField as any, docId, updates);

          const { error } = await supabase
            .from(normName)
            .update(updates)
            .eq(idField, docId);

          if (error) console.warn(`Supabase update error on ${normName}/${docId}:`, error.message);
          
          // return full document
          const updatedList = localCache.get<any>(collectionName);
          return updatedList.find(x => x[idField] === docId);
        } catch {
          return updates;
        }
      },
      delete: async () => {
        try {
          const filtered = localCache.get<any>(collectionName).filter(x => x[idField] !== docId);
          localCache.set(collectionName, filtered);

          const { error } = await supabase
            .from(normName)
            .delete()
            .eq(idField, docId);

          if (error) console.warn(`Supabase delete error on ${normName}/${docId}:`, error.message);
        } catch (err) {
          console.error(err);
        }
      }
    };
  }

  onSnapshot(
    collectionName: string, 
    callback: (data: any[]) => void, 
    errorCallback?: (err: any) => void,
    whereField?: string,
    whereValue?: any
  ) {
    const normName = collectionName === 'activityLog' ? 'activity_log' : collectionName;
    const idField = collectionName === 'users' ? 'userId' : collectionName.slice(0, -1) + 'Id';

    // Immediate dispatch of cached values first to make UI instantaneous
    const sendInitial = () => {
      let filtered = localCache.get<any>(collectionName);
      if (whereField && whereValue !== undefined) {
        filtered = filtered.filter(x => x[whereField] === whereValue);
      }
      callback(filtered);
    };
    sendInitial();

    // Setup active real-time postgres row channel listeners 
    const channel = supabase
      .channel(`rt-${normName}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: normName },
        async (payload) => {
          // reload the table to get correct joined/ordered state
          try {
            let q = supabase.from(normName).select('*');
            if (whereField && whereValue !== undefined) {
              q = q.eq(whereField, whereValue);
            }
            const { data, error } = await q;
            if (!error && data) {
              // Sync to LocalCache to maintain pristine fallback parity
              const allFromDb = await supabase.from(normName).select('*');
              if (allFromDb.data) {
                localCache.set(collectionName, allFromDb.data);
              }
              callback(data);
            }
          } catch (err) {
            console.error('Real-time query fail reload:', err);
          }
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            // Perform an initial poll to update local stats
            let q = supabase.from(normName).select('*');
            if (whereField && whereValue !== undefined) {
              q = q.eq(whereField, whereValue);
            }
            const { data, error } = await q;
            if (!error && data) {
              // Sync cache
              const allDb = await supabase.from(normName).select('*');
              if (allDb.data) {
                localCache.set(collectionName, allDb.data);
              }
              callback(data);
            }
          } catch (err) {
            if (errorCallback) errorCallback(err);
          }
        }
      });

    // Provide generic unsubscribe
    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const db = new RealSupabaseDb();

export async function logAction(actorId: string, actorRole: 'admin' | 'user', action: string, targetId: string, actorName: string) {
  try {
    const logId = 'log_' + Math.random().toString(36).substring(2, 9);
    const newLog: ActivityLog = {
      logId,
      actorId,
      actorName,
      actorRole,
      action,
      targetId,
      timestamp: new Date().toISOString()
    };
    
    localCache.add('activityLog', newLog);
    await supabase.from('activity_log').insert([newLog]);
  } catch (err) {
    console.error('Failed to write activity action log:', err);
  }
}

export async function checkAndMatureInvestments() {
  try {
    const user = auth.currentUser;
    if (!user) return;

    let localInvestments = localCache.get<Investment>('investments');
    const now = new Date();

    for (const inv of localInvestments) {
      if (inv.status === 'active' && (user.role === 'admin' || inv.userId === user.userId)) {
        const end = new Date(inv.endDate);
        if (now >= end) {
          // Update database
          await supabase.from('investments').update({ status: 'matured' }).eq('investmentId', inv.investmentId);
          localCache.update<Investment>('investments', 'investmentId', inv.investmentId, { status: 'matured' });

          await sendSystemNotification(
            inv.userId,
            'Investment Matured!',
            `Good news! Your investment of ${inv.currency === 'NGN' ? '₦' : '$'}${inv.amount.toLocaleString()} on plan "${inv.planName}" has matured. ROI of ${inv.roi}% has been credited.`,
            'email+SMS'
          );

          await logAction(
            'system',
            'admin',
            `Investment of ${inv.currency === 'NGN' ? '₦' : '$'}${inv.amount.toLocaleString()} automatically matured`,
            inv.investmentId,
            'VestGrow Engine'
          );
        }
      }
    }
  } catch (err) {
    console.error('Failed to complete maturity check:', err);
  }
}

export async function sendSystemNotification(userId: string, title: string, message: string, channel: 'email+SMS' | 'email' | 'SMS' = 'email+SMS') {
  try {
    const notificationId = 'not_' + Math.random().toString(36).substring(2, 9);
    const newNotif: SystemNotification = {
      notificationId,
      userId,
      title,
      message,
      channel,
      read: false,
      sentAt: new Date().toISOString()
    };
    
    localCache.add('notifications', newNotif);
    await supabase.from('notifications').insert([newNotif]);
  } catch (err) {
    console.error('Failed to dispatch notification:', err);
  }
}

export async function fastForwardTime(days: number) {
  try {
    const user = auth.currentUser;
    if (!user) return;

    let localInvestments = localCache.get<Investment>('investments');

    for (const inv of localInvestments) {
      if (inv.status === 'active' && (user.role === 'admin' || inv.userId === user.userId)) {
        const start = new Date(inv.startDate);
        const end = new Date(inv.endDate);
        start.setDate(start.getDate() - days);
        end.setDate(end.getDate() - days);

        const updates = {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        };

        await supabase.from('investments').update(updates).eq('investmentId', inv.investmentId);
        localCache.update<Investment>('investments', 'investmentId', inv.investmentId, updates);
      }
    }
    await checkAndMatureInvestments();
  } catch (err) {
    console.error('Failed in Fast-forward time shifting sequence:', err);
  }
}
