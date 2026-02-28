'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Leaf, TrendingUp, Package, DollarSign, MapPin, Calendar, BarChart3, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface AnalyticsData {
  totalListings: number
  totalOffers: number
  avgPriceByGrade: { grade: string; avgPrice: number }[]
  popularCrops: { crop: string; count: number }[]
  listingsByLocation: { location: string; count: number }[]
  recentActivity: { date: string; listings: number; offers: number }[]
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysAgo)

      const { count: totalListings } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())

      const { count: totalOffers } = await supabase
        .from('offers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())

      const { data: listings } = await supabase
        .from('listings')
        .select('quality_grade, price_range_min, price_range_max, crop_type, location')
        .gte('created_at', startDate.toISOString())

      const gradeStats: Record<string, { total: number; count: number }> = {}
      listings?.forEach((l) => {
        if (!gradeStats[l.quality_grade]) {
          gradeStats[l.quality_grade] = { total: 0, count: 0 }
        }
        gradeStats[l.quality_grade].total += (l.price_range_min + l.price_range_max) / 2
        gradeStats[l.quality_grade].count += 1
      })

      const avgPriceByGrade = Object.entries(gradeStats).map(([grade, stats]) => ({
        grade,
        avgPrice: Math.round(stats.total / stats.count)
      })).sort((a, b) => a.grade.localeCompare(b.grade))

      const cropCounts: Record<string, number> = {}
      listings?.forEach((l: any) => {
        cropCounts[l.crop_type] = (cropCounts[l.crop_type] || 0) + 1
      })

      const popularCrops = Object.entries(cropCounts)
        .map(([crop, count]) => ({ crop, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)

      const locationCounts: Record<string, number> = {}
      listings?.forEach((l) => {
        const location = l.location?.split(',')[0] || 'Unknown'
        locationCounts[location] = (locationCounts[location] || 0) + 1
      })

      const listingsByLocation = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)

      setAnalytics({
        totalListings: totalListings || 0,
        totalOffers: totalOffers || 0,
        avgPriceByGrade,
        popularCrops,
        listingsByLocation,
        recentActivity: []
      })
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const gradeColors: Record<string, { bg: string; text: string; bar: string }> = {
    'A': { bg: 'bg-green-50', text: 'text-green-600', bar: 'from-green-400 to-emerald-500' },
    'B': { bg: 'bg-amber-50', text: 'text-amber-600', bar: 'from-amber-400 to-orange-500' },
    'C': { bg: 'bg-red-50', text: 'text-red-600', bar: 'from-red-400 to-rose-500' }
  }

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

            <div className="flex items-center gap-3">
              {/* Time range pills */}
              <div className="flex items-center gap-0.5 bg-gray-100/80 p-1 rounded-xl">
                {(['7d', '30d', '90d'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${timeRange === range
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                  </button>
                ))}
              </div>

              <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-strong rounded-2xl p-6 border border-gray-100/50 animate-pulse">
                <div className="skeleton h-5 w-32 mb-4" />
                <div className="skeleton h-10 w-20 mb-2" />
                <div className="skeleton h-3 w-40" />
              </div>
            ))}
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-strong rounded-2xl p-6 border border-gray-100/50 card-glow stagger-item">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Total Listings</h3>
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-200/30">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-5xl font-black text-green-600">{analytics.totalListings}</p>
                <p className="text-xs text-gray-400 mt-2">Active produce listings</p>
              </div>

              <div className="glass-strong rounded-2xl p-6 border border-gray-100/50 card-glow-blue stagger-item" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Total Offers</h3>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/30">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-5xl font-black text-blue-600">{analytics.totalOffers}</p>
                <p className="text-xs text-gray-400 mt-2">Buyer offers submitted</p>
              </div>
            </div>

            {/* Average Price by Grade */}
            <div className="glass-strong rounded-2xl p-6 border border-gray-100/50 stagger-item" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Average Price by Grade</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {analytics.avgPriceByGrade.map((item) => {
                  const colors = gradeColors[item.grade] || gradeColors['C']
                  return (
                    <div key={item.grade} className={`text-center p-5 ${colors.bg} rounded-2xl`}>
                      <div className={`text-3xl font-black ${colors.text} mb-1`}>
                        Grade {item.grade}
                      </div>
                      <div className="text-4xl font-black text-gray-900">₹{item.avgPrice}</div>
                      <div className="text-xs text-gray-400 mt-1 font-medium">per kg</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Popular Crops */}
              <div className="glass-strong rounded-2xl p-6 border border-gray-100/50 stagger-item" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Popular Crops</h3>
                </div>
                <div className="space-y-4">
                  {analytics.popularCrops.map((item, index) => (
                    <div key={item.crop} className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center text-green-700 font-bold text-xs flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-900 truncate">{item.crop}</span>
                          <span className="text-xs font-bold text-gray-400 ml-2">{item.count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full bar-animate"
                            style={{ width: `${analytics.popularCrops.length > 0 ? (item.count / analytics.popularCrops[0].count) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {analytics.popularCrops.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No crop data available</p>
                  )}
                </div>
              </div>

              {/* Listings by Location */}
              <div className="glass-strong rounded-2xl p-6 border border-gray-100/50 stagger-item" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Top Locations</h3>
                </div>
                <div className="space-y-4">
                  {analytics.listingsByLocation.map((item, index) => (
                    <div key={item.location} className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-900 truncate">{item.location}</span>
                          <span className="text-xs font-bold text-gray-400 ml-2">{item.count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full bar-animate"
                            style={{ width: `${analytics.listingsByLocation.length > 0 ? (item.count / analytics.listingsByLocation[0].count) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {analytics.listingsByLocation.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No location data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 glass-strong rounded-2xl border border-gray-100/50">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">No analytics data available</p>
            <p className="text-sm text-gray-400 mt-1">Data will appear here once listings are created</p>
          </div>
        )}
      </main>
    </div>
  )
}
