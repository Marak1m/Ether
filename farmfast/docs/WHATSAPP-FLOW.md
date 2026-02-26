# WhatsApp Flow for Farmers

## Overview

Farmers interact with FarmFast entirely through WhatsApp. No app download needed.

---

## Complete Flow

### Step 1: Send Photo 📸

**Farmer:** Sends photo of produce to **+1 913 799 0421**

**System:**
- Downloads image
- Sends to Gemini AI for grading
- Creates listing (without location yet)

**Farmer Receives:**
```
⏳ आपकी फसल की जांच हो रही है...

🌟 ग्रेड A

उचित भाव: ₹15-20/किलो
ताजगी: 5 दिन

📍 अब अपना पिनकोड भेजें (जैसे: 411001)
```

---

### Step 2: Send Pincode 📍

**Farmer:** Types `411001`

**System:**
- Validates pincode (6 digits)
- Geocodes to coordinates
- Updates listing with location

**Farmer Receives:**
```
✅ स्थान सहेजा गया: Pune, Maharashtra, India

📦 अब कितने किलो बेचना है? कृपया संख्या भेजें (जैसे: 500)
```

---

### Step 3: Send Quantity 📦

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

### Step 4: Receive Offers 💰

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

### Step 5: Accept Offer ✅

**Farmer:** Types `पहला वाला ठीक है` (or `1`, `first`)

**Farmer Receives:**
```
✅ ऑफर स्वीकार किया गया!

📞 खरीददार आपसे जल्द संपर्क करेगा।

माल देने के बाद "माल दे दिया" लिखकर भेजें।
```

---

### Step 6: Confirm Delivery 🤝

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

**Response:** Shows step-by-step instructions

---

## Conversation States

The system tracks conversation state:

1. **idle** - Ready for new listing
2. **awaiting_location** - Waiting for pincode
3. **awaiting_quantity** - Waiting for quantity
4. **listing_active** - Listing created, waiting for offers
5. **reviewing_offers** - Offers received
6. **awaiting_handover_confirmation** - Waiting for delivery confirmation

---

## Error Handling

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
2. Add contact: **+1 913 799 0421**
3. Send join code from Twilio console
4. Wait for confirmation

### Test Flow

1. Send photo (use test-tomato.jpg)
2. Send pincode: `411001`
3. Send quantity: `500`
4. Check dashboard - listing should appear!
5. Submit offer from dashboard
6. Check WhatsApp - offer notification!

---

## Behind the Scenes

```
WhatsApp Message
    ↓
Twilio Webhook
    ↓
/api/whatsapp
    ↓
Process based on state
    ↓
Update database
    ↓
Send response via Twilio
    ↓
Farmer receives message
```

---

## Key Features

✅ No app required
✅ Hindi interface
✅ Simple 3-step process
✅ Real-time notifications
✅ State management
✅ Error handling
✅ Multi-offer support
