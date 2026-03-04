-- =====================================================
-- TRIP PLANNER DATABASE SCHEMA
-- UniLife Mobile Application
-- =====================================================

-- Drop existing tables if they exist (for clean re-installation)
DROP TABLE IF EXISTS trip_recommendations CASCADE;
DROP TABLE IF EXISTS trip_days CASCADE;
DROP TABLE IF EXISTS trips CASCADE;

-- =====================================================
-- 1. TRIPS TABLE - Main trip information
-- =====================================================
CREATE TABLE trips (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    destination VARCHAR(255) NOT NULL,
    place_id VARCHAR(255),                    -- Google Place ID
    latitude DECIMAL(10, 8),                  -- Coordinates
    longitude DECIMAL(11, 8),
    duration INTEGER NOT NULL CHECK (duration >= 1 AND duration <= 30),
    budget DECIMAL(10, 2) NOT NULL CHECK (budget > 0),
    travel_type VARCHAR(50) DEFAULT 'solo',   -- solo, family, friends, couple
    accommodation_type VARCHAR(50) DEFAULT 'standard', -- budget, standard, luxury
    transport_mode VARCHAR(50) DEFAULT 'car', -- bus, train, car, flight
    food_preference VARCHAR(50) DEFAULT 'mixed', -- veg, non-veg, mixed
    total_estimated_cost DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'planning',    -- planning, booked, completed, cancelled
    ai_summary TEXT,                          -- AI generated summary
    ai_travel_tips TEXT,                      -- JSON array of travel tips
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster user queries
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_created_at ON trips(created_at DESC);

-- =====================================================
-- 2. TRIP_DAYS TABLE - Day-by-day itinerary
-- =====================================================
CREATE TABLE trip_days (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number >= 1),
    activities JSONB DEFAULT '[]',            -- Array of activity objects
    estimated_cost DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, day_number)               -- One entry per day per trip
);

-- Index for faster trip lookups
CREATE INDEX idx_trip_days_trip_id ON trip_days(trip_id);

-- =====================================================
-- 3. TRIP_RECOMMENDATIONS TABLE - Hotels, food, places
-- =====================================================
CREATE TABLE trip_recommendations (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,                -- hotel, food, place
    name VARCHAR(255) NOT NULL,
    rating DECIMAL(2, 1),                     -- e.g., 4.5
    address TEXT,
    photo_url TEXT,
    place_id VARCHAR(255),                    -- Google Place ID
    price_level INTEGER,                      -- 1-4 (cheap to expensive)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_trip_recommendations_trip_id ON trip_recommendations(trip_id);
CREATE INDEX idx_trip_recommendations_type ON trip_recommendations(type);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to trips table
CREATE TRIGGER update_trips_updated_at
    BEFORE UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_recommendations ENABLE ROW LEVEL SECURITY;

-- Trips policies - users can only see their own trips
CREATE POLICY trips_select_policy ON trips
    FOR SELECT USING (auth.uid()::text = user_id::text OR true);

CREATE POLICY trips_insert_policy ON trips
    FOR INSERT WITH CHECK (true);

CREATE POLICY trips_update_policy ON trips
    FOR UPDATE USING (true);

CREATE POLICY trips_delete_policy ON trips
    FOR DELETE USING (true);

-- Trip days policies
CREATE POLICY trip_days_select_policy ON trip_days
    FOR SELECT USING (true);

CREATE POLICY trip_days_insert_policy ON trip_days
    FOR INSERT WITH CHECK (true);

CREATE POLICY trip_days_update_policy ON trip_days
    FOR UPDATE USING (true);

CREATE POLICY trip_days_delete_policy ON trip_days
    FOR DELETE USING (true);

-- Trip recommendations policies
CREATE POLICY trip_recommendations_select_policy ON trip_recommendations
    FOR SELECT USING (true);

CREATE POLICY trip_recommendations_insert_policy ON trip_recommendations
    FOR INSERT WITH CHECK (true);

CREATE POLICY trip_recommendations_update_policy ON trip_recommendations
    FOR UPDATE USING (true);

CREATE POLICY trip_recommendations_delete_policy ON trip_recommendations
    FOR DELETE USING (true);

-- =====================================================
-- SAMPLE SEED DATA
-- =====================================================

-- Insert sample trip (assuming user_id 1 exists)
INSERT INTO trips (
    user_id, destination, place_id, latitude, longitude,
    duration, budget, travel_type, accommodation_type,
    transport_mode, food_preference, total_estimated_cost,
    status, ai_summary
) VALUES (
    1,
    'Kuala Lumpur, Malaysia',
    'ChIJ5-rvAcdJzDERfSgcL1uO2fQ',
    3.1390,
    101.6869,
    3,
    1500.00,
    'friends',
    'standard',
    'car',
    'mixed',
    1350.00,
    'planning',
    'A 3-day adventure in Kuala Lumpur exploring iconic landmarks, delicious street food, and vibrant nightlife.'
);

-- Insert sample trip days
INSERT INTO trip_days (trip_id, day_number, activities, estimated_cost) VALUES
(1, 1, '[
    {"time": "09:00", "activity": "Visit Petronas Twin Towers", "cost": 80},
    {"time": "12:00", "activity": "Lunch at Jalan Alor", "cost": 30},
    {"time": "14:00", "activity": "Explore KL Tower", "cost": 50},
    {"time": "18:00", "activity": "Dinner at Pavilion KL", "cost": 60}
]'::jsonb, 220.00),
(1, 2, '[
    {"time": "09:00", "activity": "Batu Caves exploration", "cost": 20},
    {"time": "12:00", "activity": "Lunch at Indian restaurant", "cost": 25},
    {"time": "14:00", "activity": "Visit Islamic Arts Museum", "cost": 15},
    {"time": "18:00", "activity": "Street food tour", "cost": 40}
]'::jsonb, 100.00),
(1, 3, '[
    {"time": "09:00", "activity": "Shopping at Central Market", "cost": 100},
    {"time": "12:00", "activity": "Lunch at Chinatown", "cost": 30},
    {"time": "14:00", "activity": "Visit National Museum", "cost": 10},
    {"time": "18:00", "activity": "Farewell dinner", "cost": 80}
]'::jsonb, 220.00);

-- Insert sample recommendations
INSERT INTO trip_recommendations (trip_id, type, name, rating, address, price_level) VALUES
(1, 'hotel', 'Traders Hotel Kuala Lumpur', 4.5, 'Kuala Lumpur City Centre', 3),
(1, 'hotel', 'Impiana KLCC Hotel', 4.3, 'Jalan Pinang, KLCC', 3),
(1, 'food', 'Jalan Alor Food Street', 4.6, 'Jalan Alor, Bukit Bintang', 1),
(1, 'food', 'Hutong Lot 10', 4.4, 'Lot 10 Shopping Centre', 2),
(1, 'place', 'Petronas Twin Towers', 4.7, 'Kuala Lumpur City Centre', 2),
(1, 'place', 'Batu Caves', 4.5, 'Gombak, Selangor', 1);

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get full trip with all days and recommendations
-- SELECT 
--     t.*,
--     json_agg(DISTINCT td.*) as days,
--     json_agg(DISTINCT tr.*) as recommendations
-- FROM trips t
-- LEFT JOIN trip_days td ON t.id = td.trip_id
-- LEFT JOIN trip_recommendations tr ON t.id = tr.trip_id
-- WHERE t.user_id = 1
-- GROUP BY t.id;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
