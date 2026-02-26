-- Insert test listings for FarmFast
-- Run this in Supabase SQL Editor to see data on the dashboard

INSERT INTO public.listings (
  farmer_phone, crop_type, quality_grade, quantity_kg,
  location, price_range_min, price_range_max, shelf_life_days,
  image_url, hindi_summary, confidence_score,
  quality_factors, status
) VALUES 
(
  '+919876543210', 
  'Tomato', 
  'A', 
  500,
  'Pune, Maharashtra', 
  18, 
  20, 
  7,
  'https://images.unsplash.com/photo-1546470427-227e2e1e8c8e?w=400',
  'आपके टमाटर A ग्रेड के हैं। बहुत अच्छी क्वालिटी है।',
  92,
  '{"color": "Vibrant red color", "surface": "No visible defects", "uniformity": "Highly uniform size"}',
  'active'
),
(
  '+919876543211', 
  'Onion', 
  'B', 
  750,
  'Nashik, Maharashtra', 
  25, 
  28, 
  14,
  'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400',
  'आपके प्याज B ग्रेड के हैं। अच्छी क्वालिटी है।',
  85,
  '{"color": "Good golden color", "surface": "Minor surface marks", "uniformity": "Mostly uniform"}',
  'active'
),
(
  '+919876543212', 
  'Potato', 
  'B', 
  1000,
  'Satara, Maharashtra', 
  12, 
  14, 
  21,
  'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400',
  'आपके आलू B ग्रेड के हैं। अच्छी क्वालिटी है।',
  88,
  '{"color": "Healthy brown color", "surface": "Few minor blemishes", "uniformity": "Good size consistency"}',
  'active'
),
(
  '+919876543213', 
  'Mango', 
  'A', 
  300,
  'Ratnagiri, Maharashtra', 
  80, 
  90, 
  5,
  'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400',
  'आपके आम A ग्रेड के हैं। प्रीमियम क्वालिटी है।',
  95,
  '{"color": "Perfect golden yellow", "surface": "Flawless skin", "uniformity": "Excellent uniformity"}',
  'active'
),
(
  '+919876543214', 
  'Cabbage', 
  'C', 
  600,
  'Kolhapur, Maharashtra', 
  8, 
  10, 
  10,
  'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400',
  'आपकी पत्तागोभी C ग्रेड की है। तुरंत बिक्री के लिए उपयुक्त।',
  75,
  '{"color": "Acceptable green", "surface": "Some outer leaf damage", "uniformity": "Variable sizes"}',
  'active'
);
