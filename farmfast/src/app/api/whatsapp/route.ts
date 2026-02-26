import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { gradeProduceImage } from '@/lib/gemini'
import { sendWhatsAppMessage, formatPhoneNumber } from '@/lib/twilio'
import { getCoordinatesFromPincode } from '@/lib/geocoding'
import { textToSpeech } from '@/lib/tts'
import axios from 'axios'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    
    const from = formatPhoneNumber(formData.get('From') as string)
    const body = (formData.get('Body') as string || '').trim()
    const numMedia = parseInt(formData.get('NumMedia') as string || '0')
    const mediaUrl = numMedia > 0 ? formData.get('MediaUrl0') as string : null
    
    console.log(`WhatsApp message from ${from}: "${body}", media: ${!!mediaUrl}`)

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

    if (!session) {
      const { data: newSession } = await supabase
        .from('chat_sessions')
        .insert({ 
          farmer_phone: from, 
          conversation_state: farmer ? 'idle' : 'awaiting_name' 
        })
        .select()
        .single()
      session = newSession
    }

    // If farmer not registered, start registration flow
    if (!farmer && session?.conversation_state !== 'awaiting_name' && session?.conversation_state !== 'awaiting_initial_location') {
      await supabase
        .from('chat_sessions')
        .update({ conversation_state: 'awaiting_name' })
        .eq('farmer_phone', from)

      const welcomeMsg = '🌾 *FarmFast में आपका स्वागत है!*\n\nपहले अपना नाम बताएं:'
      await sendWhatsAppMessage(from, welcomeMsg)
      
      // Send voice message
      try {
        const audioBase64 = await textToSpeech('फार्मफास्ट में आपका स्वागत है। पहले अपना नाम बताएं।')
        const audioUrl = `data:audio/mp3;base64,${audioBase64}`
        await sendWhatsAppMessage(from, '🔊 आवाज़ संदेश:', audioUrl)
      } catch (error) {
        console.error('Voice message error:', error)
      }

      return NextResponse.json({ success: true })
    }

    // Handle name input (registration step 1)
    if (session?.conversation_state === 'awaiting_name') {
      const name = body.trim()
      
      if (!name || name.length < 2) {
        await sendWhatsAppMessage(from, '❌ कृपया अपना पूरा नाम बताएं।')
        return NextResponse.json({ success: true })
      }

      // Save name in session and ask for location
      await supabase
        .from('chat_sessions')
        .update({
          farmer_name: name,
          conversation_state: 'awaiting_initial_location',
          last_message_at: new Date().toISOString()
        })
        .eq('farmer_phone', from)

      const locationMsg = `धन्यवाद ${name} जी! 🙏\n\nअब अपना पिनकोड भेजें (जैसे: 411001):`
      await sendWhatsAppMessage(from, locationMsg)

      // Send voice message
      try {
        const audioBase64 = await textToSpeech(`धन्यवाद ${name} जी। अब अपना पिनकोड भेजें।`)
        const audioUrl = `data:audio/mp3;base64,${audioBase64}`
        await sendWhatsAppMessage(from, '🔊 आवाज़ संदेश:', audioUrl)
      } catch (error) {
        console.error('Voice message error:', error)
      }

      return NextResponse.json({ success: true })
    }

    // Handle initial location input (registration step 2)
    if (session?.conversation_state === 'awaiting_initial_location') {
      const pincode = body.replace(/\s/g, '')
      
      if (!/^\d{6}$/.test(pincode)) {
        await sendWhatsAppMessage(from, '❌ कृपया सही 6 अंकों का पिनकोड भेजें। उदाहरण: 411001')
        return NextResponse.json({ success: true })
      }

      try {
        const coords = await getCoordinatesFromPincode(pincode)
        
        // Create farmer profile
        await supabase
          .from('farmers')
          .insert({
            phone: from,
            name: session.farmer_name,
            location: coords.display_name || 'India',
            pincode: pincode,
            latitude: coords.lat,
            longitude: coords.lon
          })

        // Update session to idle (registration complete)
        await supabase
          .from('chat_sessions')
          .update({
            conversation_state: 'idle',
            farmer_location: coords.display_name,
            last_message_at: new Date().toISOString()
          })
          .eq('farmer_phone', from)

        const successMsg = `✅ रजिस्ट्रेशन पूरा हुआ!\n\n📍 स्थान: ${coords.display_name}\n\n📸 अब अपनी फसल की फोटो भेजें और बेचना शुरू करें! 🚀`
        await sendWhatsAppMessage(from, successMsg)

        // Send voice message
        try {
          const audioBase64 = await textToSpeech('रजिस्ट्रेशन पूरा हुआ। अब अपनी फसल की फोटो भेजें और बेचना शुरू करें।')
          const audioUrl = `data:audio/mp3;base64,${audioBase64}`
          await sendWhatsAppMessage(from, '🔊 आवाज़ संदेश:', audioUrl)
        } catch (error) {
          console.error('Voice message error:', error)
        }

      } catch (error) {
        console.error('Geocoding error:', error)
        await sendWhatsAppMessage(from, '❌ पिनकोड नहीं मिला। कृपया दूसरा पिनकोड भेजें।')
      }

      return NextResponse.json({ success: true })
    }

    // Handle image upload (quality grading flow)
    if (mediaUrl) {
      const processingMsg = 'आपकी फसल की जांच हो रही है... कृपया 10 सेकंड प्रतीक्षा करें। ⏳'
      await sendWhatsAppMessage(from, processingMsg)

      // Send voice message
      try {
        const audioBase64 = await textToSpeech('आपकी फसल की जांच हो रही है। कृपया दस सेकंड प्रतीक्षा करें।')
        const audioUrl = `data:audio/mp3;base64,${audioBase64}`
        await sendWhatsAppMessage(from, '🔊 आवाज़ संदेश:', audioUrl)
      } catch (error) {
        console.error('Voice message error:', error)
      }

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
          farmer_id: farmer?.id,
          crop_type: gradeResult.crop_type,
          quality_grade: gradeResult.grade,
          quantity_kg: 0, // Will ask next
          location: farmer?.location || 'India',
          pincode: farmer?.pincode,
          latitude: farmer?.latitude,
          longitude: farmer?.longitude,
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

      // Update session to ask for quantity (skip location if farmer registered)
      await supabase
        .from('chat_sessions')
        .update({
          current_listing_id: listing.id,
          conversation_state: farmer ? 'awaiting_quantity' : 'awaiting_location',
          last_message_at: new Date().toISOString()
        })
        .eq('farmer_phone', from)

      // Send grade result
      const gradeEmoji = gradeResult.grade === 'A' ? '🌟' : gradeResult.grade === 'B' ? '✅' : '👍'
      const message = `${gradeEmoji} *ग्रेड ${gradeResult.grade}*\n\n${gradeResult.hindi_summary}\n\n*उचित भाव:* ₹${gradeResult.price_range_min}-${gradeResult.price_range_max}/किलो\n*ताजगी:* ${gradeResult.shelf_life_days} दिन\n\n${farmer ? '📦 अब कितने किलो बेचना है? कृपया संख्या भेजें (जैसे: 500)' : '📍 अब अपना पिनकोड भेजें (जैसे: 411001)'}`

      await sendWhatsAppMessage(from, message)

      // Send voice message with grade result
      try {
        const voiceText = `ग्रेड ${gradeResult.grade}। ${gradeResult.hindi_summary}। उचित भाव ${gradeResult.price_range_min} से ${gradeResult.price_range_max} रुपये प्रति किलो।`
        const audioBase64 = await textToSpeech(voiceText)
        const audioUrl = `data:audio/mp3;base64,${audioBase64}`
        await sendWhatsAppMessage(from, '🔊 आवाज़ संदेश:', audioUrl)
      } catch (error) {
        console.error('Voice message error:', error)
      }
      
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
      const helpMsg = farmer 
        ? `*FarmFast में आपका स्वागत है!* 🌾\n\n*फसल बेचने के लिए:*\n1️⃣ अपनी फसल की फोटो भेजें 📸\n2️⃣ मैं 10 सेकंड में क्वालिटी चेक करूंगा ✅\n3️⃣ कितने किलो बेचना है बताएं 📦\n4️⃣ खरीददारों को लिस्टिंग भेजी जाएगी 🎯\n5️⃣ ऑफर मिलने पर सूचना मिलेगी 📱\n\n*अभी फोटो भेजें!* 🚀`
        : `*FarmFast में आपका स्वागत है!* 🌾\n\n*पहली बार इस्तेमाल कर रहे हैं?*\n1️⃣ अपना नाम बताएं\n2️⃣ अपना पिनकोड भेजें 📍\n3️⃣ फसल की फोटो भेजें 📸\n4️⃣ मैं क्वालिटी चेक करूंगा ✅\n5️⃣ खरीददारों से ऑफर मिलेंगे 💰\n\n*शुरू करने के लिए अपना नाम भेजें!*`
      
      await sendWhatsAppMessage(from, helpMsg)
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

    // Default: ask for image or start registration
    const defaultMsg = farmer
      ? '👋 नमस्ते! मैं FarmFast हूँ। 🌾\n\n📸 अपनी फसल की फोटो भेजें और मैं तुरंत:\n✅ क्वालिटी चेक करूंगा\n💰 सही भाव बताऊंगा\n🎯 खरीददारों से ऑफर दिलाऊंगा\n\n*अभी फोटो भेजें!*\n\n(मदद के लिए "help" टाइप करें)'
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
