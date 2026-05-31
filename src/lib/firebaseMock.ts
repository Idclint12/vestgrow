// This file is kept to maintain structural compatibility with imports across the codebase.
// All operations are backed by the real cloud Supabase engine in supabase.ts.

export {
  auth,
  db,
  supabase,
  logAction,
  checkAndMatureInvestments,
  sendSystemNotification,
  fastForwardTime,
  OperationType
} from './supabase';

export function handleFirestoreError(error: any) {
  console.error("Database connection error: ", error);
}
