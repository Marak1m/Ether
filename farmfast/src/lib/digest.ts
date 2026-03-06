/* eslint-disable @typescript-eslint/no-explicit-any */
// Weekly farmer digest — compares FarmFast earnings to mandi rates
// and sends a summary WhatsApp message every Monday morning.

import { supabase } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/twilio'

export async function sendWeeklyDigest(farmerPhone: string): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Query sold/accepted listings for this farmer in the last 7 days
  const { data: listings } = await supabase
    .from('listings')
    .select('id, quantity_kg, mandi_modal_price, auction_status, status, crop_type, quality_grade')
    .eq('farmer_phone', farmerPhone)
    .gte('created_at', sevenDaysAgo)
    .or('status.eq.sold,auction_status.eq.accepted')

  if (!listings || listings.length === 0) return // nothing to report

  const listingIds = listings.map(l => l.id)

  // Get accepted offers for those listings
  const { data: offers } = await supabase
    .from('offers')
    .select('listing_id, price_per_kg, total_amount')
    .in('listing_id', listingIds)
    .eq('status', 'accepted')

  if (!offers || offers.length === 0) return

  // Calculate metrics
  let totalKg = 0
  let weightedPriceSum = 0
  let mandiPriceSum = 0
  let mandiCount = 0

  for (const offer of offers) {
    const listing = listings.find(l => l.id === offer.listing_id)
    if (!listing) continue
    const qty = listing.quantity_kg || 0
    totalKg += qty
    weightedPriceSum += offer.price_per_kg * qty
    if (listing.mandi_modal_price) {
      mandiPriceSum += listing.mandi_modal_price * qty
      mandiCount += qty
    }
  }

  if (totalKg === 0) return

  const avgFarmfastPrice = Math.round(weightedPriceSum / totalKg)
  const avgMandiPrice =
    mandiCount > 0 ? Math.round(mandiPriceSum / mandiCount) : avgFarmfastPrice
  const extraEarnings = Math.round((avgFarmfastPrice - avgMandiPrice) * totalKg)

  // Fetch trust score from farmers table
  const { data: farmer } = await supabase
    .from('farmers')
    .select('trust_score, name')
    .eq('phone', farmerPhone)
    .maybeSingle()

  const trustScore = (farmer as any)?.trust_score ?? 80

  // Determine tip based on listing quality
  const hasGradeC = listings.some(l => l.quality_grade === 'C')
  const hasDispute = false // extend later when dispute tracking is added
  let tip: string
  if (hasGradeC) {
    tip = 'छंटाई करें — खराब फल अलग करें'
  } else if (hasDispute) {
    tip = 'साफ रोशनी में फोटो भेजें'
  } else {
    tip = 'बढ़िया! जल्दी लिस्टिंग से और ऑफर मिलते हैं'
  }

  const message =
    `📊 आपकी FarmFast रिपोर्ट (इस हफ्ते)\n` +
    `बेचा: ${totalKg} किलो | औसत दाम: ₹${avgFarmfastPrice}/किलो\n` +
    `मंडी था: ₹${avgMandiPrice}/किलो | फायदा: +₹${extraEarnings} 🎉\n` +
    `ट्रस्ट स्कोर: ${trustScore}/100 ⭐\n` +
    `टिप: ${tip}`

  await sendWhatsAppMessage(farmerPhone, message)
}
