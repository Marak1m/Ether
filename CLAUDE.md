# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FarmFast** — An AI-powered agricultural marketplace connecting Indian farmers with buyers. Farmers list produce by sending a WhatsApp photo; Amazon Bedrock AI grades it (A/B/C) in seconds and creates a listing. Buyers browse a web dashboard with real-time updates, location filters, and submit offers via the web UI, which triggers WhatsApp notifications back to farmers.

## Commands

```bash
npm run dev       # Start local dev server (port 3000)
npm run build     # Build production Next.js bundle
npm run start     # Start production server
npm run lint      # Run ESLint
```

**Docker:**
```bash
docker build -t farmfast .
docker run -p 8080:3000 farmfast
```

There are no automated test suites — quality is enforced via TypeScript strict mode and ESLint.

## Architecture

### Full-Stack Next.js

This is a **Next.js 16 App Router** application. All backend logic lives in `src/app/api/` as API Route handlers; all frontend pages are in `src/app/`. The `@/*` path alias maps to `./src/*`.

### Key Data Flow: WhatsApp Farmer Flow

The WhatsApp integration is the core of the product. `src/app/api/whatsapp/route.ts` (~750 lines) is a Twilio webhook that implements a **state machine** persisted in the `chat_sessions` Supabase table:

```
awaiting_name → awaiting_full_address → awaiting_initial_location
  → idle → (image received) → awaiting_quantity
  → listing_active → reviewing_offers → awaiting_handover_confirmation
```

Image processing pipeline: Twilio media URL → download → S3 upload → base64 encode → Bedrock Nova Lite grading → JSON parse → store listing in Supabase.

Sessions older than 24 hours in non-idle states are auto-reset to prevent stuck flows.

### AI: Amazon Bedrock

**`src/lib/bedrock.ts`** — Two models:
- **Nova Lite v1** (`amazon.nova-lite-v1:0`): Multimodal image grading. Returns crop type, grade (A/B/C), confidence score, price range (₹/kg), shelf life, quality factors JSON, and a one-sentence Hindi summary.
- **Nova Micro v1** (`amazon.nova-micro-v1:0`): Text-only Hindi chat responses (optional/future use).

Auth uses AWS SDK with `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` SigV4 signing.

### Image Storage: Amazon S3

**`src/lib/s3.ts`** — Images are stored in S3 as `produce-images/{farmerPhone}/{listingId}.jpg`. The database stores the **S3 key** (not a URL). `resolveImageUrl()` determines at query time whether a stored value is an S3 key or a direct URL, generating 1-hour pre-signed URLs as needed.

### Database: Supabase (PostgreSQL)

**`src/lib/supabase.ts`** — TypeScript types for `Listing`, `Offer`, `BuyerProfile`. Direct Supabase SDK queries (no ORM). Key tables:

| Table | Purpose |
|-------|---------|
| `listings` | Produce listings with grade, price, location, S3 image key |
| `offers` | Buyer offers linked to listings |
| `farmers` | Farmer profiles (phone = primary identifier) |
| `buyers` | Buyer profiles (linked to Supabase Auth user ID) |
| `chat_sessions` | WhatsApp conversation state per farmer phone |

SQL migration scripts are in `sql/`. Apply them in order to Supabase SQL editor when setting up a new environment.

Supabase Realtime subscriptions (`src/lib/realtime.ts`) power live dashboard updates without polling.

### Authentication

- **Farmers:** Phone-number based via WhatsApp. No passwords. The farmer's phone number is their unique ID across all tables.
- **Buyers:** Supabase Auth (email/password) via `src/lib/auth.ts`. Buyer profiles are stored in the `buyers` table with the Supabase Auth `user.id` as the primary key.

### Frontend

Pages use React Server Components where possible; client components are marked `'use client'`. State is managed locally via `useState` — no Redux/Zustand. Realtime data comes via Supabase Realtime channels.

Key pages: `/dashboard` (listings + map), `/analytics`, `/mandi-prices`, `/buyer/login`, `/buyer/register`, `/admin` (test data creation).

Leaflet maps are used in `src/components/ListingsMap.tsx` for geospatial listing display.

### Deployment

```
Browser → CloudFront CDN → AWS App Runner (port 8080) → Docker (Node 20-Alpine)
                                        ↓
              Bedrock AI | S3 Storage | Supabase DB | Twilio WhatsApp
```

App Runner health check polls `GET /api/health`. The Dockerfile uses multi-stage builds with a non-root `nextjs:nodejs` user. Next.js is configured for `output: 'standalone'` so the container bundles only what's needed.

## Environment Variables

```env
# AWS (required for AI grading and image storage)
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

# Optional
GOOGLE_CLOUD_API_KEY=     # Google TTS (not active in current flow)
CEDA_API_KEY=             # Mandi prices API
NEXT_PUBLIC_APP_URL=      # Frontend base URL
ADMIN_PASSWORD=           # Admin panel access
```

`NEXT_PUBLIC_*` variables must be provided as Docker build args when building the container image.

## Notable Patterns

- **Phone normalization:** All farmer phones are normalized to `+91XXXXXXXXXX` format at the WhatsApp webhook boundary before any DB lookup.
- **Geocoding:** Indian pincodes are resolved to lat/lon via OpenStreetMap Nominatim (`src/lib/geocoding.ts`). If geocoding fails, coordinates default to 0,0.
- **Distance filtering:** The listings API (`src/app/api/listings/route.ts`) uses the Haversine formula in `src/lib/utils.ts` to calculate distance from buyer coordinates and filter/sort by radius.
- **RLS policies:** Currently set to allow public access for demo purposes. Tighten before production.
