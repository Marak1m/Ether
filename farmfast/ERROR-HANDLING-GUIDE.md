# Error Handling Guide

## Foreign Key Constraint Error - RESOLVED

### Error
```
Error: update or delete on table "farmers" violates foreign key constraint "listings_farmer_id_fkey" on table "listings"
```

### Root Cause
The `listings` table has a foreign key reference to the `farmers` table (`farmer_id`), but the constraint didn't have a CASCADE delete rule. When trying to delete a farmer from the admin console, the database prevented the deletion because related listings still existed.

### Solution

#### Option 1: Fix Database Constraint (Recommended)
Run `fix-foreign-key-constraint.sql` in Supabase SQL Editor:

```sql
-- Drop existing constraint
alter table public.listings 
drop constraint if exists listings_farmer_id_fkey;

-- Add constraint with CASCADE delete
alter table public.listings 
add constraint listings_farmer_id_fkey 
foreign key (farmer_id) 
references public.farmers(id) 
on delete cascade;
```

This ensures when a farmer is deleted, all their listings are automatically deleted.

#### Option 2: Application-Level Handling (Already Implemented)
The admin console now handles this by:
1. Finding the farmer's phone number
2. Deleting all related listings first
3. Deleting all related chat sessions
4. Then deleting the farmer

Code in `src/app/admin/console/page.tsx`:
```typescript
if (table === 'farmers') {
  const { data: farmer } = await supabase
    .from('farmers')
    .select('phone')
    .eq('id', id)
    .single()
  
  if (farmer) {
    // Delete related listings
    await supabase
      .from('listings')
      .delete()
      .eq('farmer_phone', farmer.phone)
    
    // Delete related chat sessions
    await supabase
      .from('chat_sessions')
      .delete()
      .eq('farmer_phone', farmer.phone)
  }
}
```

### Recommendation
Use **both** solutions:
1. Run the SQL script to fix the database constraint (prevents future issues)
2. Keep the application-level handling (provides better control and feedback)

---

## Other Error Handling in the System

### 1. WhatsApp Registration Errors

#### Invalid Name
```typescript
if (!name || name.length < 2) {
  await sendWhatsAppMessage(from, '❌ कृपया अपना पूरा नाम बताएं।')
  return NextResponse.json({ success: true })
}
```

#### Invalid Address
```typescript
if (!fullAddress || fullAddress.length < 10) {
  await sendWhatsAppMessage(from, '❌ कृपया पूरा पता बताएं। उदाहरण: गाँव/शहर, तहसील, जिला, राज्य')
  return NextResponse.json({ success: true })
}
```

#### Invalid Pincode
```typescript
if (!/^\d{6}$/.test(pincode)) {
  await sendWhatsAppMessage(from, '❌ कृपया सही 6 अंकों का पिनकोड भेजें। उदाहरण: 411001')
  return NextResponse.json({ success: true })
}
```

#### Pincode Not Found (Geocoding Error)
```typescript
try {
  const coords = await getCoordinatesFromPincode(pincode)
  // ... success handling
} catch (error) {
  console.error('Geocoding error:', error)
  await sendWhatsAppMessage(from, '❌ पिनकोड नहीं मिला। कृपया दूसरा पिनकोड भेजें।')
}
```

### 2. Profile Update Errors

#### Invalid Name Update
```typescript
if (!newName || newName.length < 2) {
  await sendWhatsAppMessage(from, '❌ कृपया नया नाम बताएं।\n\nउदाहरण: नाम बदलो राज कुमार')
  return NextResponse.json({ success: true })
}
```

#### Invalid Address Update
```typescript
if (!newAddress || newAddress.length < 10) {
  await sendWhatsAppMessage(from, '❌ कृपया पूरा पता बताएं।\n\nउदाहरण: पता बदलो गाँव खेड़ा, पुणे, महाराष्ट्र')
  return NextResponse.json({ success: true })
}
```

#### Invalid Pincode Update
```typescript
if (!pincodeMatch) {
  await sendWhatsAppMessage(from, '❌ कृपया सही 6 अंकों का पिनकोड बताएं।\n\nउदाहरण: पिनकोड बदलो 411001')
  return NextResponse.json({ success: true })
}
```

### 3. Listing Creation Errors

#### Invalid Quantity
```typescript
if (isNaN(quantity) || quantity <= 0) {
  await sendWhatsAppMessage(from, '❌ कृपया सही संख्या भेजें। उदाहरण: 500')
  return NextResponse.json({ success: true })
}

if (quantity < 50) {
  await sendWhatsAppMessage(from, '⚠️ कम से कम 50 किलो होना चाहिए। कृपया फिर से भेजें।')
  return NextResponse.json({ success: true })
}
```

### 4. Voice Message Errors

All voice message calls are wrapped in try-catch to ensure the flow continues even if TTS fails:

```typescript
try {
  const audioBase64 = await textToSpeech(text)
  const audioUrl = `data:audio/mp3;base64,${audioBase64}`
  await sendWhatsAppMessage(from, '🔊 आवाज़ संदेश:', audioUrl)
} catch (error) {
  console.error('Voice message error:', error)
  // Text message already sent, continue without voice
}
```

### 5. Image Grading Errors

```typescript
try {
  const gradeResult = await gradeProduceImage(imageBase64)
  // ... success handling
} catch (error) {
  console.error('Gemini API error:', error)
  throw new Error('Failed to grade produce image')
}
```

### 6. Admin Console Errors

```typescript
try {
  // ... delete operations
  loadData(activeTab)
  alert('Deleted successfully')
} catch (error: any) {
  alert('Error: ' + error.message)
}
```

---

## Error Handling Best Practices

### 1. Always Provide User Feedback
- Show clear error messages in Hindi for farmers
- Include examples of correct input format
- Use emojis for visual clarity (❌ for errors, ✅ for success)

### 2. Graceful Degradation
- Voice messages fail → Continue with text messages
- Geocoding fails → Ask for different pincode
- Image grading fails → Show generic error

### 3. Validation Before Database Operations
- Validate all user input before database queries
- Check data types, lengths, formats
- Prevent invalid data from reaching the database

### 4. Logging
- Log all errors to console for debugging
- Include context (user phone, operation type)
- Don't expose sensitive data in logs

### 5. Transaction Safety
- Delete related records before parent records
- Use CASCADE constraints where appropriate
- Handle foreign key constraints properly

---

## Testing Error Scenarios

### Test Invalid Inputs
1. Name: Send single character → Should show error
2. Address: Send short text → Should show error
3. Pincode: Send 5 digits → Should show error
4. Pincode: Send 999999 → Should show "not found" error
5. Quantity: Send 0 → Should show error
6. Quantity: Send 30 → Should show "minimum 50 kg" error

### Test Database Errors
1. Delete farmer with listings → Should delete listings first
2. Update with invalid data → Should show error
3. Network timeout → Should show error

### Test API Errors
1. Invalid Gemini API key → Should show grading error
2. Invalid Twilio credentials → Should show send error
3. Invalid geocoding → Should show pincode error

---

## Monitoring & Alerts

### Key Metrics to Monitor
1. Error rate in WhatsApp webhook
2. Failed voice message rate
3. Failed image grading rate
4. Failed geocoding rate
5. Database constraint violations

### Recommended Alerts
- Alert if error rate > 5%
- Alert if voice message failure > 20%
- Alert if image grading failure > 10%
- Alert if database errors occur

---

## Future Improvements

1. **Retry Logic**: Add automatic retries for transient failures
2. **Better Error Messages**: More specific error messages based on error type
3. **Error Tracking**: Integrate with error tracking service (Sentry, etc.)
4. **Rate Limiting**: Prevent abuse by limiting requests per user
5. **Validation Library**: Use Zod or similar for input validation
