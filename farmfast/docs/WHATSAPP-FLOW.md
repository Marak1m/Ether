# WhatsApp Flow for Farmers

## Overview

Farmers interact with FarmFast entirely through WhatsApp. No app download needed.

---

## Complete Flow

### Step 0: First-Time Registration (New Farmers Only) 👤

**New Farmer:** Sends any message to **+1 415 523 8886** (sandbox)

**System:**
- Checks if farmer is registered
- If not registered, starts registration flow

**Farmer Receives:**
```
🌾 FarmFast में आपका स्वागत है!

पहले अपना नाम बताएं:
```
**Plus:** 🔊 Voice message in Hindi

---

### Step 0.1: Provide Name

**Farmer:** Types their name (e.g., `राज कुमार`)

**System:**
- Saves name in session
- Asks for location

**Farmer Receives:**
```
धन्यवाद राज कुमार जी! 🙏

अब अपना पिनकोड भेजें (जैसे: 411001):
```
**Plus:** 🔊 Voice message in Hindi

---

### Step 0.2: Provide Location

**Farmer:** Types pincode (e.g., `411001`)

**System:**
- Validates pincode (6 digits)
- Geocodes to coordinates
- Creates farmer profile in database
- Marks registration complete

**Farmer Receives:**
```
✅ रजिस्ट्रेशन पूरा हुआ!

📍 स्थान: Pune, Maharashtra, India

📸 अब अपनी फसल की फोटो भेजें और बेचना शुरू करें! 🚀
```
**Plus:** 🔊 Voice message in Hindi

---

### Step 1: Send Photo 📸

**Farmer:** Sends photo of produce

**System:**
- Downloads image
- Sends to Gemini AI for grading
- Creates listing with farmer's saved location

**Farmer Receives:**
```
⏳ आपकी फसल की जांच हो रही है...

🌟 ग्रेड A

उचित भाव: ₹15-20/किलो
ताजगी: 5 दिन

📦 अब कितने किलो बेचना है? कृपया संख्या भेजें (जैसे: 500)
```
**Plus:** 🔊 Voice message with grade details in Hindi

**Note:** For registered farmers, location is already saved, so we skip directly to quantity.

---

### Step 2: Send Quantity 📦

**Farmer:** Types `500`

**System:**
- Validates quantity (min 50 kg)
- Updates listing
- Marks as active
- Dashboard updates in real-time!

**Farmer Receives:**
```
✅ बढ़िया! आपकी 500 किलो की लिस्टिंग 15 खरीददारों को भेज दी गई है। 🎯

⏰ 1 घंटे में ऑफर मिलने शुरू हो जाएंगे।
```

---

### Step 3: Receive Offers 💰

**When buyer submits offer:**

**Farmer Receives:**
```
🎉 नया ऑफर मिला! (ऑफर #1)

खरीददार: Raj Traders
भाव: ₹16/किलो
कुल राशि: ₹8000
लेने का समय: Tomorrow 10 AM

⏳ और ऑफर का इंतजार करें या "पहला वाला ठीक है" लिखकर स्वीकार करें।
```

---

### Step 4: Accept Offer ✅

**Farmer:** Types `पहला वाला ठीक है` (or `1`, `first`)

**Farmer Receives:**
```
✅ ऑफर स्वीकार किया गया!

📞 खरीददार आपसे जल्द संपर्क करेगा।

माल देने के बाद "माल दे दिया" लिखकर भेजें।
```

---

### Step 5: Confirm Delivery 🤝

**Farmer:** Types `माल दे दिया` (after delivery)

**Farmer Receives:**
```
🎉 बधाई हो!

✅ पेमेंट आपके खाते में भेज दिया गया है।

🙏 FarmFast इस्तेमाल करने के लिए धन्यवाद!
```

---

## Additional Commands

### Check Status

**Farmer:** Types `status` or `स्थिति`

**Response:** Shows current listing status and offer count

### Get Help

**Farmer:** Types `help` or `मदद`

**Response:** Shows step-by-step instructions (different for registered vs new farmers)

---

## Conversation States

The system tracks conversation state:

1. **awaiting_name** - New farmer, waiting for name (registration)
2. **awaiting_initial_location** - New farmer, waiting for pincode (registration)
3. **idle** - Ready for new listing (registered farmer)
4. **awaiting_location** - Waiting for pincode (unregistered farmer with image)
5. **awaiting_quantity** - Waiting for quantity
6. **listing_active** - Listing created, waiting for offers
7. **reviewing_offers** - Offers received
8. **awaiting_handover_confirmation** - Waiting for delivery confirmation

---

## Voice Messages 🔊

Every important message includes a voice response in Hindi:
- Welcome message
- Registration confirmation
- Grade results
- Processing updates

This helps farmers who may have difficulty reading.

---

## Error Handling

### Invalid Name
```
❌ कृपया अपना पूरा नाम बताएं।
```

### Invalid Pincode
```
❌ कृपया सही 6 अंकों का पिनकोड भेजें। उदाहरण: 411001
```

### Invalid Quantity
```
❌ कृपया सही संख्या भेजें। उदाहरण: 500
```

### Quantity Too Low
```
⚠️ कम से कम 50 किलो होना चाहिए।
```

---

## Testing

### Join Sandbox (One Time)

1. Open WhatsApp
2. Add contact: **+1 415 523 8886**
3. Send: `join habit-needed`
4. Wait for confirmation

### Test Flow (New Farmer)

1. Send any message (e.g., "hello")
2. Send name: `Test Farmer`
3. Send pincode: `411001`
4. Send photo (use test-tomato.jpg)
5. Send quantity: `500`
6. Check dashboard - listing should appear!

### Test Flow (Registered Farmer)

1. Send photo directly
2. Send quantity: `500`
3. Done! (location already saved)

---

## Behind the Scenes

```
WhatsApp Message
    ↓
Twilio Webhook
    ↓
/api/whatsapp
    ↓
Check farmer registration
    ↓
Process based on state
    ↓
Update database
    ↓
Generate voice message (optional)
    ↓
Send response via Twilio
    ↓
Farmer receives text + voice
```

---

## Key Features

✅ No app required
✅ Hindi interface
✅ Voice messages for accessibility
✅ One-time registration
✅ Farmer profiles saved
✅ Location pre-filled for returning farmers
✅ Simple 2-step process (after registration)
✅ Real-time notifications
✅ State management
✅ Error handling
✅ Multi-offer support
