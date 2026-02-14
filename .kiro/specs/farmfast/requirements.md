# FarmFast - Requirements Document

## 1. Executive Summary

FarmFast is an AI-powered market linkage platform that connects farmers with multiple buyers within 1 hour of harvest, enabling competitive pricing and same-day payments. The platform addresses the ₹1.5 lakh crore annual post-harvest loss problem by reducing the time gap between harvest and sale, while increasing farmer income by 15-20% through transparent price discovery.

## 2. Problem Statement

### 2.1 The Market Access Gap

Indian agriculture faces a critical market efficiency problem:
- 86% of farmers (120 million) are small/marginal holders with zero bargaining power
- Farmers lose 40-60% of value to intermediaries due to lack of direct buyer access
- Post-harvest losses account for ₹1.5 lakh crore annually (4-8% cereals, 5-15% fruits/vegetables)
- 60% of farmers have no access to formal credit, forcing distress sales to local traders

### 2.2 Current Reality

When a farmer harvests produce:
1. Local trader is often the only immediately accessible buyer
2. Trader offers below-market prices (taking advantage of information asymmetry)
3. Farmer accepts due to urgent cash needs and lack of alternatives
4. Going to mandi involves time, transport costs, and payment delays of 2-3 days
5. Result: Farmer loses ₹2-4 per kg compared to fair market value

### 2.3 Why Existing Solutions Don't Work

- Price information apps: Farmers already know mandi prices from WhatsApp groups, but knowing prices doesn't help without buyer access
- Advisory platforms: Information without actionable market linkage doesn't increase income
- E-mandis: Still require farmers to physically transport produce with upfront costs

## 3. Solution Overview

FarmFast creates an instant marketplace where:
- Farmers list produce via WhatsApp (photo + voice message)
- AI grades quality objectively (A/B/C standard)
- System broadcasts to nearby buyers within 5-20km radius
- Multiple buyers submit competitive offers within 1 hour
- Farmer selects best offer, gets same-day payment via UPI escrow
- Platform charges 2% commission from buyers (farmers pay zero)

## 4. Target Users

### 4.1 Primary Users: Small and Marginal Farmers

- Landholding: 0.5-5 acres
- Demographics: 120 million farmers across India (86% of farmer population)
- Tech access: Feature phones with WhatsApp, limited smartphone literacy
- Language preference: Hindi, Marathi, Telugu, Tamil, Kannada (voice-first interface)
- Primary need: Immediate cash flow and fair prices

### 4.2 Secondary Users: Buyers

- Local traders and aggregators
- Food processing companies
- Restaurant and hotel chains
- Farmer Producer Organizations (FPOs)
- Direct consumer groups (bulk buyers)
- E-commerce platforms (Amazon Fresh, BigBasket)

## 5. Functional Requirements

### 5.1 Voice-First Produce Listing

**User Story:** As a farmer with freshly harvested produce, I want to quickly list my produce for sale using my voice in my regional language, so that I can access multiple buyers without needing literacy or smartphone skills.

**Functional Requirements:**
- Accept produce listing via WhatsApp voice note or photo with voice caption
- Support Hindi, Marathi, Telugu, Tamil, Kannada languages
- Extract key information: crop type, estimated quantity, location, urgency
- Confirm listing details back to farmer via voice message
- Complete listing process in under 2 minutes

**Acceptance Criteria:**
- System recognizes agricultural terminology with 85% accuracy
- Voice response generated within 5 seconds
- Farmer can list produce without typing any text
- System handles background noise and rural accent variations

### 5.2 AI-Powered Quality Grading

**User Story:** As a farmer selling produce, I want an objective quality assessment of my produce so that I can negotiate fair prices with buyers based on standardized grades.

**Functional Requirements:**
- Analyze produce photos to determine quality grade (A/B/C)
- Assess visual factors: color uniformity, surface defects, size consistency, ripeness
- Provide quality grade with confidence score
- Explain grade in simple language via voice message
- Support initial crop types: Tomato, Onion, Potato, Mango, Banana

**Acceptance Criteria:**
- Quality assessment completes within 10 seconds
- Grade accuracy of 80%+ compared to human expert assessment
- Works with varying photo quality and lighting conditions
- Farmer receives both visual grade indicator and voice explanation

### 5.3 Instant Buyer Broadcast and Matching

**User Story:** As a farmer who listed produce, I want my listing to reach multiple potential buyers nearby so that I can receive competitive offers quickly.

**Functional Requirements:**
- Identify registered buyers within configurable radius (default 5-20km)
- Broadcast listing to relevant buyer categories based on crop type and quantity
- Include quality grade, quantity, location, and farmer contact in broadcast
- Track buyer views and interest in real-time
- Send automated reminders to active buyers

**Acceptance Criteria:**
- Listing reaches all eligible buyers within 5 minutes
- Buyers receive push notifications on mobile app
- Farmer receives confirmation: "Your listing sent to 12 buyers in your area"
- System handles concurrent broadcasts for multiple farmers

### 5.4 Transparent Competitive Bidding

**User Story:** As a farmer receiving buyer offers, I want to see all offers side-by-side with clear pricing so that I can choose the best deal with confidence.

**Functional Requirements:**
- Display all buyer offers in ranked order (highest price first)
- Show buyer name, offered price, pickup timeline, payment terms
- Provide LLM-generated comparison: "₹16 offer is 25% above local trader rate"
- Allow farmer to counter-offer or accept directly
- Maintain offer validity for 2 hours

**Acceptance Criteria:**
- Farmer receives first offer within 30 minutes (90% of cases)
- Receives minimum 2 offers within 1 hour (target: 3+ offers)
- Offers presented in voice format for illiterate farmers
- Farmer can accept offer with single voice command: "पहला वाला ठीक है" (first one is fine)

### 5.5 Secure Same-Day Payment

**User Story:** As a farmer selling produce through FarmFast, I want to receive payment immediately after handover so that I avoid payment delays and defaults.

**Functional Requirements:**
- Buyer pre-authorizes payment via UPI before pickup
- Platform holds payment in escrow during transaction
- Farmer confirms produce handover via voice or button press
- Payment released to farmer's account within 30 seconds of confirmation
- Generate digital receipt for both parties

**Acceptance Criteria:**
- 100% payment completion rate (no defaults)
- Payment reaches farmer account within 1 minute of handover confirmation
- Works with all UPI-enabled bank accounts
- Automated dispute resolution process if handover disputed

### 5.6 Buyer Dashboard and Sourcing Tools

**User Story:** As a buyer (trader/FPO/restaurant), I want to browse available produce listings with quality grades so that I can source efficiently and reduce procurement time.

**Functional Requirements:**
- Web and mobile dashboard showing active listings in buyer's service area
- Filter by crop type, quality grade, quantity, distance
- View farmer ratings based on past transactions
- Submit offers with auto-calculation of margins and logistics costs
- Track accepted offers and pending pickups

**Acceptance Criteria:**
- Dashboard loads within 2 seconds
- Real-time updates when new listings appear
- Buyer can submit offer within 1 minute of viewing listing
- Historical data on past purchases and farmer performance

### 5.7 Quality-Based Pricing Intelligence

**User Story:** As a farmer unfamiliar with quality-based pricing, I want to understand what price I should expect for my produce grade so that I can evaluate if offers are fair.

**Functional Requirements:**
- Fetch current mandi prices for farmer's nearest APMC
- Apply quality grade adjustment: A-grade (+10-15%), B-grade (baseline), C-grade (-10-15%)
- Calculate fair price range based on quality and market data
- Explain to farmer via voice: "Your B-grade tomatoes are worth ₹14-16 per kg today"
- Update price intelligence daily from Agmarknet and user transaction data

**Acceptance Criteria:**
- Price suggestions within ±₹2/kg of actual market reality
- Covers all major mandis across India (500+ markets)
- Farmer receives price context before offers arrive
- Historical trend data: "Prices typically rise 10% next week due to festival demand"

### 5.8 Transaction History and Learning

**User Story:** As a farmer making multiple sales through FarmFast, I want to see my past transactions so that I can learn which buyers are reliable and what prices I achieved.

**Functional Requirements:**
- Store all transaction records: date, buyer, quantity, price, quality grade
- Calculate total earnings and average price per crop type
- Show comparison: "You earned ₹1,200 more using FarmFast vs local trader rate"
- Provide buyer ratings from farmer perspective
- Generate seasonal insights: "You got best prices for onions in October"

**Acceptance Criteria:**
- Transaction history accessible via voice query: "मेरे पिछले महीने की बिक्री दिखाओ"
- Data retained for minimum 2 years
- Visual and voice-based presentation of insights
- Privacy-protected (farmer's data not shared without consent)

## 6. Non-Functional Requirements

### 6.1 Performance

- WhatsApp message response time: Under 5 seconds
- Quality grading inference: Under 10 seconds
- Buyer broadcast: Complete within 5 minutes
- Platform availability: 99.5% uptime during harvest seasons
- Support 10,000 concurrent farmer listings during peak periods

### 6.2 Usability

- Zero learning curve for farmers (WhatsApp-based interface)
- Complete transaction flow without reading any text (voice-driven)
- Buyer dashboard intuitive enough for small trader with basic smartphone skills
- Support low-bandwidth scenarios (2G network connectivity)

### 6.3 Scalability

- Start with 3 states (Maharashtra, Karnataka, Telangana) covering 30 million farmers
- Scale to pan-India deployment (28 states) within 12 months
- Handle 100,000+ daily transactions during peak harvest season
- Support addition of new crops without platform downtime

### 6.4 Security and Trust

- Farmer data encrypted and not sold to third parties
- Buyer verification process (GST, trade license validation)
- Escrow payment system with 100% fraud prevention
- Dispute resolution mechanism (platform mediates quality/quantity conflicts)

### 6.5 Accessibility

- Works on feature phones via WhatsApp (no app download required)
- Voice-first design for illiterate users (estimated 30% of target farmers)
- Regional language support (not just translation but cultural context)
- Offline capability: Listing queued and submitted when network available

## 7. Success Metrics

### 7.1 Farmer Impact Metrics

- Average price realization improvement: Target 15-20% vs local trader rates
- Time to first buyer offer: Target under 30 minutes
- Payment completion rate: Target 100% (zero defaults)
- Repeat usage rate: Target 70% (farmers return for second sale)

### 7.2 Platform Metrics

- Farmer acquisition: 10,000 farmers in first 3 months (pilot phase)
- Buyer network: 500+ registered buyers in pilot regions
- Transaction volume: 50,000 tons produce traded in first 6 months
- Gross Merchandise Value (GMV): ₹100 crore in first year

### 7.3 Social Impact Metrics

- Post-harvest loss reduction: Target 5% reduction (₹7,500 crore national savings)
- Farmer income increase: Additional ₹5,000-10,000 per farmer per season
- Rural employment: 1,000+ aggregator jobs created in first year
- Market transparency: 100% of transactions with documented pricing

## 8. Regulatory and Compliance

### 8.1 Agricultural Regulations

- Compliance with APMC regulations in states with mandatory mandi routes
- Partnership with licensed traders where direct farmer-buyer sales restricted
- Adherence to MSP guidelines (farmers can exit to MSP if better)

### 8.2 Financial Regulations

- RBI compliance for payment aggregation
- UPI payment gateway partner: Razorpay/PhonePe (licensed entities)
- Escrow account management following regulatory norms
- Transaction limits as per digital payment regulations

### 8.3 Data Protection

- No sale of farmer personal data to third parties
- Consent-based data usage for platform improvement
- Right to data deletion (GDPR-style compliance)
- Transparent privacy policy in regional languages

## 9. Future Enhancements (Post-MVP)

### 9.1 Phase 2 Features

- Credit against standing produce (buyer pre-payment for future harvest)
- Weather-based harvest timing advice
- Integration with cold storage networks for extended selling windows
- Group selling for small quantity farmers (aggregate to meet buyer minimums)

### 9.2 Phase 3 Features

- Export market linkage for premium quality produce
- Traceability and certification (organic, FPO-certified)
- Input marketplace (farmers buy seeds/fertilizers at collective prices)
- Insurance products linked to quality grades

## 10. Technical Constraints

### 10.1 Must Use Technologies

- AWS cloud infrastructure (hackathon requirement)
- WhatsApp Business API via Twilio or MessageBird
- LLM integration (AWS Bedrock Claude or Gemini API)
- UPI payment integration (Razorpay/PhonePe/Paytm)

### 10.2 Device Compatibility

- Android 6.0+ for buyer mobile app
- WhatsApp version: Latest stable version for farmers
- Web browsers: Chrome, Firefox, Safari for buyer dashboard
- No iOS app in MVP (Android-first approach)

### 10.3 Data Requirements

- Initial quality grading model: 5,000 labeled images per crop type
- Buyer database: Minimum 100 buyers per district for launch
- Mandi price data: Daily updates from Agmarknet API
- Language models: Pre-trained on agricultural terminology

## 11. Assumptions and Dependencies

### 11.1 Assumptions

- Farmers have access to WhatsApp (550+ million users in India)
- Buyers are willing to pay 2% commission for access to quality-graded produce
- Internet connectivity available in rural areas (at least 2G)
- UPI adoption continues to grow in rural India
- Agmarknet API provides reliable daily price data

### 11.2 Dependencies

- WhatsApp Business API availability and reliability (Twilio)
- Payment gateway uptime and UPI infrastructure (Razorpay)
- AWS cloud services availability
- Google Maps API for distance calculations
- Third-party ML model accuracy for quality grading
