-- VESTGROW SUPABASE DATABASE SCHEMA SETUP
-- Copy and paste this script directly into your Supabase SQL Editor (https://supabase.com/dashboard/project/wixtwgmqwaadctwqkjof/sql/new) and click Run.

-- 1. Create User Profiles Table
CREATE TABLE IF NOT EXISTS public.users (
  "userId" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "phone" TEXT,
  "role" TEXT DEFAULT 'user' CHECK ("role" IN ('user', 'admin')),
  "status" TEXT DEFAULT 'kyc_pending' CHECK ("status" IN ('active', 'kyc_pending', 'kyc_rejected', 'suspended')),
  "kycDocNIN" TEXT,
  "kycDocSelfie" TEXT,
  "kycDocAddress" TEXT,
  "kycRejectionReason" TEXT,
  "referralCode" TEXT UNIQUE,
  "referredBy" TEXT,
  "bankAccounts" JSONB DEFAULT '[]'::jsonb,
  "notificationPrefs" JSONB DEFAULT '{"email": true, "sms": true}'::jsonb
);

-- 2. Create Investments Table
CREATE TABLE IF NOT EXISTS public.investments (
  "investmentId" TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES public.users("userId") ON DELETE CASCADE,
  "userName" TEXT,
  "planId" TEXT NOT NULL,
  "planName" TEXT NOT NULL,
  "amount" NUMERIC NOT NULL CHECK ("amount" > 0),
  "currency" TEXT NOT NULL CHECK ("currency" IN ('NGN', 'USD')),
  "roi" NUMERIC NOT NULL CHECK ("roi" >= 0),
  "startDate" TEXT NOT NULL,
  "endDate" TEXT NOT NULL,
  "status" TEXT NOT NULL CHECK ("status" IN ('pending', 'active', 'matured', 'paid out', 'rejected')),
  "paystackRef" TEXT,
  "customRoiApplied" BOOLEAN DEFAULT false
);

-- 3. Create Investment Plans Table
CREATE TABLE IF NOT EXISTS public.plans (
  "planId" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "duration" NUMERIC NOT NULL,
  "minAmount" NUMERIC NOT NULL,
  "defaultROI" NUMERIC NOT NULL,
  "currency" TEXT NOT NULL CHECK ("currency" IN ('NGN', 'USD', 'ANY')),
  "status" TEXT DEFAULT 'active' CHECK ("status" IN ('active', 'inactive'))
);

-- 4. Create Withdrawals Table
CREATE TABLE IF NOT EXISTS public.withdrawals (
  "withdrawalId" TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES public.users("userId") ON DELETE CASCADE,
  "userName" TEXT,
  "amount" NUMERIC NOT NULL CHECK ("amount" > 0),
  "currency" TEXT NOT NULL CHECK ("currency" IN ('NGN', 'USD')),
  "bankDetails" JSONB NOT NULL,
  "status" TEXT NOT NULL CHECK ("status" IN ('pending', 'released', 'held')),
  "requestDate" TEXT NOT NULL
);

-- 5. Create Referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
  "referralId" TEXT PRIMARY KEY,
  "referrerId" TEXT REFERENCES public.users("userId") ON DELETE CASCADE,
  "referredUserId" TEXT NOT NULL,
  "referredUserName" TEXT,
  "bonus" NUMERIC NOT NULL CHECK ("bonus" >= 0),
  "currency" TEXT NOT NULL CHECK ("currency" IN ('NGN', 'USD')),
  "status" TEXT DEFAULT 'pending' CHECK ("status" IN ('pending', 'earned')),
  "date" TEXT NOT NULL
);

-- 6. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  "notificationId" TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES public.users("userId") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "channel" TEXT NOT NULL CHECK ("channel" IN ('email+SMS', 'email', 'SMS')),
  "read" BOOLEAN DEFAULT false,
  "sentAt" TEXT NOT NULL
);

-- 7. Create Activity Log Table
CREATE TABLE IF NOT EXISTS public.activity_log (
  "logId" TEXT PRIMARY KEY,
  "actorId" TEXT NOT NULL,
  "actorName" TEXT NOT NULL,
  "actorRole" TEXT NOT NULL CHECK ("actorRole" IN ('admin', 'user')),
  "action" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "timestamp" TEXT NOT NULL
);

-- Enable RLS for simple open sandbox development (or write custom security policies as requested)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- High-performance row policies for sandbox access (allows authenticated client read-write operations)
CREATE POLICY "Enable read for authenticated users" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert/update access for users" ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON public.investments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.plans FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.withdrawals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.referrals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.activity_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. Enable REALTIME for instant updates inside the app layout
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.investments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;

-- Pre-seed default Investment Plans
INSERT INTO public.plans ("planId", "name", "duration", "minAmount", "defaultROI", "currency", "status") VALUES
  ('3m-15', 'Starter Plan (3 Months)', 3, 10000, 15, 'ANY', 'active'),
  ('6m-25', 'Standard Growth (6 Months)', 6, 25000, 25, 'ANY', 'active'),
  ('12m-40', 'Elite Harvest (12 Months)', 12, 50000, 40, 'ANY', 'active')
ON CONFLICT ("planId") DO UPDATE SET
  "name" = EXCLUDED."name",
  "duration" = EXCLUDED."duration",
  "minAmount" = EXCLUDED."minAmount",
  "defaultROI" = EXCLUDED."defaultROI",
  "currency" = EXCLUDED."currency",
  "status" = EXCLUDED."status";
