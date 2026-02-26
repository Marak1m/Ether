# API Documentation

## Base URL

- Local: `http://localhost:3000`
- Production: `https://your-vercel-url.vercel.app`

---

## Endpoints

### GET /api/listings

Get active listings with optional filters.

**Query Parameters:**
- `status` (optional) - Filter by status (default: "active")
- `grade` (optional) - Filter by quality grade (A, B, or C)
- `lat` (optional) - Buyer latitude for distance calculation
- `lon` (optional) - Buyer longitude for distance calculation
- `radius` (optional) - Radius in km (default: 15)

**Example:**
```
GET /api/listings?status=active&grade=A&lat=18.5204&lon=73.8567&radius=20
```

**Response:**
```json
[
  {
    "id": "uuid",
    "crop_type": "Tomato",
    "quality_grade": "A",
    "quantity_kg": 500,
    "location": "Pune, Maharashtra",
    "latitude": 18.5204,
    "longitude": 73.8567,
    "pincode": "411001",
    "price_range_min": 15,
    "price_range_max": 20,
    "shelf_life_days": 5,
    "image_url": "https://...",
    "farmer_phone": "+919876543210",
    "distance": 12.5,
    "created_at": "2026-02-26T10:00:00Z"
  }
]
```

---

### POST /api/offers

Submit an offer on a listing.

**Body:**
```json
{
  "listing_id": "uuid",
  "buyer_name": "Raj Traders",
  "buyer_phone": "+919876543210",
  "price_per_kg": 16,
  "pickup_time": "Tomorrow 10 AM",
  "message": "I need fresh tomatoes"
}
```

**Response:**
```json
{
  "id": "uuid",
  "listing_id": "uuid",
  "buyer_name": "Raj Traders",
  "buyer_phone": "+919876543210",
  "price_per_kg": 16,
  "total_amount": 8000,
  "pickup_time": "Tomorrow 10 AM",
  "message": "I need fresh tomatoes",
  "status": "pending",
  "created_at": "2026-02-26T11:00:00Z"
}
```

**Side Effects:**
- Sends WhatsApp notification to farmer
- Updates chat session state to "reviewing_offers"

---

### GET /api/offers

Get offers for a listing.

**Query Parameters:**
- `listing_id` (required) - Listing UUID

**Example:**
```
GET /api/offers?listing_id=uuid
```

**Response:**
```json
[
  {
    "id": "uuid",
    "listing_id": "uuid",
    "buyer_name": "Raj Traders",
    "price_per_kg": 16,
    "total_amount": 8000,
    "status": "pending",
    "created_at": "2026-02-26T11:00:00Z"
  }
]
```

---

### POST /api/whatsapp

WhatsApp webhook (called by Twilio).

**Headers:**
- `Content-Type: application/x-www-form-urlencoded`

**Body (Form Data):**
- `From` - Sender phone number
- `Body` - Message text
- `NumMedia` - Number of media files
- `MediaUrl0` - First media URL (if image sent)

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>
```

**Behavior:**
- Processes message based on conversation state
- Sends response via Twilio
- Updates database
- Returns empty TwiML response

---

## Authentication

### Protected Routes

These routes require Supabase authentication:

- `/buyer/profile` - Buyer profile page
- `/analytics` - Analytics dashboard

### Public Routes

- `/landing` - Landing page
- `/dashboard` - Dashboard (can view without auth, but can't submit offers)
- `/buyer/login` - Login page
- `/buyer/register` - Registration page

---

## Real-time Subscriptions

### Listings Channel

Subscribe to listing changes:

```typescript
import { realtimeService } from '@/lib/realtime'

const channel = realtimeService.subscribeToListings((payload) => {
  console.log('Listing changed:', payload)
  // Refresh listings
})

// Cleanup
realtimeService.unsubscribe()
```

### Offers Channel

Subscribe to offer changes for a listing:

```typescript
const channel = realtimeService.subscribeToOffers(listingId, (payload) => {
  console.log('Offer changed:', payload)
  // Update offer list
})
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid parameters"
}
```

### 404 Not Found
```json
{
  "error": "Listing not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

No rate limiting currently implemented. Consider adding for production.

---

## CORS

CORS is enabled for all origins in development. Configure for production as needed.
