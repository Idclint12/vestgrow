// This file is kept to maintain structural compatibility with imports across the codebase.
// All operations are backed by the real cloud Firebase (Firestore + Auth) engine in firebase.ts.

export {
  auth,
  db,
  logAction,
  checkAndMatureInvestments,
  sendSystemNotification,
  fastForwardTime,
  OperationType,
  handleFirestoreError
} from './firebase';
