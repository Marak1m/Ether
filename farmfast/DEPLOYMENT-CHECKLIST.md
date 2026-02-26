# Deployment Checklist for Voice & Registration Features

## Prerequisites

1. **Google Cloud API Key** (for Text-to-Speech)
   - Same key as Gemini API works for both services
   - Ensure Text-to-Speech API is enabled in Google Cloud Console

2. **Supabase Database Updates**
   - Run `add-farmers-table.sql` in Supabase SQL Editor
   - This adds the farmers table and updates chat_sessions

3. **Environment Variables**
   - Add `GOOGLE_CLOUD_API_KEY` to Vercel environment variables
   - Value: Same as `GEMINI_API_KEY`

## Deployment Steps

### 1. Update Database Schema

```bash
# In Supabase SQL Editor, run:
farmfast/add-farmers-table.sql
```

This creates:
- `farmers` table (stores farmer profiles)
- Updates `chat_sessions` table (adds farmer_name, farmer_location)
- Adds `farmer_id` column to `listings` table

### 2. Update Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add:
```
GOOGLE_CLOUD_API_KEY=AIzaSyDXMj5dJkz_XgHQZzU60GEu-rq3Ljp8LIM
```

### 3. Deploy to Vercel

```bash
git add .
git commit -m "feat: Add voice responses and farmer registration flow"
git push origin main
```

Vercel will automatically deploy.

### 4. Test the New Flow

#### Test Registration (New Farmer)
1. Use a new WhatsApp number (not previously used)
2. Send any message to the Twilio sandbox number
3. Should receive: "FarmFast में आपका स्वागत है! पहले अपना नाम बताएं:"
4. Send name: "Test Farmer"
5. Should receive: "धन्यवाद Test Farmer जी! अब अपना पिनकोड भेजें"
6. Send pincode: "411001"
7. Should receive: "रजिस्ट्रेशन पूरा हुआ! अब अपनी फसल की फोटो भेजें"

#### Test Voice Messages
- Each message should be followed by a voice message (🔊 आवाज़ संदेश:)
- Voice messages are in Hindi
- If voice fails, text message still works (graceful degradation)

#### Test Returning Farmer
1. Use the same WhatsApp number again
2. Send a photo directly
3. Should skip name/location and go straight to quantity
4. Location should be pre-filled from farmer profile

## Features Added

### 1. Voice Responses 🔊
- Text-to-speech for all important messages
- Hindi voice (hi-IN-Wavenet-D)
- Helps farmers who have difficulty reading
- Graceful fallback if voice generation fails

### 2. Farmer Registration Flow 👤
- One-time registration for new farmers
- Collects: Name, Location (pincode)
- Stores in `farmers` table
- Returning farmers skip registration

### 3. Improved Flow
- **New farmers:** Name → Location → Photo → Quantity
- **Returning farmers:** Photo → Quantity (location pre-filled)
- Faster for returning users
- Better data quality

## Conversation States

New states added:
- `awaiting_name` - Waiting for farmer name (registration)
- `awaiting_initial_location` - Waiting for pincode (registration)

Existing states:
- `idle` - Ready for new listing
- `awaiting_location` - Waiting for pincode (unregistered with image)
- `awaiting_quantity` - Waiting for quantity
- `listing_active` - Listing created
- `reviewing_offers` - Offers received
- `awaiting_handover_confirmation` - Waiting for delivery confirmation

## Database Schema Changes

### New Table: `farmers`
```sql
- id (uuid, primary key)
- phone (text, unique)
- name (text)
- location (text)
- pincode (text)
- latitude (numeric)
- longitude (numeric)
- is_registered (boolean)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### Updated Table: `chat_sessions`
```sql
+ farmer_name (text)
+ farmer_location (text)
```

### Updated Table: `listings`
```sql
+ farmer_id (uuid, references farmers)
```

## Troubleshooting

### Voice Messages Not Working
- Check `GOOGLE_CLOUD_API_KEY` is set in Vercel
- Check Text-to-Speech API is enabled in Google Cloud Console
- Check Vercel logs for TTS errors
- Text messages should still work even if voice fails

### Registration Not Triggering
- Check database: `select * from farmers where phone = '+919953500224'`
- If farmer exists, delete to test: `delete from farmers where phone = '+919953500224'`
- Check chat_sessions state: `select * from chat_sessions where farmer_phone = '+919953500224'`

### Location Not Pre-filling
- Check farmer profile has pincode, latitude, longitude
- Check listings table has farmer_id populated
- Verify geocoding worked during registration

## Rollback Plan

If issues occur:

1. **Disable voice messages:**
   - Comment out TTS calls in `whatsapp/route.ts`
   - Deploy

2. **Disable registration flow:**
   - Set all sessions to `idle` state
   - Skip farmer check in webhook

3. **Revert database:**
   - Drop farmers table
   - Remove farmer_id from listings
   - Remove farmer_name, farmer_location from chat_sessions

## Next Steps

- Monitor voice message success rate
- Collect feedback from farmers
- Consider adding more voice messages
- Add farmer profile editing
- Add multi-language support
