# FarmFast Menu System

## Overview

Farmers can manage their profile and access features through simple WhatsApp commands.

---

## Menu Commands

### View Menu
**Command:** `मेनू` or `menu`

**Response:**
```
📋 FarmFast मेनू

प्रोफाइल देखें:
"प्रोफाइल" या "profile" लिखें

प्रोफाइल अपडेट करें:
• नाम बदलें: "नाम बदलो [नया नाम]"
• पता बदलें: "पता बदलो [नया पता]"
• पिनकोड बदलें: "पिनकोड बदलो [नया पिनकोड]"

उदाहरण:
नाम बदलो राज कुमार
पता बदलो गाँव खेड़ा, पुणे, महाराष्ट्र
पिनकोड बदलो 411001

फसल बेचने के लिए:
फोटो भेजें 📸
```

---

## Profile Management

### View Profile
**Command:** `प्रोफाइल` or `profile`

**Response:**
```
👤 आपकी प्रोफाइल

📛 नाम: राज कुमार
📍 पता: गाँव खेड़ा, पुणे, महाराष्ट्र
📮 पिनकोड: 411001
📞 फोन: +919876543210

💡 अपडेट करने के लिए मेनू लिखें
```

---

## Update Profile

### Update Name
**Command:** `नाम बदलो [नया नाम]`

**Examples:**
- `नाम बदलो राज कुमार`
- `नाम बदल विजय शर्मा`
- `name change Raj Kumar`

**Response:**
```
✅ नाम अपडेट हो गया!

📛 नया नाम: राज कुमार
```

---

### Update Address
**Command:** `पता बदलो [नया पता]`

**Examples:**
- `पता बदलो गाँव खेड़ा, पुणे, महाराष्ट्र`
- `पता बदल शिवाजी नगर, मुंबई, महाराष्ट्र`
- `address change Village Kheda, Pune, Maharashtra`

**Response:**
```
✅ पता अपडेट हो गया!

📍 नया पता: गाँव खेड़ा, पुणे, महाराष्ट्र
```

**Requirements:**
- Minimum 10 characters
- Should include village/town, district, state

---

### Update Pincode
**Command:** `पिनकोड बदलो [नया पिनकोड]`

**Examples:**
- `पिनकोड बदलो 411001`
- `पिनकोड बदल 400001`
- `pincode change 411001`

**Response:**
```
✅ पिनकोड अपडेट हो गया!

📮 नया पिनकोड: 411001
📍 स्थान: Pune, Maharashtra, India
```

**Requirements:**
- Must be exactly 6 digits
- Must be a valid Indian pincode
- System will auto-update coordinates

---

## Registration Flow (New Farmers)

### Step 1: Name
**System asks:** `पहले अपना नाम बताएं:`

**Farmer sends:** `राज कुमार`

**Requirements:**
- Minimum 2 characters

---

### Step 2: Full Address
**System asks:** `अब अपना पूरा पता बताएं:`

**Farmer sends:** `गाँव खेड़ा, तहसील हवेली, पुणे, महाराष्ट्र`

**Requirements:**
- Minimum 10 characters
- Should include village/town, tehsil/taluka, district, state

---

### Step 3: Pincode (Mandatory)
**System asks:** `अब अपना पिनकोड भेजें (6 अंक):`

**Farmer sends:** `411001`

**Requirements:**
- Exactly 6 digits
- Valid Indian pincode
- If invalid, system will re-prompt

**Response:**
```
✅ रजिस्ट्रेशन पूरा हुआ!

👤 नाम: राज कुमार
📍 पता: गाँव खेड़ा, तहसील हवेली, पुणे, महाराष्ट्र
📮 पिनकोड: 411001

📸 अब अपनी फसल की फोटो भेजें और बेचना शुरू करें! 🚀

💡 मेनू लिखें प्रोफाइल अपडेट करने के लिए
```

---

## Natural Language Understanding

The system understands variations:

### Name Update
- `नाम बदलो राज`
- `नाम बदल राज`
- `name change Raj`

### Address Update
- `पता बदलो पुणे`
- `पता बदल मुंबई`
- `address change Pune`

### Pincode Update
- `पिनकोड बदलो 411001`
- `पिनकोड बदल 411001`
- `pincode change 411001`

The system extracts the relevant information after the command.

---

## Error Handling

### Invalid Name
```
❌ कृपया नया नाम बताएं।

उदाहरण: नाम बदलो राज कुमार
```

### Invalid Address
```
❌ कृपया पूरा पता बताएं।

उदाहरण: पता बदलो गाँव खेड़ा, पुणे, महाराष्ट्र
```

### Invalid Pincode
```
❌ कृपया सही 6 अंकों का पिनकोड बताएं।

उदाहरण: पिनकोड बदलो 411001
```

### Pincode Not Found
```
❌ पिनकोड नहीं मिला। कृपया सही पिनकोड बताएं।
```

---

## Database Schema

### Farmers Table
```sql
- id (uuid)
- phone (text, unique)
- name (text)
- full_address (text) -- NEW: Complete address
- location (text) -- Auto-generated from pincode
- pincode (text) -- MANDATORY
- latitude (numeric)
- longitude (numeric)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### Listings Table
```sql
- full_address (text) -- NEW: Copied from farmer profile
- (other fields remain same)
```

---

## Key Features

✅ Natural language commands in Hindi/English
✅ Profile view and update
✅ Full address collection (not just pincode)
✅ Mandatory pincode validation
✅ Auto-update coordinates from pincode
✅ Simple menu system
✅ Error handling with helpful messages
✅ Voice messages for key interactions

---

## Testing

### Test Profile View
1. Send: `प्रोफाइल`
2. Should show complete profile

### Test Name Update
1. Send: `नाम बदलो Test Farmer`
2. Should confirm update
3. Send: `प्रोफाइल` to verify

### Test Address Update
1. Send: `पता बदलो Test Village, Pune, Maharashtra`
2. Should confirm update
3. Send: `प्रोफाइल` to verify

### Test Pincode Update
1. Send: `पिनकोड बदलो 411001`
2. Should confirm update with location
3. Send: `प्रोफाइल` to verify

### Test Invalid Pincode
1. Send: `पिनकोड बदलो 123`
2. Should show error
3. Send: `पिनकोड बदलो 999999`
4. Should show "pincode not found" error
