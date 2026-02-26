# FarmFast - AI-Powered Agricultural Marketplace

Connect farmers with buyers through WhatsApp and AI-powered quality grading.

## 🌾 What is FarmFast?

FarmFast is a complete agricultural marketplace that:
- **For Farmers**: List produce via WhatsApp (no app needed)
- **For Buyers**: Browse quality-graded listings on web dashboard
- **AI Grading**: Gemini AI grades produce quality (A/B/C) in 10 seconds
- **Location-Based**: Matches farmers with nearby buyers (5-50km radius)
- **Real-time**: Dashboard updates automatically when new listings added

---

## ✅ Features

### For Farmers (WhatsApp)
- 📸 Send photo → Get AI quality grade
- 📍 Send pincode → Location saved
- 📦 Send quantity → Listing created
- 💰 Receive offer notifications
- ✅ Accept offers via WhatsApp
- 💵 Get paid after delivery

### For Buyers (Web Dashboard)
- 🔍 Browse quality-graded listings
- 🗺️ Interactive map view
- 📊 Filter by grade (A/B/C) and radius (5-50km)
- 💼 Submit competitive offers
- 📈 Analytics dashboard
- ⭐ Rating system
- 🔔 Real-time updates

---

## 🚀 Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS, TypeScript
- **Backend**: Next.js API Routes, Node.js
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini AI
- **WhatsApp**: Twilio WhatsApp API
- **Maps**: Leaflet + OpenStreetMap
- **Hosting**: Vercel

---

## 📁 Project Structure

```
farmfast/
├── src/
│   ├── app/
│   │   ├── landing/          # Landing page
│   │   ├── dashboard/        # Buyer dashboard
│   │   ├── analytics/        # Analytics dashboard
│   │   ├── buyer/            # Auth pages (login, register, profile)
│   │   ├── admin/            # Admin panel
│   │   └── api/
│   │       ├── whatsapp/     # WhatsApp webhook
│   │       ├── listings/     # Listings API
│   │       └── offers/       # Offers API
│   ├── components/           # React components
│   └── lib/                  # Utilities (supabase, gemini, twilio, etc.)
├── public/                   # Static assets
├── docs/                     # Documentation
└── .env.local               # Environment variables (not in git)
```

---

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+ installed
- Supabase account (free)
- Twilio account with WhatsApp sandbox (free)
- Google Gemini API key (free)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd farmfast
npm install
```

### 2. Environment Variables

Create `.env.local` file:

```env
# AI
GEMINI_API_KEY=your_gemini_api_key

# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# WhatsApp
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886
```

### 3. Database Setup

Run these SQL files in Supabase SQL Editor:

```bash
1. supabase-schema.sql          # Main schema
2. update-schema-location.sql   # Location fields
3. add-ratings-schema.sql       # Rating system (optional)
```

### 4. Run Locally

```bash
npm run dev
```

Open http://localhost:3000

---

## 🌐 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push
   ```

2. **Go to Vercel**
   - Visit https://vercel.com
   - Click "Import Project"
   - Select your GitHub repo
   - Add environment variables (from `.env.local`)
   - Click "Deploy"

3. **Configure Twilio**
   - Go to Twilio WhatsApp Sandbox
   - Set webhook: `https://your-vercel-url.vercel.app/api/whatsapp`
   - Method: POST
   - Save

4. **Test WhatsApp**
   - Add contact: +1 415 523 8886
   - Send join code from Twilio
   - Send a photo to test!

**Detailed deployment guide:** See `docs/DEPLOYMENT.md`

---

## 📱 How It Works

### Farmer Flow (WhatsApp)

```
1. Send Photo → AI grades in 10s → "Grade A, ₹15-20/kg"
2. Send Pincode → "411001" → "Location: Pune, Maharashtra"
3. Send Quantity → "500" → "Listed! Sent to 15 buyers"
4. Receive Offers → "New offer: ₹16/kg from Raj Traders"
5. Accept Offer → "पहला वाला ठीक है" → "Offer accepted!"
6. Confirm Delivery → "माल दे दिया" → "Payment sent!"
```

### Buyer Flow (Web)

```
1. Register → Create account with location
2. Browse → See quality-graded listings
3. Filter → By grade (A/B/C) and radius (5-50km)
4. View Map → Interactive map with markers
5. Submit Offer → Price, pickup time, message
6. Wait → Farmer accepts via WhatsApp
7. Pickup → Collect produce and rate farmer
```

---

## 🧪 Testing

### Test Locally (Dashboard)

```bash
npm run dev

# Test these URLs:
http://localhost:3000/landing      # Landing page
http://localhost:3000/dashboard    # Dashboard
http://localhost:3000/admin        # Create test listing
http://localhost:3000/analytics    # View analytics
```

### Test WhatsApp (Needs Deployment)

WhatsApp requires a public HTTPS URL. Options:

**Option 1: Vercel (Recommended)**
- Deploy to Vercel
- Get production URL
- Set Twilio webhook
- Test on WhatsApp

**Option 2: ngrok (Quick Test)**
```bash
npm run dev
ngrok http 3000
# Copy HTTPS URL
# Set as Twilio webhook
```

---

## 📊 Features Status

### ✅ Completed

- [x] AI quality grading (Gemini)
- [x] WhatsApp integration (Twilio)
- [x] Location-based matching
- [x] Interactive map view (Leaflet)
- [x] Buyer authentication (Supabase Auth)
- [x] Real-time updates (Supabase Realtime)
- [x] Analytics dashboard
- [x] Rating system
- [x] Modern UI with Inter font
- [x] Responsive design

### 🔄 Optional Enhancements

- [ ] Payment integration (Razorpay/Stripe)
- [ ] In-app chat
- [ ] Mobile app (React Native)
- [ ] Advanced analytics (charts, trends)
- [ ] Multi-language support

---

## 🗂️ Database Schema

### Main Tables

1. **listings** - Produce listings from farmers
2. **offers** - Buyer offers on listings
3. **buyers** - Buyer profiles
4. **chat_sessions** - WhatsApp conversation state
5. **ratings** - Farmer/buyer ratings

**Schema files:**
- `supabase-schema.sql` - Main schema
- `update-schema-location.sql` - Location fields
- `add-ratings-schema.sql` - Rating system

---

## 🔑 API Routes

### Public Routes

- `GET /api/listings` - Get active listings (with filters)
- `POST /api/offers` - Submit offer
- `POST /api/whatsapp` - WhatsApp webhook (Twilio)

### Protected Routes

- `/buyer/profile` - Buyer profile (requires auth)
- `/analytics` - Analytics dashboard (requires auth)

---

## 🎨 UI Components

### Pages

- `/landing` - Landing page with hero, features, stats
- `/dashboard` - Main buyer dashboard (list/map view)
- `/analytics` - Analytics and insights
- `/buyer/login` - Login page
- `/buyer/register` - Registration page
- `/buyer/profile` - Profile management
- `/admin` - Admin panel (create test listings)

### Components

- `ListingCard` - Display produce listing
- `ListingsMap` - Interactive map with markers
- `OfferModal` - Submit offer form
- `QualityBadge` - Grade badge (A/B/C)
- `RatingStars` - Star rating display

---

## 🔧 Configuration

### Tailwind CSS

Custom configuration in `src/app/globals.css`:
- Inter font
- Custom animations (fadeIn, slideUp)
- Color scheme (green, blue, violet)

### Next.js

- App Router (Next.js 15)
- TypeScript strict mode
- Tailwind CSS v4
- Dynamic imports for Leaflet (SSR fix)

---

## 📝 Environment Variables

Required variables:

```env
# AI Grading
GEMINI_API_KEY              # Google Gemini API key

# Database
NEXT_PUBLIC_SUPABASE_URL    # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anon key

# WhatsApp
TWILIO_ACCOUNT_SID          # Twilio account SID
TWILIO_AUTH_TOKEN           # Twilio auth token
TWILIO_WHATSAPP_NUMBER      # Twilio WhatsApp number
```

**Get API keys:**
- Gemini: https://makersuite.google.com/app/apikey
- Supabase: https://supabase.com/dashboard
- Twilio: https://console.twilio.com

---

## 🐛 Troubleshooting

### Dashboard not loading
- Check if `npm run dev` is running
- Check browser console for errors
- Verify Supabase environment variables

### Map not showing
- Wait for loading spinner (Leaflet loads dynamically)
- Check browser console for errors
- Leaflet requires client-side rendering

### WhatsApp not responding
- Verify webhook URL is correct
- Check if you joined the sandbox
- Check Vercel/ngrok logs
- Ensure URL ends with `/api/whatsapp`

### Real-time updates not working
- Check Supabase Realtime is enabled
- Check browser console for connection errors
- Verify Supabase environment variables

---

## 📚 Documentation

Additional documentation in `docs/` folder:

- `DEPLOYMENT.md` - Detailed deployment guide
- `WHATSAPP-FLOW.md` - WhatsApp flow explanation
- `API.md` - API documentation

---

## 🤝 Contributing

This is a hackathon project. Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

## 📄 License

MIT License - See LICENSE file

---

## 🎯 Quick Start Checklist

- [ ] Clone repo and run `npm install`
- [ ] Create `.env.local` with all variables
- [ ] Run SQL files in Supabase
- [ ] Test locally: `npm run dev`
- [ ] Deploy to Vercel
- [ ] Configure Twilio webhook
- [ ] Join WhatsApp sandbox
- [ ] Test WhatsApp flow
- [ ] Done! 🎉

---

## 📞 Support

For issues or questions:
- Check documentation in `docs/` folder
- Review troubleshooting section above
- Check Vercel logs for deployment issues
- Check Twilio console for WhatsApp issues

---

## 🌟 Features Highlight

**What makes FarmFast special:**

1. **No App for Farmers** - Everything via WhatsApp
2. **AI Quality Grading** - Objective A/B/C grades in 10 seconds
3. **Location-Based** - Automatic matching with nearby buyers
4. **Real-time** - Dashboard updates instantly
5. **Bilingual** - Hindi for farmers, English for buyers
6. **Complete Solution** - From listing to payment

---

**Built with ❤️ for Indian farmers**

**Tech Stack:** Next.js • Supabase • Gemini AI • Twilio • Vercel
