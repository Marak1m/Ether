import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/twilio'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { listing_id, buyer_name, buyer_phone, buyer_id, price_per_kg, pickup_window, pickup_date, pickup_time, message } = body

    // Get listing details
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listing_id)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Hard check 1: auction window closed
    if (listing.auction_closes_at && new Date() > new Date(listing.auction_closes_at)) {
      return NextResponse.json({ error: 'AUCTION_CLOSED' }, { status: 400 })
    }

    // Hard check 2: offer below reserve price
    if (listing.reserve_price && price_per_kg < listing.reserve_price) {
      return NextResponse.json(
        { error: 'BELOW_RESERVE', reserve_price: listing.reserve_price },
        { status: 400 }
      )
    }

    const total_amount = price_per_kg * listing.quantity_kg
    // Prefer new pickup_window, fall back to legacy pickup_time
    const resolvedPickupWindow = pickup_window || pickup_time || 'Within 2 hours'

    // Insert offer
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .insert({
        listing_id,
        buyer_name,
        buyer_phone,
        buyer_id: buyer_id || null,
        price_per_kg,
        total_amount,
        pickup_time: resolvedPickupWindow,
        pickup_window: resolvedPickupWindow,
        pickup_date: pickup_date || null,
        message,
        status: 'pending'
      })
      .select()
      .single()

    if (offerError) {
      return NextResponse.json({ error: offerError.message }, { status: 500 })
    }

    // Notify farmer via WhatsApp (optional - skip if Twilio not configured)
    try {
      // Get count of total offers for this listing
      const { count: offerCount } = await supabase
        .from('offers')
        .select('*', { count: 'exact', head: true })
        .eq('listing_id', listing_id)

      // Calculate auction time remaining
      const closesAt = listing.auction_closes_at ? new Date(listing.auction_closes_at) : null
      const minutesLeft = closesAt ? Math.max(0, Math.round((closesAt.getTime() - Date.now()) / 60000)) : null

      const whatsappMessage =
        `🎉 *New Offer on Your ${listing.crop_type}!* (Offer #${offerCount})\n\n` +
        `👤 Buyer: ${buyer_name}\n` +
        `💰 Price: ₹${price_per_kg}/kg\n` +
        `📦 Qty: ${listing.quantity_kg} kg → Total: ₹${total_amount.toFixed(0)}\n` +
        `🚚 Pickup: ${resolvedPickupWindow}\n` +
        (message ? `💬 Note: ${message}\n` : '') +
        (minutesLeft !== null
          ? `\n⏰ Your auction closes in *${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}*.\n`
          : '\n') +
        (offerCount === 1
          ? '\nWait for more offers, or reply *1* to accept this offer now.'
          : `\nYou have *${offerCount} offers*. Reply "offers" to see all, or a number to accept.`)

      await sendWhatsAppMessage(listing.farmer_phone, whatsappMessage)

      // Update chat session to reviewing_offers state
      await supabase
        .from('chat_sessions')
        .update({
          conversation_state: 'reviewing_offers',
          last_message_at: new Date().toISOString()
        })
        .eq('farmer_phone', listing.farmer_phone)
        
    } catch (whatsappError) {
      console.log('WhatsApp notification skipped:', whatsappError)
      // Continue even if WhatsApp fails
    }

    return NextResponse.json(offer)
    
  } catch (error) {
    console.error('Offer creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const listing_id = searchParams.get('listing_id')

  if (!listing_id) {
    return NextResponse.json({ error: 'listing_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('listing_id', listing_id)
    .order('price_per_kg', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
