'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Leaf, ArrowRight, ChevronRight, BarChart3, Shield, Zap, MapPin, MessageCircle, Sparkles } from 'lucide-react'

// Animated counter hook
function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    let start = 0
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [started, end, duration])

  return { count, ref }
}

export default function LandingPage() {
  const stat1 = useCountUp(150, 2000)
  const stat2 = useCountUp(20, 1800)
  const stat3 = useCountUp(10, 1500)
  const stat4 = useCountUp(100, 2200)

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Navigation */}
      <nav className="glass-strong sticky top-0 z-50 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-xl shadow-lg shadow-green-200/50">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                FarmFast
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Browse Listings
              </Link>
              <Link href="/mandi-prices" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Mandi Prices
              </Link>
              <Link href="/analytics" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Analytics
              </Link>
              <Link
                href="/buyer/login"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                href="/buyer/register"
                className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-green-200/50 hover:shadow-lg hover:shadow-green-300/50 hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated background orbs */}
        <div className="absolute top-10 right-[10%] w-[500px] h-[500px] bg-gradient-to-br from-green-200/40 to-emerald-100/20 rounded-full blur-3xl pointer-events-none float-card" />
        <div className="absolute bottom-20 left-[5%] w-[300px] h-[300px] bg-gradient-to-br from-blue-200/30 to-violet-100/15 rounded-full blur-3xl pointer-events-none float-card-delayed" />
        <div className="absolute top-[40%] left-[40%] w-[200px] h-[200px] bg-gradient-to-br from-amber-100/20 to-orange-100/10 rounded-full blur-3xl pointer-events-none float-card-slow" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: Text Content */}
            <div className="space-y-8 animate-in">
              <div className="inline-flex items-center gap-2 bg-green-50/80 border border-green-200/60 text-green-700 text-xs font-semibold px-4 py-2 rounded-full backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                AI-Powered Agricultural Marketplace
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.05] tracking-tight">
                Sell Your{' '}
                <span className="gradient-text-animated">Harvest</span>
                <br />
                in Under{' '}
                <span className="text-green-600">1 Hour</span>
              </h1>

              <p className="text-lg md:text-xl text-gray-500 leading-relaxed max-w-lg">
                AI grades your produce in 10 seconds. Buyers compete for your crop. You get paid the same day. All via WhatsApp.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/buyer/register" className="group bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-semibold px-8 py-4 rounded-2xl flex items-center gap-2 transition-all hover:-translate-y-0.5 shadow-xl shadow-green-200/40 hover:shadow-green-300/50">
                  Start as Buyer
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="https://wa.me/14155238886?text=join%20habit-needed" target="_blank" rel="noopener noreferrer"
                  className="group glass hover:bg-white text-gray-900 font-semibold px-8 py-4 rounded-2xl flex items-center gap-2 transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md">
                  <span className="text-2xl">💬</span>
                  I&apos;m a Farmer
                </a>
              </div>

              <div className="flex items-center gap-8 text-sm text-gray-500">
                {['Zero fees for farmers', 'Same-day payment', 'Works on any phone'].map(item => (
                  <span key={item} className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Floating UI Preview */}
            <div className="relative h-[620px] hidden lg:block">

              {/* Main listing card - positioned top, constrained width */}
              <div className="absolute top-0 left-0 w-[340px] glass-strong rounded-3xl shadow-2xl shadow-gray-200/40 p-6 gradient-border float-card">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">New Listing</span>
                  <span className="flex items-center gap-1.5 text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full font-semibold">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                    </span>
                    Live
                  </span>
                </div>
                <div className="flex gap-4">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tomato_je.jpg/400px-Tomato_je.jpg"
                    alt="Tomatoes"
                    className="w-24 h-24 rounded-2xl object-cover shadow-md" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-xl">Tomatoes</h3>
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full mb-2 mt-1">
                      ✅ Grade B · Standard
                    </span>
                    <div className="text-sm text-gray-500 space-y-0.5">
                      <p>📦 500 kg · Pune, Maharashtra</p>
                      <p className="text-green-600 font-bold text-base">₹14 – ₹16/kg</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>AI Confidence</span>
                    <span className="text-green-600 font-bold">82%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000" style={{ width: '82%' }} />
                  </div>
                </div>
              </div>

              {/* Bottom row: AI badge (left) + Offer card (right) side by side */}
              <div className="absolute top-[290px] left-0 right-0 flex items-start gap-4">
                <div className="glass-strong rounded-2xl shadow-xl shadow-green-100/30 p-4 flex items-center gap-3 float-card-slow">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-50 rounded-xl flex items-center justify-center text-xl shadow-inner">🤖</div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">AI Graded in</p>
                    <p className="text-lg font-black text-gray-900">8.3 seconds</p>
                  </div>
                </div>

                <div className="flex-1 glass-strong rounded-2xl shadow-xl shadow-blue-100/30 p-5 gradient-border float-card-delayed">
                  <p className="text-xs text-gray-400 mb-2 font-semibold">🎉 New Offer Received</p>
                  <p className="text-3xl font-black text-gray-900">₹16<span className="text-sm font-normal text-gray-400">/kg</span></p>
                  <p className="text-sm text-gray-500 mt-1">Raj Traders · 2 hrs ago</p>
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm">Accept</button>
                    <button className="flex-1 bg-gray-100 text-gray-600 text-xs font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-colors">Wait</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-violet-50/80 text-violet-600 text-xs font-semibold px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Why Choose Us
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              The <span className="text-green-600">Smartest</span> Way to Trade
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Solving the ₹1.5 lakh crore post-harvest loss problem with AI and instant market access
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <Sparkles className="w-6 h-6" />,
                color: 'from-green-500 to-emerald-500',
                bgLight: 'bg-green-50',
                title: 'AI Quality Grading',
                desc: 'Gemini AI analyzes your produce photo to assign an objective A/B/C grade with confidence score in under 10 seconds.',
                tag: 'Powered by Gemini'
              },
              {
                icon: <MapPin className="w-6 h-6" />,
                color: 'from-blue-500 to-indigo-500',
                bgLight: 'bg-blue-50',
                title: 'Location-Based Matching',
                desc: 'Listings automatically broadcast to verified buyers within 20km. Get 3+ competitive offers within 1 hour.',
                tag: 'Geospatial'
              },
              {
                icon: <Shield className="w-6 h-6" />,
                color: 'from-violet-500 to-purple-500',
                bgLight: 'bg-violet-50',
                title: 'Secure Escrow Payment',
                desc: 'Buyer pays via UPI into escrow before pickup. Farmer receives money within 30 seconds of handover.',
                tag: '100% Guaranteed'
              },
              {
                icon: <MessageCircle className="w-6 h-6" />,
                color: 'from-emerald-500 to-teal-500',
                bgLight: 'bg-emerald-50',
                title: 'WhatsApp for Farmers',
                desc: 'No app download. Hindi voice-first interface. Works on 2G networks. Zero learning curve for anyone.',
                tag: 'Zero Learning Curve'
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                color: 'from-amber-500 to-orange-500',
                bgLight: 'bg-amber-50',
                title: 'Live Mandi Prices',
                desc: 'Track real-time government mandi prices for your crop. Compare your offer with market rates instantly.',
                tag: 'Market Intelligence'
              },
              {
                icon: <Zap className="w-6 h-6" />,
                color: 'from-rose-500 to-pink-500',
                bgLight: 'bg-rose-50',
                title: 'Zero Fees for Farmers',
                desc: 'Farmers pay absolutely nothing. Buyers pay 2% commission only on successful transactions. Fair for everyone.',
                tag: 'Fair Pricing'
              },
            ].map((f, i) => (
              <div key={f.title}
                className={`stagger-item group glass-strong rounded-2xl p-6 card-glow border border-gray-100/50`}
                style={{ animationDelay: `${i * 0.08}s` }}>
                <div className={`w-12 h-12 bg-gradient-to-br ${f.color} rounded-xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {f.icon}
                </div>
                <div className={`inline-block ${f.bgLight} text-gray-500 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3`}>
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
      <section className="py-24 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-50/80 text-blue-600 text-xs font-semibold px-4 py-2 rounded-full mb-4">
              <Zap className="w-3.5 h-3.5" />
              Simple Process
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-500">Simple 3-step process for everyone</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* For Farmers */}
            <div className="glass-strong rounded-3xl p-8 border border-green-100/50 card-glow">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2.5 rounded-xl text-white shadow-lg shadow-green-200/40">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-black text-gray-900">For Farmers</h3>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full ml-auto">Via WhatsApp</span>
              </div>
              <div className="space-y-6">
                {[
                  { step: 1, title: 'Send Photo via WhatsApp', desc: 'Take a photo of your produce and send it to FarmFast WhatsApp number', emoji: '📸' },
                  { step: 2, title: 'Get AI Quality Grade', desc: 'Receive A/B/C grade instantly. Your listing goes live to nearby buyers', emoji: '🤖' },
                  { step: 3, title: 'Accept Best Offer & Get Paid', desc: 'Review offers, accept the best one, get paid immediately after handover', emoji: '💰' },
                ].map(s => (
                  <div key={s.step} className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl flex items-center justify-center font-bold flex-shrink-0 text-sm shadow-lg shadow-green-200/30">
                      {s.step}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-0.5 flex items-center gap-2">
                        {s.title} <span className="text-lg">{s.emoji}</span>
                      </h4>
                      <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For Buyers */}
            <div className="glass-strong rounded-3xl p-8 border border-blue-100/50 card-glow-blue">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200/40">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-black text-gray-900">For Buyers</h3>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full ml-auto">Web Dashboard</span>
              </div>
              <div className="space-y-6">
                {[
                  { step: 1, title: 'Browse Quality-Graded Listings', desc: 'See all available produce in your area with AI-verified quality grades', emoji: '🔍' },
                  { step: 2, title: 'Submit Competitive Offers', desc: 'Make offers based on quality grade and live mandi market prices', emoji: '📊' },
                  { step: 3, title: 'Pick Up & Pay Securely', desc: 'If accepted, get farmer location, pick up produce, funds released via UPI', emoji: '🚚' },
                ].map(s => (
                  <div key={s.step} className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold flex-shrink-0 text-sm shadow-lg shadow-blue-200/30">
                      {s.step}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-0.5 flex items-center gap-2">
                        {s.title} <span className="text-lg">{s.emoji}</span>
                      </h4>
                      <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { ref: stat1.ref, value: `₹${stat1.count}L Cr`, label: 'Post-Harvest Loss Solved', icon: '📉' },
              { ref: stat2.ref, value: `${stat2.count}%`, label: 'Higher Farmer Income', icon: '📈' },
              { ref: stat3.ref, value: `<${stat3.count}s`, label: 'AI Grading Speed', icon: '⚡' },
              { ref: stat4.ref, value: `${stat4.count}%`, label: 'Payment Guarantee', icon: '🔒' },
            ].map(stat => (
              <div key={stat.label} ref={stat.ref} className="text-center">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-4xl md:text-5xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-gray-400 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="glass-strong rounded-3xl p-12 md:p-16 shadow-2xl shadow-gray-200/30 border border-gray-100/50">
            <div className="inline-flex items-center gap-2 bg-green-50/80 text-green-600 text-xs font-semibold px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Join the Revolution
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              Ready to Transform<br />Agricultural Trade?
            </h2>
            <p className="text-lg text-gray-500 mb-10 max-w-lg mx-auto">
              Join thousands of farmers and buyers using FarmFast for fair, transparent, and instant transactions
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/buyer/register"
                className="group px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold rounded-2xl transition-all shadow-xl shadow-green-200/40 hover:shadow-green-300/50 hover:-translate-y-0.5 text-lg flex items-center gap-2"
              >
                Register as Buyer
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard"
                className="group px-8 py-4 glass hover:bg-white text-gray-900 font-bold rounded-2xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 text-lg flex items-center gap-2 border border-gray-200/60"
              >
                Explore Listings
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-xl">
                  <Leaf className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-extrabold">FarmFast</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                AI-powered agricultural marketplace connecting farmers directly with buyers for fair, transparent trade.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-gray-300 mb-4">For Farmers</h4>
              <ul className="space-y-2.5 text-gray-400 text-sm">
                <li className="hover:text-white transition-colors cursor-pointer">How It Works</li>
                <li className="hover:text-white transition-colors cursor-pointer">WhatsApp Guide</li>
                <li className="hover:text-white transition-colors cursor-pointer">Pricing</li>
                <li className="hover:text-white transition-colors cursor-pointer">FAQs</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-gray-300 mb-4">For Buyers</h4>
              <ul className="space-y-2.5 text-gray-400 text-sm">
                <li><Link href="/buyer/register" className="hover:text-white transition-colors">Register</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Browse Listings</Link></li>
                <li><Link href="/mandi-prices" className="hover:text-white transition-colors">Mandi Prices</Link></li>
                <li><Link href="/analytics" className="hover:text-white transition-colors">Analytics</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-gray-300 mb-4">Company</h4>
              <ul className="space-y-2.5 text-gray-400 text-sm">
                <li className="hover:text-white transition-colors cursor-pointer">About Us</li>
                <li className="hover:text-white transition-colors cursor-pointer">Contact</li>
                <li className="hover:text-white transition-colors cursor-pointer">Privacy Policy</li>
                <li className="hover:text-white transition-colors cursor-pointer">Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-sm">© 2026 FarmFast. Built with ❤️ for Indian farmers.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
