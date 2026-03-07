-- Make pincode column nullable in buyers table.
-- Previously had NOT NULL constraint which blocked registration
-- when a buyer did not supply a pincode.

ALTER TABLE public.buyers
  ALTER COLUMN pincode DROP NOT NULL;

-- Also make phone and address nullable to match the registration form
-- (these are collected but should not block account creation if omitted)
ALTER TABLE public.buyers
  ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE public.buyers
  ALTER COLUMN address DROP NOT NULL;
