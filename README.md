# FarmFast - AI-Powered Agricultural Marketplace
Projeft for AI for Bharat to 
Connect farmers with buyers through WhatsApp and AI-powered quality grading.

## 🌾 What is FarmFast?

FarmFast is a complete agricultural marketplace that:
- **For Farmers**: List produce via WhatsApp (no app needed)
- **For Buyers**: Browse quality-graded listings on web dashboard
- **AI Grading**: Gemini AI grades produce quality (A/B/C) in 10 seconds
- **Location-Based**: Matches farmers with nearby buyers (5-50km radius)# 🌾 FarmFast — AI-Powered Agricultural Marketplace

> Connecting Indian farmers with buyers through WhatsApp + AI quality grading, powered by Amazon Web Services.

![AWS](https://img.shields.io/badge/AWS-Bedrock%20%7C%20S3%20%7C%20App%20Runner%20%7C%20CloudFront-FF9900?style=for-the-badge&logo=amazon-aws)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)

---

## 🏗️ Architecture

```
Browser ─── CloudFront CDN ─── AWS App Runner ─── Next.js 16
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
             Amazon Bedrock    Amazon S3        Supabase
          (Nova Lite + Micro)  (Image Store)   (PostgreSQL)
                    │
               Twilio API
            (WhatsApp Gateway)
```

### AWS Services Used

| Service | Purpose | Details |
|---------|---------|---------|
| **Amazon Bedrock** | AI produce grading + Hindi chat | Nova Lite (multimodal) for image grading, Nova Micro (text) for chat |
| **Amazon S3** | Image storage | Pre-signed URLs for secure produce photo storage |
| **AWS App Runner** | Container hosting | Dockerized Next.js app, 1 vCPU / 2 GB |
| **Amazon CloudFront** | CDN | Global edge caching, HTTPS, routes to App Runner |
| **Amazon ECR** | Container registry | Docker image storage for App Runner |

---

## ✅ Features

### For Farmers (WhatsApp — No App Required)
- 📸 Send photo → **Amazon Nova Lite** grades produce quality (A/B/C) in ~10 seconds
- 🗣️ Hindi voice-first interface via **Amazon Nova Micro**
- 📍 Send pincode → Location auto-resolved
- 📦 Send quantity → Listing goes live to nearby buyers
- 💰 Receive + accept/reject offers via WhatsApp
- 💵 Get paid after delivery

### For Buyers (Web Dashboard)
- 🔍 Browse AI-graded listings with photos from **S3**
- 🗺️ Interactive map view (Leaflet + OpenStreetMap)
- 📊 Filter by grade (A/B/C) and radius (5–50 km)
- 💼 Submit competitive offers
- 📈 Analytics dashboard with trade insights
- 📉 Live mandi prices from government APIs (CEDA/Agmarknet)

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS |
| **Backend** | Next.js API Routes (Node.js) |
| **AI** | Amazon Bedrock — Nova Lite v1 (vision) + Nova Micro v1 (text) |
| **Database** | Supabase (PostgreSQL + Realtime) |
| **Storage** | Amazon S3 (pre-signed URLs) |
| **WhatsApp** | Twilio WhatsApp Business API |
| **Maps** | Leaflet + OpenStreetMap |
| **Hosting** | AWS App Runner + CloudFront |
| **Container** | Docker (Node 20 Alpine, multi-stage build) |

---

## 📁 Project Structure

```
farmfast/
├── src/
│   ├── app/
│   │   ├── landing/              # Landing page
│   │   ├── dashboard/            # Buyer dashboard (list + map view)
│   │   ├── analytics/            # Trade analytics + mandi prices
│   │   ├── mandi-prices/         # Government mandi price tracker
│   │   ├── buyer/                # Auth (login, register, profile)
│   │   ├── admin/                # Admin panel
│   │   └── api/
│   │       ├── whatsapp/         # Twilio webhook (Bedrock AI)
│   │       ├── listings/         # CRUD listings
│   │       ├── offers/           # Submit/manage offers
│   │       └── health/           # App Runner health check
│   ├── components/               # React components
│   └── lib/
│       ├── bedrock.ts            # Amazon Nova Lite + Micro integration
│       ├── s3.ts                 # S3 upload + pre-signed URLs
│       ├── supabase.ts           # Database client
│       └── twilio.ts             # WhatsApp messaging
├── sql/                          # Database migration scripts
├── docs/                         # Additional documentation
├── Dockerfile                    # Multi-stage Docker build for App Runner
├── .dockerignore                 # Excludes node_modules from build context
└── .env.local                    # Environment variables (not in git)
```

---

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 20+
- Docker Desktop (for AWS deployment)
- AWS CLI v2 (for AWS deployment)
- Supabase account
- Twilio account with WhatsApp sandbox
- AWS account with Bedrock model access

### 1. Clone & Install

```bash
git clone https://github.com/Marak1m/Ether.git
cd Ether/farmfast
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
# Amazon Bedrock AI
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Amazon S3
AWS_S3_BUCKET=your_s3_bucket_name

# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# WhatsApp
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Mandi Prices
CEDA_API_KEY=your_ceda_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_PASSWORD=your_admin_password
```

### 3. Database Setup

Run these scripts in Supabase SQL Editor (in order):

```
sql/supabase-schema.sql            → Main schema
sql/update-schema-location.sql     → Location fields
sql/add-farmers-table.sql          → Farmer profiles
sql/add-ratings-schema.sql         → Rating system
sql/seed-demo-data.sql             → Demo data (optional)
```

### 4. Enable Bedrock Models

In AWS Console → **Bedrock → Model Access**, request access for:
- `Amazon Nova Lite` (image grading)
- `Amazon Nova Micro` (Hindi chat)

### 5. Run Locally

```bash
npm run dev
```

Open http://localhost:3000/landing

---

## 🌐 AWS Deployment

### Architecture

```
User → CloudFront (d3w40aypkquo4p.cloudfront.net)
         → App Runner (vd7sn5hz9z.us-east-1.awsapprunner.com)
            → Docker container (Node 20 Alpine, port 8080)
```

### Deploy Steps

```bash
# 1. Build Docker image
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=your_url \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  --build-arg NEXT_PUBLIC_APP_URL=https://your-cloudfront-domain \
  -t farmfast .

# 2. Authenticate with ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# 3. Tag and push
docker tag farmfast:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/farmfast:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/farmfast:latest

# 4. Create App Runner service (via AWS Console or CLI)
# - Source: ECR image
# - Port: 8080
# - CPU: 1 vCPU, Memory: 2 GB
# - Health check: HTTP /api/health

# 5. Create CloudFront distribution
# - Origin: App Runner URL (HTTPS only)
# - Cache policy: CachingDisabled
# - Origin request policy: AllViewerExceptHostHeader
# - Allow all HTTP methods (GET, POST, PUT, PATCH, DELETE)
```

### Key Deployment Notes

- **Port 8080** — App Runner default; configured in Dockerfile and App Runner
- **Health check** — `/api/health` returns `{"status":"ok"}` for App Runner health monitoring
- **`NEXT_PUBLIC_*` vars** — Must be passed as `--build-arg` during Docker build (baked into client bundle)
- **Runtime env vars** — All other secrets passed via App Runner environment configuration
- **CloudFront origin policy** — Use `AllViewerExceptHostHeader` (ID: `b689b0a8-53d0-40ab-baf2-68738e2966ac`), NOT `AllViewer`

---

## 📱 How It Works

### Farmer Flow (WhatsApp)

```
1. Send Photo   → Nova Lite grades in ~10s → "Grade A, ₹15-20/kg"
2. Send Pincode → "411001" → "Location: Pune, Maharashtra"
3. Send Quantity → "500" → "Listed! Sent to nearby buyers"
4. Receive Offer → "New offer: ₹16/kg from Raj Traders"
5. Accept Offer  → "पहला वाला ठीक है" → "Offer accepted!"
6. Delivery      → "माल दे दिया" → "Payment released!"
```

### Buyer Flow (Web)

```
1. Register   → Create account with location
2. Browse     → See AI-graded listings with S3 photos
3. Filter     → By grade (A/B/C) and radius (5-50km)
4. Compare    → Check live mandi prices
5. Offer      → Submit price, pickup time, message
6. Wait       → Farmer accepts/rejects via WhatsApp
7. Pickup     → Collect produce, rate the farmer
```

---

## 🗂️ Database Schema

| Table | Purpose |
|-------|---------|
| `listings` | Produce listings from farmers (grade, quantity, location, S3 image URL) |
| `offers` | Buyer offers on listings (price, status, messages) |
| `buyers` | Buyer profiles (name, location, business type) |
| `farmers` | Farmer profiles (phone, address, pincode) |
| `chat_sessions` | WhatsApp conversation state machine |
| `ratings` | Transaction ratings |

Schema files are in the `sql/` directory.

---

## 💰 AI Cost Model (Amazon Nova)

| Model | Input | Output | Use Case |
|-------|-------|--------|----------|
| Nova Lite v1 | $0.06/1M tokens | $0.24/1M tokens | Image grading (multimodal) |
| Nova Micro v1 | $0.035/1M tokens | $0.14/1M tokens | Hindi chat (text-only) |

**Estimated cost for 500 produce photos:** ~$0.10 (50x cheaper than Claude Sonnet)

---

## 🔑 API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/health` | Health check for App Runner |
| `POST` | `/api/whatsapp` | Twilio webhook (receives WhatsApp messages) |
| `GET` | `/api/listings` | Get active listings (supports filters) |
| `POST` | `/api/offers` | Submit buyer offer |
| `GET` | `/api/mandi-prices` | Fetch government mandi prices |

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| App Runner CREATE_FAILED | Ensure port is 8080 (not 3000), health check on `/api/health` |
| CloudFront returns 404 | Use `AllViewerExceptHostHeader` origin request policy, not `AllViewer` |
| Bedrock AccessDeniedException | Enable Nova Lite + Micro in Bedrock → Model Access |
| WhatsApp not responding | Verify webhook URL is `https://your-domain/api/whatsapp`, method: POST |
| Docker build slow | Ensure `.dockerignore` exists (excludes node_modules) |
| Git push blocked | Don't commit files with AWS keys — use `.gitignore` |

---

## 📚 Documentation

- `docs/DEPLOYMENT.md` — Deployment guide
- `docs/WHATSAPP-FLOW.md` — WhatsApp conversation flow
- `docs/API.md` — API documentation
- `docs/MENU-SYSTEM.md` — WhatsApp menu system

---

## 📄 License

MIT License

---

**Built with ❤️ for Indian farmers**

**AWS Stack:** Bedrock (Nova) • S3 • App Runner • CloudFront • ECR
**App Stack:** Next.js 16 • TypeScript • Supabase • Twilio • Docker

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
