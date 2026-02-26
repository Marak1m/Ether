'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Tab = 'farmers' | 'listings' | 'offers' | 'sessions'

export default function AdminConsole() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('farmers')
  const [farmers, setFarmers] = useState<any[]>([])
  const [listings, setListings] = useState<any[]>([])
  const [offers, setOffers] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Simple password check (in production, use proper auth)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'farmfast2024') {
      setIsAuthenticated(true)
      loadData('farmers')
    } else {
      alert('Incorrect password')
    }
  }

  const loadData = async (tab: Tab) => {
    setLoading(true)
    try {
      switch (tab) {
        case 'farmers':
          const { data: farmersData } = await supabase
            .from('farmers')
            .select('*')
            .order('created_at', { ascending: false })
          setFarmers(farmersData || [])
          break
        
        case 'listings':
          const { data: listingsData } = await supabase
            .from('listings')
            .select('*')
            .order('created_at', { ascending: false })
          setListings(listingsData || [])
          break
        
        case 'offers':
          const { data: offersData } = await supabase
            .from('offers')
            .select('*, listings(crop_type, farmer_phone)')
            .order('created_at', { ascending: false })
          setOffers(offersData || [])
          break
        
        case 'sessions':
          const { data: sessionsData } = await supabase
            .from('chat_sessions')
            .select('*')
            .order('last_message_at', { ascending: false })
          setSessions(sessionsData || [])
          break
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (table: string, id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    
    try {
      // Special handling for farmers - delete related listings first
      if (table === 'farmers') {
        // Get farmer's phone to find related listings
        const { data: farmer } = await supabase
          .from('farmers')
          .select('phone')
          .eq('id', id)
          .single()
        
        if (farmer) {
          // Delete related listings
          await supabase
            .from('listings')
            .delete()
            .eq('farmer_phone', farmer.phone)
          
          // Delete related chat sessions
          await supabase
            .from('chat_sessions')
            .delete()
            .eq('farmer_phone', farmer.phone)
        }
      }
      
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      
      // Reload data
      loadData(activeTab)
      alert('Deleted successfully')
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setSearchTerm('')
    loadData(tab)
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadData(activeTab)
    }
  }, [])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🔐 Admin Console
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter admin password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  const filteredData = () => {
    const term = searchTerm.toLowerCase()
    switch (activeTab) {
      case 'farmers':
        return farmers.filter(f => 
          f.name?.toLowerCase().includes(term) || 
          f.phone?.includes(term) ||
          f.location?.toLowerCase().includes(term)
        )
      case 'listings':
        return listings.filter(l => 
          l.crop_type?.toLowerCase().includes(term) || 
          l.farmer_phone?.includes(term) ||
          l.location?.toLowerCase().includes(term)
        )
      case 'offers':
        return offers.filter(o => 
          o.buyer_name?.toLowerCase().includes(term) || 
          o.buyer_phone?.includes(term)
        )
      case 'sessions':
        return sessions.filter(s => 
          s.farmer_phone?.includes(term) ||
          s.conversation_state?.toLowerCase().includes(term)
        )
      default:
        return []
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              🌾 FarmFast Admin Console
            </h1>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'farmers', label: 'Farmers', count: farmers.length },
              { id: 'listings', label: 'Listings', count: listings.length },
              { id: 'offers', label: 'Offers', count: offers.length },
              { id: 'sessions', label: 'Chat Sessions', count: sessions.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as Tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {activeTab === 'farmers' && <FarmersTable data={filteredData()} onDelete={handleDelete} />}
            {activeTab === 'listings' && <ListingsTable data={filteredData()} onDelete={handleDelete} />}
            {activeTab === 'offers' && <OffersTable data={filteredData()} onDelete={handleDelete} />}
            {activeTab === 'sessions' && <SessionsTable data={filteredData()} onDelete={handleDelete} />}
          </div>
        )}
      </div>
    </div>
  )
}

// Farmers Table Component
function FarmersTable({ data, onDelete }: { data: any[], onDelete: (table: string, id: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pincode</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((farmer) => (
            <tr key={farmer.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{farmer.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{farmer.phone}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{farmer.location}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{farmer.pincode}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(farmer.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => onDelete('farmers', farmer.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-12 text-gray-500">No farmers found</div>
      )}
    </div>
  )
}

// Listings Table Component
function ListingsTable({ data, onDelete }: { data: any[], onDelete: (table: string, id: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crop</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farmer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((listing) => (
            <tr key={listing.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{listing.crop_type}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  listing.quality_grade === 'A' ? 'bg-green-100 text-green-800' :
                  listing.quality_grade === 'B' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  Grade {listing.quality_grade}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{listing.quantity_kg} kg</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{listing.farmer_phone}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{listing.location}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  listing.status === 'active' ? 'bg-green-100 text-green-800' :
                  listing.status === 'sold' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {listing.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(listing.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => onDelete('listings', listing.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-12 text-gray-500">No listings found</div>
      )}
    </div>
  )
}

// Offers Table Component
function OffersTable({ data, onDelete }: { data: any[], onDelete: (table: string, id: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/kg</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pickup</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((offer) => (
            <tr key={offer.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{offer.buyer_name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{offer.buyer_phone}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{offer.price_per_kg}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{offer.total_amount}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{offer.pickup_time}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  offer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {offer.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(offer.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => onDelete('offers', offer.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-12 text-gray-500">No offers found</div>
      )}
    </div>
  )
}

// Sessions Table Component
function SessionsTable({ data, onDelete }: { data: any[], onDelete: (table: string, id: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farmer Phone</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Message</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((session) => (
            <tr key={session.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{session.farmer_phone}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.farmer_name || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {session.conversation_state}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(session.last_message_at).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => onDelete('chat_sessions', session.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-12 text-gray-500">No sessions found</div>
      )}
    </div>
  )
}
