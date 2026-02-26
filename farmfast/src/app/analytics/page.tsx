'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Leaf, TrendingUp, Package, DollarSign, MapPin, Calendar } from 'lucide-react'
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

      // Fetch total listings
      const { count: totalListings } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())

      // Fetch total offers
      const { count: totalOffers } = await supabase
        .from('offers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())

      // Fetch average price by grade
      const { data: listings } = await supabase
        .from('listings')
        .select('quality_grade, price_range_min, price_range_max')
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
      }))

      // Fetch popular crops
      const cropCounts: Record<string, number> = {}
      listings?.forEach((l: any) => {
        cropCounts[l.crop_type] = (cropCounts[l.crop_type] || 0) + 1
      })

      const popularCrops = Object.entries(cropCounts)
        .map(([crop, count]) => ({ crop, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Fetch listings by location
      const { data: locationData } = await supabase
        .from('listings')
        .select('location')
        .gte('created_at', startDate.toISOString())

      const locationCounts: Record<string, number> = {}
      locationData?.forEach((l) => {
        const location = l.location.split(',')[0] // Get city name
        locationCounts[location] = (locationCounts[location] || 0) + 1
      })

      const listingsByLocation = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setAnalytics({
        totalListings: totalListings || 0,
        totalOffers: totalOffers || 0,
        avgPriceByGrade,
        popularCrops,
        listingsByLocation,
        recentActivity: [] // Simplified for now
      })
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-xl shadow-lg">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  FarmFast Analytics
                </h1>
                <p className="text-sm text-gray-600">Market insights and trends</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              
              <Link
                href="/dashboard"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600">Loading analytics...</p>
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Total Listings</h3>
                  <Package className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-4xl font-black text-green-600">{analytics.totalListings}</p>
                <p className="text-sm text-gray-500 mt-2">Active produce listings</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Total Offers</h3>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-4xl font-black text-blue-600">{analytics.totalOffers}</p>
                <p className="text-sm text-gray-500 mt-2">Buyer offers submitted</p>
              </div>
            </div>

            {/* Average Price by Grade */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Average Price by Grade</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {analytics.avgPriceByGrade.map((item) => (
                  <div key={item.grade} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold mb-1 ${
                      item.grade === 'A' ? 'text-green-600' :
                      item.grade === 'B' ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      Grade {item.grade}
                    </div>
                    <div className="text-3xl font-black text-gray-900">₹{item.avgPrice}</div>
                    <div className="text-sm text-gray-500">per kg</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Crops */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Popular Crops</h3>
              </div>
              <div className="space-y-3">
                {analytics.popularCrops.map((item, index) => (
                  <div key={item.crop} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{item.crop}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(item.count / analytics.popularCrops[0].count) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-600 w-12 text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Listings by Location */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Top Locations</h3>
              </div>
              <div className="space-y-3">
                {analytics.listingsByLocation.map((item, index) => (
                  <div key={item.location} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{item.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(item.count / analytics.listingsByLocation[0].count) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-600 w-12 text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No analytics data available</p>
          </div>
        )}
      </main>
    </div>
  )
}
