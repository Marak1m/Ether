-- ============================================================
-- FarmFast Demo Seed Data for Analytics Dashboard
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Fix RLS on mandi_prices so the server-side cron sync can write to it
ALTER TABLE public.mandi_prices DISABLE ROW LEVEL SECURITY;

-- 2. Demo farmers
INSERT INTO public.farmers (phone, name, location, full_address, pincode, latitude, longitude, is_registered, created_at)
VALUES
  ('+919876543210', 'Rajesh Kumar',  'Pune, Maharashtra',        'Kothrud, Pune, Maharashtra 411038',         '411001', 18.5204, 73.8567, true, NOW() - INTERVAL '90 days'),
  ('+919876543211', 'Suresh Patel',  'Nashik, Maharashtra',       'Gangapur Road, Nashik, Maharashtra 422005', '422001', 19.9975, 73.7898, true, NOW() - INTERVAL '75 days'),
  ('+919876543212', 'Amar Singh',    'Lucknow, Uttar Pradesh',    'Hazratganj, Lucknow, UP 226001',            '226001', 26.8467, 80.9462, true, NOW() - INTERVAL '60 days'),
  ('+919876543213', 'Priya Devi',    'Hyderabad, Telangana',      'Secunderabad, Hyderabad, Telangana 500003', '500001', 17.3850, 78.4867, true, NOW() - INTERVAL '55 days'),
  ('+919876543214', 'Mohan Yadav',   'Bhopal, Madhya Pradesh',   'MP Nagar, Bhopal, MP 462011',               '462001', 23.2599, 77.4126, true, NOW() - INTERVAL '45 days'),
  ('+919876543215', 'Kavita Sharma', 'Ahmedabad, Gujarat',        'Navrangpura, Ahmedabad, Gujarat 380009',    '380001', 23.0225, 72.5714, true, NOW() - INTERVAL '40 days')
ON CONFLICT (phone) DO NOTHING;

-- 3. Mandi prices — 30-day backfill using SIN for realistic price variation
INSERT INTO public.mandi_prices (crop_type, district, modal_price, min_price, max_price, price_date)
SELECT
  c.crop_type,
  d.district,
  ROUND(CAST(c.base_price * (0.88 + 0.24 * ABS(SIN(EXTRACT(DOY FROM gs.dt) * 1.7 + c.phase))) AS numeric), 2),
  ROUND(CAST(c.base_price * (0.72 + 0.18 * ABS(SIN(EXTRACT(DOY FROM gs.dt) * 1.7 + c.phase))) AS numeric), 2),
  ROUND(CAST(c.base_price * (1.05 + 0.30 * ABS(SIN(EXTRACT(DOY FROM gs.dt) * 1.7 + c.phase))) AS numeric), 2),
  gs.dt::date
FROM
  generate_series(NOW() - INTERVAL '29 days', NOW() - INTERVAL '1 day', '1 day') AS gs(dt)
  CROSS JOIN (VALUES
    ('Tomato',      12.0, 0.1),
    ('Onion',       18.0, 0.5),
    ('Potato',      15.0, 1.2),
    ('Rice',        28.0, 2.1),
    ('Cauliflower', 14.0, 0.7),
    ('Mango',       45.0, 3.3),
    ('Banana',      16.0, 1.8)
  ) AS c(crop_type, base_price, phase)
  CROSS JOIN (VALUES
    ('Pune'), ('Nashik'), ('Lucknow'), ('Hyderabad'), ('Bhopal'), ('Ahmedabad')
  ) AS d(district)
ON CONFLICT (crop_type, district, price_date) DO NOTHING;

-- 4. Historical listings + accepted offers (via CTE)
WITH inserted_listings AS (
  INSERT INTO public.listings
    (farmer_phone, crop_type, quality_grade, quantity_kg,
     price_range_min, price_range_max,
     location, latitude, longitude,
     status, auction_status,
     reserve_price, mandi_modal_price, auction_closes_at,
     hindi_summary, created_at, updated_at)
  VALUES
    -- Tomato (7 listings, mix of A/B/C, spread over 28 days)
    ('+919876543210','Tomato','A',500, 15,19,'Pune, Maharashtra',         18.5204,73.8567,'active','accepted',14.5,12.0, NOW()-INTERVAL '27 days 20 hours','टमाटर ग्रेड A पुणे से',       NOW()-INTERVAL '28 days',NOW()-INTERVAL '27 days 20 hours'),
    ('+919876543211','Tomato','B',300, 13,17,'Nashik, Maharashtra',        19.9975,73.7898,'active','accepted',12.5,11.5, NOW()-INTERVAL '24 days 20 hours','टमाटर ग्रेड B नासिक',        NOW()-INTERVAL '25 days',NOW()-INTERVAL '24 days 20 hours'),
    ('+919876543212','Tomato','A',750, 16,20,'Lucknow, Uttar Pradesh',     26.8467,80.9462,'active','accepted',14.8,12.2, NOW()-INTERVAL '20 days 20 hours','उत्तम टमाटर ग्रेड A',        NOW()-INTERVAL '21 days',NOW()-INTERVAL '20 days 20 hours'),
    ('+919876543210','Tomato','B',400, 12,16,'Pune, Maharashtra',          18.5204,73.8567,'active','accepted',13.0,11.8, NOW()-INTERVAL '16 days 20 hours','पुणे टमाटर ग्रेड B',         NOW()-INTERVAL '17 days',NOW()-INTERVAL '16 days 20 hours'),
    ('+919876543213','Tomato','A',600, 15,19,'Hyderabad, Telangana',       17.3850,78.4867,'active','accepted',14.5,12.5, NOW()-INTERVAL '11 days 20 hours','हैदराबाद टमाटर A',           NOW()-INTERVAL '12 days',NOW()-INTERVAL '11 days 20 hours'),
    ('+919876543211','Tomato','C',200, 10,13,'Nashik, Maharashtra',        19.9975,73.7898,'active','closed',  11.0,10.5, NOW()-INTERVAL '7 days 20 hours', 'टमाटर ग्रेड C',              NOW()-INTERVAL '8 days', NOW()-INTERVAL '7 days 20 hours'),
    ('+919876543214','Tomato','A',800, 16,20,'Bhopal, Madhya Pradesh',     23.2599,77.4126,'active','accepted',15.0,12.3, NOW()-INTERVAL '3 days 20 hours', 'भोपाल से ताजे टमाटर A',     NOW()-INTERVAL '4 days', NOW()-INTERVAL '3 days 20 hours'),
    -- Onion (6 listings)
    ('+919876543211','Onion','A',1000,22,27,'Nashik, Maharashtra',         19.9975,73.7898,'active','accepted',20.5,18.2, NOW()-INTERVAL '26 days 20 hours','नासिक प्याज A ग्रेड',        NOW()-INTERVAL '27 days',NOW()-INTERVAL '26 days 20 hours'),
    ('+919876543215','Onion','B',600, 19,24,'Ahmedabad, Gujarat',          23.0225,72.5714,'active','accepted',18.8,17.9, NOW()-INTERVAL '22 days 20 hours','गुजरात प्याज ग्रेड B',       NOW()-INTERVAL '23 days',NOW()-INTERVAL '22 days 20 hours'),
    ('+919876543210','Onion','A',800, 22,26,'Pune, Maharashtra',           18.5204,73.8567,'active','accepted',20.0,18.5, NOW()-INTERVAL '18 days 20 hours','पुणे प्याज उत्तम गुणवत्ता',  NOW()-INTERVAL '19 days',NOW()-INTERVAL '18 days 20 hours'),
    ('+919876543211','Onion','B',500, 18,23,'Nashik, Maharashtra',         19.9975,73.7898,'active','closed',  17.5,17.2, NOW()-INTERVAL '13 days 20 hours','नासिक प्याज B',              NOW()-INTERVAL '14 days',NOW()-INTERVAL '13 days 20 hours'),
    ('+919876543213','Onion','A',700, 22,27,'Hyderabad, Telangana',        17.3850,78.4867,'active','accepted',20.8,18.9, NOW()-INTERVAL '8 days 20 hours', 'हैदराबाद प्याज A',           NOW()-INTERVAL '9 days', NOW()-INTERVAL '8 days 20 hours'),
    ('+919876543215','Onion','C',300, 15,19,'Ahmedabad, Gujarat',          23.0225,72.5714,'active','closed',  16.5,16.8, NOW()-INTERVAL '4 days 20 hours', 'प्याज ग्रेड C गुजरात',      NOW()-INTERVAL '5 days', NOW()-INTERVAL '4 days 20 hours'),
    -- Potato (5 listings)
    ('+919876543212','Potato','B',800, 16,20,'Lucknow, Uttar Pradesh',     26.8467,80.9462,'active','accepted',15.5,14.8, NOW()-INTERVAL '25 days 20 hours','लखनऊ आलू ग्रेड B',          NOW()-INTERVAL '26 days',NOW()-INTERVAL '25 days 20 hours'),
    ('+919876543214','Potato','A',600, 18,22,'Bhopal, Madhya Pradesh',     23.2599,77.4126,'active','accepted',17.0,15.2, NOW()-INTERVAL '19 days 20 hours','भोपाल आलू A ग्रेड',         NOW()-INTERVAL '20 days',NOW()-INTERVAL '19 days 20 hours'),
    ('+919876543210','Potato','B',500, 16,20,'Pune, Maharashtra',          18.5204,73.8567,'active','accepted',15.8,14.5, NOW()-INTERVAL '13 days 20 hours','पुणे का आलू ग्रेड B',       NOW()-INTERVAL '14 days',NOW()-INTERVAL '13 days 20 hours'),
    ('+919876543213','Potato','A',700, 18,22,'Hyderabad, Telangana',       17.3850,78.4867,'active','accepted',17.2,15.6, NOW()-INTERVAL '7 days 20 hours', 'हैदराबाद आलू A',            NOW()-INTERVAL '8 days', NOW()-INTERVAL '7 days 20 hours'),
    ('+919876543212','Potato','C',300, 13,16,'Lucknow, Uttar Pradesh',     26.8467,80.9462,'active','closed',  13.5,14.2, NOW()-INTERVAL '2 days 20 hours', 'आलू ग्रेड C',               NOW()-INTERVAL '3 days', NOW()-INTERVAL '2 days 20 hours'),
    -- Rice (5 listings)
    ('+919876543212','Rice','A',500, 32,38,'Lucknow, Uttar Pradesh',       26.8467,80.9462,'active','accepted',30.5,28.2, NOW()-INTERVAL '27 days 20 hours','बासमती चावल ग्रेड A',       NOW()-INTERVAL '28 days',NOW()-INTERVAL '27 days 20 hours'),
    ('+919876543214','Rice','A',400, 33,39,'Bhopal, Madhya Pradesh',       23.2599,77.4126,'active','accepted',31.0,27.8, NOW()-INTERVAL '21 days 20 hours','भोपाल चावल A ग्रेड',        NOW()-INTERVAL '22 days',NOW()-INTERVAL '21 days 20 hours'),
    ('+919876543212','Rice','B',350, 28,34,'Lucknow, Uttar Pradesh',       26.8467,80.9462,'active','accepted',27.5,26.5, NOW()-INTERVAL '14 days 20 hours','चावल ग्रेड B लखनऊ',         NOW()-INTERVAL '15 days',NOW()-INTERVAL '14 days 20 hours'),
    ('+919876543213','Rice','A',600, 33,40,'Hyderabad, Telangana',         17.3850,78.4867,'active','accepted',31.5,29.0, NOW()-INTERVAL '8 days 20 hours', 'हैदराबाद चावल A उत्तम',    NOW()-INTERVAL '9 days', NOW()-INTERVAL '8 days 20 hours'),
    ('+919876543214','Rice','B',300, 28,33,'Bhopal, Madhya Pradesh',       23.2599,77.4126,'active','closed',  27.0,27.5, NOW()-INTERVAL '3 days 20 hours', 'चावल ग्रेड B भोपाल',       NOW()-INTERVAL '4 days', NOW()-INTERVAL '3 days 20 hours'),
    -- Cauliflower (5 listings)
    ('+919876543210','Cauliflower','A',300,17,21,'Pune, Maharashtra',      18.5204,73.8567,'active','accepted',16.2,13.8, NOW()-INTERVAL '23 days 20 hours','गोभी A ग्रेड पुणे',         NOW()-INTERVAL '24 days',NOW()-INTERVAL '23 days 20 hours'),
    ('+919876543211','Cauliflower','B',250,15,19,'Nashik, Maharashtra',    19.9975,73.7898,'active','accepted',14.5,13.2, NOW()-INTERVAL '17 days 20 hours','नासिक गोभी ग्रेड B',        NOW()-INTERVAL '18 days',NOW()-INTERVAL '17 days 20 hours'),
    ('+919876543215','Cauliflower','C',200,12,15,'Ahmedabad, Gujarat',     23.0225,72.5714,'active','closed',  13.0,12.5, NOW()-INTERVAL '11 days 20 hours','गोभी ग्रेड C',              NOW()-INTERVAL '12 days',NOW()-INTERVAL '11 days 20 hours'),
    ('+919876543210','Cauliflower','A',350,17,21,'Pune, Maharashtra',      18.5204,73.8567,'active','accepted',16.5,14.2, NOW()-INTERVAL '5 days 20 hours', 'गोभी A ग्रेड',              NOW()-INTERVAL '6 days', NOW()-INTERVAL '5 days 20 hours'),
    ('+919876543213','Cauliflower','B',280,15,19,'Hyderabad, Telangana',   17.3850,78.4867,'active','accepted',14.8,13.5, NOW()-INTERVAL '2 days 20 hours', 'हैदराबाद गोभी B',          NOW()-INTERVAL '3 days', NOW()-INTERVAL '2 days 20 hours'),
    -- Mango (4 listings)
    ('+919876543213','Mango','A',200,55,65,'Hyderabad, Telangana',         17.3850,78.4867,'active','accepted',52.0,45.5, NOW()-INTERVAL '22 days 20 hours','हापुस आम A ग्रेड',          NOW()-INTERVAL '23 days',NOW()-INTERVAL '22 days 20 hours'),
    ('+919876543210','Mango','A',150,56,66,'Pune, Maharashtra',            18.5204,73.8567,'active','accepted',53.0,46.0, NOW()-INTERVAL '15 days 20 hours','रत्नागिरी आम A',            NOW()-INTERVAL '16 days',NOW()-INTERVAL '15 days 20 hours'),
    ('+919876543211','Mango','B',180,48,58,'Nashik, Maharashtra',          19.9975,73.7898,'active','accepted',46.5,44.0, NOW()-INTERVAL '9 days 20 hours', 'नासिक आम ग्रेड B',         NOW()-INTERVAL '10 days',NOW()-INTERVAL '9 days 20 hours'),
    ('+919876543213','Mango','A',250,57,67,'Hyderabad, Telangana',         17.3850,78.4867,'active','accepted',54.0,46.8, NOW()-INTERVAL '4 days 20 hours', 'हैदराबाद आम A ग्रेड',      NOW()-INTERVAL '5 days', NOW()-INTERVAL '4 days 20 hours'),
    -- Banana (4 listings)
    ('+919876543215','Banana','A',600,20,25,'Ahmedabad, Gujarat',          23.0225,72.5714,'active','accepted',19.5,16.2, NOW()-INTERVAL '24 days 20 hours','गुजरात केला A ग्रेड',      NOW()-INTERVAL '25 days',NOW()-INTERVAL '24 days 20 hours'),
    ('+919876543214','Banana','B',500,18,22,'Bhopal, Madhya Pradesh',      23.2599,77.4126,'active','accepted',17.8,15.8, NOW()-INTERVAL '16 days 20 hours','भोपाल केला ग्रेड B',       NOW()-INTERVAL '17 days',NOW()-INTERVAL '16 days 20 hours'),
    ('+919876543215','Banana','A',700,21,26,'Ahmedabad, Gujarat',          23.0225,72.5714,'active','accepted',20.0,16.5, NOW()-INTERVAL '9 days 20 hours', 'ताजा केला A ग्रेड',        NOW()-INTERVAL '10 days',NOW()-INTERVAL '9 days 20 hours'),
    ('+919876543214','Banana','B',450,18,22,'Bhopal, Madhya Pradesh',      23.2599,77.4126,'active','closed',  17.5,15.5, NOW()-INTERVAL '3 days 20 hours', 'केला ग्रेड B भोपाल',       NOW()-INTERVAL '4 days', NOW()-INTERVAL '3 days 20 hours')
  RETURNING id, crop_type, quality_grade, mandi_modal_price, quantity_kg, created_at, auction_status
),
-- 5. Accepted offers for the historical 'accepted' listings
accepted_listings AS (
  SELECT * FROM inserted_listings WHERE auction_status = 'accepted'
)
INSERT INTO public.offers
  (listing_id, buyer_name, buyer_phone, price_per_kg, quantity_kg,
   status, pickup_window, message, created_at)
SELECT
  al.id,
  (ARRAY['Raj Traders','Sharma Foods','Patel Exports','Kumar Agri','Singh Wholesale','Mehta Trading'])
    [1 + (EXTRACT(DAY FROM al.created_at)::int % 6)],
  '+91980000' || LPAD((EXTRACT(DAY FROM al.created_at)::int * 13 + 1000)::text, 4, '0'),
  -- FarmFast price: mandi + 18-28% premium (varies by crop phase)
  ROUND(CAST(al.mandi_modal_price * (1.18 + 0.10 * ABS(SIN(EXTRACT(DOY FROM al.created_at)))) AS numeric), 2),
  al.quantity_kg,
  'accepted',
  (ARRAY['Today morning (8 AM - 12 PM)','Today afternoon (12 PM - 5 PM)',
         'Tomorrow morning (8 AM - 12 PM)','Today evening (5 PM - 8 PM)'])
    [1 + (EXTRACT(DAY FROM al.created_at)::int % 4)],
  'Offer accepted via FarmFast platform',
  -- First offer arrives 20-55 minutes after listing
  al.created_at + INTERVAL '20 minutes'
    + (EXTRACT(DAY FROM al.created_at)::int % 35 * INTERVAL '1 minute')
FROM accepted_listings al;

-- 6. Currently OPEN listings for the Supply Overview tab
INSERT INTO public.listings
  (farmer_phone, crop_type, quality_grade, quantity_kg,
   price_range_min, price_range_max,
   location, latitude, longitude,
   status, auction_status,
   reserve_price, mandi_modal_price, auction_closes_at,
   hindi_summary, created_at, updated_at)
VALUES
  ('+919876543210','Tomato',     'A',600, 15,20,'Pune, Maharashtra',        18.5204,73.8567,'active','open',14.5,12.2, NOW()+INTERVAL '85 minutes', 'ताजे टमाटर A ग्रेड',NOW()-INTERVAL '35 minutes',NOW()-INTERVAL '35 minutes'),
  ('+919876543211','Onion',      'B',800, 19,24,'Nashik, Maharashtra',       19.9975,73.7898,'active','open',18.5,17.8, NOW()+INTERVAL '75 minutes', 'नासिक प्याज B',     NOW()-INTERVAL '45 minutes',NOW()-INTERVAL '45 minutes'),
  ('+919876543212','Potato',     'A',500, 18,22,'Lucknow, Uttar Pradesh',    26.8467,80.9462,'active','open',17.0,15.5, NOW()+INTERVAL '90 minutes', 'लखनऊ आलू A',       NOW()-INTERVAL '30 minutes',NOW()-INTERVAL '30 minutes'),
  ('+919876543213','Mango',      'A',200, 55,66,'Hyderabad, Telangana',      17.3850,78.4867,'active','open',52.5,46.2, NOW()+INTERVAL '60 minutes', 'हैदराबाद आम A',    NOW()-INTERVAL '60 minutes',NOW()-INTERVAL '60 minutes'),
  ('+919876543214','Cauliflower','B',350, 15,19,'Bhopal, Madhya Pradesh',    23.2599,77.4126,'active','open',14.2,13.0, NOW()+INTERVAL '100 minutes','भोपाल गोभी B',     NOW()-INTERVAL '20 minutes',NOW()-INTERVAL '20 minutes'),
  ('+919876543215','Banana',     'A',700, 20,26,'Ahmedabad, Gujarat',        23.0225,72.5714,'active','open',19.8,16.5, NOW()+INTERVAL '70 minutes', 'गुजरात केला A',    NOW()-INTERVAL '50 minutes',NOW()-INTERVAL '50 minutes'),
  ('+919876543210','Rice',       'A',400, 32,39,'Pune, Maharashtra',         18.5204,73.8567,'active','open',30.5,28.5, NOW()+INTERVAL '95 minutes', 'पुणे चावल A',      NOW()-INTERVAL '25 minutes',NOW()-INTERVAL '25 minutes'),
  ('+919876543211','Tomato',     'B',300, 13,17,'Nashik, Maharashtra',       19.9975,73.7898,'active','open',12.8,11.9, NOW()+INTERVAL '110 minutes','नासिक टमाटर B',    NOW()-INTERVAL '10 minutes',NOW()-INTERVAL '10 minutes'),
  ('+919876543213','Onion',      'A',900, 22,27,'Hyderabad, Telangana',      17.3850,78.4867,'active','open',21.0,18.8, NOW()+INTERVAL '80 minutes', 'हैदराबाद प्याज A', NOW()-INTERVAL '40 minutes',NOW()-INTERVAL '40 minutes'),
  ('+919876543214','Potato',     'B',450, 16,20,'Bhopal, Madhya Pradesh',    23.2599,77.4126,'active','open',15.5,15.2, NOW()+INTERVAL '65 minutes', 'भोपाल आलू B',      NOW()-INTERVAL '55 minutes',NOW()-INTERVAL '55 minutes');

-- 7. Pending offers on some open listings (shows offer_count > 0)
INSERT INTO public.offers
  (listing_id, buyer_name, buyer_phone, price_per_kg, quantity_kg, status, pickup_window, message, created_at)
SELECT
  l.id,
  'Raj Traders',
  '+919800000001',
  l.reserve_price + 1.5,
  l.quantity_kg,
  'pending',
  'Today afternoon (12 PM - 5 PM)',
  'Interested in bulk purchase',
  NOW() - INTERVAL '5 minutes'
FROM public.listings l
WHERE l.auction_status = 'open'
  AND l.crop_type IN ('Tomato', 'Mango', 'Rice')
  AND l.created_at > NOW() - INTERVAL '2 hours';

-- Summary
SELECT
  (SELECT count(*) FROM public.farmers WHERE phone LIKE '+91987654321%') AS demo_farmers,
  (SELECT count(*) FROM public.mandi_prices WHERE price_date < CURRENT_DATE) AS mandi_price_history_rows,
  (SELECT count(*) FROM public.listings WHERE created_at < NOW() - INTERVAL '2 hours') AS historical_listings,
  (SELECT count(*) FROM public.listings WHERE auction_status = 'open') AS open_listings,
  (SELECT count(*) FROM public.offers WHERE status = 'accepted') AS accepted_offers,
  (SELECT count(*) FROM public.offers WHERE status = 'pending') AS pending_offers;
