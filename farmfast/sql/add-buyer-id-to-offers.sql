-- Add buyer_id column to offers table so we can link offers back to registered buyers.
-- This is nullable — anonymous buyers (not logged in via web) will have buyer_id = NULL.

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Also add pickup_window and pickup_date columns if they are missing
-- (they were added after the initial schema was created)
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS pickup_window TEXT;

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS pickup_date DATE;

-- Index for fast buyer lookup
CREATE INDEX IF NOT EXISTS offers_buyer_id_idx ON public.offers(buyer_id);
