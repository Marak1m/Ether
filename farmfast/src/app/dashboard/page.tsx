'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Listing } from '@/lib/supabase'
import { ListingCard } from '@/components/ListingCard'
import { ListingsMap } from '@/components/ListingsMap'
import { Leaf, Map, List, User, LogOut, Zap, TrendingUp, BarChart3, Search } from 'lucide-react'
import { getCurrentUser, signOut } from '@/lib/auth'
import { realtimeService } from '@/lib/realtime'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [gradeFilter, setGradeFilter] = useState<'all' | 'A' | 'B' | 'C'>('all')
  const [buyerLocation, setBuyerLocation] = useState<{ lat: number, lon: number } | null>(null)
  const [radius, setRadius] = useState(15)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [user, setUser] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [newListingAlert, setNewListingAlert] = useState(false)
  const [cropFilter, setCropFilter] = useState<string>('all')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.log('Not authenticated')
      setUser(null)
    } finally {
      setCheckingAuth(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
      router.push('/landing')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  useEffect(() => {
    const savedLocation = localStorage.getItem('buyerLocation')
    if (savedLocation) {
      setBuyerLocation(JSON.parse(savedLocation))
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lon: position.coords.longitude
            }
            setBuyerLocation(location)
            localStorage.setItem('buyerLocation', JSON.stringify(location))
          },
          () => {
            const defaultLocation = { lat: 18.5204, lon: 73.8567 }
            setBuyerLocation(defaultLocation)
          }
        )
      }
    }
  }, [])

  useEffect(() => {
    fetchListings()

    const channel = realtimeService.subscribeToListings((payload) => {
      console.log('Real-time update:', payload)
      if (payload.eventType === 'INSERT') {
        setNewListingAlert(true)
        setTimeout(() => setNewListingAlert(false), 5000)
      }
      fetchListings()
    })

    return () => {
      realtimeService.unsubscribe()
    }
  }, [gradeFilter, buyerLocation, radius])

  const fetchListings = async () => {
    setLoading(true)
    try {
      let url = `/api/listings?status=active`
      if (gradeFilter !== 'all') url += `&grade=${gradeFilter}`
      if (buyerLocation && radius > 0) {
        url += `&lat=${buyerLocation.lat}&lon=${buyerLocation.lon}&radius=${radius}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        console.error('API error:', response.status, response.statusText)
        setListings([])
        return
      }

      const data = await response.json()
      setListings(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch listings:', error)
      setListings([])
    } finally {
      setLoading(false)
    }
  }

  // Get unique crop types for filter
  const cropTypes = Array.from(new Set(listings.map(l => l.crop_type)))

  // Apply crop filter
  const filteredListings = cropFilter === 'all'
    ? listings
    : listings.filter(l => l.crop_type === cropFilter)

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Header */}
      <header className="glass-strong border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/landing" className="flex items-center gap-2.5">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-xl shadow-lg shadow-green-200/50">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent leading-tight">
                  FarmFast
                </h1>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Buyer Dashboard</p>
              </div>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              {!checkingAuth && (
                <>
                  {user ? (
                    <>
                      <Link href="/mandi-prices" className="hidden md:flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50">
                        <BarChart3 className="w-4 h-4" />
                        Mandi Prices
                      </Link>
                      <Link href="/analytics" className="hidden md:flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50">
                        <TrendingUp className="w-4 h-4" />
                        Analytics
                      </Link>
                      <Link href="/buyer/profile" className="flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50">
                        <User className="w-4 h-4" />
                        <span className="hidden md:inline">Profile</span>
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-1.5 px-3 py-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors rounded-lg hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden md:inline">Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/mandi-prices" className="hidden md:flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50">
                        <BarChart3 className="w-4 h-4" />
                        Mandi Prices
                      </Link>
                      <Link href="/buyer/login" className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                        Login
                      </Link>
                      <Link href="/buyer/register" className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-green-200/50 hover:shadow-lg hover:-translate-y-0.5">
                        Register
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* New Listing Alert */}
        {newListingAlert && (
          <div className="mb-4 glass-strong border border-green-200/50 p-4 rounded-2xl animate-in">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-700">
                  New listing added! The page has been updated automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Active Listings', value: filteredListings.length, color: 'from-green-500 to-emerald-500', bg: 'bg-green-50/80', textColor: 'text-green-600', icon: '📦' },
            { label: 'Total Quantity', value: `${filteredListings.reduce((a, l) => a + l.quantity_kg, 0).toLocaleString()} kg`, color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50/80', textColor: 'text-blue-600', icon: '⚖️' },
            {
              label: 'Avg Price Range', value: filteredListings.length > 0
                ? `₹${Math.round(filteredListings.reduce((a, l) => a + l.price_range_min, 0) / filteredListings.length)}-${Math.round(filteredListings.reduce((a, l) => a + l.price_range_max, 0) / filteredListings.length)}/kg`
                : '—', color: 'from-violet-500 to-purple-500', bg: 'bg-violet-50/80', textColor: 'text-violet-600', icon: '💰'
            },
          ].map((stat, i) => (
            <div key={stat.label} className={`glass-strong rounded-2xl p-5 border border-gray-100/50 card-glow stagger-item`} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</span>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className={`text-3xl font-black ${stat.textColor}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-0.5 bg-gray-100/80 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              <List className="w-3.5 h-3.5 inline mr-1" />
              List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${viewMode === 'map'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              <Map className="w-3.5 h-3.5 inline mr-1" />
              Map
            </button>
          </div>

          {/* Grade filter pills */}
          <div className="flex items-center gap-1.5">
            {(['all', 'A', 'B', 'C'] as const).map(grade => (
              <button
                key={grade}
                onClick={() => setGradeFilter(grade)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${gradeFilter === grade
                  ? grade === 'A' ? 'bg-green-100 text-green-700 shadow-sm'
                    : grade === 'B' ? 'bg-amber-100 text-amber-700 shadow-sm'
                      : grade === 'C' ? 'bg-red-100 text-red-700 shadow-sm'
                        : 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100/80 text-gray-500 hover:bg-gray-200/80'
                  }`}
              >
                {grade === 'all' ? 'All Grades' : `Grade ${grade}`}
              </button>
            ))}
          </div>

          {/* Crop type filter */}
          {cropTypes.length > 0 && (
            <select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              className="px-3 py-2 bg-gray-100/80 border-0 rounded-xl text-xs font-semibold text-gray-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-0"
            >
              <option value="all">All Crops</option>
              {cropTypes.map(crop => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
          )}

          {/* Radius selector */}
          <select
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="px-3 py-2 bg-gray-100/80 border-0 rounded-xl text-xs font-semibold text-gray-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-0"
          >
            <option value="5">Within 5 km</option>
            <option value="10">Within 10 km</option>
            <option value="15">Within 15 km</option>
            <option value="20">Within 20 km</option>
            <option value="50">Within 50 km</option>
            <option value="100">Within 100 km</option>
            <option value="200">Within 200 km</option>
            <option value="0">All India</option>
          </select>
        </div>

        {/* Listings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Available Produce {buyerLocation && <span className="text-gray-400 font-normal text-sm">({radius > 0 ? `${radius}km radius` : 'All India'})</span>}
            </h2>
            <span className="text-xs text-gray-400 font-medium">{filteredListings.length} results</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="glass-strong rounded-2xl p-5 border border-gray-100/50 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-28 h-28 skeleton rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <div className="skeleton h-5 w-24" />
                      <div className="skeleton h-4 w-32" />
                      <div className="skeleton h-3 w-40" />
                      <div className="skeleton h-3 w-36" />
                      <div className="skeleton h-10 w-full mt-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-16 glass-strong rounded-2xl border border-gray-100/50">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-600 font-semibold">No active listings found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or increasing the search radius</p>
            </div>
          ) : viewMode === 'map' ? (
            <ListingsMap
              listings={filteredListings}
              buyerLocation={buyerLocation}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredListings.map((listing, i) => (
                <div key={listing.id} className="stagger-item" style={{ animationDelay: `${i * 0.05}s` }}>
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="glass-strong border-t border-gray-200/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              © 2026 FarmFast — Connecting farmers with buyers through AI
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <Link href="/mandi-prices" className="hover:text-gray-600 transition-colors">Mandi Prices</Link>
              <Link href="/analytics" className="hover:text-gray-600 transition-colors">Analytics</Link>
              <Link href="/landing" className="hover:text-gray-600 transition-colors">Home</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
