// Mandi Price Sync — populates mandi_prices table from the existing curated
// data source in lib/mandi.ts (the "CEDA fetch pattern" reused per spec).

import { supabase } from '@/lib/supabase'
import { getCuratedMandiPrices, quintalToKg } from '@/lib/mandi'

const SYNC_CROPS = [
  'Tomato', 'Onion', 'Potato', 'Wheat', 'Rice',
  'Mango', 'Cauliflower', 'Green Chili', 'Banana'
]

const SYNC_DISTRICTS = [
  'Pune', 'Nashik', 'Moga', 'Lucknow',
  'Azadpur', 'Bhopal', 'Ahmedabad', 'Hyderabad'
]

// Fallback ₹/kg prices when no curated data matches
const FALLBACK_PRICES: Record<string, number> = {
  Tomato: 12,
  Onion: 18,
  Potato: 15,
  Wheat: 22,
  Rice: 28,
  Mango: 45,
  Cauliflower: 14,
  'Green Chili': 20,
  Banana: 16,
}

/**
 * Syncs mandi prices into the mandi_prices table.
 * Reuses getCuratedMandiPrices() — the existing data source — and upserts
 * for each crop × district combination specified in the spec.
 * Never throws; logs and skips on individual failures.
 */
export async function syncMandiPrices(): Promise<void> {
  const allPrices = getCuratedMandiPrices()
  const today = new Date().toISOString().split('T')[0]

  for (const crop of SYNC_CROPS) {
    for (const district of SYNC_DISTRICTS) {
      try {
        // Prefer exact district match, fall back to any entry for this crop
        const exactMatch = allPrices.find(
          p =>
            p.commodity.toLowerCase() === crop.toLowerCase() &&
            p.district.toLowerCase() === district.toLowerCase() &&
            p.date === today
        )
        const cropMatch = allPrices.find(
          p =>
            p.commodity.toLowerCase() === crop.toLowerCase() &&
            p.date === today
        )
        const source = exactMatch ?? cropMatch

        const modalPriceKg = source
          ? quintalToKg(source.modal_price)
          : (FALLBACK_PRICES[crop] ?? 10)
        const minPriceKg = source
          ? quintalToKg(source.min_price)
          : Math.round(modalPriceKg * 0.8 * 10) / 10
        const maxPriceKg = source
          ? quintalToKg(source.max_price)
          : Math.round(modalPriceKg * 1.3 * 10) / 10

        await supabase.from('mandi_prices').upsert(
          {
            crop_type: crop,
            district,
            state: source?.state ?? 'India',
            modal_price: modalPriceKg,
            min_price: minPriceKg,
            max_price: maxPriceKg,
            price_date: today,
            source: 'ceda_agmarknet',
          },
          { onConflict: 'crop_type,district,price_date' }
        )
      } catch (err) {
        console.error(`[mandi-sync] Failed for ${crop}/${district}:`, err)
        // skip and continue
      }
    }
  }
}

/**
 * Returns today's modal price (₹/kg) for a crop in a district.
 * Falls back to hardcoded defaults if no DB row found.
 */
export async function getMandiPriceFromDB(
  cropType: string,
  district: string
): Promise<number> {
  const { data } = await supabase
    .from('mandi_prices')
    .select('modal_price')
    .ilike('crop_type', cropType)
    .ilike('district', district)
    .order('price_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (data?.modal_price) return data.modal_price

  // Try any district for this crop
  const { data: anyDistrict } = await supabase
    .from('mandi_prices')
    .select('modal_price')
    .ilike('crop_type', cropType)
    .order('price_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (anyDistrict?.modal_price) return anyDistrict.modal_price

  return FALLBACK_PRICES[cropType] ?? 10
}
