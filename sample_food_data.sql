-- Sample Data for Food Section
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/eugltxikxnfibbxrjdch/sql

-- =====================================================
-- INSERT VENDORS (Food Stalls)
-- =====================================================
INSERT INTO vendors (name, type, location, is_open, rating) VALUES
('Campus Cafe', 'Cafe', 'Block A Ground Floor', true, 4.5),
('Mamak Corner', 'Malaysian', 'Food Court Level 1', true, 4.7),
('Noodle House', 'Chinese', 'Food Court Level 1', true, 4.3),
('Burger Station', 'Western', 'Block B Canteen', true, 4.2),
('Healthy Bites', 'Healthy', 'Library Building', true, 4.6),
('Roti House', 'Indian', 'Food Court Level 1', true, 4.4)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- INSERT FOOD CATEGORIES
-- =====================================================
INSERT INTO food_categories (vendor_id, name) 
SELECT v.id, 'Beverages' FROM vendors v WHERE v.name = 'Campus Cafe'
ON CONFLICT DO NOTHING;

INSERT INTO food_categories (vendor_id, name) 
SELECT v.id, 'Snacks' FROM vendors v WHERE v.name = 'Campus Cafe'
ON CONFLICT DO NOTHING;

INSERT INTO food_categories (vendor_id, name) 
SELECT v.id, 'Rice' FROM vendors v WHERE v.name = 'Mamak Corner'
ON CONFLICT DO NOTHING;

INSERT INTO food_categories (vendor_id, name) 
SELECT v.id, 'Noodles' FROM vendors v WHERE v.name = 'Mamak Corner'
ON CONFLICT DO NOTHING;

INSERT INTO food_categories (vendor_id, name) 
SELECT v.id, 'Noodles' FROM vendors v WHERE v.name = 'Noodle House'
ON CONFLICT DO NOTHING;

INSERT INTO food_categories (vendor_id, name) 
SELECT v.id, 'Rice' FROM vendors v WHERE v.name = 'Noodle House'
ON CONFLICT DO NOTHING;

INSERT INTO food_categories (vendor_id, name) 
SELECT v.id, 'Burgers' FROM vendors v WHERE v.name = 'Burger Station'
ON CONFLICT DO NOTHING;

INSERT INTO food_categories (vendor_id, name) 
SELECT v.id, 'Sides' FROM vendors v WHERE v.name = 'Burger Station'
ON CONFLICT DO NOTHING;

INSERT INTO food_categories (vendor_id, name) 
SELECT v.id, 'Salads' FROM vendors v WHERE v.name = 'Healthy Bites'
ON CONFLICT DO NOTHING;

INSERT INTO food_categories (vendor_id, name) 
SELECT v.id, 'Smoothies' FROM vendors v WHERE v.name = 'Healthy Bites'
ON CONFLICT DO NOTHING;

INSERT INTO food_categories (vendor_id, name) 
SELECT v.id, 'Breads' FROM vendors v WHERE v.name = 'Roti House'
ON CONFLICT DO NOTHING;

INSERT INTO food_categories (vendor_id, name) 
SELECT v.id, 'Curries' FROM vendors v WHERE v.name = 'Roti House'
ON CONFLICT DO NOTHING;

-- =====================================================
-- INSERT FOOD ITEMS
-- =====================================================

-- Campus Cafe Items
INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Iced Latte', 8.50, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Beverages'
WHERE v.name = 'Campus Cafe';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Hot Cappuccino', 7.00, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Beverages'
WHERE v.name = 'Campus Cafe';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Croissant', 5.50, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Snacks'
WHERE v.name = 'Campus Cafe';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Chocolate Muffin', 4.50, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Snacks'
WHERE v.name = 'Campus Cafe';

-- Mamak Corner Items
INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Nasi Lemak Special', 9.50, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Rice'
WHERE v.name = 'Mamak Corner';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Nasi Goreng Ayam', 10.00, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Rice'
WHERE v.name = 'Mamak Corner';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Mee Goreng Mamak', 8.50, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Noodles'
WHERE v.name = 'Mamak Corner';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Maggi Goreng', 7.50, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Noodles'
WHERE v.name = 'Mamak Corner';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Roti Canai', 3.00, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Rice'
WHERE v.name = 'Mamak Corner';

-- Noodle House Items
INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Wonton Mee Dry', 9.00, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Noodles'
WHERE v.name = 'Noodle House';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Char Kuey Teow', 10.50, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Noodles'
WHERE v.name = 'Noodle House';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Chicken Rice', 9.50, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Rice'
WHERE v.name = 'Noodle House';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Pan Mee Soup', 8.50, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Noodles'
WHERE v.name = 'Noodle House';

-- Burger Station Items
INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Classic Beef Burger', 12.50, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Burgers'
WHERE v.name = 'Burger Station';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Chicken Burger', 11.00, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Burgers'
WHERE v.name = 'Burger Station';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Double Cheese Burger', 15.00, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Burgers'
WHERE v.name = 'Burger Station';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'French Fries', 5.00, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Sides'
WHERE v.name = 'Burger Station';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Onion Rings', 6.00, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Sides'
WHERE v.name = 'Burger Station';

-- Healthy Bites Items
INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Caesar Salad', 12.00, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Salads'
WHERE v.name = 'Healthy Bites';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Greek Salad', 11.50, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Salads'
WHERE v.name = 'Healthy Bites';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Grilled Chicken Salad', 14.00, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Salads'
WHERE v.name = 'Healthy Bites';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Berry Smoothie', 9.00, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Smoothies'
WHERE v.name = 'Healthy Bites';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Green Detox Smoothie', 10.00, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Smoothies'
WHERE v.name = 'Healthy Bites';

-- Roti House Items
INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Roti Canai Plain', 2.50, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Breads'
WHERE v.name = 'Roti House';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Roti Telur', 4.00, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Breads'
WHERE v.name = 'Roti House';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Roti Planta', 3.50, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Breads'
WHERE v.name = 'Roti House';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Chicken Curry', 8.00, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Curries'
WHERE v.name = 'Roti House';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Dhal Curry', 6.00, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Curries'
WHERE v.name = 'Roti House';

INSERT INTO food_items (vendor_id, category_id, name, price, is_available, image_url)
SELECT v.id, c.id, 'Fish Head Curry', 18.00, true, NULL
FROM vendors v 
JOIN food_categories c ON c.vendor_id = v.id AND c.name = 'Curries'
WHERE v.name = 'Roti House';

-- Verify data was inserted
SELECT 'Vendors inserted:' as info, COUNT(*) as count FROM vendors;
SELECT 'Food categories inserted:' as info, COUNT(*) as count FROM food_categories;
SELECT 'Food items inserted:' as info, COUNT(*) as count FROM food_items;
