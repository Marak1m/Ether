import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/twilio'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Fetch listing
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single()

  if (listingError || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  // Mark auction as closed
  await supabase
    .from('listings')
    .update({ auction_status: 'closed' })
    .eq('id', id)

  // Get all offers ordered by price descending
  const { data: offers } = await supabase
    .from('offers')
    .select('*')
    .eq('listing_id', id)
    .order('price_per_kg', { ascending: false })

  const offerCount = offers?.length ?? 0

  // Build top-3 offer lines for the WhatsApp message
  const top3 = (offers ?? []).slice(0, 3)
  const numberEmojis = ['1️⃣', '2️⃣', '3️⃣']
  const offerLines = top3
    .map((o: { buyer_name: string; price_per_kg: number }, i: number) => {
      const buyerFirst = o.buyer_name?.split(' ')[0] ?? 'खरीददार'
      return `${numberEmojis[i]} ₹${o.price_per_kg}/किलो — ${buyerFirst}`
    })
    .join('\n')

  const highestOffer = top3[0]
  const highestPrice = highestOffer?.price_per_kg ?? 0
  const totalEarnings = Math.round(highestPrice * listing.quantity_kg)

  const message =
    `⏰ नीलामी बंद! ${offerCount} ऑफर आए:\n` +
    `${offerLines}\n` +
    `सबसे अच्छा: ₹${highestPrice} × ${listing.quantity_kg} किलो = ₹${totalEarnings}\n` +
    `स्वीकार के लिए 1 भेजें।`

  try {
    if (offerCount > 0) {
      await sendWhatsAppMessage(listing.farmer_phone, message)
    }
  } catch (err) {
    console.error('[close-auction] WhatsApp send failed:', err)
  }

  return NextResponse.json({ success: true, offer_count: offerCount })
}
