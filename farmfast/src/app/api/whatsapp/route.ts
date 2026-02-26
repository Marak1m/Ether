import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { gradeProduceImage } from '@/lib/gemini'
import { sendWhatsAppMessage, formatPhoneNumber } from '@/lib/twilio'
import { getCoordinatesFromPincode } from '@/lib/geocoding'
import axios from 'axios'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    
    const from = formatPhoneNumber(formData.get('From') as string)
    const body = (formData.get('Body') as string || '').trim()
    const numMedia = parseInt(formData.get('NumMedia') as string || '0')
    const mediaUrl = numMedia > 0 ? formData.get('MediaUrl0') as string : null
    
    console.log(`WhatsApp message from ${from}: "${body}", media: ${!!mediaUrl}`)

    // Get or create chat session
    let { data: session } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('farmer_phone', from)
      .single()

    if (!session) {
      const { data: newSession } = await supabase
        .from('chat_sessions')
        .insert({ farmer_phone: from, conversation_state: 'idle' })
        .select()
        .single()
      session = newSession
    }

    // Handle image upload (quality grading flow)
    if (mediaUrl) {
      await sendWhatsAppMessage(
        from,
        'आपकी फसल की जांच हो रही है... कृपया 10 सेकंड प्रतीक्षा करें। ⏳'
      )

      // Download image from Twilio
      const imageResponse = await axios.get(mediaUrl, {
        responseType: 'arraybuffer',
        auth: {
          username: process.env.TWILIO_ACCOUNT_SID!,
          password: process.env.TWILIO_AUTH_TOKEN!
        }
      })
      const imageBase64 = Buffer.from(imageResponse.data).toString('base64')

      // Grade with Gemini
      const gradeResult = await gradeProduceImage(imageBase64)

      // Save listing to database (without location yet)
      const { data: listing, error } = await supabase
        .from('listings')
        .insert({
          farmer_phone: from,
          crop_type: gradeResult.crop_type,
          quality_grade: gradeResult.grade,
          quantity_kg: 0, // Will ask next
          location: 'India', // Will update with pincode
          price_range_min: gradeResult.price_range_min,
          price_range_max: gradeResult.price_range_max,
          shelf_life_days: gradeResult.shelf_life_days,
          image_url: mediaUrl,
          hindi_summary: gradeResult.hindi_summary,
          confidence_score: gradeResult.confidence,
          quality_factors: gradeResult.quality_factors,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error

      // Update session to ask for location
      await supabase
        .from('chat_sessions')
        .update({
          current_listing_id: listing.id,
          conversation_state: 'awaiting_location',
          last_message_at: new Date().toISOString()
        })
        .eq('farmer_phone', from)

      // Send grade result and ask for location
      const gradeEmoji = gradeResult.grade === 'A' ? '🌟' : gradeResult.grade === 'B' ? '✅' : '👍'
      const message = `${gradeEmoji} *ग्रेड ${gradeResult.grade}*\n\n${gradeResult.hindi_summary}\n\n*उचित भाव:* ₹${gradeResult.price_range_min}-${gradeResult.price_range_max}/किलो\n*ताजगी:* ${gradeResult.shelf_life_days} दिन\n\n📍 अब अपना पिनकोड भेजें (जैसे: 411001)`

      await sendWhatsAppMessage(from, message)
      
      return NextResponse.json({ success: true })
    }

    // Handle location (pincode) input
    if (session?.conversation_state === 'awaiting_location') {
      const pincode = body.replace(/\s/g, '')
      
      // Validate pincode (6 digits)
      if (!/^\d{6}$/.test(pincode)) {
        await sendWhatsAppMessage(
          from,
          '❌ कृपया सही 6 अंकों का पिनकोड भेजें। उदाहरण: 411001'
        )
        return NextResponse.json({ success: true })
      }

      try {
        // Get coordinates from pincode
        const coords = await getCoordinatesFromPincode(pincode)
        
        // Update listing with location
        await supabase
          .from('listings')
          .update({
            pincode: pincode,
            latitude: coords.lat,
            longitude: coords.lon,
            location: coords.display_name || 'India'
          })
          .eq('id', session.current_listing_id)

        // Update session to ask for quantity
        await supabase
          .from('chat_sessions')
          .update({
            conversation_state: 'awaiting_quantity',
            last_message_at: new Date().toISOString()
          })
          .eq('farmer_phone', from)

        await sendWhatsAppMessage(
          from,
          `✅ स्थान सहेजा गया: ${coords.display_name}\n\n📦 अब कितने किलो बेचना है? कृपया संख्या भेजें (जैसे: 500)`
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

      // Get listing details for broadcast count
      const { data: listing } = await supabase
        .from('listings')
        .select('*')
        .eq('id', session.current_listing_id)
        .single()

      // Count nearby buyers (within 20km)
      let buyerCount = 0
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

    // Handle offer acceptance
    if (session?.conversation_state === 'reviewing_offers') {
      const lowerBody = body.toLowerCase()
      
      if (lowerBody.includes('पहला') || lowerBody.includes('1') || lowerBody.includes('first')) {
        // Accept first offer
        await sendWhatsAppMessage(
          from,
          '✅ ऑफर स्वीकार किया गया!\n\n💰 खरीददार ने पेमेंट जमा कर दिया है।\n\n📞 खरीददार आपसे जल्द संपर्क करेगा।\n\nमाल देने के बाद "माल दे दिया" लिखकर भेजें, तो पैसा तुरंत आपके खाते में आ जाएगा। 🎉'
        )
        
        await supabase
          .from('chat_sessions')
          .update({
            conversation_state: 'awaiting_handover_confirmation',
            last_message_at: new Date().toISOString()
          })
          .eq('farmer_phone', from)
        
        return NextResponse.json({ success: true })
      }
    }

    // Handle handover confirmation
    if (session?.conversation_state === 'awaiting_handover_confirmation') {
      const lowerBody = body.toLowerCase()
      
      if (lowerBody.includes('माल') || lowerBody.includes('दे दिया') || lowerBody.includes('delivered')) {
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
    }

    // Handle general queries
    if (body.toLowerCase().includes('help') || body.toLowerCase().includes('मदद')) {
      await sendWhatsAppMessage(
        from,
        `*FarmFast में आपका स्वागत है!* 🌾\n\n*फसल बेचने के लिए:*\n1️⃣ अपनी फसल की फोटो भेजें 📸\n2️⃣ मैं 10 सेकंड में क्वालिटी चेक करूंगा ✅\n3️⃣ अपना पिनकोड भेजें 📍\n4️⃣ कितने किलो बेचना है बताएं 📦\n5️⃣ खरीददारों को लिस्टिंग भेजी जाएगी 🎯\n6️⃣ ऑफर मिलने पर सूचना मिलेगी 📱\n\n*अभी फोटो भेजें!* 🚀`
      )
      return NextResponse.json({ success: true })
    }

    // Check for status query
    if (body.toLowerCase().includes('status') || body.toLowerCase().includes('स्थिति')) {
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
            `📊 *आपकी लिस्टिंग की स्थिति:*\n\n🌾 फसल: ${listing.crop_type}\n⭐ ग्रेड: ${listing.quality_grade}\n📦 मात्रा: ${listing.quantity_kg} किलो\n💰 ऑफर: ${offerCount || 0}\n\n${offerCount && offerCount > 0 ? '✅ ऑफर आ गए हैं! जल्द ही आपको सूचना मिलेगी।' : '⏳ ऑफर का इंतजार है...'}`
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

    // Default: ask for image
    await sendWhatsAppMessage(
      from,
      '👋 नमस्ते! मैं FarmFast हूँ। 🌾\n\n📸 अपनी फसल की फोटो भेजें और मैं तुरंत:\n✅ क्वालिटी चेक करूंगा\n💰 सही भाव बताऊंगा\n🎯 खरीददारों से ऑफर दिलाऊंगा\n\n*अभी फोटो भेजें!*\n\n(मदद के लिए "help" टाइप करें)'
    )

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
