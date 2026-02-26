import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export type Listing = {
  id: string
  farmer_phone: string
  crop_type: string
  quality_grade: 'A' | 'B' | 'C'
  quantity_kg: number
  location: string
  latitude: number | null
  longitude: number | null
  pincode: string | null
  address: string | null
  price_range_min: number
  price_range_max: number
  shelf_life_days: number
  image_url: string
  hindi_summary: string
  confidence_score: number
  quality_factors: {
    color: string
    surface: string
    uniformity: string
  }
  status: 'active' | 'sold' | 'expired'
  created_at: string
}

export type Buyer = {
  id: string
  buyer_name: string
  buyer_phone: string | null
  buyer_email: string | null
  pincode: string
  address: string
  latitude: number | null
  longitude: number | null
  created_at: string
}

export type Offer = {
  id: string
  listing_id: string
  buyer_id: string | null
  buyer_name: string
  buyer_phone: string | null
  price_per_kg: number
  total_amount: number
  pickup_time: string
  message: string | null
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}
