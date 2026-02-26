'use client'

import Link from 'next/link'
import { Leaf, Zap, Shield, TrendingUp, MapPin, Smartphone, ArrowRight, CheckCircle } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-xl">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                FarmFast
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Browse Listings
              </Link>
              <Link
                href="/buyer/login"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                href="/buyer/register"
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-white relative overflow-hidden">
        {/* Subtle background circles */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-emerald-100 rounded-full blur-3xl opacity-30 pointer-events-none" />
        
        <div className="container mx-auto px-6 pt-24 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            
            {/* Left: Text */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-4 py-2 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                AI-Powered Market Linkage
              </div>
              
              <h1 className="text-6xl font-black text-gray-900 leading-[1.05] tracking-tight">
                Connect Farmers<br />
                with{' '}
                <span className="text-green-600">Multiple</span>{' '}
                <span className="text-violet-600">Buyers</span><br />
                in 1 Hour
              </h1>
              
              <p className="text-xl text-gray-500 leading-relaxed max-w-lg">
                AI grades your produce in 10 seconds. 
                15+ buyers compete for it. 
                You get paid the same day.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/buyer/register" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-xl flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-green-200">
                  Start as Buyer
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="https://wa.me/14155238886?text=join%20habit-needed" target="_blank" rel="noopener noreferrer"
                  className="bg-white hover:bg-gray-50 text-gray-900 font-semibold px-8 py-4 rounded-xl flex items-center gap-2 border border-gray-200 transition-all hover:scale-105 shadow-sm">
                  <span className="text-xl">💬</span>
                  I&apos;m a Farmer
                </a>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                  Zero fees for farmers
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                  Same-day payment
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                  Works on any phone
                </span>
              </div>
            </div>
            
            {/* Right: Floating UI preview cards */}
            <div className="relative h-[520px] hidden lg:block">
              
              {/* Main listing card */}
              <div className="absolute top-8 left-4 right-4 bg-white rounded-2xl shadow-2xl p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">New Listing</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">● Live</span>
                </div>
                <div className="flex gap-4">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tomato_je.jpg/400px-Tomato_je.jpg" 
                    alt="Tomatoes"
                    className="w-20 h-20 rounded-xl object-cover" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">Tomatoes</h3>
                    <span className="inline-block bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full mb-2">
                      ✅ Grade B · Standard
                    </span>
                    <div className="text-sm text-gray-500 space-y-0.5">
                      <p>📦 500 kg · Pune, Maharashtra</p>
                      <p className="text-green-600 font-semibold">₹14 – ₹16/kg</p>
                    </div>
                  </div>
                </div>
                {/* Consistency bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Batch Consistency</span>
                    <span className="text-green-600 font-medium">82/100</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-1.5 bg-green-500 rounded-full" style={{width: '82%'}} />
                  </div>
                </div>
              </div>
              
              {/* Floating offer card */}
              <div className="absolute bottom-28 right-0 w-56 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-2">🎉 New Offer Received</p>
                <p className="text-2xl font-black text-gray-900">₹16<span className="text-sm font-normal text-gray-400">/kg</span></p>
                <p className="text-sm text-gray-500">Raj Traders · 2 hrs</p>
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 bg-green-600 text-white text-xs font-semibold py-2 rounded-lg">Accept</button>
                  <button className="flex-1 bg-gray-100 text-gray-600 text-xs font-semibold py-2 rounded-lg">Wait</button>
                </div>
              </div>
              
              {/* Floating grade badge */}
              <div className="absolute bottom-16 left-0 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-lg">🌾</div>
                <div>
                  <p className="text-xs text-gray-400">AI Graded in</p>
                  <p className="text-sm font-bold text-gray-900">8.3 seconds</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Why Choose <span className="text-green-600">FarmFast</span>?
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Solving the ₹1.5 lakh crore post-harvest loss problem with AI and instant market access
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🤖',
                title: 'AI Quality Grading',
                desc: 'Gemini AI analyzes 6 photos of your produce to assign an objective A/B/C grade with consistency score in under 10 seconds.',
                tag: 'Powered by Gemini'
              },
              {
                icon: '📍',
                title: 'Location-Based Matching',
                desc: 'Listings automatically broadcast to verified buyers within 20km. Farmers get 3+ competitive offers within 1 hour.',
                tag: 'Geospatial'
              },
              {
                icon: '🔒',
                title: 'Secure Escrow Payment',
                desc: 'Buyer pays via UPI into escrow before pickup. Farmer receives money within 30 seconds of handover. Zero defaults.',
                tag: '100% Guaranteed'
              },
              {
                icon: '💬',
                title: 'WhatsApp for Farmers',
                desc: 'No app download. Voice-first Hindi interface. Works on 2G. Farmers with zero literacy can use it.',
                tag: 'Zero Learning Curve'
              },
              {
                icon: '📊',
                title: '6-Photo Fraud Prevention',
                desc: 'Top, middle, bottom, best, worst, and full batch photos. Consistency score shown to buyers. Trust score per farmer.',
                tag: 'Our Innovation'
              },
              {
                icon: '💸',
                title: 'Zero Fees for Farmers',
                desc: 'Farmers pay absolutely nothing. Buyers pay 2% commission only on successful transactions.',
                tag: 'Fair Pricing'
              },
            ].map(f => (
              <div key={f.title}
                className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-green-100 transition-colors">
                  {f.icon}
                </div>
                <div className="inline-block bg-gray-50 text-gray-500 text-xs font-medium px-2 py-1 rounded-full mb-3">
                  {f.tag}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-black">How It Works</h2>
            <p className="text-xl text-gray-600">Simple 3-step process for farmers and buyers</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* For Farmers */}
            <div className="bg-gradient-to-br from-green-100 to-green-50 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-6 text-green-800">For Farmers</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Send Photo via WhatsApp</h4>
                    <p className="text-gray-700">
                      Take a photo of your produce and send to FarmFast WhatsApp number with quantity
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Get AI Quality Grade</h4>
                    <p className="text-gray-700">
                      Receive A/B/C grade instantly. Your listing is broadcast to nearby buyers
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Accept Best Offer</h4>
                    <p className="text-gray-700">
                      Review offers via WhatsApp, accept the best one, and get paid immediately after handover
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Buyers */}
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-6 text-blue-800">For Buyers</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Browse Quality-Graded Listings</h4>
                    <p className="text-gray-700">
                      See all available produce in your area with AI-verified quality grades
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Submit Competitive Offers</h4>
                    <p className="text-gray-700">
                      Make offers based on quality grade and market prices. Farmer sees all offers
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Pick Up & Pay</h4>
                    <p className="text-gray-700">
                      If accepted, get farmer's location, pick up produce, and payment is released via UPI
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-green-700 to-emerald-600 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '₹1.5L Cr', label: 'Annual Post-Harvest Loss', icon: '📉' },
              { value: '15-20%', label: 'Higher Farmer Income', icon: '📈' },
              { value: '<1 Hour', label: 'Time to First Offer', icon: '⚡' },
              { value: '100%', label: 'Payment Guarantee', icon: '🔒' },
            ].map(stat => (
              <div key={stat.label} className="text-center text-white">
                <div className="text-3xl mb-1">{stat.icon}</div>
                <div className="text-4xl font-black mb-1">{stat.value}</div>
                <div className="text-green-100 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6 text-black">
            Ready to Transform Agricultural Trade?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of farmers and buyers using FarmFast for fair, transparent, and instant transactions
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/buyer/register"
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl text-lg"
            >
              Register as Buyer
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-bold rounded-xl transition-all shadow-md hover:shadow-lg text-lg border-2 border-gray-200"
            >
              Explore Listings
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-xl">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">FarmFast</span>
              </div>
              <p className="text-gray-400">
                AI-powered market linkage platform connecting farmers with buyers
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Farmers</h4>
              <ul className="space-y-2 text-gray-400">
                <li>How It Works</li>
                <li>WhatsApp Guide</li>
                <li>Pricing</li>
                <li>FAQs</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Buyers</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Register</li>
                <li>Browse Listings</li>
                <li>Quality Grades</li>
                <li>Payment Terms</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2026 FarmFast. Built with ❤️ for Indian farmers.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
