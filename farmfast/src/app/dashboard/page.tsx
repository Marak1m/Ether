'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Listing } from '@/lib/supabase'
import { ListingCard } from '@/components/ListingCard'
import { ListingsMap } from '@/components/ListingsMap'
import { Leaf, Filter, Map, List, User, LogOut, Zap, TrendingUp } from 'lucide-react'
import { getCurrentUser, signOut } from '@/lib/auth'
import { realtimeService } from '@/lib/realtime'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [gradeFilter, setGradeFilter] = useState<'all' | 'A' | 'B' | 'C'>('all')
  const [buyerLocation, setBuyerLocation] = useState<{lat: number, lon: number} | null>(null)
  const [radius, setRadius] = useState(15)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [user, setUser] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [newListingAlert, setNewListingAlert] = useState(false)

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
    // Get buyer location from localStorage or browser
    const savedLocation = localStorage.getItem('buyerLocation')
    if (savedLocation) {
      setBuyerLocation(JSON.parse(savedLocation))
    } else {
      // Try to get browser location
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
            // Default to Pune if location denied
            const defaultLocation = { lat: 18.5204, lon: 73.8567 }
            setBuyerLocation(defaultLocation)
          }
        )
      }
    }
  }, [])

  useEffect(() => {
    fetchListings()
    
    // Subscribe to real-time listing changes
    const channel = realtimeService.subscribeToListings((payload) => {
      console.log('Real-time update:', payload)
      
      if (payload.eventType === 'INSERT') {
        // Show new listing alert
        setNewListingAlert(true)
        setTimeout(() => setNewListingAlert(false), 5000)
      }
      
      // Refresh listings
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
      if (buyerLocation) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-xl shadow-lg">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  FarmFast
                </h1>
                <p className="text-sm text-gray-600">Buyer Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {!checkingAuth && (
                <>
                  {user ? (
                    <>
                      <Link
                        href="/analytics"
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Analytics
                      </Link>
                      <Link
                        href="/buyer/profile"
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 font-medium transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
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
                        Register
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
            
            {/* Grade Filter */}
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4 inline mr-1" />
                  List
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'map'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Map className="w-4 h-4 inline mr-1" />
                  Map
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                >
                  <option value="5">Within 5 km</option>
                  <option value="10">Within 10 km</option>
                  <option value="15">Within 15 km</option>
                  <option value="20">Within 20 km</option>
                  <option value="50">Within 50 km</option>
                </select>
              </div>
              
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Grades</option>
                <option value="A">Grade A (Premium)</option>
                <option value="B">Grade B (Standard)</option>
                <option value="C">Grade C (Economy)</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Listing Alert */}
        {newListingAlert && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg animate-slide-up">
            <div className="flex items-center">
              <Zap className="w-5 h-5 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  New listing added! The page has been updated automatically.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Stats */}
        <div className="bg-white border-b">
          <div className="grid grid-cols-3 gap-6 mb-8">
            {[
              { label: 'Active Listings', value: listings.length, color: 'text-green-600', bg: 'bg-green-50', icon: '📦' },
              { label: 'Total Quantity', value: `${listings.reduce((a, l) => a + l.quantity_kg, 0).toLocaleString()} kg`, color: 'text-blue-600', bg: 'bg-blue-50', icon: '⚖️' },
              { label: 'Avg Price Range', value: listings.length > 0 
                ? `₹${Math.round(listings.reduce((a,l) => a + l.price_range_min, 0)/listings.length)}-${Math.round(listings.reduce((a,l) => a + l.price_range_max, 0)/listings.length)}/kg`
                : '—', color: 'text-violet-600', bg: 'bg-violet-50', icon: '💰' },
            ].map(stat => (
              <div key={stat.label} className={`${stat.bg} rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">{stat.label}</span>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Listings */}
        <div>
          <h2 className="text-xl font-semibold text-black mb-4">
            Available Produce {buyerLocation && `(${radius}km radius)`}
          </h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="mt-2 text-gray-600">Loading listings...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <Leaf className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No active listings at the moment</p>
              <p className="text-sm text-gray-500 mt-1">Check back soon for fresh produce!</p>
            </div>
          ) : viewMode === 'map' ? (
            <ListingsMap
              listings={listings}
              buyerLocation={buyerLocation}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            FarmFast - Connecting farmers with buyers through AI-powered quality grading
          </p>
        </div>
      </footer>
    </div>
  )
}
