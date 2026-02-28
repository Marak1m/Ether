-- FarmFast Demo Data: Seed realistic data for hackathon demo
-- Run this in your Supabase SQL Editor AFTER running fix-registration-schema.sql

-- ============================================================
-- 1. MOCK FARMERS (3 farmers across different Indian states)
-- ============================================================
INSERT INTO public.farmers (phone, name, full_address, location, pincode, latitude, longitude)
VALUES
  ('+919876543210', 'Ramesh Patil', 'गाँव खेड़ा, तालुका हवेली, जिला पुणे, महाराष्ट्र', 'Pune, Maharashtra, India', '411001', 18.5204, 73.8567),
  ('+919876543211', 'Gurpreet Singh', 'गाँव मोगा, जिला मोगा, पंजाब', 'Moga, Punjab, India', '142001', 30.8103, 75.1726),
  ('+919876543212', 'Aarti Devi', 'गाँव सीतापुर, जिला लखनऊ, उत्तर प्रदेश', 'Lucknow, Uttar Pradesh, India', '226001', 26.8467, 80.9462)
ON CONFLICT (phone) DO NOTHING;

-- ============================================================
-- 2. MOCK BUYERS (2 buyers with profiles)
-- ============================================================
INSERT INTO public.buyers (buyer_name, buyer_phone, buyer_email, pincode, address, latitude, longitude)
VALUES
  ('Raj Traders Pvt Ltd', '+919988776655', 'raj@rajtraders.com', '411037', 'APMC Market, Gultekdi, Pune, Maharashtra', 18.4973, 73.8715),
  ('Fresh Harvest Co.', '+919988776644', 'info@freshharvestco.in', '400070', 'Vashi APMC, Navi Mumbai, Maharashtra', 19.0760, 72.9981)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. MOCK LISTINGS (12 diverse listings, spread over 30 days)
-- ============================================================

-- Get farmer IDs
DO $$
DECLARE
  f1_id UUID;
  f2_id UUID;
  f3_id UUID;
  b1_id UUID;
  b2_id UUID;
  l1_id UUID;
  l2_id UUID;
  l3_id UUID;
  l4_id UUID;
  l5_id UUID;
  l6_id UUID;
  l7_id UUID;
  l8_id UUID;
  l9_id UUID;
  l10_id UUID;
  l11_id UUID;
  l12_id UUID;
BEGIN
  SELECT id INTO f1_id FROM public.farmers WHERE phone = '+919876543210';
  SELECT id INTO f2_id FROM public.farmers WHERE phone = '+919876543211';
  SELECT id INTO f3_id FROM public.farmers WHERE phone = '+919876543212';
  SELECT id INTO b1_id FROM public.buyers WHERE buyer_name = 'Raj Traders Pvt Ltd';
  SELECT id INTO b2_id FROM public.buyers WHERE buyer_name = 'Fresh Harvest Co.';

  -- Listing 1: Tomatoes Grade A (Pune, 2 days ago)
  INSERT INTO public.listings (farmer_phone, farmer_id, crop_type, quality_grade, quantity_kg, location, full_address, pincode, latitude, longitude, price_range_min, price_range_max, shelf_life_days, confidence_score, hindi_summary, quality_factors, status, image_url, created_at)
  VALUES ('+919876543210', f1_id, 'Tomato', 'A', 500, 'Pune, Maharashtra, India', 'गाँव खेड़ा, पुणे', '411001', 18.5204, 73.8567, 18, 22, 7, 92, '🌟 बहुत बढ़िया टमाटर! ताज़ा, चमकदार लाल रंग, कोई दाग नहीं।', '{"color": "Vibrant red", "surface": "Smooth, no blemishes", "uniformity": "Excellent size consistency"}', 'active', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tomato_je.jpg/400px-Tomato_je.jpg', NOW() - INTERVAL '2 days')
  RETURNING id INTO l1_id;

  -- Listing 2: Onion Grade B (Pune, 5 days ago)
  INSERT INTO public.listings (farmer_phone, farmer_id, crop_type, quality_grade, quantity_kg, location, full_address, pincode, latitude, longitude, price_range_min, price_range_max, shelf_life_days, confidence_score, hindi_summary, quality_factors, status, image_url, created_at)
  VALUES ('+919876543210', f1_id, 'Onion', 'B', 800, 'Pune, Maharashtra, India', 'गाँव खेड़ा, पुणे', '411001', 18.5204, 73.8567, 14, 18, 21, 78, '✅ अच्छी गुणवत्ता के प्याज़। कुछ छोटे दाग हैं लेकिन बाज़ार के लिए ठीक है।', '{"color": "Golden brown", "surface": "Minor marks", "uniformity": "Good consistency"}', 'active', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Onion_on_White.JPG/400px-Onion_on_White.JPG', NOW() - INTERVAL '5 days')
  RETURNING id INTO l2_id;

  -- Listing 3: Wheat Grade A (Punjab, 3 days ago)
  INSERT INTO public.listings (farmer_phone, farmer_id, crop_type, quality_grade, quantity_kg, location, full_address, pincode, latitude, longitude, price_range_min, price_range_max, shelf_life_days, confidence_score, hindi_summary, quality_factors, status, image_url, created_at)
  VALUES ('+919876543211', f2_id, 'Wheat', 'A', 2000, 'Moga, Punjab, India', 'गाँव मोगा, पंजाब', '142001', 30.8103, 75.1726, 24, 28, 180, 88, '🌟 प्रीमियम गेहूं! साफ दाने, अच्छी नमी, बेहतरीन गुणवत्ता।', '{"color": "Golden amber", "surface": "Clean, no debris", "uniformity": "Uniform grain size"}', 'active', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Wheat_close-up.JPG/400px-Wheat_close-up.JPG', NOW() - INTERVAL '3 days')
  RETURNING id INTO l3_id;

  -- Listing 4: Rice Grade B (UP, 7 days ago)
  INSERT INTO public.listings (farmer_phone, farmer_id, crop_type, quality_grade, quantity_kg, location, full_address, pincode, latitude, longitude, price_range_min, price_range_max, shelf_life_days, confidence_score, hindi_summary, quality_factors, status, image_url, created_at)
  VALUES ('+919876543212', f3_id, 'Rice', 'B', 1500, 'Lucknow, Uttar Pradesh, India', 'सीतापुर, लखनऊ', '226001', 26.8467, 80.9462, 32, 38, 365, 82, '✅ अच्छी गुणवत्ता का चावल। कुछ टूटे दाने हैं पर ज़्यादातर ठीक है।', '{"color": "White, slight yellow tinge", "surface": "Some broken grains", "uniformity": "Mostly uniform"}', 'active', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/White_rice.jpg/400px-White_rice.jpg', NOW() - INTERVAL '7 days')
  RETURNING id INTO l4_id;

  -- Listing 5: Potato Grade B (UP, 10 days ago)
  INSERT INTO public.listings (farmer_phone, farmer_id, crop_type, quality_grade, quantity_kg, location, full_address, pincode, latitude, longitude, price_range_min, price_range_max, shelf_life_days, confidence_score, hindi_summary, quality_factors, status, image_url, created_at)
  VALUES ('+919876543212', f3_id, 'Potato', 'B', 1000, 'Lucknow, Uttar Pradesh, India', 'सीतापुर, लखनऊ', '226001', 26.8467, 80.9462, 12, 16, 30, 75, '✅ ठीक-ठाक आलू। कुछ छोटे हैं लेकिन ज़्यादातर बाज़ार योग्य।', '{"color": "Light brown", "surface": "Some soil residue", "uniformity": "Variable sizes"}', 'sold', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Patates.jpg/400px-Patates.jpg', NOW() - INTERVAL '10 days')
  RETURNING id INTO l5_id;

  -- Listing 6: Mango Grade A (Maharashtra, 8 days ago)
  INSERT INTO public.listings (farmer_phone, farmer_id, crop_type, quality_grade, quantity_kg, location, full_address, pincode, latitude, longitude, price_range_min, price_range_max, shelf_life_days, confidence_score, hindi_summary, quality_factors, status, image_url, created_at)
  VALUES ('+919876543210', f1_id, 'Mango', 'A', 300, 'Pune, Maharashtra, India', 'गाँव खेड़ा, पुणे', '411001', 18.5204, 73.8567, 60, 80, 5, 95, '🌟 शानदार आम! पूरे पके हुए, मीठी खुशबू, प्रीमियम क्वालिटी।', '{"color": "Golden yellow", "surface": "Smooth, unblemished", "uniformity": "Excellent"}', 'sold', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Hapus_Mango.jpg/400px-Hapus_Mango.jpg', NOW() - INTERVAL '8 days')
  RETURNING id INTO l6_id;

  -- Listing 7: Cauliflower Grade C (Punjab, 12 days ago)
  INSERT INTO public.listings (farmer_phone, farmer_id, crop_type, quality_grade, quantity_kg, location, full_address, pincode, latitude, longitude, price_range_min, price_range_max, shelf_life_days, confidence_score, hindi_summary, quality_factors, status, image_url, created_at)
  VALUES ('+919876543211', f2_id, 'Cauliflower', 'C', 400, 'Moga, Punjab, India', 'गाँव मोगा, पंजाब', '142001', 30.8103, 75.1726, 8, 12, 4, 60, '👍 ठीक है, पर कुछ पत्तियां पीली हैं। कम भाव मिलेगा।', '{"color": "White with yellow spots", "surface": "Some browning", "uniformity": "Varied sizes"}', 'active', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Cauliflower.JPG/400px-Cauliflower.JPG', NOW() - INTERVAL '12 days')
  RETURNING id INTO l7_id;

  -- Listing 8: Green Chili Grade B (UP, 15 days ago)
  INSERT INTO public.listings (farmer_phone, farmer_id, crop_type, quality_grade, quantity_kg, location, full_address, pincode, latitude, longitude, price_range_min, price_range_max, shelf_life_days, confidence_score, hindi_summary, quality_factors, status, image_url, created_at)
  VALUES ('+919876543212', f3_id, 'Green Chili', 'B', 200, 'Lucknow, Uttar Pradesh, India', 'सीतापुर, लखनऊ', '226001', 26.8467, 80.9462, 25, 35, 7, 80, '✅ अच्छी मिर्च! हरी और ताज़ा, थोड़ी मुड़ी हुई पर ठीक है।', '{"color": "Bright green", "surface": "Firm", "uniformity": "Some curved"}', 'active', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/GreenChillies.jpg/400px-GreenChillies.jpg', NOW() - INTERVAL '15 days')
  RETURNING id INTO l8_id;

  -- Listing 9: Tomato Grade C (Punjab, 18 days ago)
  INSERT INTO public.listings (farmer_phone, farmer_id, crop_type, quality_grade, quantity_kg, location, full_address, pincode, latitude, longitude, price_range_min, price_range_max, shelf_life_days, confidence_score, hindi_summary, quality_factors, status, image_url, created_at)
  VALUES ('+919876543211', f2_id, 'Tomato', 'C', 600, 'Moga, Punjab, India', 'गाँव मोगा, पंजाब', '142001', 30.8103, 75.1726, 8, 12, 3, 55, '👍 ये टमाटर प्रोसेसिंग के लिए ठीक हैं, कुछ नरम और दाग वाले।', '{"color": "Uneven red-green", "surface": "Soft spots", "uniformity": "Mixed sizes"}', 'expired', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tomato_je.jpg/400px-Tomato_je.jpg', NOW() - INTERVAL '18 days')
  RETURNING id INTO l9_id;

  -- Listing 10: Onion Grade A (Maharashtra, 20 days ago)
  INSERT INTO public.listings (farmer_phone, farmer_id, crop_type, quality_grade, quantity_kg, location, full_address, pincode, latitude, longitude, price_range_min, price_range_max, shelf_life_days, confidence_score, hindi_summary, quality_factors, status, image_url, created_at)
  VALUES ('+919876543210', f1_id, 'Onion', 'A', 1200, 'Pune, Maharashtra, India', 'गाँव खेड़ा, पुणे', '411001', 18.5204, 73.8567, 20, 25, 30, 90, '🌟 प्रीमियम प्याज़! बड़े, चमकदार, कोई दाग नहीं।', '{"color": "Deep golden", "surface": "Perfect skin", "uniformity": "Large, uniform"}', 'sold', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Onion_on_White.JPG/400px-Onion_on_White.JPG', NOW() - INTERVAL '20 days')
  RETURNING id INTO l10_id;

  -- Listing 11: Wheat Grade B (UP, 22 days ago)
  INSERT INTO public.listings (farmer_phone, farmer_id, crop_type, quality_grade, quantity_kg, location, full_address, pincode, latitude, longitude, price_range_min, price_range_max, shelf_life_days, confidence_score, hindi_summary, quality_factors, status, image_url, created_at)
  VALUES ('+919876543212', f3_id, 'Wheat', 'B', 1800, 'Lucknow, Uttar Pradesh, India', 'सीतापुर, लखनऊ', '226001', 26.8467, 80.9462, 20, 24, 150, 76, '✅ ठीक-ठाक गेहूं। कुछ कंकड़ हैं, सफाई ज़रूरी।', '{"color": "Light amber", "surface": "Some debris", "uniformity": "Mostly uniform"}', 'active', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Wheat_close-up.JPG/400px-Wheat_close-up.JPG', NOW() - INTERVAL '22 days')
  RETURNING id INTO l11_id;

  -- Listing 12: Rice Grade A (Punjab, 25 days ago)
  INSERT INTO public.listings (farmer_phone, farmer_id, crop_type, quality_grade, quantity_kg, location, full_address, pincode, latitude, longitude, price_range_min, price_range_max, shelf_life_days, confidence_score, hindi_summary, quality_factors, status, image_url, created_at)
  VALUES ('+919876543211', f2_id, 'Rice', 'A', 2500, 'Moga, Punjab, India', 'गाँव मोगा, पंजाब', '142001', 30.8103, 75.1726, 40, 48, 365, 91, '🌟 बासमती चावल! लंबे दाने, खुशबूदार, प्रीमियम क्वालिटी।', '{"color": "Pure white", "surface": "Clean, polished", "uniformity": "Long, uniform grains"}', 'sold', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/White_rice.jpg/400px-White_rice.jpg', NOW() - INTERVAL '25 days')
  RETURNING id INTO l12_id;

  -- ============================================================
  -- 4. MOCK OFFERS (8 offers on various listings)
  -- ============================================================

  -- Offers on Tomato Grade A (l1)
  INSERT INTO public.offers (listing_id, buyer_id, buyer_name, buyer_phone, price_per_kg, total_amount, pickup_time, message, status, created_at)
  VALUES
    (l1_id, b1_id, 'Raj Traders Pvt Ltd', '+919988776655', 20.00, 10000.00, 'आज शाम 4 बजे', 'ताज़ा टमाटर चाहिए, तुरंत भुगतान करूंगा', 'pending', NOW() - INTERVAL '1 day'),
    (l1_id, b2_id, 'Fresh Harvest Co.', '+919988776644', 21.50, 10750.00, 'कल सुबह 8 बजे', 'प्रीमियम ग्रेड A के लिए अच्छा भाव दे रहे हैं', 'pending', NOW() - INTERVAL '1 day');

  -- Offer on Onion Grade B (l2)
  INSERT INTO public.offers (listing_id, buyer_id, buyer_name, buyer_phone, price_per_kg, total_amount, pickup_time, message, status, created_at)
  VALUES (l2_id, b1_id, 'Raj Traders Pvt Ltd', '+919988776655', 16.00, 12800.00, 'कल दोपहर तक', '800 किलो प्याज़ चाहिए', 'pending', NOW() - INTERVAL '4 days');

  -- Offer on Wheat Grade A (l3)
  INSERT INTO public.offers (listing_id, buyer_id, buyer_name, buyer_phone, price_per_kg, total_amount, pickup_time, message, status, created_at)
  VALUES (l3_id, b2_id, 'Fresh Harvest Co.', '+919988776644', 26.00, 52000.00, '3 दिन में पिकअप', 'पूरा 2000 किलो चाहिए', 'pending', NOW() - INTERVAL '2 days');

  -- Offers on Potato Grade B (l5 - sold)
  INSERT INTO public.offers (listing_id, buyer_id, buyer_name, buyer_phone, price_per_kg, total_amount, pickup_time, message, status, created_at)
  VALUES (l5_id, b1_id, 'Raj Traders Pvt Ltd', '+919988776655', 14.00, 14000.00, 'पिकअप हो गया', 'अच्छे आलू मिले', 'accepted', NOW() - INTERVAL '9 days');

  -- Offers on Mango Grade A (l6 - sold)
  INSERT INTO public.offers (listing_id, buyer_id, buyer_name, buyer_phone, price_per_kg, total_amount, pickup_time, message, status, created_at)
  VALUES
    (l6_id, b2_id, 'Fresh Harvest Co.', '+919988776644', 75.00, 22500.00, 'अगले दिन', 'हापुस आम बहुत अच्छे हैं!', 'accepted', NOW() - INTERVAL '7 days'),
    (l6_id, b1_id, 'Raj Traders Pvt Ltd', '+919988776655', 65.00, 19500.00, '2 दिन में', 'पक्का भाव', 'rejected', NOW() - INTERVAL '7 days');

  -- Offer on Onion Grade A (l10 - sold)
  INSERT INTO public.offers (listing_id, buyer_id, buyer_name, buyer_phone, price_per_kg, total_amount, pickup_time, message, status, created_at)
  VALUES (l10_id, b2_id, 'Fresh Harvest Co.', '+919988776644', 23.00, 27600.00, 'उसी दिन पिकअप', 'प्रीमियम प्याज़ लूंगा', 'accepted', NOW() - INTERVAL '19 days');

END $$;
