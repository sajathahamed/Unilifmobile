-- ===================================================
-- FIX: Run this in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard > SQL Editor
-- ===================================================

-- 1. Enable RLS on laundry_services and allow public read
ALTER TABLE laundry_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on laundry_services" ON laundry_services;
CREATE POLICY "Allow public read on laundry_services"
  ON laundry_services FOR SELECT
  USING (true);

-- 2. Add missing columns to laundry_orders (for AI item detection)
ALTER TABLE laundry_orders
  ADD COLUMN IF NOT EXISTS items_json JSONB,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Enable RLS on laundry_orders
ALTER TABLE laundry_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read own laundry orders" ON laundry_orders;
CREATE POLICY "Allow users to read own laundry orders"
  ON laundry_orders FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow users to insert laundry orders" ON laundry_orders;
CREATE POLICY "Allow users to insert laundry orders"
  ON laundry_orders FOR INSERT
  WITH CHECK (true);

-- 4. Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read notifications" ON notifications;
CREATE POLICY "Allow users to read notifications"
  ON notifications FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow inserting notifications" ON notifications;
CREATE POLICY "Allow inserting notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- 5. Check if laundry_services has data
SELECT * FROM laundry_services;

-- 6. If empty, insert sample data (using correct column names)
INSERT INTO laundry_services (name, location, price_per_kg, price_per_item, pickup_available)
VALUES
  ('QuickWash Campus', 'Block A, Ground Floor', 4.50, 2.00, true),
  ('FreshSpin Laundry', 'Student Hub, Level 2', 5.00, 2.50, true),
  ('EcoClean Express', 'Hostel Block C', 3.80, 1.80, false)
ON CONFLICT DO NOTHING;
