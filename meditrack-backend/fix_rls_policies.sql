-- Quick fix for RLS policies - Run this in Supabase SQL Editor
-- This enables API access to all tables

-- Users table policy
DROP POLICY IF EXISTS "Enable all access for users table" ON users;
CREATE POLICY "Enable all access for users table" ON users
    FOR ALL USING (true) WITH CHECK (true);

-- Prescriptions table policy
DROP POLICY IF EXISTS "Enable all access for prescriptions table" ON prescriptions;
CREATE POLICY "Enable all access for prescriptions table" ON prescriptions
    FOR ALL USING (true) WITH CHECK (true);

-- Medicines table policy
DROP POLICY IF EXISTS "Enable all access for medicines table" ON medicines;
CREATE POLICY "Enable all access for medicines table" ON medicines
    FOR ALL USING (true) WITH CHECK (true);

-- Medicine logs table policy
DROP POLICY IF EXISTS "Enable all access for medicine_logs table" ON medicine_logs;
CREATE POLICY "Enable all access for medicine_logs table" ON medicine_logs
    FOR ALL USING (true) WITH CHECK (true);

-- Health reports table policy
DROP POLICY IF EXISTS "Enable all access for health_reports table" ON health_reports;
CREATE POLICY "Enable all access for health_reports table" ON health_reports
    FOR ALL USING (true) WITH CHECK (true);

-- Notification settings table policy
DROP POLICY IF EXISTS "Enable all access for notification_settings table" ON notification_settings;
CREATE POLICY "Enable all access for notification_settings table" ON notification_settings
    FOR ALL USING (true) WITH CHECK (true);

-- Notification history table policy
DROP POLICY IF EXISTS "Enable all access for notification_history table" ON notification_history;
CREATE POLICY "Enable all access for notification_history table" ON notification_history
    FOR ALL USING (true) WITH CHECK (true);

-- Verify policies are created
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
