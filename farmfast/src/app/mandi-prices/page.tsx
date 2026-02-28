'use client'

import { useEffect, useState } from 'react'
import { Leaf, TrendingUp, TrendingDown, Minus, Search, BarChart3, ArrowLeft, MapPin, IndianRupee } from 'lucide-react'
import Link from 'next/link'

interface CommoditySummary {
    commodity: string
    avg_modal_price: number
    avg_min_price: number
    avg_max_price: number
    price_per_kg: number
    trend: 'up' | 'down' | 'stable'
    trend_pct: number
    markets_reporting: number
}

interface MandiPrice {
    commodity: string
    state: string
    district: string
    market: string
    variety: string
    min_price: number
    max_price: number
    modal_price: number
    date: string
}

interface TrendPoint {
    date: string
    modal_price: number
}

const cropEmojis: Record<string, string> = {
    'Tomato': '🍅', 'Onion': '🧅', 'Potato': '🥔', 'Mango': '🥭',
    'Banana': '🍌', 'Cabbage': '🥬', 'Wheat': '🌾', 'Rice': '🍚',
    'Apple': '🍎', 'Cauliflower': '🥦', 'Green Chilli': '🌶️',
    'Garlic': '🧄', 'Brinjal': '🍆',
}

export default function MandiPricesPage() {
    const [summaries, setSummaries] = useState<CommoditySummary[]>([])
    const [prices, setPrices] = useState<MandiPrice[]>([])
    const [trendData, setTrendData] = useState<TrendPoint[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCommodity, setSelectedCommodity] = useState<string>('all')
    const [selectedState, setSelectedState] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [commodities, setCommodities] = useState<string[]>([])
    const [states, setStates] = useState<string[]>([])
    const [trendCommodity, setTrendCommodity] = useState<string>('')

    useEffect(() => {
        Promise.all([
            fetch('/api/mandi-prices?action=summaries').then(r => r.json()),
            fetch('/api/mandi-prices?action=commodities').then(r => r.json()),
            fetch('/api/mandi-prices?action=states').then(r => r.json()),
        ]).then(([summariesData, commoditiesData, statesData]) => {
            setSummaries(summariesData)
            setCommodities(commoditiesData)
            setStates(statesData)
            setLoading(false)
        }).catch(err => {
            console.error('Failed to fetch mandi data:', err)
            setLoading(false)
        })
    }, [])

    useEffect(() => {
        const params = new URLSearchParams()
        if (selectedCommodity !== 'all') params.set('commodity', selectedCommodity)
        if (selectedState !== 'all') params.set('state', selectedState)

        fetch(`/api/mandi-prices?${params.toString()}`).then(r => r.json()).then(setPrices)
    }, [selectedCommodity, selectedState])

    const loadTrend = (commodity: string) => {
        setTrendCommodity(commodity)
        fetch(`/api/mandi-prices?action=trend&commodity=${commodity}`)
            .then(r => r.json())
            .then(setTrendData)
    }

    // Filter summaries by search
    const filteredSummaries = summaries.filter(s =>
        s.commodity.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Mini sparkline component
    const Sparkline = ({ data }: { data: TrendPoint[] }) => {
        if (data.length < 2) return null
        const maxP = Math.max(...data.map(d => d.modal_price))
        const minP = Math.min(...data.map(d => d.modal_price))
        const range = maxP - minP || 1
        const width = 280
        const height = 80
        const padding = 4

        const points = data.map((d, i) => {
            const x = padding + (i / (data.length - 1)) * (width - padding * 2)
            const y = height - padding - ((d.modal_price - minP) / range) * (height - padding * 2)
            return `${x},${y}`
        }).join(' ')

        const areaPoints = points + ` ${width - padding},${height - padding} ${padding},${height - padding}`

        return (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20">
                <defs>
                    <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgb(22, 163, 74)" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="rgb(22, 163, 74)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon points={areaPoints} fill="url(#sparkGradient)" />
                <polyline
                    points={points}
                    fill="none"
                    stroke="rgb(22, 163, 74)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {/* Dots on data points */}
                {data.map((d, i) => {
                    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
                    const y = height - padding - ((d.modal_price - minP) / range) * (height - padding * 2)
                    return <circle key={i} cx={x} cy={y} r="3" fill="white" stroke="rgb(22,163,74)" strokeWidth="2" />
                })}
            </svg>
        )
    }

    const TrendBadge = ({ trend, pct }: { trend: string; pct: number }) => {
        if (trend === 'up') return (
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" /> +{pct}%
            </span>
        )
        if (trend === 'down') return (
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                <TrendingDown className="w-3 h-3" /> {pct}%
            </span>
        )
        return (
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                <Minus className="w-3 h-3" /> Stable
            </span>
        )
    }

    return (
        <div className="min-h-screen gradient-mesh">
            {/* Header */}
            <header className="glass-strong border-b border-gray-200/50 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-xl shadow-lg shadow-amber-200/50">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent leading-tight">
                                    Mandi Prices
                                </h1>
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Live Market Rates · Agmarknet Data</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50">
                                <ArrowLeft className="w-4 h-4" />
                                Dashboard
                            </Link>
                            <Link href="/landing" className="flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50">
                                <Leaf className="w-4 h-4" />
                                Home
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="glass-strong rounded-2xl p-5 border border-gray-100/50 animate-pulse">
                                <div className="skeleton h-8 w-8 rounded-lg mb-3" />
                                <div className="skeleton h-5 w-20 mb-2" />
                                <div className="skeleton h-8 w-24 mb-1" />
                                <div className="skeleton h-3 w-16" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Search & Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative flex-1 min-w-[200px] max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search commodity..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 glass-strong border border-gray-200/50 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-gray-400"
                                />
                            </div>

                            <select
                                value={selectedCommodity}
                                onChange={e => { setSelectedCommodity(e.target.value); if (e.target.value !== 'all') loadTrend(e.target.value) }}
                                className="px-3 py-2.5 bg-gray-100/80 border-0 rounded-xl text-xs font-semibold text-gray-600 focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="all">All Commodities</option>
                                {commodities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <select
                                value={selectedState}
                                onChange={e => setSelectedState(e.target.value)}
                                className="px-3 py-2.5 bg-gray-100/80 border-0 rounded-xl text-xs font-semibold text-gray-600 focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="all">All States</option>
                                {states.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        {/* Commodity Summary Cards */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <IndianRupee className="w-5 h-5 text-amber-500" />
                                Commodity Overview
                                <span className="text-xs font-medium text-gray-400 ml-auto">{filteredSummaries.length} commodities</span>
                            </h2>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredSummaries.map((s, i) => (
                                    <button
                                        key={s.commodity}
                                        onClick={() => { setSelectedCommodity(s.commodity); loadTrend(s.commodity) }}
                                        className={`stagger-item glass-strong rounded-2xl p-5 border text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedCommodity === s.commodity
                                                ? 'border-amber-300 shadow-lg shadow-amber-100/40'
                                                : 'border-gray-100/50 card-glow'
                                            }`}
                                        style={{ animationDelay: `${i * 0.04}s` }}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-2xl">{cropEmojis[s.commodity] || '🌱'}</span>
                                            <TrendBadge trend={s.trend} pct={s.trend_pct} />
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-900 mb-1">{s.commodity}</h3>
                                        <p className="text-2xl font-black text-gray-900">₹{s.price_per_kg}<span className="text-xs font-normal text-gray-400">/kg</span></p>
                                        <p className="text-[10px] text-gray-400 mt-1 font-medium">{s.markets_reporting} markets reporting</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Trend Chart (shown when commodity selected) */}
                        {trendCommodity && trendData.length > 0 && (
                            <div className="glass-strong rounded-2xl p-6 border border-gray-100/50 animate-in">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                        <span className="text-xl">{cropEmojis[trendCommodity] || '🌱'}</span>
                                        {trendCommodity} — 7-Day Price Trend
                                    </h3>
                                    <span className="text-xs text-gray-400 font-medium">₹ per quintal (modal price)</span>
                                </div>

                                <Sparkline data={trendData} />

                                {/* Date labels */}
                                <div className="flex justify-between mt-2 px-1">
                                    {trendData.map((d, i) => (
                                        <span key={i} className="text-[9px] text-gray-400 font-medium">
                                            {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Detailed Price Table */}
                        <div className="glass-strong rounded-2xl border border-gray-100/50 overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-blue-500" />
                                    Market-wise Prices
                                    <span className="text-xs font-medium text-gray-400 ml-auto">{prices.length} entries</span>
                                </h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50/80">
                                            <th className="text-left px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Commodity</th>
                                            <th className="text-left px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Market</th>
                                            <th className="text-left px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Variety</th>
                                            <th className="text-right px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Min (₹/qtl)</th>
                                            <th className="text-right px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Max (₹/qtl)</th>
                                            <th className="text-right px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Modal (₹/qtl)</th>
                                            <th className="text-right px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">₹/kg</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {prices.slice(0, 20).map((p, i) => (
                                            <tr key={`${p.market}-${p.commodity}-${i}`} className="hover:bg-green-50/30 transition-colors">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{cropEmojis[p.commodity] || '🌱'}</span>
                                                        <span className="text-sm font-semibold text-gray-900">{p.commodity}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="text-sm text-gray-900 font-medium">{p.market}</div>
                                                    <div className="text-[10px] text-gray-400">{p.state}</div>
                                                </td>
                                                <td className="px-5 py-3 text-sm text-gray-500">{p.variety}</td>
                                                <td className="px-5 py-3 text-sm text-gray-500 text-right font-mono">₹{p.min_price.toLocaleString()}</td>
                                                <td className="px-5 py-3 text-sm text-gray-500 text-right font-mono">₹{p.max_price.toLocaleString()}</td>
                                                <td className="px-5 py-3 text-sm font-bold text-gray-900 text-right font-mono">₹{p.modal_price.toLocaleString()}</td>
                                                <td className="px-5 py-3 text-right">
                                                    <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                        ₹{(Math.round(p.modal_price / 10) / 10).toFixed(1)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {prices.length === 0 && (
                                    <div className="text-center py-12">
                                        <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm">No prices found for selected filters</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Data source disclaimer */}
                        <div className="text-center py-4">
                            <p className="text-[10px] text-gray-400 font-medium">
                                Data sourced from Agmarknet • Government of India • Updated daily • Prices in ₹ per quintal (100 kg)
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
