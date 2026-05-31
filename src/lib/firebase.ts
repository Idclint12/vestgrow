import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword as fbSignIn, 
  createUserWithEmailAndPassword as fbCreateUser, 
  signOut as fbSignOut, 
  onAuthStateChanged as fbOnAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  collection, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc as fbAddDoc, 
  onSnapshot as fbOnSnapshot, 
  query, 
  where, 
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, Investment, InvestmentPlan, WithdrawalRequest, Referral, SystemNotification, ActivityLog } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const fUser = authInstance.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: fUser?.uid || null,
      email: fUser?.email || null,
      emailVerified: fUser?.emailVerified || false,
      isAnonymous: fUser?.isAnonymous || false,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize real SDKs
const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const authInstance = getAuth(app);

// Default seeded plans as fallback/initialization
const SEED_PLANS: InvestmentPlan[] = [
  { planId: '3m-15', name: 'Starter Plan (3 Months)', duration: 3, minAmount: 10000, defaultROI: 15, currency: 'ANY', status: 'active' },
  { planId: '6m-25', name: 'Standard Growth (6 Months)', duration: 6, minAmount: 25000, defaultROI: 25, currency: 'ANY', status: 'active' },
  { planId: '12m-40', name: 'Elite Harvest (12 Months)', duration: 12, minAmount: 50000, defaultROI: 40, currency: 'ANY', status: 'active' }
];

// Helper to seed plans if they do not exist
async function seedPlansIfNeeded() {
  try {
    const plansSnap = await getDocs(collection(firestore, 'plans'));
    if (plansSnap.empty) {
      console.log('Seeding initial investment plans into cloud Firestore...');
      const batch = writeBatch(firestore);
      for (const plan of SEED_PLANS) {
        batch.set(doc(firestore, 'plans', plan.planId), plan);
      }
      await batch.commit();
    }
  } catch (err) {
    console.error('Failed to seed plans: ', err);
  }
}

// Run seeding asynchronously on boot
seedPlansIfNeeded();

class RealFirebaseAuth {
  private _currentUser: UserProfile | null = null;
  private _authListeners: ((user: UserProfile | null) => void)[] = [];
  private _activeProfileListenerUnsubscribe: (() => void) | null = null;

  constructor() {
    fbOnAuthStateChanged(authInstance, async (fbUser) => {
      // Clean up previous profile listeners
      if (this._activeProfileListenerUnsubscribe) {
        this._activeProfileListenerUnsubscribe();
        this._activeProfileListenerUnsubscribe = null;
      }

      if (fbUser) {
        // Create an active real-time profile listener so changes flow immediately to App state
        const profileRef = doc(firestore, 'users', fbUser.uid);
        this._activeProfileListenerUnsubscribe = fbOnSnapshot(profileRef, (snap) => {
          if (snap.exists()) {
            const profile = snap.data() as UserProfile;
            this._currentUser = profile;
            this._triggerAuthChange(profile);
          } else {
            // Profile doc might not exist yet during sign-up
            // Construct a fallback temporary profile using native credentials
            const fallbackProfile: UserProfile = {
              userId: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Investor',
              email: fbUser.email || '',
              phone: fbUser.phoneNumber || '',
              role: fbUser.email === 'paypalwash007@gmail.com' ? 'admin' : 'user',
              status: fbUser.email === 'paypalwash007@gmail.com' ? 'active' : 'kyc_pending',
              referralCode: 'VG-' + fbUser.uid.substring(0, 5).toUpperCase(),
              bankAccounts: [],
              notificationPrefs: { email: true, sms: true }
            };
            this._currentUser = fallbackProfile;
            this._triggerAuthChange(fallbackProfile);
          }
        }, (err) => {
          console.error('Real-time profile sync error:', err);
        });
      } else {
        this._currentUser = null;
        this._triggerAuthChange(null);
      }
    });
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
      const cred = await fbCreateUser(authInstance, email, password);
      const userId = cred.user.uid;
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

      await setDoc(doc(firestore, 'users', userId), newUser);

      if (referralCodeEntered) {
        try {
          const refereeSnap = await getDocs(query(collection(firestore, 'users'), where('referralCode', '==', referralCodeEntered)));
          if (!refereeSnap.empty) {
            const referrerId = refereeSnap.docs[0].id;
            const referralId = 'ref_' + Math.random().toString(36).substring(2, 9);
            const newReferral: Referral = {
              referralId,
              referrerId,
              referredUserId: userId,
              referredUserName: name,
              bonus: 5000,
              currency: 'NGN',
              status: 'pending',
              date: new Date().toISOString()
            };
            await setDoc(doc(firestore, 'referrals', referralId), newReferral);
          }
        } catch (refErr) {
          console.error('Failed to log referral tracking: ', refErr);
        }
      }

      await logAction(userId, role, 'Signed up for VestGrow', userId, name);
      return newUser;
    } catch (err: any) {
      console.error('Registration failed: ', err);
      throw err;
    }
  }

  async signInWithEmailAndPassword(email: string, password = 'password123') {
    try {
      const cred = await fbSignIn(authInstance, email, password);
      
      // Look up and fetch user profile to return
      const profileRef = doc(firestore, 'users', cred.user.uid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const profile = profileSnap.data() as UserProfile;
        if (profile.status === 'suspended') {
          await fbSignOut(authInstance);
          throw new Error('This account has been suspended. Please contact customer care.');
        }
        await logAction(profile.userId, profile.role, 'Logged into account', profile.userId, profile.name);
        return profile;
      } else {
        // Construct minimum profile if Auth created but doc is missing
        const fallbackProfile: UserProfile = {
          userId: cred.user.uid,
          name: email.split('@')[0],
          email,
          phone: '',
          role: email === 'paypalwash007@gmail.com' ? 'admin' : 'user',
          status: email === 'paypalwash007@gmail.com' ? 'active' : 'kyc_pending',
          referralCode: 'VG-' + cred.user.uid.substring(0, 5).toUpperCase(),
          bankAccounts: [],
          notificationPrefs: { email: true, sms: true }
        };
        await setDoc(profileRef, fallbackProfile);
        return fallbackProfile;
      }
    } catch (err: any) {
      // Auto-fallback helper for Sandbox tester ease
      if (email === 'user@vestgrow.com' || email === 'paypalwash007@gmail.com' || email === 'admin@vestgrow.com') {
        try {
          const isUserAdmin = email === 'paypalwash007@gmail.com' || email === 'admin@vestgrow.com';
          const name = isUserAdmin ? 'VestGrow System Admin' : 'Chidi Koffi';
          const phone = isUserAdmin ? '+2349000000000' : '+2348012345678';
          return await this.createUserWithEmailAndPassword(email, name, phone, undefined, password, isUserAdmin ? 'admin' : 'user');
        } catch (signupErr) {
          throw signupErr;
        }
      }
      throw err;
    }
  }

  async signOut() {
    if (this._currentUser) {
      await logAction(this._currentUser.userId, this._currentUser.role, 'Logged out from session', this._currentUser.userId, this._currentUser.name);
    }
    await fbSignOut(authInstance);
  }

  async updateProfile(updates: Partial<UserProfile>) {
    if (!this._currentUser) throw new Error('Not authenticated');
    try {
      const userRef = doc(firestore, 'users', this._currentUser.userId);
      await updateDoc(userRef, updates);
      await logAction(this._currentUser.userId, this._currentUser.role, 'Updated profile settings', this._currentUser.userId, this._currentUser.name);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${this._currentUser.userId}`);
    }
  }
}

export const auth = new RealFirebaseAuth();

class RealFirestoreDb {
  collection(collectionName: string) {
    return {
      name: collectionName,
      getDocs: async () => {
        try {
          const snap = await getDocs(collection(firestore, collectionName));
          return snap.docs.map(d => ({ ...d.data() }));
        } catch (e) {
          handleFirestoreError(e, OperationType.LIST, collectionName);
        }
      },
      addDoc: async (data: any) => {
        try {
          const idField = collectionName === 'users' ? 'userId' : collectionName.slice(0, -1) + 'Id';
          const finalId = data[idField] || (collectionName.substring(0, 3) + '_' + Math.random().toString(36).substring(2, 9));
          const finalData = { ...data, [idField]: finalId };
          
          await setDoc(doc(firestore, collectionName, finalId), finalData);
          return finalData;
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, collectionName);
        }
      }
    };
  }

  doc(collectionName: string, docId: string) {
    return {
      collectionName,
      docId,
      get: async () => {
        try {
          const snap = await getDoc(doc(firestore, collectionName, docId));
          if (!snap.exists()) throw new Error('Document not found');
          return snap.data();
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `${collectionName}/${docId}`);
        }
      },
      set: async (data: any) => {
        try {
          const idField = collectionName === 'users' ? 'userId' : collectionName.slice(0, -1) + 'Id';
          const finalData = { ...data, [idField]: docId };
          await setDoc(doc(firestore, collectionName, docId), finalData);
          return finalData;
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `${collectionName}/${docId}`);
        }
      },
      update: async (updates: any) => {
        try {
          await updateDoc(doc(firestore, collectionName, docId), updates);
          const snap = await getDoc(doc(firestore, collectionName, docId));
          return snap.data();
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `${collectionName}/${docId}`);
        }
      },
      delete: async () => {
        try {
          await deleteDoc(doc(firestore, collectionName, docId));
        } catch (e) {
          handleFirestoreError(e, OperationType.DELETE, `${collectionName}/${docId}`);
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
    let q;
    if (whereField && whereValue !== undefined) {
      q = query(collection(firestore, collectionName), where(whereField, '==', whereValue));
    } else {
      q = collection(firestore, collectionName);
    }

    return fbOnSnapshot(
      q,
      (snapshot) => {
        const itemArray = snapshot.docs.map(d => ({ ...d.data() }));
        callback(itemArray);
      },
      (error) => {
        if (errorCallback) {
          errorCallback(error);
        } else {
          console.error(`Subscription error for collection ${collectionName}:`, error);
        }
      }
    );
  }
}

export const db = new RealFirestoreDb();

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
    await setDoc(doc(firestore, 'activityLog', logId), newLog);
  } catch (err) {
    console.error('Failed to write activity action log:', err);
  }
}

export async function checkAndMatureInvestments() {
  try {
    const user = authInstance.currentUser;
    if (!user) return; // Keep idle if no user is signed in

    // Get user profile to check role
    const profileRef = doc(firestore, 'users', user.uid);
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) return;
    const profile = profileSnap.data() as UserProfile;

    let q;
    if (profile.role === 'admin') {
      // Admin matures everything
      q = collection(firestore, 'investments');
    } else {
      // Normal user only matures their own active investments!
      q = query(collection(firestore, 'investments'), where('userId', '==', user.uid));
    }

    const snap = await getDocs(q);
    const investments = snap.docs.map(doc => doc.data() as Investment);
    const now = new Date();

    for (const inv of investments) {
      if (inv.status === 'active') {
        const end = new Date(inv.endDate);
        if (now >= end) {
          await updateDoc(doc(firestore, 'investments', inv.investmentId), {
            status: 'matured'
          });

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
    await setDoc(doc(firestore, 'notifications', notificationId), newNotif);
  } catch (err) {
    console.error('Failed to dispatch notification:', err);
  }
}

export async function fastForwardTime(days: number) {
  try {
    const user = authInstance.currentUser;
    if (!user) return;

    // Get user profile to check role
    const profileRef = doc(firestore, 'users', user.uid);
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) return;
    const profile = profileSnap.data() as UserProfile;

    let q;
    if (profile.role === 'admin') {
      q = collection(firestore, 'investments');
    } else {
      q = query(collection(firestore, 'investments'), where('userId', '==', user.uid));
    }

    const snap = await getDocs(q);
    const investments = snap.docs.map(doc => doc.data() as Investment);

    for (const inv of investments) {
      if (inv.status === 'active') {
        const start = new Date(inv.startDate);
        const end = new Date(inv.endDate);
        start.setDate(start.getDate() - days);
        end.setDate(end.getDate() - days);

        await updateDoc(doc(firestore, 'investments', inv.investmentId), {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        });
      }
    }
    await checkAndMatureInvestments();
  } catch (err) {
    console.error('Failed in Fast-forward time shifting sequence:', err);
  }
}
