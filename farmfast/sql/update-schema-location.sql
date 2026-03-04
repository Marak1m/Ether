-- Add location fields to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Create buyers table for buyer profiles
CREATE TABLE IF NOT EXISTS public.buyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT,
  buyer_email TEXT,
  pincode TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;

-- Allow public access for demo
CREATE POLICY "Allow public on buyers"
  ON public.buyers FOR ALL
  USING (true);

-- Add buyer_id to offers table
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES public.buyers(id);

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS listings_location_idx ON public.listings(latitude, longitude);
CREATE INDEX IF NOT EXISTS buyers_location_idx ON public.buyers(latitude, longitude);
