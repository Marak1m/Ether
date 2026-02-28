-- Fix WhatsApp registration flow: ensure all required columns exist
-- Run this in your Supabase SQL Editor if address/pincode registration is broken

-- 1. Ensure farmers table exists with all required columns
CREATE TABLE IF NOT EXISTS public.farmers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  pincode TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  is_registered BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns that may be missing
ALTER TABLE public.farmers ADD COLUMN IF NOT EXISTS full_address TEXT;

-- Enable RLS + policies
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'farmers' AND policyname = 'Allow public on farmers'
  ) THEN
    CREATE POLICY "Allow public on farmers" ON public.farmers FOR ALL USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS farmers_phone_idx ON public.farmers(phone);

-- 2. Ensure chat_sessions has all required columns for registration flow
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS farmer_name TEXT;
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS farmer_location TEXT;
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS temp_full_address TEXT;
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS temp_pincode TEXT;

-- 3. Ensure listings table has location columns
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS farmer_id UUID;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS full_address TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
