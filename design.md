# FarmFast - System Design Document

## Design Philosophy

FarmFast is designed with three core principles:

1. Accessibility First: Every farmer, regardless of literacy or smartphone access, must be able to use the platform via voice and WhatsApp
2. Speed Over Perfection: Farmers need quick decisions, not perfect predictions. Target 1-hour buyer response time over complex optimizations
3. Trust Through Transparency: Quality grading and payment escrow build trust in a sector plagued by information asymmetry

## High-Level Architecture

FarmFast uses a serverless microservices architecture optimized for rural Indian network conditions and WhatsApp-first interactions.

### System Components

1. User Interface Layer
- Farmer Interface: WhatsApp Business API (Twilio)
- Buyer Interface: Progressive Web App (PWA) + Android app
- Admin Interface: Web dashboard for operations and support

2. Core Services Layer
- Listing Service: Handles produce listing creation and broadcasting
- Quality Grading Service: AI-powered produce quality assessment
- Matching Service: Geospatial buyer discovery and listing broadcast
- Bidding Service: Manages buyer offers and farmer selections
- Payment Service: UPI escrow and transaction management
- Voice Service: Speech-to-text and text-to-speech in regional languages

3. Data Layer
- Primary Database: PostgreSQL (user profiles, transactions, listings)
- Cache Layer: Redis (session state, active listings)
- Object Storage: AWS S3 (produce images, voice recordings)
- Search Engine: Elasticsearch (buyer search, listing discovery)

4. External Integrations
- WhatsApp: Twilio Business API for farmer communication
- Payment: Razorpay for UPI escrow and settlements
- LLM: AWS Bedrock Claude for natural language processing
- Maps: Google Maps API for distance calculations
- Market Data: Agmarknet API for mandi prices

### Data Flow Example: Farmer Lists Produce

Step 1: Farmer Sends WhatsApp Message
- Farmer sends photo + voice note: "500 किलो टमाटर बेचना है" (Want to sell 500kg tomatoes)
- Message received by Twilio webhook

Step 2: Processing Pipeline
- Voice Service converts speech to text using Google Speech-to-Text
- LLM extracts structured data: crop=tomato, quantity=500kg, urgency=today
- Image uploaded to S3, Quality Grading Service triggered

Step 3: Quality Assessment
- MobileNetV3 model analyzes image in under 10 seconds
- Output: Grade B, confidence 89%, quality factors saved to database
- Voice response generated: "आपके टमाटर B ग्रेड हैं" (Your tomatoes are B grade)

Step 4: Listing Creation and Broadcast
- Listing Service creates database record with farmer details, quality grade, location
- Matching Service queries buyer database for eligible buyers within 20km
- Broadcast sent via email/SMS/push notification to 15 buyers

Step 5: Buyer Response Loop
- Buyers view listing on dashboard, submit offers via app
- Bidding Service ranks offers and sends to farmer via WhatsApp voice message
- Farmer selects best offer via voice: "पहला वाला ठीक है" (First one is okay)

Step 6: Transaction Completion
- Payment Service creates escrow transaction
- Buyer deposits ₹8,000 via UPI (500kg × ₹16/kg)
- Buyer receives farmer's phone number and pickup instructions
- After pickup, farmer confirms handover, payment released within 30 seconds

## Detailed Component Design

### Listing Service

Purpose: Manage the complete lifecycle of produce listings from creation to fulfillment.

Key Operations:
- Create listing from WhatsApp voice/photo input
- Update listing status (active, offers_received, sold, expired)
- Archive completed transactions
- Handle listing modifications (quantity changes, early closure)

Database Schema:

listings table:
- listing_id (UUID, primary key)
- farmer_id (UUID, foreign key to users)
- crop_type (string: tomato, onion, potato, etc.)
- quality_grade (A/B/C)
- quantity_kg (integer)
- location (lat/lon coordinates)
- listing_status (active, sold, expired, cancelled)
- created_at, expires_at timestamps
- image_urls (array of S3 paths)

Business Logic:
- Listings auto-expire after 6 hours if no offers accepted
- Quality grade cannot be changed after listing creation (prevents fraud)
- Minimum listing quantity: 50kg (prevents spam)
- Maximum active listings per farmer: 5 (prevents system abuse)

### Quality Grading Service

Purpose: Provide objective, AI-powered quality assessment to create standardized grading system.

ML Model Architecture:
- Base model: MobileNetV3-Large pre-trained on ImageNet
- Fine-tuned on agricultural produce dataset (5,000 images per crop)
- Output: Multi-class classification (A/B/C grade) + quality factors (color, defects, uniformity)
- Inference time: 8-10 seconds on CPU, 2-3 seconds on GPU

Quality Grading Criteria:

A Grade (Premium): 
- Color uniformity 90%+
- Surface defects under 5%
- Size consistency 85%+
- Ripeness optimal for 5+ day shelf life

B Grade (Standard):
- Color uniformity 70-90%
- Surface defects 5-15%
- Size consistency 65-85%
- Ripeness optimal for 3-5 day shelf life

C Grade (Economy):
- Color uniformity below 70%
- Surface defects 15-30%
- Size consistency below 65%
- Immediate sale recommended

Deployment:
- Primary: AWS Lambda with ML model loaded in /tmp directory
- Fallback: AWS SageMaker endpoint for batch processing
- Model stored in S3, versioned for A/B testing
- Weekly retraining with new farmer images (with consent)

### Matching Service

Purpose: Connect farmers with relevant buyers based on location, crop type, and buyer preferences.

Matching Algorithm:

Phase 1: Buyer Discovery
- Query buyers table for those interested in crop_type
- Filter by geospatial distance (PostGIS radius query: 20km default)
- Check buyer capacity (daily purchase limits, storage availability)
- Exclude buyers with poor ratings (below 3.5 stars)

Phase 2: Ranking
- Rank by distance (closer buyers ranked higher)
- Boost buyers with history of quick offers (respond within 15 minutes)
- Boost buyers who purchase entire quantity (reduce farmer effort)
- Apply buyer preferences (some prefer A-grade only, etc.)

Phase 3: Broadcast
- Top 20 buyers notified simultaneously
- Notification includes: crop, grade, quantity, approximate location (district-level for privacy)
- Buyers can view full details and submit offer on dashboard

Geospatial Optimization:
- Buyers indexed by location using PostGIS geography type
- Radius queries optimized with GIST spatial index
- Dynamic radius expansion if fewer than 5 buyers found in 20km (expand to 50km)

### Bidding Service

Purpose: Facilitate transparent offer submission and selection process.

Offer Structure:

offers table:
- offer_id (UUID, primary key)
- listing_id (UUID, foreign key)
- buyer_id (UUID, foreign key)
- offered_price_per_kg (decimal)
- total_amount (decimal)
- pickup_timeline (string: within_2_hours, within_4_hours, same_day)
- payment_terms (instant_via_platform, cash_on_pickup)
- offer_status (pending, accepted, rejected, expired)
- created_at timestamp

Business Rules:
- Buyers can modify offer within 30 minutes of submission
- Farmers receive voice notification for every new offer
- Offers auto-expire after 2 hours
- Maximum 1 active offer per buyer per listing
- Minimum offer: 80% of suggested fair price (prevents lowball offers)

Farmer Offer Review:
- Offers presented in voice format: "तीन खरीददार हैं। पहला ₹16 प्रति किलो दे रहा है, 2 घंटे में लेगा।" (Three buyers. First offering ₹16 per kg, will pick up in 2 hours.)
- LLM generates comparison: "Best offer is ₹500 more than second-best. Recommend accepting."
- Farmer accepts via voice command or WhatsApp button click

### Payment Service

Purpose: Handle secure payment escrow and instant settlements.

Payment Flow:

Pre-Authorization (Before Pickup):
- Buyer selects offer, clicks "Confirm Purchase"
- Razorpay creates UPI collect request for total amount
- Buyer completes UPI payment, funds held in platform escrow account
- Farmer notified: "पैसा जमा हो गया। खरीददार को माल दे सकते हैं।" (Payment received. You can handover produce to buyer.)

Settlement (After Handover):
- Buyer arrives, collects produce
- Farmer confirms via WhatsApp: "माल दे दिया" (Produce handed over)
- Platform releases payment to farmer's UPI ID within 30 seconds
- 2% commission deducted from buyer's payment (farmer receives full amount)

Dispute Resolution:
- If farmer doesn't confirm handover within 4 hours, buyer can raise dispute
- Platform support calls both parties, mediates resolution
- If quality mismatch proven (photo evidence), partial refund issued
- Escrow held for 24 hours maximum before auto-resolution

Transaction Records:

transactions table:
- transaction_id (UUID, primary key)
- listing_id, offer_id, farmer_id, buyer_id (foreign keys)
- amount (decimal)
- commission (decimal: 2% of amount)
- payment_status (authorized, completed, refunded, disputed)
- settlement_timestamp
- upi_transaction_ref (from Razorpay)

### Voice Service

Purpose: Enable completely voice-driven interaction for illiterate farmers.

Speech-to-Text (STT):
- Provider: Google Cloud Speech-to-Text API
- Languages: Hindi (hi-IN), Marathi (mr-IN), Telugu (te-IN), Tamil (ta-IN), Kannada (kn-IN)
- Model: Latest long-form audio model
- Custom vocabulary: Agricultural terms (crop names, units, market terminology)
- Accuracy target: 85%+ word accuracy for agricultural conversations

Text-to-Speech (TTS):
- Provider: Google Cloud Text-to-Speech (WaveNet voices)
- Voice selection: Gender-neutral, clear pronunciation
- Speech rate: 15% slower than default (rural users prefer slower speech)
- SSML formatting: Pauses between sentences, emphasis on numbers

Intent Recognition:
- Lightweight classifier on top of STT output
- Common intents:
  - list_produce: "टमाटर बेचना है" (Want to sell tomatoes)
  - check_offers: "कोई खरीददार मिला?" (Any buyer found?)
  - accept_offer: "पहला वाला ठीक है" (First one is okay)
  - confirm_handover: "माल दे दिया" (Produce handed over)
  - help: "कैसे यूज करें?" (How to use?)

Voice Conversation State Management:
- Redis stores conversation context (last 5 messages)
- Session timeout: 30 minutes of inactivity
- Context includes: current listing_id, last offers viewed, pending actions
- Example: If farmer says "हां ठीक है" (Yes okay), system knows to accept the last offer presented

## WhatsApp Integration Architecture

Why WhatsApp:
- 550+ million users in India, 97% of rural smartphone users have WhatsApp
- No app installation required (zero friction)
- Familiar interface (farmers already use for communication)
- Works on 2G networks with async message delivery

Technical Implementation:
- Twilio WhatsApp Business API (official Meta partner)
- Webhook endpoint: AWS API Gateway → Lambda function
- Message types supported:
  - Text messages (farmer voice transcription results)
  - Image messages (produce photos)
  - Audio messages (voice notes from farmers)
  - Interactive buttons (Accept/Reject offers)

Message Flow:
1. Farmer sends WhatsApp message to FarmFast number
2. Twilio receives message, POSTs to webhook
3. Lambda function processes message (extracts content, identifies farmer)
4. Business logic executes (listing creation, offer acceptance, etc.)
5. Response generated (text/voice/image)
6. Sent back to farmer via Twilio API

Rate Limiting:
- Twilio limit: 60 messages per minute per number
- Per-user limit: 10 messages per hour (prevents spam)
- Queue overflow messages for async delivery

Cost Optimization:
- WhatsApp message cost: ₹0.50 per business-initiated message
- User-initiated messages (replies): Free for 24 hours
- Strategy: Batch multiple updates into single message when possible

## Buyer Dashboard Design

Technology Stack:
- Frontend: React 18 + TypeScript
- UI Framework: Material-UI (fast development, mobile-responsive)
- State Management: React Query (for server state)
- Maps: Google Maps JavaScript API
- Deployment: Hosted as static site on AWS S3 + CloudFront

Key Screens:

1. Active Listings Map View
- Map showing farmer locations (district-level for privacy)
- Pin colors indicate crop type
- Pin size indicates quantity
- Click pin to view listing details

2. Listing Details Modal
- Crop type, quality grade (with grade explanation)
- Quantity, farmer location (village name)
- Expected price range based on quality
- Submit offer form (price per kg, pickup timeline)

3. My Offers Tab
- List of all offers submitted by buyer
- Status indicators: Pending (yellow), Accepted (green), Rejected (red)
- Accepted offers show farmer contact and pickup instructions

4. Purchase History
- Past transactions with farmers
- Option to rate farmer (quality accuracy, handover smoothness)
- Analytics: Total quantity purchased, average price paid, savings vs mandi rates

Mobile Responsiveness:
- Dashboard fully functional on Android phones (buyers often use mobile devices)
- Touch-optimized UI elements (large buttons, easy scrolling)
- Offline mode: View cached listings, queue offers for submission when online

## Deployment Architecture

### Cloud Infrastructure (AWS)

Compute:
- AWS Lambda for all microservices (auto-scales, pay-per-use)
- Language: Node.js 20 for APIs, Python 3.12 for ML services
- Memory allocation: 512MB (APIs), 3GB (ML inference)
- Timeout: 30 seconds (APIs), 120 seconds (ML)

API Gateway:
- REST API for buyer dashboard and mobile app
- WebSocket API for real-time offer notifications to buyers
- Custom domain: api.farmfast.in
- Rate limiting: 1000 requests per minute per API key

Database:
- Amazon RDS PostgreSQL 15 (Multi-AZ for high availability)
- Instance: db.t3.medium (2 vCPU, 4GB RAM for MVP)
- Storage: 100GB SSD with auto-scaling
- Backup: Daily snapshots, 7-day retention

Caching:
- Amazon ElastiCache Redis (cache.t3.micro for MVP)
- Cache: Session state, active listings, buyer profiles, mandi prices
- TTL: 30 minutes for most data, 24 hours for mandi prices

Storage:
- AWS S3 for images and ML models
- Bucket structure:
  - produce-images/: Farmer-uploaded photos
  - voice-recordings/: Audio messages
  - ml-models/: Quality grading models (versioned)
- Lifecycle policy: Archive images older than 90 days to S3 Glacier

CDN:
- Amazon CloudFront for buyer dashboard static assets
- Edge locations in India for low latency
- Caching strategy: 24-hour cache for JS/CSS, no cache for API calls

Monitoring:
- Amazon CloudWatch for logs and metrics
- Custom metrics: Listing creation rate, buyer response time, payment success rate
- Alarms: Lambda errors, database connection failures, high API latency

Cost Estimate (MVP for 10,000 farmers):
- Lambda: ₹5,000/month (1 million requests)
- RDS: ₹8,000/month (db.t3.medium)
- S3: ₹2,000/month (50GB storage)
- Twilio WhatsApp: ₹20,000/month (40,000 messages)
- Total: ~₹40,000/month (~$500/month)

### Deployment Pipeline

Development → Staging → Production

CI/CD Tool: GitHub Actions

Pipeline Stages:
1. Code Push: Developer pushes to GitHub
2. Automated Tests: Unit tests, integration tests (must pass to proceed)
3. Build: Docker images built for Lambda functions
4. Deploy to Staging: Deploy to staging AWS environment
5. Smoke Tests: Automated E2E tests on staging
6. Manual Approval: PM reviews staging deployment
7. Deploy to Production: Blue-green deployment to production
8. Health Check: Monitor error rates for 30 minutes post-deployment

Rollback Strategy:
- Keep previous Lambda version available
- Single command rollback if production issues detected
- Database migrations backward-compatible for 1 version

## Security and Privacy Design

### Authentication

Farmers:
- Phone number-based authentication via WhatsApp
- No password required (WhatsApp session verification sufficient)
- Session token stored in Redis, 30-day expiry

Buyers:
- Email + password for dashboard access
- JWT tokens (7-day expiry, refresh token for 30 days)
- Two-factor authentication optional (SMS OTP)

Admin:
- Multi-factor authentication mandatory
- IP whitelisting for production database access
- Role-based access control (RBAC)

### Data Protection

Encryption:
- In transit: TLS 1.3 for all API communications
- At rest: RDS encryption enabled, S3 server-side encryption (AES-256)
- Secrets: AWS Secrets Manager for API keys, database credentials

Privacy:
- Farmer location shared with buyers at district-level only (not exact GPS)
- Farmer phone number revealed only after offer acceptance
- Buyer cannot see other buyers' offers (no bid history)
- Transaction data anonymized for analytics (personally identifiable information removed)

Compliance:
- Data retention: User data deleted upon account closure request
- Consent management: Explicit opt-in for ML model training using farmer images
- Transparency: Privacy policy available in regional languages

### Fraud Prevention

Quality Grade Manipulation:
- Images timestamped and location-tagged (detect old photos)
- Farmer cannot upload multiple photos and choose best grade (first photo locks grade)
- Repeat offenders (grade mismatches reported by buyers) get account warnings

Payment Fraud:
- Escrow system prevents non-payment by buyers
- Razorpay handles payment verification (reduces platform risk)
- Chargeback protection (UPI transactions are instant settlement)

Fake Listings:
- Phone number verification required
- Rate limiting: Max 3 listings per day per farmer
- Machine learning model flags suspicious patterns (e.g., listing 10 tons with smartphone photo)

## Scalability Considerations

### Current Bottlenecks

Quality Grading Service:
- ML inference takes 8-10 seconds on Lambda CPU
- Solution: Use AWS Inferentia instances for 3x faster inference once volume justifies cost

Database Connections:
- RDS connection limit: 100 concurrent connections
- Solution: Use RDS Proxy for connection pooling

Buyer Broadcast:
- Sending SMS/email to 100+ buyers takes time
- Solution: Use Amazon SNS for parallel message delivery

### Horizontal Scaling Strategy

Phase 1 (0-10K farmers): Single AWS region (Mumbai), shared RDS instance

Phase 2 (10K-100K farmers): Read replicas for database, Lambda auto-scaling

Phase 3 (100K+ farmers): Multi-region deployment, DynamoDB for high-write workloads

Phase 4 (1M+ farmers): Event-driven architecture with Kafka, microservices decomposition

### Geographic Expansion

Regional Customization:
- Different crops per region (mangoes in Maharashtra, basmati in Punjab)
- Regional language models (Punjabi, Bengali added based on demand)
- State-specific regulations (APMC compliance varies by state)

Deployment Strategy:
- Start with Maharashtra, Karnataka, Telangana (high agritech adoption)
- Expand to North India (UP, Punjab, Haryana) in Phase 2
- East/Northeast India (West Bengal, Assam) in Phase 3

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Voice Recognition Robustness

*For any* agricultural voice input in supported languages (Hindi, Marathi, Telugu, Tamil, Kannada), the speech-to-text system should correctly extract crop type, quantity, and location with at least 85% accuracy, regardless of background noise levels or regional accent variations.

**Validates: Requirements 5.1.1, 5.1.4**

### Property 2: Quality Grading Model Robustness

*For any* produce image of supported crop types (tomato, onion, potato, mango, banana), the quality grading model should assign a grade (A/B/C) with at least 80% accuracy compared to human expert assessment, regardless of photo quality, lighting conditions, or camera angle.

**Validates: Requirements 5.2.2, 5.2.3**

### Property 3: Multi-Modal Output Completeness

*For any* quality grading result, the system should generate both a visual grade indicator (A/B/C with confidence score) and a voice explanation in the farmer's selected language, ensuring accessibility for both literate and illiterate users.

**Validates: Requirements 5.2.4**

### Property 4: Broadcast Confirmation Delivery

*For any* successfully created listing, the system should send a confirmation message to the farmer indicating the number of buyers who received the broadcast, providing transparency about market reach.

**Validates: Requirements 5.3.3**

### Property 5: Voice-Driven Offer Interaction

*For any* set of buyer offers on a listing, the system should be able to present all offers in voice format in the farmer's language and correctly parse voice acceptance commands (e.g., "पहला वाला ठीक है") to identify which offer the farmer selected.

**Validates: Requirements 5.4.3, 5.4.4**

### Property 6: Payment Escrow Guarantee

*For any* accepted offer, the escrow payment system should guarantee that either the farmer receives full payment after handover confirmation OR the buyer receives a full refund if the transaction is cancelled, with zero possibility of payment default by either party.

**Validates: Requirements 5.5.1**

### Property 7: Dispute Resolution State Machine

*For any* transaction where handover is disputed (farmer doesn't confirm within 4 hours OR buyer raises quality concern), the system should automatically trigger the dispute resolution workflow and hold escrow funds until resolution, preventing premature payment release.

**Validates: Requirements 5.5.4**

### Property 8: Transaction History Persistence

*For any* completed transaction, the system should store all transaction details (date, buyer, quantity, price, quality grade) and make them retrievable via voice query or dashboard access for at least 2 years, enabling farmers to track their earnings history.

**Validates: Requirements 5.6.4**

### Property 9: Pricing Algorithm Accuracy

*For any* produce listing with quality grade and location, the pricing intelligence system should calculate a fair price range that falls within ±₹2/kg of the actual market price at the nearest mandi for that quality grade, based on current Agmarknet data.

**Validates: Requirements 5.7.1**

### Property 10: Price Information Sequencing

*For any* listing creation, the system should deliver price context (expected price range based on quality and current mandi rates) to the farmer before any buyer offers arrive, ensuring farmers can evaluate offers against market benchmarks.

**Validates: Requirements 5.7.3**

### Property 11: Historical Trend Calculation

*For any* crop type and location combination with sufficient historical data (minimum 30 days), the system should calculate and present price trend information (e.g., "Prices typically rise 10% next week") based on past transaction data and seasonal patterns.

**Validates: Requirements 5.7.4**

### Property 12: Multi-Modal Transaction Insights

*For any* farmer's transaction history query (voice or dashboard), the system should generate insights in both visual format (charts, tables) and voice format (spoken summary), ensuring accessibility across literacy levels.

**Validates: Requirements 5.8.1, 5.8.3**

### Property 13: Data Privacy Protection

*For any* farmer's personal data (phone number, location, transaction history), the system should enforce access controls such that the data is never shared with buyers or third parties without explicit farmer consent, and unauthorized access attempts are blocked.

**Validates: Requirements 5.8.4**

## Error Handling

### Voice Recognition Errors

**Scenario**: Speech-to-text fails to recognize farmer's voice input

**Handling**:
- Retry with enhanced noise filtering (up to 2 retries)
- If still fails, send voice message: "आपकी आवाज़ साफ नहीं सुनाई दी। कृपया फिर से बोलें।" (Your voice wasn't clear. Please speak again.)
- Fallback: Offer button-based interface for crop selection
- Log failure for model improvement

### Quality Grading Errors

**Scenario**: Image quality too poor for grading (blurry, too dark, wrong subject)

**Handling**:
- Detect low confidence score (below 60%)
- Send voice message: "फोटो साफ नहीं है। कृपया अच्छी रोशनी में दूसरी फोटो भेजें।" (Photo not clear. Please send another photo in good lighting.)
- Provide photo tips: "फसल को नज़दीक से, रोशनी में फोटो लें" (Take photo of produce close-up, in light)
- Allow up to 3 photo retries per listing

**Scenario**: ML model inference timeout or failure

**Handling**:
- Fallback to manual grading queue (support team grades within 15 minutes)
- Notify farmer: "हम आपकी फसल की जांच कर रहे हैं। 15 मिनट में ग्रेड मिलेगा।" (We're checking your produce. Grade in 15 minutes.)
- Alert engineering team for model debugging

### Buyer Matching Errors

**Scenario**: No buyers found within 20km radius

**Handling**:
- Expand search radius to 50km automatically
- If still no buyers, notify farmer: "आपके क्षेत्र में अभी खरीददार नहीं मिले। हम आपको सूचित करेंगे जब कोई मिलेगा।" (No buyers in your area right now. We'll notify you when someone is available.)
- Add listing to "pending broadcast" queue
- Notify farmer when new buyers register in the area

**Scenario**: All notified buyers are inactive (haven't logged in for 7+ days)

**Handling**:
- Send SMS to inactive buyers as backup notification
- Expand radius and notify additional buyers
- Provide farmer with option to list on partner platforms (e.g., local FPO)

### Payment Errors

**Scenario**: Buyer's UPI payment fails (insufficient balance, bank downtime)

**Handling**:
- Retry payment up to 3 times with 5-minute intervals
- If all retries fail, cancel offer and notify farmer: "खरीददार का पेमेंट नहीं हो पाया। दूसरे ऑफर देखें।" (Buyer's payment failed. Check other offers.)
- Offer automatically marked as expired
- Buyer notified and given option to retry with different payment method

**Scenario**: Payment settlement to farmer fails (invalid UPI ID, bank account frozen)

**Handling**:
- Hold payment in escrow and notify farmer: "आपके खाते में पैसा नहीं जा पाया। कृपया अपना UPI ID जांचें।" (Payment couldn't reach your account. Please check your UPI ID.)
- Allow farmer to update UPI ID via WhatsApp
- Retry settlement after update
- If unresolved for 24 hours, support team contacts farmer via phone

### Network and Connectivity Errors

**Scenario**: Farmer's WhatsApp message fails to reach server (network timeout)

**Handling**:
- WhatsApp automatically retries message delivery when network available
- Server implements idempotency (duplicate messages don't create duplicate listings)
- If message delayed by more than 1 hour, send confirmation when finally received

**Scenario**: Buyer dashboard loses internet connection

**Handling**:
- Progressive Web App caches recent listings for offline viewing
- Queue offer submissions for automatic retry when connection restored
- Show clear "Offline" indicator in UI
- Sync queued actions when connection returns

### Data Consistency Errors

**Scenario**: Race condition - two buyers accept same listing simultaneously

**Handling**:
- Database transaction with row-level locking on listing status
- First acceptance wins, second buyer receives: "यह लिस्टिंग पहले ही बिक चुकी है।" (This listing already sold.)
- Refund second buyer's escrow payment immediately

**Scenario**: Farmer confirms handover but buyer disputes quality

**Handling**:
- Freeze payment in escrow (don't release to farmer yet)
- Support team contacts both parties within 2 hours
- Request photo evidence from buyer
- If quality mismatch proven (grade A listed but C delivered), partial refund calculated
- If dispute unresolved, escalate to senior support for manual resolution

### External Service Failures

**Scenario**: Twilio WhatsApp API downtime

**Handling**:
- Fallback to SMS for critical notifications (offer accepted, payment received)
- Queue non-critical messages for delivery when Twilio recovers
- Display service status on buyer dashboard
- Alert engineering team immediately

**Scenario**: Razorpay payment gateway downtime

**Handling**:
- Pause new offer acceptances (prevent transactions that can't complete)
- Notify farmers: "पेमेंट सिस्टम में अस्थायी समस्या है। कृपया 30 मिनट बाद कोशिश करें।" (Temporary payment system issue. Please try in 30 minutes.)
- Monitor Razorpay status page for recovery
- Resume operations automatically when gateway recovers

**Scenario**: Agmarknet API unavailable (mandi price data)

**Handling**:
- Use cached prices from last successful fetch (up to 24 hours old)
- Display disclaimer: "कीमतें कल की हैं, आज की अपडेट नहीं मिली।" (Prices from yesterday, today's update not available.)
- Fallback to historical average if cache also expired
- Alert team to investigate API issue

### Monitoring and Alerting

**Critical Alerts** (immediate engineering response):
- Payment service errors (any payment failure)
- Database connection failures
- ML model inference errors exceeding 10% of requests
- WhatsApp webhook failures

**Warning Alerts** (investigate within 1 hour):
- Voice recognition accuracy drops below 80%
- Quality grading confidence scores consistently low
- Buyer response rate drops below 50%
- API latency exceeds 3 seconds (95th percentile)

**Metrics Dashboard**:
- Real-time error rates by service
- Payment success rate (target: 99.9%)
- Voice recognition accuracy (target: 85%+)
- Average time to first buyer offer (target: under 30 minutes)

## Testing Strategy

### Dual Testing Approach

FarmFast requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Test specific voice commands (e.g., "500 किलो टमाटर")
- Test edge cases (empty listings, invalid quantities)
- Test error handling (network failures, payment timeouts)
- Test integration points (Twilio webhooks, Razorpay callbacks)

**Property Tests**: Verify universal properties across all inputs
- Test voice recognition across thousands of generated agricultural phrases
- Test quality grading across diverse image conditions
- Test pricing algorithm across all crop/location combinations
- Test escrow system across various transaction scenarios

Together, unit tests catch concrete bugs while property tests verify general correctness.

### Property-Based Testing Configuration

**Testing Library**: For Node.js services, use **fast-check** (JavaScript/TypeScript property-based testing library)

**Test Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `// Feature: farmfast, Property {number}: {property_text}`

**Example Property Test Structure**:
```javascript
// Feature: farmfast, Property 1: Voice Recognition Robustness
test('voice recognition handles agricultural terms with 85% accuracy', () => {
  fc.assert(
    fc.property(
      agriculturalVoiceInputGenerator(),
      (voiceInput) => {
        const result = speechToText(voiceInput);
        const accuracy = compareWithGroundTruth(result, voiceInput.groundTruth);
        return accuracy >= 0.85;
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

**Coverage Target**: 80% for business logic

**Key Areas for Unit Tests**:
- Listing Service: Test listing creation, status updates, expiration logic
- Quality Grading Service: Test grade assignment logic, confidence scoring
- Matching Service: Test buyer discovery algorithm, radius expansion
- Bidding Service: Test offer validation, ranking, expiration
- Payment Service: Test escrow state machine, settlement logic
- Voice Service: Test intent recognition, response generation

**Mocking Strategy**:
- Mock external services (Twilio, Razorpay, AWS services)
- Use test doubles for database operations
- Mock ML model inference for faster test execution

### Integration Tests

**Test Scenarios**:
- Complete user flow: Farmer lists produce → Quality grading → Buyer broadcast → Offer submission → Offer acceptance → Payment escrow → Handover confirmation → Payment settlement
- Dispute resolution flow: Transaction disputed → Support mediation → Partial refund
- Multi-farmer concurrency: Multiple farmers listing simultaneously

**Test Environment**:
- Staging AWS environment with test data
- Twilio WhatsApp sandbox for message testing
- Razorpay test mode for payment testing

**Execution**: Run before every production deployment

### Load Tests

**Scenarios**:
- Simulate 1,000 concurrent farmers creating listings
- Simulate 5,000 buyers viewing listings simultaneously
- Simulate 500 concurrent payment transactions

**Success Criteria**:
- Lambda auto-scales without errors
- 95th percentile API latency under 2 seconds
- Database connection pool doesn't exhaust
- No message delivery failures

**Tools**: Artillery or k6 for load testing

### User Acceptance Testing

**Pilot Program**:
- 50 farmers and 10 buyers in single village
- 2-week pilot period during harvest season
- Gather feedback on voice interface clarity, pricing accuracy, payment reliability

**Feedback Collection**:
- Post-transaction surveys (voice-based for farmers)
- Weekly interviews with pilot participants
- Analytics on feature usage and drop-off points

**Iteration**: Refine UX based on pilot feedback before wider rollout
