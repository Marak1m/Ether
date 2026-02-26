-- Add rating fields to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS farmer_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Add rating fields to buyers table
ALTER TABLE public.buyers 
ADD COLUMN IF NOT EXISTS buyer_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Create ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES public.buyers(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  rating_type VARCHAR(10) NOT NULL CHECK (rating_type IN ('farmer', 'buyer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(offer_id, rating_type)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS ratings_listing_id_idx ON public.ratings(listing_id);
CREATE INDEX IF NOT EXISTS ratings_buyer_id_idx ON public.ratings(buyer_id);
CREATE INDEX IF NOT EXISTS ratings_offer_id_idx ON public.ratings(offer_id);

-- Enable RLS
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view ratings" ON public.ratings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create ratings" ON public.ratings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
