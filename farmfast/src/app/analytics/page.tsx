'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Leaf, ArrowLeft, BarChart3, TrendingUp, Package } from 'lucide-react'
import Link from 'next/link'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'price-trends' | 'supply' | 'market-intel'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="glass-strong rounded-2xl p-5 border border-gray-100/50">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-black text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

const GRADE_COLORS = { A: '#16a34a', B: '#d97706', C: '#dc2626' }
const CHART_COLORS = ['#16a34a', '#2563eb', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#ea580c', '#65a30d', '#0f766e']

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('price-trends')
  const [loading, setLoading] = useState(true)

  // ── Tab 1: Price Trends ──
  const [selectedCrop, setSelectedCrop] = useState<string>('Tomato')
  const [cropList, setCropList] = useState<string[]>([])
  const [priceTrendData, setPriceTrendData] = useState<any[]>([])
  const [ffAvg, setFfAvg] = useState(0)
  const [mandiAvg, setMandiAvg] = useState(0)

  // ── Tab 2: Supply Overview ──
  const [cropSupply, setCropSupply] = useState<any[]>([])
  const [districtSupply, setDistrictSupply] = useState<any[]>([])
  const [activeCount, setActiveCount] = useState(0)
  const [closingSoonCount, setClosingSoonCount] = useState(0)

  // ── Tab 3: Market Intelligence ──
  const [cropComparison, setCropComparison] = useState<any[]>([])
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([])
  const [fillRateByGrade, setFillRateByGrade] = useState<{ grade: string; rate: number }[]>([])
  const [avgMinutesToOffer, setAvgMinutesToOffer] = useState<number | null>(null)

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    if (cropList.length > 0 && selectedCrop) fetchPriceTrend(selectedCrop)
  }, [selectedCrop, cropList])

  // ── Data fetchers ──────────────────────────────────────────────────────────

  async function fetchAll() {
    setLoading(true)
    try {
      await Promise.all([fetchCropList(), fetchSupply(), fetchMarketIntel()])
    } finally {
      setLoading(false)
    }
  }

  async function fetchCropList() {
    const { data } = await supabase.from('listings').select('crop_type')
    const crops = Array.from(new Set((data ?? []).map((r: any) => r.crop_type))).sort() as string[]
    setCropList(crops)
    if (crops.length > 0) {
      const first = crops[0]
      setSelectedCrop(first)
      await fetchPriceTrend(first)
    }
  }

  async function fetchPriceTrend(crop: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // FarmFast accepted offer prices per day
    const { data: offerRows } = await supabase
      .from('offers')
      .select('price_per_kg, created_at, listings!inner(crop_type)')
      .eq('status', 'accepted')
      .eq('listings.crop_type', crop)
      .gte('created_at', thirtyDaysAgo + 'T00:00:00Z')

    // Mandi prices per day
    const { data: mandiRows } = await supabase
      .from('mandi_prices')
      .select('modal_price, price_date')
      .ilike('crop_type', crop)
      .gte('price_date', thirtyDaysAgo)
      .order('price_date', { ascending: true })

    // Aggregate by date
    const ffByDate: Record<string, { sum: number; count: number }> = {}
    ;(offerRows ?? []).forEach((r: any) => {
      const d = r.created_at.split('T')[0]
      if (!ffByDate[d]) ffByDate[d] = { sum: 0, count: 0 }
      ffByDate[d].sum += r.price_per_kg
      ffByDate[d].count += 1
    })

    const mandiByDate: Record<string, number[]> = {}
    ;(mandiRows ?? []).forEach((r: any) => {
      if (!mandiByDate[r.price_date]) mandiByDate[r.price_date] = []
      mandiByDate[r.price_date].push(r.modal_price)
    })

    // Build unified date list (last 30 days)
    const dates: string[] = []
    for (let i = 29; i >= 0; i--) {
      dates.push(new Date(Date.now() - i * 86400000).toISOString().split('T')[0])
    }

    const chartData = dates.map(date => {
      const ffEntry = ffByDate[date]
      const mandiEntry = mandiByDate[date]
      return {
        date: date.slice(5), // MM-DD
        farmfast: ffEntry ? Math.round(ffEntry.sum / ffEntry.count) : null,
        mandi: mandiEntry ? Math.round(mandiEntry.reduce((a, b) => a + b, 0) / mandiEntry.length) : null,
      }
    }).filter(d => d.farmfast !== null || d.mandi !== null)

    setPriceTrendData(chartData)

    // Compute current averages (last 7 days of data)
    const recentFF = Object.values(ffByDate)
    const recentMandi = Object.values(mandiByDate)
    setFfAvg(recentFF.length > 0 ? Math.round(recentFF.reduce((s, e) => s + e.sum / e.count, 0) / recentFF.length) : 0)
    setMandiAvg(recentMandi.length > 0 ? Math.round(recentMandi.flatMap(v => v).reduce((s, v) => s + v, 0) / recentMandi.flatMap(v => v).length) : 0)
  }

  async function fetchSupply() {
    const now = new Date().toISOString()
    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    const { data: activeListings } = await supabase
      .from('listings')
      .select('crop_type, location, auction_status, auction_closes_at')
      .eq('auction_status', 'open')
      .eq('status', 'active')

    const items = activeListings ?? []
    setActiveCount(items.length)
    setClosingSoonCount(items.filter((l: any) => l.auction_closes_at && l.auction_closes_at <= oneHourLater && l.auction_closes_at >= now).length)

    // By crop
    const cropMap: Record<string, number> = {}
    items.forEach((l: any) => { cropMap[l.crop_type] = (cropMap[l.crop_type] || 0) + 1 })
    setCropSupply(Object.entries(cropMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count))

    // By district (first segment of location)
    const distMap: Record<string, number> = {}
    items.forEach((l: any) => {
      const d = (l.location || 'Unknown').split(',')[0].trim()
      distMap[d] = (distMap[d] || 0) + 1
    })
    setDistrictSupply(Object.entries(distMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8))
  }

  async function fetchMarketIntel() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Crop comparison: mandi avg vs FarmFast accepted avg
    const { data: mandiAll } = await supabase
      .from('mandi_prices')
      .select('crop_type, modal_price')
      .gte('price_date', sevenDaysAgo.split('T')[0])

    const { data: acceptedOffers } = await supabase
      .from('offers')
      .select('price_per_kg, listings!inner(crop_type)')
      .eq('status', 'accepted')
      .gte('created_at', sevenDaysAgo)

    const mandiByCrop: Record<string, number[]> = {}
    ;(mandiAll ?? []).forEach((r: any) => {
      if (!mandiByCrop[r.crop_type]) mandiByCrop[r.crop_type] = []
      mandiByCrop[r.crop_type].push(r.modal_price)
    })

    const ffByCrop: Record<string, number[]> = {}
    ;(acceptedOffers ?? []).forEach((r: any) => {
      const crop = r.listings?.crop_type || 'Unknown'
      if (!ffByCrop[crop]) ffByCrop[crop] = []
      ffByCrop[crop].push(r.price_per_kg)
    })

    const allCrops = Array.from(new Set([...Object.keys(mandiByCrop), ...Object.keys(ffByCrop)]))
    setCropComparison(allCrops.map(crop => ({
      crop,
      mandi: mandiByCrop[crop] ? Math.round(mandiByCrop[crop].reduce((s, v) => s + v, 0) / mandiByCrop[crop].length) : 0,
      farmfast: ffByCrop[crop] ? Math.round(ffByCrop[crop].reduce((s, v) => s + v, 0) / ffByCrop[crop].length) : 0,
    })).filter(r => r.mandi > 0 || r.farmfast > 0))

    // Grade distribution this week
    const { data: weekListings } = await supabase
      .from('listings')
      .select('quality_grade, id, created_at')
      .gte('created_at', sevenDaysAgo)

    const gradeCounts: Record<string, number> = {}
    ;(weekListings ?? []).forEach((l: any) => {
      gradeCounts[l.quality_grade] = (gradeCounts[l.quality_grade] || 0) + 1
    })
    setGradeDistribution(Object.entries(gradeCounts).map(([name, value]) => ({ name, value })))

    // Auction fill rate by grade (% listings with ≥1 offer within 2h)
    if (weekListings && weekListings.length > 0) {
      const grades = ['A', 'B', 'C']
      const rates = await Promise.all(grades.map(async grade => {
        const gradeListings = (weekListings ?? []).filter((l: any) => l.quality_grade === grade)
        if (gradeListings.length === 0) return { grade, rate: 0 }
        let filled = 0
        for (const l of gradeListings) {
          const cutoff = new Date(new Date(l.created_at).getTime() + 2 * 60 * 60 * 1000).toISOString()
          const { count } = await supabase
            .from('offers')
            .select('*', { count: 'exact', head: true })
            .eq('listing_id', l.id)
            .lte('created_at', cutoff)
          if ((count ?? 0) >= 1) filled++
        }
        return { grade, rate: Math.round((filled / gradeListings.length) * 100) }
      }))
      setFillRateByGrade(rates)
    }

    // Avg minutes to first offer (last 7 days)
    if (weekListings && weekListings.length > 0) {
      const ids = weekListings.map((l: any) => l.id)
      const { data: firstOffers } = await supabase
        .from('offers')
        .select('listing_id, created_at')
        .in('listing_id', ids)
        .order('created_at', { ascending: true })

      // Get earliest offer per listing
      const firstOfferByListing: Record<string, string> = {}
      ;(firstOffers ?? []).forEach((o: any) => {
        if (!firstOfferByListing[o.listing_id]) firstOfferByListing[o.listing_id] = o.created_at
      })

      const minuteDelays = Object.entries(firstOfferByListing).map(([listingId, offerAt]) => {
        const listing = weekListings.find((l: any) => l.id === listingId)
        if (!listing) return null
        return (new Date(offerAt).getTime() - new Date(listing.created_at).getTime()) / 60000
      }).filter(Boolean) as number[]

      setAvgMinutesToOffer(
        minuteDelays.length > 0 ? Math.round(minuteDelays.reduce((s, v) => s + v, 0) / minuteDelays.length) : null
      )
    }
  }

  const premiumPct = mandiAvg > 0 ? Math.round(((ffAvg - mandiAvg) / mandiAvg) * 100) : 0

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Header */}
      <header className="glass-strong border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-xl shadow-lg shadow-green-200/50">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent leading-tight">
                  FarmFast Analytics
                </h1>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Market insights & trends</p>
              </div>
            </div>
            <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 border-b border-gray-200/50 -mb-px">
            {([
              { id: 'price-trends', label: 'Price Trends', icon: TrendingUp },
              { id: 'supply', label: 'Supply Overview', icon: Package },
              { id: 'market-intel', label: 'Market Intelligence', icon: BarChart3 },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === id
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-strong rounded-2xl p-6 border border-gray-100/50 animate-pulse">
                <div className="skeleton h-5 w-32 mb-4" />
                <div className="skeleton h-32 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* ── Tab 1: Price Trends ─────────────────────────────────────── */}
            {activeTab === 'price-trends' && (
              <div className="space-y-6">
                {/* Crop selector */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-700">Crop:</label>
                  <select
                    value={selectedCrop}
                    onChange={e => setSelectedCrop(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {cropList.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-4">
                  <StatCard label="FarmFast Avg" value={ffAvg > 0 ? `₹${ffAvg}/kg` : '—'} sub="Accepted offer avg" />
                  <StatCard label="Mandi Avg" value={mandiAvg > 0 ? `₹${mandiAvg}/kg` : '—'} sub="Market modal price" />
                  <StatCard
                    label="Premium"
                    value={ffAvg > 0 && mandiAvg > 0 ? `${premiumPct > 0 ? '+' : ''}${premiumPct}%` : '—'}
                    sub="FarmFast vs mandi"
                  />
                </div>

                {/* Line chart */}
                <div className="glass-strong rounded-2xl p-6 border border-gray-100/50">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Price Comparison — Last 30 Days</h3>
                  {priceTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={priceTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} unit="₹" />
                        <Tooltip formatter={(v: any) => [`₹${v}`, '']} />
                        <Legend />
                        <Line type="monotone" dataKey="farmfast" stroke="#16a34a" strokeWidth={2} name="FarmFast" dot={false} connectNulls />
                        <Line type="monotone" dataKey="mandi" stroke="#9ca3af" strokeWidth={2} name="Mandi" dot={false} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-400 text-center py-12">No price data for {selectedCrop} yet. Data will appear after accepted offers and mandi syncs.</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Tab 2: Supply Overview ──────────────────────────────────── */}
            {activeTab === 'supply' && (
              <div className="space-y-6">
                {/* Live count */}
                <div className="glass-strong rounded-2xl p-4 border border-gray-100/50 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                  <p className="text-sm font-semibold text-gray-700">
                    <span className="text-green-600">{activeCount}</span> listings available,&nbsp;
                    <span className="text-orange-500">{closingSoonCount}</span> auctions closing in next hour
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* By crop */}
                  <div className="glass-strong rounded-2xl p-6 border border-gray-100/50">
                    <h3 className="text-base font-bold text-gray-900 mb-4">Active Listings by Crop</h3>
                    {cropSupply.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={cropSupply} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                          <Tooltip />
                          <Bar dataKey="count" name="Listings" radius={[0, 4, 4, 0]}>
                            {cropSupply.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-400 text-center py-12">No active listings</p>
                    )}
                  </div>

                  {/* By district */}
                  <div className="glass-strong rounded-2xl p-6 border border-gray-100/50">
                    <h3 className="text-base font-bold text-gray-900 mb-4">Active Listings by District</h3>
                    {districtSupply.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={districtSupply} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                          <Tooltip />
                          <Bar dataKey="count" name="Listings" radius={[0, 4, 4, 0]}>
                            {districtSupply.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-400 text-center py-12">No district data</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab 3: Market Intelligence ──────────────────────────────── */}
            {activeTab === 'market-intel' && (
              <div className="space-y-6">
                {/* Avg minutes to first offer */}
                <div className="glass-strong rounded-2xl p-6 border border-gray-100/50 text-center">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Avg Time to First Offer (last 7 days)</p>
                  <p className="text-6xl font-black text-green-600">
                    {avgMinutesToOffer != null ? avgMinutesToOffer : '—'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">minutes from listing to first offer</p>
                </div>

                {/* Auction fill rate */}
                <div className="grid grid-cols-3 gap-4">
                  {fillRateByGrade.map(({ grade, rate }) => (
                    <StatCard
                      key={grade}
                      label={`Grade ${grade} Fill Rate`}
                      value={`${rate}%`}
                      sub="listings with ≥1 offer in 2h"
                    />
                  ))}
                  {fillRateByGrade.length === 0 && (
                    <div className="col-span-3 glass-strong rounded-2xl p-6 text-center text-gray-400 text-sm border border-gray-100/50">
                      No listing data for this week yet
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Mandi vs FarmFast by crop */}
                  <div className="glass-strong rounded-2xl p-6 border border-gray-100/50">
                    <h3 className="text-base font-bold text-gray-900 mb-4">Mandi vs FarmFast Price by Crop</h3>
                    {cropComparison.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={cropComparison} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" tick={{ fontSize: 11 }} unit="₹" />
                          <YAxis dataKey="crop" type="category" tick={{ fontSize: 11 }} width={80} />
                          <Tooltip formatter={(v: any) => [`₹${v}/kg`, '']} />
                          <Legend />
                          <Bar dataKey="mandi" name="Mandi" fill="#9ca3af" radius={[0, 2, 2, 0]} />
                          <Bar dataKey="farmfast" name="FarmFast" fill="#16a34a" radius={[0, 2, 2, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-400 text-center py-12">Data will appear after accepted offers and mandi syncs.</p>
                    )}
                  </div>

                  {/* Grade distribution donut */}
                  <div className="glass-strong rounded-2xl p-6 border border-gray-100/50">
                    <h3 className="text-base font-bold text-gray-900 mb-4">Grade Distribution (This Week)</h3>
                    {gradeDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={gradeDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${Math.round((percent || 0) * 100)}%`}
                            labelLine={false}
                          >
                            {gradeDistribution.map((entry: any) => (
                              <Cell
                                key={entry.name}
                                fill={GRADE_COLORS[entry.name as keyof typeof GRADE_COLORS] ?? '#6b7280'}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any) => [v, 'listings']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-400 text-center py-12">No listings this week yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
