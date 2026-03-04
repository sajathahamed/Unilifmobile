-- =====================================================
-- TRIP PLANNER DATABASE SCHEMA - UPDATED
-- UniLife Mobile Application
-- Version 2.0 - With Void System & Enhanced Fields
-- =====================================================

-- Note: Run this AFTER the original trip_planner.sql
-- This adds new columns and tables without breaking existing data

-- =====================================================
-- 1. ADD NEW COLUMNS TO TRIPS TABLE
-- =====================================================

-- Add new columns for enhanced trip planning
ALTER TABLE trips ADD COLUMN IF NOT EXISTS travelers INTEGER DEFAULT 1;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS itinerary_json JSONB;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS hotel_details_json JSONB;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS total_cost_lkr DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS budget_lkr DECIMAL(12, 2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS transport_details_json JSONB;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS cost_breakdown_json JSONB;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS budget_sufficient BOOLEAN DEFAULT true;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'LKR';

-- Modify status to include 'void' option
-- Status options: planning, booked, completed, cancelled, void
ALTER TABLE trips ALTER COLUMN status SET DEFAULT 'planning';

-- Add void-related columns
ALTER TABLE trips ADD COLUMN IF NOT EXISTS voided_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS void_reason TEXT;

-- =====================================================
-- 2. CREATE USERS TABLE EXTENSION FOR GOOGLE AUTH
-- =====================================================

-- Add Google-related columns to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'email';

-- Create index for google_id
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- =====================================================
-- 3. CREATE TRIP_PLANS TABLE - For Detailed AI Plans
-- =====================================================

CREATE TABLE IF NOT EXISTS trip_plans (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    destination VARCHAR(255) NOT NULL,
    days INTEGER NOT NULL CHECK (days >= 1 AND days <= 30),
    budget_lkr DECIMAL(12, 2) NOT NULL,
    travelers INTEGER DEFAULT 1,
    room_type VARCHAR(50) DEFAULT 'standard',
    travel_type VARCHAR(50) DEFAULT 'solo',
    transport_mode VARCHAR(50) DEFAULT 'car',
    food_preference VARCHAR(50) DEFAULT 'mixed',
    
    -- AI Generated Content
    summary TEXT,
    itinerary_json JSONB NOT NULL DEFAULT '[]',
    hotel_details_json JSONB DEFAULT '[]',
    food_places_json JSONB DEFAULT '[]',
    transport_details_json JSONB,
    cost_breakdown_json JSONB,
    travel_tips_json JSONB DEFAULT '[]',
    
    -- Cost Information
    total_cost_lkr DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_cost_usd DECIMAL(12, 2),
    budget_sufficient BOOLEAN DEFAULT true,
    budget_message TEXT,
    
    -- Status Management
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'void', 'archived')),
    voided_at TIMESTAMP WITH TIME ZONE,
    void_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for trip_plans
CREATE INDEX IF NOT EXISTS idx_trip_plans_user_id ON trip_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_plans_status ON trip_plans(status);
CREATE INDEX IF NOT EXISTS idx_trip_plans_created_at ON trip_plans(created_at DESC);

-- =====================================================
-- 4. UPDATED_AT TRIGGER FOR TRIP_PLANS
-- =====================================================

DROP TRIGGER IF EXISTS update_trip_plans_updated_at ON trip_plans;
CREATE TRIGGER update_trip_plans_updated_at
    BEFORE UPDATE ON trip_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. ROW LEVEL SECURITY FOR TRIP_PLANS
-- =====================================================

ALTER TABLE trip_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create
DROP POLICY IF EXISTS trip_plans_select_policy ON trip_plans;
CREATE POLICY trip_plans_select_policy ON trip_plans
    FOR SELECT USING (true);

DROP POLICY IF EXISTS trip_plans_insert_policy ON trip_plans;
CREATE POLICY trip_plans_insert_policy ON trip_plans
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS trip_plans_update_policy ON trip_plans;
CREATE POLICY trip_plans_update_policy ON trip_plans
    FOR UPDATE USING (true);

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to void a trip plan
CREATE OR REPLACE FUNCTION void_trip_plan(
    p_trip_plan_id INTEGER,
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE trip_plans 
    SET status = 'void',
        voided_at = NOW(),
        void_reason = p_reason
    WHERE id = p_trip_plan_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get active trips for a user
CREATE OR REPLACE FUNCTION get_active_trip_plans(p_user_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    destination VARCHAR,
    days INTEGER,
    budget_lkr DECIMAL,
    total_cost_lkr DECIMAL,
    status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tp.id,
        tp.destination,
        tp.days,
        tp.budget_lkr,
        tp.total_cost_lkr,
        tp.status,
        tp.created_at
    FROM trip_plans tp
    WHERE tp.user_id = p_user_id 
    AND tp.status = 'active'
    ORDER BY tp.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get voided trips for a user
CREATE OR REPLACE FUNCTION get_voided_trip_plans(p_user_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    destination VARCHAR,
    days INTEGER,
    budget_lkr DECIMAL,
    total_cost_lkr DECIMAL,
    voided_at TIMESTAMP WITH TIME ZONE,
    void_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tp.id,
        tp.destination,
        tp.days,
        tp.budget_lkr,
        tp.total_cost_lkr,
        tp.voided_at,
        tp.void_reason
    FROM trip_plans tp
    WHERE tp.user_id = p_user_id 
    AND tp.status = 'void'
    ORDER BY tp.voided_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. UPSERT FUNCTION FOR USER WITH GOOGLE AUTH
-- =====================================================

CREATE OR REPLACE FUNCTION upsert_user_google(
    p_email VARCHAR,
    p_name VARCHAR,
    p_google_id VARCHAR,
    p_photo_url TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    -- Try to find existing user by google_id or email
    SELECT id INTO v_user_id
    FROM users
    WHERE google_id = p_google_id OR email = p_email
    LIMIT 1;
    
    IF v_user_id IS NULL THEN
        -- Insert new user
        INSERT INTO users (name, email, google_id, photo_url, auth_provider, role)
        VALUES (p_name, p_email, p_google_id, p_photo_url, 'google', 'student')
        RETURNING id INTO v_user_id;
    ELSE
        -- Update existing user
        UPDATE users
        SET name = COALESCE(p_name, name),
            google_id = COALESCE(p_google_id, google_id),
            photo_url = COALESCE(p_photo_url, photo_url),
            auth_provider = CASE WHEN p_google_id IS NOT NULL THEN 'google' ELSE auth_provider END
        WHERE id = v_user_id;
    END IF;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. VIEW FOR TRIP SUMMARY
-- =====================================================

CREATE OR REPLACE VIEW trip_plans_summary AS
SELECT 
    tp.id,
    tp.user_id,
    u.name as user_name,
    u.email as user_email,
    tp.destination,
    tp.days,
    tp.travelers,
    tp.budget_lkr,
    tp.total_cost_lkr,
    tp.budget_sufficient,
    tp.room_type,
    tp.status,
    tp.created_at,
    tp.voided_at
FROM trip_plans tp
JOIN users u ON tp.user_id = u.id;

-- =====================================================
-- END OF SCHEMA UPDATE
-- =====================================================
