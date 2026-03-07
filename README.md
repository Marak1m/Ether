# FarmFast — AI-Powered Agricultural Marketplace

> Connecting Indian farmers with buyers through WhatsApp + AI quality grading, powered by Amazon Web Services.

![AWS](https://img.shields.io/badge/AWS-Bedrock%20%7C%20S3%20%7C%20App%20Runner%20%7C%20CloudFront-FF9900?style=for-the-badge&logo=amazon-aws)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)

---

## What is FarmFast?

FarmFast is a full-stack agricultural marketplace built for India:

- **Farmers** list produce by sending a WhatsApp photo — no app download required
- **Amazon Bedrock Nova Lite** grades the produce (A/B/C), estimates a price range, and responds in Hindi within ~10 seconds
- **Buyers** browse an AI-graded web dashboard, filter by location radius and grade, and submit competitive offers
- The **auction system** anchors reserve prices to live government mandi (wholesale) prices — farmers are protected from below-market offers

---

## Architecture

```
Browser ─── CloudFront CDN ─── AWS App Runner ─── Next.js 16 App
                                       │
               ┌───────────────────────┼──────────────────────┐
               │                       │                      │
        Amazon Bedrock           Amazon S3              Supabase DB
     (Nova Lite — vision)    (Produce photos)          (PostgreSQL)
               │
          Twilio API
       (WhatsApp Gateway)

EventBridge Scheduler ─── Lambda (farmfast-cron-invoker) ─── App Runner cron endpoints
```

### AWS Services

| Service | Purpose |
|---------|---------|
| **Amazon Bedrock Nova Lite v1** | Multimodal image grading: crop type, grade (A/B/C), price range, Hindi summary |
| **Amazon Bedrock Nova Micro v1** | Text-only Hindi chat responses |
| **Amazon S3** | Produce photo storage with 1-hour pre-signed URLs |
| **AWS App Runner** | Containerised Next.js hosting (1 vCPU / 2 GB, auto-scaling) |
| **Amazon CloudFront** | CDN + HTTPS termination |
| **Amazon ECR** | Docker image registry |
| **AWS Lambda** | Thin HTTP invoker for cron jobs (`farmfast-cron-invoker`) |
| **EventBridge Scheduler** | Triggers Lambda on schedule (midnight IST daily, Monday 7 AM IST) |

### Why Lambda for cron?

EventBridge Scheduler does not natively support arbitrary HTTPS endpoints. The correct architecture is:

```
EventBridge Scheduler → Lambda → HTTP GET (with Bearer token) → App Runner /api/cron/*
```

---

## Features

### For Farmers (WhatsApp — No App Required)
- Send a produce photo → Nova Lite grades it in ~10 seconds
- Receive grade (A/B/C), estimated price range, and a Hindi summary via WhatsApp
- Send pincode → location auto-resolved via OpenStreetMap Nominatim
- Send quantity → listing goes live with a mandi-anchored reserve price
- Receive offer notifications; accept/reject via WhatsApp
- Confirm delivery via WhatsApp

### For Buyers (Web Dashboard)
- Browse AI-graded listings with S3 produce photos
- Interactive Leaflet map view
- Filter by grade (A/B/C) and radius (5–50 km)
- View live mandi prices before submitting offers
- Submit competitive offers with pickup window selection
- Offers below the reserve price are rejected automatically

### Analytics Dashboard (3 Tabs)
- **Price Trends** — FarmFast accepted offer prices vs mandi modal prices over 30 days
- **Supply Overview** — Crop distribution of open auction listings by location
- **Market Intel** — Grade distribution, fill rate, avg time to first offer

---

## Tech Stack

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

## Project Structure

```
farmfast/
├── src/
│   ├── app/
│   │   ├── landing/                      # Landing page
│   │   ├── dashboard/                    # Buyer dashboard (list + map view)
│   │   ├── analytics/                    # Trade analytics (3-tab dashboard)
│   │   ├── mandi-prices/                 # Live government mandi price tracker
│   │   ├── buyer/                        # Auth (login, register, profile)
│   │   ├── admin/                        # Admin panel (test data creation)
│   │   └── api/
│   │       ├── whatsapp/                 # Twilio webhook + Bedrock AI pipeline
│   │       ├── listings/                 # CRUD + auction status management
│   │       ├── offers/                   # Submit offers (reserve price validation)
│   │       ├── mandi-prices/             # Serve mandi price data to frontend
│   │       ├── cron/
│   │       │   ├── mandi-sync/           # Daily mandi price sync (midnight IST)
│   │       │   └── weekly-digest/        # Weekly farmer digest (Monday 7 AM IST)
│   │       └── health/                   # App Runner health check
│   ├── components/
│   │   └── ListingsMap.tsx               # Leaflet map with listing markers
│   └── lib/
│       ├── bedrock.ts                    # Nova Lite + Micro integration
│       ├── s3.ts                         # S3 upload + pre-signed URL resolution
│       ├── supabase.ts                   # Database client + TypeScript types
│       ├── mandi-sync.ts                 # CEDA/Agmarknet mandi price fetcher
│       ├── digest.ts                     # Weekly digest logic
│       ├── realtime.ts                   # Supabase Realtime subscriptions
│       ├── auth.ts                       # Supabase Auth (buyer login)
│       ├── geocoding.ts                  # Pincode → lat/lon (OpenStreetMap Nominatim)
│       └── utils.ts                      # Haversine distance, phone normalisation
├── sql/
│   ├── supabase-schema.sql               # Base schema
│   ├── update-schema-location.sql        # Location fields
│   ├── add-farmers-table.sql             # Farmer profiles
│   ├── add-ratings-schema.sql            # Rating system
│   └── seed-demo-analytics.sql           # Demo data for analytics dashboard
├── Dockerfile                            # Multi-stage build (Node 20 Alpine)
└── .env.local                            # Local environment variables (not in git)
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `listings` | Produce listings (grade, quantity, location, S3 key, auction fields) |
| `offers` | Buyer offers (price, status, pickup window, pickup date) |
| `farmers` | Farmer profiles (phone as primary ID, location, pincode) |
| `buyers` | Buyer profiles (Supabase Auth user ID as primary key) |
| `chat_sessions` | WhatsApp conversation state machine per farmer phone |
| `mandi_prices` | Daily mandi prices by crop and district (30-day rolling window) |

### Spec v2 Columns

**`listings`:**
- `reserve_price` — auto-set to mandi modal price at listing time
- `mandi_modal_price` — snapshot of mandi price for analytics
- `auction_closes_at` — timestamp when auction window closes
- `auction_status` — `open` | `accepted` | `closed`

**`offers`:**
- `pickup_window` — e.g. `"Today morning (8 AM - 12 PM)"`
- `pickup_date` — resolved date of pickup

---

## Environment Variables

```env
# AWS (Bedrock AI + S3 image storage)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=farmfast-images

# Supabase (NEXT_PUBLIC vars are baked into the client bundle at build time)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Cron security (Bearer token for /api/cron/* endpoints)
CRON_SECRET=

# Optional
CEDA_API_KEY=             # Government mandi prices API
NEXT_PUBLIC_APP_URL=      # Frontend base URL (baked into client bundle)
ADMIN_PASSWORD=           # Admin panel access
```

---

## Local Development

### Prerequisites

- Node.js 20+
- Supabase project (free tier)
- Twilio account with WhatsApp sandbox
- AWS account with Bedrock Nova Lite + Micro access enabled

### Setup

```bash
git clone https://github.com/Marak1m/Ether.git
cd Ether/farmfast
npm install
```

Create `.env.local` with the variables above, then:

```bash
npm run dev     # http://localhost:3000
```

### Database Migrations

Run in Supabase SQL Editor in order:

```
sql/supabase-schema.sql              # Base schema
sql/update-schema-location.sql       # Location fields
sql/add-farmers-table.sql            # Farmer profiles
sql/add-ratings-schema.sql           # Rating system
```

Apply these to add Spec v2 fields:

```sql
CREATE TABLE IF NOT EXISTS public.mandi_prices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  crop_type text NOT NULL,
  district text NOT NULL,
  modal_price numeric NOT NULL,
  min_price numeric,
  max_price numeric,
  price_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(crop_type, district, price_date)
);

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS reserve_price numeric,
  ADD COLUMN IF NOT EXISTS mandi_modal_price numeric,
  ADD COLUMN IF NOT EXISTS auction_closes_at timestamptz,
  ADD COLUMN IF NOT EXISTS auction_status text DEFAULT 'open';

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS pickup_window text,
  ADD COLUMN IF NOT EXISTS pickup_date date;
```

Run `sql/seed-demo-analytics.sql` to populate analytics demo data (includes mandi prices, historical listings, accepted offers, and open auctions).

---

## AWS Deployment

### Live Infrastructure

| Resource | Value |
|----------|-------|
| App Runner URL | `vd7sn5hz9z.us-east-1.awsapprunner.com` |
| CloudFront | `d3w40aypkquo4p.cloudfront.net` |
| ECR | `993666109291.dkr.ecr.us-east-1.amazonaws.com/farmfast` |
| Lambda | `farmfast-cron-invoker` (Python 3.12, 60s timeout) |
| EventBridge Schedule 1 | `farmfast-mandi-sync` — daily midnight IST |
| EventBridge Schedule 2 | `farmfast-weekly-digest` — Monday 7 AM IST |

### Deploy a New Image

There is no CI/CD pipeline. To deploy a new build manually:

```bash
ECR="993666109291.dkr.ecr.us-east-1.amazonaws.com/farmfast"
SERVICE_ARN="arn:aws:apprunner:us-east-1:993666109291:service/farmfast/7331545fa3874b3c879daa09443d6bb2"

# 1. Write NEXT_PUBLIC vars for the Next.js build (not committed to git)
cat > farmfast/.env.production <<EOF
NEXT_PUBLIC_SUPABASE_URL=<value>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<value>
NEXT_PUBLIC_APP_URL=https://vd7sn5hz9z.us-east-1.awsapprunner.com
EOF

# 2. ECR login and Docker build
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 993666109291.dkr.ecr.us-east-1.amazonaws.com
docker build -t farmfast:latest farmfast/
rm farmfast/.env.production

# 3. Push to ECR — App Runner will auto-detect and redeploy
docker tag farmfast:latest $ECR:latest
docker push $ECR:latest

# 4. If auto-deploy doesn't trigger, start manually:
aws apprunner start-deployment --service-arn $SERVICE_ARN --region us-east-1
```

**Note on NEXT_PUBLIC vars:** The Dockerfile has no `ARG` declarations. `NEXT_PUBLIC_*` vars must exist as a `.env.production` file in the `farmfast/` directory during `docker build` so Next.js bakes them into the client bundle. Delete the file after building — do not commit it.

---

## API Routes

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/api/health` | None | App Runner health check |
| `POST` | `/api/whatsapp` | Twilio signature | Twilio webhook receiver |
| `GET` | `/api/listings` | None | Browse listings (grade, radius, location filters) |
| `POST` | `/api/offers` | None | Submit buyer offer (validates reserve price) |
| `GET` | `/api/mandi-prices` | None | Serve stored mandi prices |
| `GET` | `/api/cron/mandi-sync` | Bearer CRON_SECRET | Daily mandi price sync |
| `GET` | `/api/cron/weekly-digest` | Bearer CRON_SECRET | Weekly farmer WhatsApp digest |

---

## WhatsApp Farmer State Machine

`src/app/api/whatsapp/route.ts` implements a state machine persisted in `chat_sessions`:

```
awaiting_name → awaiting_full_address → awaiting_initial_location
  → idle → (image received) → awaiting_quantity
  → listing_active → reviewing_offers → awaiting_handover_confirmation
```

Image pipeline:
```
Twilio media URL → download → S3 upload → base64 encode
  → Bedrock Nova Lite (ConverseCommand) → JSON parse → DB upsert
```

Sessions older than 24 hours in non-idle states are auto-reset.

---

## Notable Patterns

- **Phone normalisation** — All farmer phones normalised to `+91XXXXXXXXXX` at the webhook boundary
- **Geocoding** — Indian pincodes resolved to lat/lon via OpenStreetMap Nominatim; defaults to 0,0 on failure
- **Distance filtering** — Listings API uses Haversine formula to filter/sort by radius from buyer coordinates
- **Image URL resolution** — `resolveImageUrl()` in `src/lib/s3.ts` distinguishes S3 keys from direct URLs; generates 1-hour pre-signed URLs for S3 keys
- **Mandi-anchored reserve prices** — At listing creation, `reserve_price` is set to the current `mandi_prices.modal_price` for the crop and district; offers below this return HTTP 400 `BELOW_RESERVE`
- **RLS** — Disabled on `mandi_prices` to allow server-side cron writes; other tables use public access for demo purposes

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| App Runner CREATE_FAILED | Port must be `8080`; health check path must be `/api/health` |
| CloudFront 404 | Use origin request policy `AllViewerExceptHostHeader`, not `AllViewer` |
| Bedrock AccessDeniedException | Enable Nova Lite + Micro in AWS Console → Bedrock → Model Access |
| WhatsApp not responding | Verify Twilio webhook is `POST https://your-domain/api/whatsapp` |
| Mandi sync writes 0 rows | Run `ALTER TABLE public.mandi_prices DISABLE ROW LEVEL SECURITY` |
| Analytics page empty | Run `sql/seed-demo-analytics.sql` in Supabase SQL Editor |
| `NEXT_PUBLIC_*` undefined in browser | Must be present during `docker build`, not just at runtime |
| Cron endpoints return 401 | `CRON_SECRET` not set in App Runner; update via `aws apprunner update-service` |

---

## License

MIT

---

**Built for Indian farmers** | AWS Bedrock • S3 • App Runner • CloudFront • ECR • EventBridge • Lambda | Next.js 16 • TypeScript • Supabase • Twilio
