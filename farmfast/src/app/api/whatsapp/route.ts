import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { gradeWithFallback } from '@/lib/bedrock'
import { uploadProduceImage } from '@/lib/s3'
import { sendWhatsAppMessage, formatPhoneNumber } from '@/lib/twilio'
import { getCoordinatesFromPincode } from '@/lib/geocoding'
import axios from 'axios'

// Normalize phone numbers to consistent format (+91XXXXXXXXXX)
function normalizePhone(phone: string): string {
  let cleaned = formatPhoneNumber(phone).replace(/[\s\-()]/g, '')
  // Ensure +91 prefix for Indian numbers
  if (cleaned.startsWith('91') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned
  }
  if (cleaned.startsWith('0')) {
    cleaned = '+91' + cleaned.substring(1)
  }
  if (!cleaned.startsWith('+')) {
    cleaned = '+91' + cleaned
  }
  return cleaned
}

// Check if a session is stale (older than 24 hours without activity)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isSessionStale(session: any): boolean {
  if (!session?.last_message_at) return false
  const lastMessage = new Date(session.last_message_at).getTime()
  const now = Date.now()
  const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000 // 24 hours
  return (now - lastMessage) > STALE_THRESHOLD_MS
}

// Extract city name from Nominatim display_name
// "131023, Sonipat, Haryana District, Haryana, India" → "Sonipat"
function extractCityFromDisplayName(displayName: string): string {
  const parts = displayName.split(',').map(s => s.trim())
  if (/^\d{5,6}$/.test(parts[0])) {
    return parts[1] || displayName
  }
  return parts[0]
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const from = normalizePhone(formData.get('From') as string)
    const body = (formData.get('Body') as string || '').trim()
    const numMedia = parseInt(formData.get('NumMedia') as string || '0')
    const mediaUrl = numMedia > 0 ? formData.get('MediaUrl0') as string : null

    console.log(`WhatsApp message from ${from}: "${body}", media: ${!!mediaUrl}`)
    console.log(`Session state check starting...`)

    // Ignore Twilio sandbox join/leave commands and confirmations
    const lowerBody = body.toLowerCase()
    if (lowerBody.includes('join') ||
      lowerBody.includes('stop') ||
      lowerBody.includes('sandbox') ||
      lowerBody.includes('you are all set') ||
      body.startsWith('Twilio')) {
      console.log('Ignoring Twilio system message')
      return NextResponse.json({ success: true })
    }

    // Check if farmer is registered
    const { data: farmer } = await supabase
      .from('farmers')
      .select('*')
      .eq('phone', from)
      .single()

    // Get or create chat session
    let { data: session } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('farmer_phone', from)
      .single()

    console.log(`Session found: ${session ? 'YES' : 'NO'}, State: ${session?.conversation_state}`)

    // Reset stale sessions (stuck for >24h in a non-idle state)
    if (session && isSessionStale(session) && session.conversation_state !== 'idle' && session.conversation_state !== 'listing_active') {
      console.log(`Resetting stale session (state: ${session.conversation_state}, last active: ${session.last_message_at})`)
      const resetState = farmer ? 'idle' : 'awaiting_name'
      await supabase
        .from('chat_sessions')
        .update({
          conversation_state: resetState,
          last_message_at: new Date().toISOString()
        })
        .eq('farmer_phone', from)

      session = { ...session, conversation_state: resetState }

      if (farmer) {
        await sendWhatsAppMessage(from, '👋 नमस्ते! आपका पिछला सत्र समाप्त हो गया था।\n\n📸 अपनी फसल की फोटो भेजें और बेचना शुरू करें!\n\n💡 *मेनू* लिखें प्रोफाइल देखने के लिए')
        return NextResponse.json({ success: true })
      }
    }

    if (!session) {
      const initialState = farmer ? 'idle' : 'awaiting_name'
      const { data: newSession } = await supabase
        .from('chat_sessions')
        .insert({
          farmer_phone: from,
          conversation_state: initialState,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single()
      session = newSession

      // Send welcome message for new unregistered farmers
      if (!farmer) {
        const welcomeMsg = '🌾 *FarmFast में आपका स्वागत है!*\n\nपहले अपना नाम बताएं:'
        await sendWhatsAppMessage(from, welcomeMsg)
        return NextResponse.json({ success: true })
      }
    }

    // If farmer not registered, start registration flow
    if (!farmer &&
      session?.conversation_state !== 'awaiting_name' &&
      session?.conversation_state !== 'awaiting_full_address' &&
      session?.conversation_state !== 'awaiting_initial_location') {
      await supabase
        .from('chat_sessions')
        .update({
          conversation_state: 'awaiting_name',
          last_message_at: new Date().toISOString()
        })
        .eq('farmer_phone', from)

      const welcomeMsg = '🌾 *FarmFast में आपका स्वागत है!*\n\nपहले अपना नाम बताएं:'
      await sendWhatsAppMessage(from, welcomeMsg)

      return NextResponse.json({ success: true })
    }

    // Handle name input (registration step 1)
    if (session?.conversation_state === 'awaiting_name') {
      const name = body.trim()

      if (!name || name.length < 2) {
        await sendWhatsAppMessage(from, '❌ कृपया अपना पूरा नाम बताएं।')
        return NextResponse.json({ success: true })
      }

      // Save name in session and ask for full address
      await supabase
        .from('chat_sessions')
        .update({
          farmer_name: name,
          conversation_state: 'awaiting_full_address',
          last_message_at: new Date().toISOString()
        })
        .eq('farmer_phone', from)

      const addressMsg = `धन्यवाद ${name} जी! 🙏\n\n📍 अब अपना पूरा पता बताएं:\n\nउदाहरण: गाँव/शहर, तहसील, जिला, राज्य`
      await sendWhatsAppMessage(from, addressMsg)

      return NextResponse.json({ success: true })
    }

    // Handle full address input (registration step 2)
    if (session?.conversation_state === 'awaiting_full_address') {
      console.log(`Handling full address input: "${body}"`)
      const fullAddress = body.trim()

      if (!fullAddress || fullAddress.length < 5) {
        await sendWhatsAppMessage(from, '❌ कृपया पूरा पता बताएं। उदाहरण: गाँव/शहर, तहसील, जिला, राज्य')
        return NextResponse.json({ success: true })
      }

      // Save address and transition to pincode step
      const { data: updatedSession, error: updateError } = await supabase
        .from('chat_sessions')
        .update({
          temp_full_address: fullAddress,
          conversation_state: 'awaiting_initial_location',
          last_message_at: new Date().toISOString()
        })
        .eq('farmer_phone', from)
        .select()
        .single()

      if (updateError) {
        console.error('Failed to save address in session:', updateError)
        // Fallback: try updating without temp_full_address in case column is missing
        await supabase
          .from('chat_sessions')
          .update({
            conversation_state: 'awaiting_initial_location',
            last_message_at: new Date().toISOString()
          })
          .eq('farmer_phone', from)

        // Store address on session object in memory for this request
        session = { ...session, conversation_state: 'awaiting_initial_location', temp_full_address: fullAddress }
      } else {
        session = updatedSession
      }

      console.log(`Updated session state to: ${session?.conversation_state}`)

      const pincodeMsg = `✅ पता सहेजा गया!\n\n📮 अब अपना पिनकोड भेजें (6 अंक):\n\nउदाहरण: 411001`
      await sendWhatsAppMessage(from, pincodeMsg)

      return NextResponse.json({ success: true })
    }

    // Handle initial location input (registration step 3 - pincode)
    if (session?.conversation_state === 'awaiting_initial_location') {
      console.log(`Handling pincode input: "${body}"`)
      const pincode = body.replace(/\s/g, '')

      if (!/^\d{6}$/.test(pincode)) {
        await sendWhatsAppMessage(from, '❌ कृपया सही 6 अंकों का पिनकोड भेजें। उदाहरण: 411001')
        return NextResponse.json({ success: true })
      }

      try {
        // Geocode the pincode
        let coords = { lat: 0, lon: 0, display_name: 'India' }
        try {
          coords = await getCoordinatesFromPincode(pincode)
        } catch (geoError) {
          console.error('Geocoding failed, using defaults:', geoError)
          // Continue with default coords so registration isn't blocked
        }

        const farmerName = session.farmer_name || 'Farmer'
        const farmerAddress = session.temp_full_address || ''

        // Create or update farmer profile (upsert to handle duplicate phone)
        const { error: farmerError } = await supabase
          .from('farmers')
          .upsert({
            phone: from,
            name: farmerName,
            full_address: farmerAddress,
            location: extractCityFromDisplayName(coords.display_name || 'India'),
            pincode: pincode,
            latitude: coords.lat,
            longitude: coords.lon
          }, { onConflict: 'phone' })

        if (farmerError) {
          console.error('Failed to create/update farmer:', farmerError)
          await sendWhatsAppMessage(from, '❌ रजिस्ट्रेशन में समस्या आई। कृपया दोबारा कोशिश करें।')
          return NextResponse.json({ success: true })
        }

        // Update session to idle (registration complete)
        const { error: sessionUpdateError } = await supabase
          .from('chat_sessions')
          .update({
            conversation_state: 'idle',
            farmer_location: coords.display_name,
            temp_full_address: null,
            last_message_at: new Date().toISOString()
          })
          .eq('farmer_phone', from)

        if (sessionUpdateError) {
          console.error('Session update error (non-critical):', sessionUpdateError)
          // Fallback: just update the state without optional columns
          await supabase
            .from('chat_sessions')
            .update({
              conversation_state: 'idle',
              last_message_at: new Date().toISOString()
            })
            .eq('farmer_phone', from)
        }

        const successMsg = `✅ रजिस्ट्रेशन पूरा हुआ!\n\n👤 नाम: ${farmerName}\n📍 पता: ${farmerAddress}\n📮 पिनकोड: ${pincode}\n\n📸 अब अपनी फसल की फोटो भेजें और बेचना शुरू करें! 🚀\n\n💡 *मेनू* लिखें प्रोफाइल अपडेट करने के लिए`
        await sendWhatsAppMessage(from, successMsg)

      } catch (error) {
        console.error('Registration error:', error)
        await sendWhatsAppMessage(from, '❌ रजिस्ट्रेशन में समस्या आई। कृपया दोबारा पिनकोड भेजें।')
      }

      return NextResponse.json({ success: true })
    }

    // Handle image upload (quality grading flow)
    if (mediaUrl) {
      const processingMsg = 'आपकी फसल की जांच हो रही है... कृपया 10 सेकंड प्रतीक्षा करें। ⏳'
      await sendWhatsAppMessage(from, processingMsg)

      try {
        // Download image from Twilio
        const imageResponse = await axios.get(mediaUrl, {
          responseType: 'arraybuffer',
          auth: {
            username: process.env.TWILIO_ACCOUNT_SID!,
            password: process.env.TWILIO_AUTH_TOKEN!
          }
        })
        const imageBase64 = Buffer.from(imageResponse.data).toString('base64')

        // Upload image to S3 for permanent storage (returns S3 key, not URL)
        let imageRef = mediaUrl // fallback to Twilio URL
        try {
          const imageBuffer = Buffer.from(imageResponse.data)
          imageRef = await uploadProduceImage(imageBuffer, from)
          console.log(`Image stored in S3 with key: ${imageRef}`)
        } catch (s3Error) {
          console.error('S3 upload failed, using Twilio URL as fallback:', s3Error)
        }

        // Extract district from farmer's location for mandi price lookup
        const farmerDistrict = farmer?.location
          ? farmer.location.split(',')[0].trim()
          : 'Pune'

        // Grade with Bedrock (Nova Lite → Nova Pro → null)
        const gradeResult = await gradeWithFallback(imageBase64, farmerDistrict)

        if (!gradeResult) {
          await sendWhatsAppMessage(
            from,
            '⚠️ फोटो जांच नहीं हो सकी। अच्छी रोशनी में दोबारा भेजें।'
          )
          return NextResponse.json({ success: true })
        }

        // Save listing to database (with auction fields)
        const { data: listing, error } = await supabase
          .from('listings')
          .insert({
            farmer_phone: from,
            farmer_id: farmer?.id,
            crop_type: gradeResult.crop_type,
            quality_grade: gradeResult.grade,
            quantity_kg: 0,
            location: farmer?.location || 'India',
            full_address: farmer?.full_address,
            pincode: farmer?.pincode,
            latitude: farmer?.latitude,
            longitude: farmer?.longitude,
            price_range_min: gradeResult.price_range_min,
            price_range_max: gradeResult.price_range_max,
            shelf_life_days: gradeResult.shelf_life_days,
            image_url: imageRef,
            hindi_summary: gradeResult.hindi_summary,
            confidence_score: gradeResult.confidence,
            status: 'active',
            reserve_price: gradeResult.reserve_price,
            mandi_modal_price: gradeResult.mandi_price,
            auction_closes_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            auction_status: 'open',
          })
          .select()
          .single()

        if (error) throw error

        // Update session to ask for quantity
        await supabase
          .from('chat_sessions')
          .update({
            current_listing_id: listing.id,
            conversation_state: farmer ? 'awaiting_quantity' : 'awaiting_location',
            last_message_at: new Date().toISOString()
          })
          .eq('farmer_phone', from)

        // Build grading success message with mandi context
        const gradeEmoji = gradeResult.grade === 'A' ? '🌟' : gradeResult.grade === 'B' ? '✅' : '👍'
        const premium = gradeResult.mandi_price > 0
          ? Math.round(((gradeResult.reserve_price - gradeResult.mandi_price) / gradeResult.mandi_price) * 100)
          : 0
        const gradeMsg =
          `${gradeEmoji} ${gradeResult.crop_type} Grade ${gradeResult.grade} — ₹${gradeResult.price_range_min}-${gradeResult.price_range_max}/किलो। ताजगी ${gradeResult.shelf_life_days} दिन।\n` +
          `📊 आज ${farmerDistrict} मंडी भाव: ₹${gradeResult.mandi_price}/किलो\n` +
          `✅ FarmFast न्यूनतम: ₹${gradeResult.reserve_price}/किलो (मंडी से ${premium}% ज्यादा)\n` +
          `2 घंटे में सबसे अच्छा ऑफर मिलेगा।\n\n` +
          (farmer ? '📦 अब कितने किलो बेचना है? कृपया संख्या भेजें (जैसे: 500)' : '📍 अब अपना पिनकोड भेजें (जैसे: 411001)')

        await sendWhatsAppMessage(from, gradeMsg)
      } catch (error) {
        console.error('Image grading error:', error)
        await sendWhatsAppMessage(
          from,
          '❌ माफ करें, फोटो की जांच में समस्या आई।\n\nकृपया दोबारा कोशिश करें:\n📸 अच्छी रोशनी में साफ फोटो भेजें\n📷 पूरी फसल दिखनी चाहिए\n\nफिर से फोटो भेजें!'
        )
      }

      return NextResponse.json({ success: true })
    }

    // Handle location (pincode) input
    if (session?.conversation_state === 'awaiting_location') {
      const pincode = body.replace(/\s/g, '')

      if (!/^\d{6}$/.test(pincode)) {
        await sendWhatsAppMessage(
          from,
          '❌ कृपया सही 6 अंकों का पिनकोड भेजें। उदाहरण: 411001'
        )
        return NextResponse.json({ success: true })
      }

      try {
        const coords = await getCoordinatesFromPincode(pincode)

        const city = extractCityFromDisplayName(coords.display_name || 'India')
        await supabase
          .from('listings')
          .update({
            pincode: pincode,
            latitude: coords.lat,
            longitude: coords.lon,
            location: city
          })
          .eq('id', session.current_listing_id)

        await supabase
          .from('chat_sessions')
          .update({
            conversation_state: 'awaiting_quantity',
            last_message_at: new Date().toISOString()
          })
          .eq('farmer_phone', from)

        await sendWhatsAppMessage(
          from,
          `✅ स्थान सहेजा गया: ${city}\n\n📦 अब कितने किलो बेचना है? कृपया संख्या भेजें (जैसे: 500)`
        )
      } catch (error) {
        console.error('Geocoding error:', error)
        await sendWhatsAppMessage(
          from,
          '❌ पिनकोड नहीं मिला। कृपया दूसरा पिनकोड भेजें या अपना शहर का नाम भेजें।'
        )
      }

      return NextResponse.json({ success: true })
    }

    // Handle quantity input
    if (session?.conversation_state === 'awaiting_quantity') {
      const quantity = parseInt(body)

      if (isNaN(quantity) || quantity <= 0) {
        await sendWhatsAppMessage(
          from,
          '❌ कृपया सही संख्या भेजें। उदाहरण: 500'
        )
        return NextResponse.json({ success: true })
      }

      if (quantity < 50) {
        await sendWhatsAppMessage(
          from,
          '⚠️ कम से कम 50 किलो होना चाहिए। कृपया फिर से भेजें।'
        )
        return NextResponse.json({ success: true })
      }

      // Update listing with quantity
      await supabase
        .from('listings')
        .update({ quantity_kg: quantity })
        .eq('id', session.current_listing_id)

      // Update session
      await supabase
        .from('chat_sessions')
        .update({
          conversation_state: 'listing_active',
          last_message_at: new Date().toISOString()
        })
        .eq('farmer_phone', from)

      // Count nearby buyers
      let buyerCount = 0
      const { data: listing } = await supabase
        .from('listings')
        .select('*')
        .eq('id', session.current_listing_id)
        .single()

      if (listing?.latitude && listing?.longitude) {
        const { count } = await supabase
          .from('buyers')
          .select('*', { count: 'exact', head: true })
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)

        buyerCount = count || 0
      }

      await sendWhatsAppMessage(
        from,
        `✅ बढ़िया! आपकी ${quantity} किलो की लिस्टिंग ${buyerCount > 0 ? buyerCount : 'आस-पास के'} खरीददारों को भेज दी गई है। 🎯\n\n⏰ 1 घंटे में ऑफर मिलने शुरू हो जाएंगे।\n\n📱 जैसे ही कोई ऑफर आएगा, मैं आपको तुरंत बताऊंगा।\n\n*नोट:* WhatsApp खुला रखें ताकि ऑफर की सूचना मिल सके।`
      )

      return NextResponse.json({ success: true })
    }

    // Handle listing_active state — farmer can close auction early
    if (session?.conversation_state === 'listing_active') {
      const isCloseCmd =
        lowerBody === 'close' ||
        lowerBody === 'band karo' ||
        lowerBody === 'band kar' ||
        lowerBody === 'बंद करो' ||
        lowerBody === 'बंद करें' ||
        lowerBody.startsWith('close auction')

      if (isCloseCmd && session.current_listing_id) {
        await supabase
          .from('listings')
          .update({ auction_status: 'closed' })
          .eq('id', session.current_listing_id)

        await supabase
          .from('chat_sessions')
          .update({
            conversation_state: 'reviewing_offers',
            last_message_at: new Date().toISOString()
          })
          .eq('farmer_phone', from)

        await sendWhatsAppMessage(
          from,
          '🔒 नीलामी बंद कर दी गई है।\n\nAuction closed. Reply "offers" to see all bids received.'
        )
        return NextResponse.json({ success: true })
      }
      // Any other message in listing_active — fall through to general handlers below
    }

    // === Global keyword handlers — accessible from any state ===

    // Global "offers"/"ऑफर" — look up latest open listing, show offers, enter reviewing_offers
    if ((lowerBody === 'offers' || lowerBody === 'ऑफर') && farmer) {
      const { data: latestListing } = await supabase
        .from('listings')
        .select('id')
        .eq('farmer_phone', from)
        .eq('auction_status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!latestListing) {
        await sendWhatsAppMessage(from, '❌ कोई सक्रिय नीलामी नहीं है।\n\nनई लिस्टिंग बनाने के लिए फसल की फोटो भेजें। 📸')
        return NextResponse.json({ success: true })
      }

      const { data: globalOffers } = await supabase
        .from('offers')
        .select('*')
        .eq('listing_id', latestListing.id)
        .eq('status', 'pending')
        .order('price_per_kg', { ascending: false })

      await supabase
        .from('chat_sessions')
        .update({
          current_listing_id: latestListing.id,
          conversation_state: 'reviewing_offers',
          last_message_at: new Date().toISOString()
        })
        .eq('farmer_phone', from)

      if (!globalOffers || globalOffers.length === 0) {
        await sendWhatsAppMessage(from, '❌ अभी कोई पेंडिंग ऑफर नहीं है।\n\n⏳ नए ऑफर का इंतजार करें।')
        return NextResponse.json({ success: true })
      }

      let offerList = '📋 *आपके ऑफर:*\n\n'
      globalOffers.forEach((offer, index) => {
        offerList += `*${index + 1}.* ${offer.buyer_name}\n   💰 ₹${offer.price_per_kg}/किलो (कुल ₹${offer.total_amount})\n   🚚 ${offer.pickup_window || offer.pickup_time || 'जल्द'}\n\n`
      })
      offerList += '✅ ऑफर स्वीकार करने के लिए नंबर भेजें (जैसे: 1, 2, 3)'
      await sendWhatsAppMessage(from, offerList)
      return NextResponse.json({ success: true })
    }

    // Global menu — intercepts before reviewing_offers so farmer can always exit to menu
    if ((lowerBody.includes('menu') || lowerBody.includes('मेनू')) && farmer) {
      const menuMsg = `📋 *FarmFast मेनू*\n\n*प्रोफाइल देखें:*\n"प्रोफाइल" या "profile" लिखें\n\n*प्रोफाइल अपडेट करें:*\n• नाम बदलें: "नाम बदलो [नया नाम]"\n• पता बदलें: "पता बदलो [नया पता]"\n• पिनकोड बदलें: "पिनकोड बदलो [नया पिनकोड]"\n\n*उदाहरण:*\nनाम बदलो राज कुमार\nपता बदलो गाँव खेड़ा, पुणे, महाराष्ट्र\nपिनकोड बदलो 411001\n\n*फसल बेचने के लिए:*\nफोटो भेजें 📸`
      await sendWhatsAppMessage(from, menuMsg)
      return NextResponse.json({ success: true })
    }

    // Handle offer acceptance
    if (session?.conversation_state === 'reviewing_offers') {
      // Bug 3 safety: if current_listing_id is null, re-fetch latest open listing
      let listingId = session.current_listing_id
      if (!listingId) {
        const { data: latestListing } = await supabase
          .from('listings')
          .select('id')
          .eq('farmer_phone', from)
          .eq('auction_status', 'open')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (latestListing) {
          listingId = latestListing.id
          await supabase
            .from('chat_sessions')
            .update({ current_listing_id: listingId, last_message_at: new Date().toISOString() })
            .eq('farmer_phone', from)
          session = { ...session, current_listing_id: listingId }
        }
      }

      if (!listingId) {
        await sendWhatsAppMessage(from, '❌ कोई सक्रिय नीलामी नहीं है।\n\nनई लिस्टिंग बनाने के लिए फसल की फोटो भेजें। 📸')
        return NextResponse.json({ success: true })
      }

      // Fetch all pending offers for this listing
      const { data: offers } = await supabase
        .from('offers')
        .select('*')
        .eq('listing_id', listingId)
        .eq('status', 'pending')
        .order('price_per_kg', { ascending: false })

      if (!offers || offers.length === 0) {
        await sendWhatsAppMessage(from, '❌ अभी कोई पेंडिंग ऑफर नहीं है।\n\n⏳ नए ऑफर का इंतजार करें।')
        return NextResponse.json({ success: true })
      }

      // Check if farmer wants to see offers list
      if (lowerBody === 'offers' || lowerBody === 'ऑफर' || lowerBody === 'list' || lowerBody === 'सूची') {
        let offerList = '📋 *आपके ऑफर:*\n\n'
        offers.forEach((offer, index) => {
          offerList += `*${index + 1}.* ${offer.buyer_name}\n   💰 ₹${offer.price_per_kg}/किलो (कुल ₹${offer.total_amount})\n   ⏰ ${offer.pickup_time}\n\n`
        })
        offerList += '✅ ऑफर स्वीकार करने के लिए नंबर भेजें (जैसे: 1, 2, 3)'
        await sendWhatsAppMessage(from, offerList)
        return NextResponse.json({ success: true })
      }

      // Check if farmer selected an offer by number
      const offerNumber = parseInt(body)
      const acceptByKeyword = lowerBody.includes('पहला') || lowerBody.includes('first') || lowerBody.includes('हां') || lowerBody.includes('हाँ') || lowerBody.includes('yes') || lowerBody.includes('ठीक')

      let selectedOffer = null
      if (!isNaN(offerNumber) && offerNumber >= 1 && offerNumber <= offers.length) {
        selectedOffer = offers[offerNumber - 1]
      } else if (acceptByKeyword) {
        selectedOffer = offers[0] // Accept highest offer
      }

      if (selectedOffer) {
        // Accept the selected offer and mark auction as accepted
        await supabase
          .from('offers')
          .update({ status: 'accepted' })
          .eq('id', selectedOffer.id)

        await supabase
          .from('listings')
          .update({ auction_status: 'accepted' })
          .eq('id', listingId)

        // Reject other offers
        const otherOfferIds = offers.filter(o => o.id !== selectedOffer!.id).map(o => o.id)
        if (otherOfferIds.length > 0) {
          await supabase
            .from('offers')
            .update({ status: 'rejected' })
            .in('id', otherOfferIds)
        }

        // Notify farmer (Hindi)
        await sendWhatsAppMessage(
          from,
          `✅ ऑफर स्वीकार हुआ! खरीददार: ${selectedOffer.buyer_name} | पिकअप: ${selectedOffer.pickup_window || selectedOffer.pickup_time || 'जल्द'}\n` +
          `कुल: ₹${selectedOffer.total_amount} | पैसे सुरक्षित हैं — माल देने पर तुरंत मिलेंगे।\n\n` +
          `माल देने के बाद "माल दे दिया" लिखकर भेजें। 🎉`
        )

        // Notify buyer (English) if phone available
        if (selectedOffer.buyer_phone) {
          const listing = await supabase
            .from('listings')
            .select('quantity_kg')
            .eq('id', listingId)
            .single()
          const qty = listing.data?.quantity_kg ?? 0
          const total = Math.round(selectedOffer.price_per_kg * qty)
          await sendWhatsAppMessage(
            selectedOffer.buyer_phone,
            `✅ Offer accepted! Farmer: ${farmer?.name || 'Farmer'}, ${farmer?.location || 'India'}\n` +
            `Pickup: ${selectedOffer.pickup_window || selectedOffer.pickup_time || 'TBD'} | ` +
            `Total: ₹${selectedOffer.price_per_kg} × ${qty} kg = ₹${total}\n` +
            `Payment in escrow — released on handover confirmation.`
          ).catch(() => {}) // best-effort
        }

        await supabase
          .from('chat_sessions')
          .update({
            conversation_state: 'awaiting_handover_confirmation',
            last_message_at: new Date().toISOString()
          })
          .eq('farmer_phone', from)

        return NextResponse.json({ success: true })
      }

      // Unrecognized input in reviewing_offers — show help
      let offerList = '📋 *आपके ऑफर:*\n\n'
      offers.forEach((offer, index) => {
        offerList += `*${index + 1}.* ${offer.buyer_name} — ₹${offer.price_per_kg}/किलो\n`
      })
      offerList += '\n✅ ऑफर स्वीकार करने के लिए नंबर भेजें (जैसे: 1)\n💡 "ऑफर" लिखें पूरी जानकारी देखने के लिए'
      await sendWhatsAppMessage(from, offerList)
      return NextResponse.json({ success: true })
    }

    // Handle handover confirmation
    if (session?.conversation_state === 'awaiting_handover_confirmation') {
      if (lowerBody.includes('माल') || lowerBody.includes('दे दिया') || lowerBody.includes('delivered') || lowerBody.includes('done') || lowerBody.includes('हो गया')) {
        // Update listing status to sold
        if (session.current_listing_id) {
          await supabase
            .from('listings')
            .update({ status: 'sold' })
            .eq('id', session.current_listing_id)
        }

        await sendWhatsAppMessage(
          from,
          '🎉 *बधाई हो!*\n\n✅ पेमेंट आपके खाते में भेज दिया गया है।\n\n💰 30 सेकंड में पैसा आ जाएगा।\n\n🙏 FarmFast इस्तेमाल करने के लिए धन्यवाद!\n\nअगली बार फिर से फसल बेचने के लिए फोटो भेजें। 📸'
        )

        await supabase
          .from('chat_sessions')
          .update({
            conversation_state: 'idle',
            current_listing_id: null,
            last_message_at: new Date().toISOString()
          })
          .eq('farmer_phone', from)

        return NextResponse.json({ success: true })
      }

      // Unrecognized input while waiting for handover
      await sendWhatsAppMessage(from, '📦 माल देने के बाद "माल दे दिया" लिखकर भेजें।\n\n❓ कोई समस्या है? "help" लिखें।')
      return NextResponse.json({ success: true })
    }

    // Handle menu command
    if (lowerBody.includes('menu') || lowerBody.includes('मेनू')) {
      if (!farmer) {
        await sendWhatsAppMessage(from, '❌ पहले रजिस्ट्रेशन पूरा करें।')
        return NextResponse.json({ success: true })
      }

      const menuMsg = `📋 *FarmFast मेनू*\n\n*प्रोफाइल देखें:*\n"प्रोफाइल" या "profile" लिखें\n\n*प्रोफाइल अपडेट करें:*\n• नाम बदलें: "नाम बदलो [नया नाम]"\n• पता बदलें: "पता बदलो [नया पता]"\n• पिनकोड बदलें: "पिनकोड बदलो [नया पिनकोड]"\n\n*उदाहरण:*\nनाम बदलो राज कुमार\nपता बदलो गाँव खेड़ा, पुणे, महाराष्ट्र\nपिनकोड बदलो 411001\n\n*फसल बेचने के लिए:*\nफोटो भेजें 📸`

      await sendWhatsAppMessage(from, menuMsg)
      return NextResponse.json({ success: true })
    }

    // Handle profile view
    if (lowerBody.includes('profile') || lowerBody.includes('प्रोफाइल')) {
      if (!farmer) {
        await sendWhatsAppMessage(from, '❌ पहले रजिस्ट्रेशन पूरा करें।')
        return NextResponse.json({ success: true })
      }

      const profileMsg = `👤 *आपकी प्रोफाइल*\n\n📛 नाम: ${farmer.name}\n📍 पता: ${farmer.full_address || farmer.location}\n📮 पिनकोड: ${farmer.pincode}\n📞 फोन: ${farmer.phone}\n\n💡 अपडेट करने के लिए *मेनू* लिखें`

      await sendWhatsAppMessage(from, profileMsg)
      return NextResponse.json({ success: true })
    }

    // Handle profile updates with natural language

    // Update name
    if ((lowerBody.includes('नाम') && lowerBody.includes('बदल')) ||
      (lowerBody.includes('name') && lowerBody.includes('change'))) {
      if (!farmer) {
        await sendWhatsAppMessage(from, '❌ पहले रजिस्ट्रेशन पूरा करें।')
        return NextResponse.json({ success: true })
      }

      const newName = body.replace(/.*?(बदलो|बदल|change)\s*/i, '').trim()

      if (!newName || newName.length < 2) {
        await sendWhatsAppMessage(from, '❌ कृपया नया नाम बताएं।\n\nउदाहरण: नाम बदलो राज कुमार')
        return NextResponse.json({ success: true })
      }

      await supabase
        .from('farmers')
        .update({ name: newName, updated_at: new Date().toISOString() })
        .eq('phone', from)

      await sendWhatsAppMessage(from, `✅ नाम अपडेट हो गया!\n\n📛 नया नाम: ${newName}`)
      return NextResponse.json({ success: true })
    }

    // Update address
    if ((lowerBody.includes('पता') && lowerBody.includes('बदल')) ||
      (lowerBody.includes('address') && lowerBody.includes('change'))) {
      if (!farmer) {
        await sendWhatsAppMessage(from, '❌ पहले रजिस्ट्रेशन पूरा करें।')
        return NextResponse.json({ success: true })
      }

      const newAddress = body.replace(/.*?(बदलो|बदल|change)\s*/i, '').trim()

      if (!newAddress || newAddress.length < 5) {
        await sendWhatsAppMessage(from, '❌ कृपया पूरा पता बताएं।\n\nउदाहरण: पता बदलो गाँव खेड़ा, पुणे, महाराष्ट्र')
        return NextResponse.json({ success: true })
      }

      await supabase
        .from('farmers')
        .update({ full_address: newAddress, updated_at: new Date().toISOString() })
        .eq('phone', from)

      await sendWhatsAppMessage(from, `✅ पता अपडेट हो गया!\n\n📍 नया पता: ${newAddress}`)
      return NextResponse.json({ success: true })
    }

    // Update pincode
    if ((lowerBody.includes('पिनकोड') && lowerBody.includes('बदल')) ||
      (lowerBody.includes('pincode') && lowerBody.includes('change'))) {
      if (!farmer) {
        await sendWhatsAppMessage(from, '❌ पहले रजिस्ट्रेशन पूरा करें।')
        return NextResponse.json({ success: true })
      }

      const pincodeMatch = body.match(/\d{6}/)

      if (!pincodeMatch) {
        await sendWhatsAppMessage(from, '❌ कृपया सही 6 अंकों का पिनकोड बताएं।\n\nउदाहरण: पिनकोड बदलो 411001')
        return NextResponse.json({ success: true })
      }

      const newPincode = pincodeMatch[0]

      try {
        const coords = await getCoordinatesFromPincode(newPincode)

        const newCity = extractCityFromDisplayName(coords.display_name) || farmer.location
        await supabase
          .from('farmers')
          .update({
            pincode: newPincode,
            latitude: coords.lat,
            longitude: coords.lon,
            location: newCity,
            updated_at: new Date().toISOString()
          })
          .eq('phone', from)

        await sendWhatsAppMessage(from, `✅ पिनकोड अपडेट हो गया!\n\n📮 नया पिनकोड: ${newPincode}\n📍 स्थान: ${newCity}`)
      } catch {
        await sendWhatsAppMessage(from, '❌ पिनकोड नहीं मिला। कृपया सही पिनकोड बताएं।')
      }

      return NextResponse.json({ success: true })
    }

    // Handle general queries
    if (lowerBody.includes('help') || lowerBody.includes('मदद')) {
      const helpMsg = farmer
        ? `*FarmFast में आपका स्वागत है!* 🌾\n\n*फसल बेचने के लिए:*\n1️⃣ अपनी फसल की फोटो भेजें 📸\n2️⃣ मैं 10 सेकंड में क्वालिटी चेक करूंगा ✅\n3️⃣ कितने किलो बेचना है बताएं 📦\n4️⃣ खरीददारों को लिस्टिंग भेजी जाएगी 🎯\n5️⃣ ऑफर मिलने पर सूचना मिलेगी 📱\n\n*अभी फोटो भेजें!* 🚀\n\n💡 *मेनू* लिखें प्रोफाइल देखने/अपडेट करने के लिए`
        : `*FarmFast में आपका स्वागत है!* 🌾\n\n*पहली बार इस्तेमाल कर रहे हैं?*\n1️⃣ अपना नाम बताएं\n2️⃣ अपना पूरा पता भेजें 📍\n3️⃣ अपना पिनकोड भेजें 📮\n4️⃣ फसल की फोटो भेजें 📸\n5️⃣ मैं क्वालिटी चेक करूंगा ✅\n6️⃣ खरीददारों से ऑफर मिलेंगे 💰\n\n*शुरू करने के लिए अपना नाम भेजें!*`

      await sendWhatsAppMessage(from, helpMsg)
      return NextResponse.json({ success: true })
    }

    // Check for status query
    if (lowerBody.includes('status') || lowerBody.includes('स्थिति')) {
      if (session?.current_listing_id) {
        const { data: listing } = await supabase
          .from('listings')
          .select('*')
          .eq('id', session.current_listing_id)
          .single()

        if (listing) {
          const { count: offerCount } = await supabase
            .from('offers')
            .select('*', { count: 'exact', head: true })
            .eq('listing_id', listing.id)

          await sendWhatsAppMessage(
            from,
            `📊 *आपकी लिस्टिंग की स्थिति:*\n\n🌾 फसल: ${listing.crop_type}\n⭐ ग्रेड: ${listing.quality_grade}\n📦 मात्रा: ${listing.quantity_kg} किलो\n💰 ऑफर: ${offerCount || 0}\n\n${offerCount && offerCount > 0 ? '✅ ऑफर आ गए हैं! "ऑफर" लिखें देखने के लिए।' : '⏳ ऑफर का इंतजार है...'}`
          )
          return NextResponse.json({ success: true })
        }
      }

      await sendWhatsAppMessage(
        from,
        '❌ कोई सक्रिय लिस्टिंग नहीं है।\n\nनई लिस्टिंग बनाने के लिए फसल की फोटो भेजें। 📸'
      )
      return NextResponse.json({ success: true })
    }

    // Default: ask for image or start registration
    const defaultMsg = farmer
      ? '👋 नमस्ते! मैं FarmFast हूँ। 🌾\n\n📸 अपनी फसल की फोटो भेजें और मैं तुरंत:\n✅ क्वालिटी चेक करूंगा\n💰 सही भाव बताऊंगा\n🎯 खरीददारों से ऑफर दिलाऊंगा\n\n*अभी फोटो भेजें!*\n\n💡 *मेनू* लिखें प्रोफाइल देखने के लिए\n(मदद के लिए "help" टाइप करें)'
      : '👋 नमस्ते! मैं FarmFast हूँ। 🌾\n\n*पहले अपना नाम बताएं:*\n\n(मदद के लिए "help" टाइप करें)'

    await sendWhatsAppMessage(from, defaultMsg)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
