'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const [formData, setFormData] = useState({
    farmer_phone: '+919876543210',
    crop_type: 'Tomato',
    quality_grade: 'B',
    quantity_kg: 500,
    location: 'Maharashtra',
    pincode: '411001',
    address: 'Pune, Maharashtra',
    latitude: 18.5204,
    longitude: 73.8567,
    price_range_min: 14,
    price_range_max: 16,
    shelf_life_days: 5,
    image_url: 'https://images.unsplash.com/photo-1546470427-227e2e1e8c8e?w=400',
    hindi_summary: 'आपके टमाटर B ग्रेड के हैं। अच्छी क्वालिटी है।',
    confidence_score: 85
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase
        .from('listings')
        .insert({
          ...formData,
          quality_factors: {
            color: 'Good color',
            surface: 'Minor marks',
            uniformity: 'Mostly uniform'
          },
          status: 'active'
        })
        .select()

      if (error) throw error

      setMessage('✅ Listing created successfully! Check the dashboard.')
      
      // Reset form
      setFormData({
        ...formData,
        farmer_phone: '+919876543' + Math.floor(Math.random() * 1000)
      })
    } catch (error: any) {
      setMessage('❌ Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                🌾 FarmFast Admin - Add Listing
              </h1>
              <p className="text-sm text-gray-600">
                Quick way to add test listings without WhatsApp
              </p>
            </div>
            <a
              href="/admin/console"
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              🔐 Admin Console
            </a>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Farmer Phone
                </label>
                <input
                  type="text"
                  value={formData.farmer_phone}
                  onChange={(e) => setFormData({...formData, farmer_phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Crop Type
                </label>
                <select
                  value={formData.crop_type}
                  onChange={(e) => setFormData({...formData, crop_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option>Tomato</option>
                  <option>Onion</option>
                  <option>Potato</option>
                  <option>Mango</option>
                  <option>Banana</option>
                  <option>Cabbage</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality Grade
                </label>
                <select
                  value={formData.quality_grade}
                  onChange={(e) => setFormData({...formData, quality_grade: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="A">A - Premium</option>
                  <option value="B">B - Standard</option>
                  <option value="C">C - Economy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity (kg)
                </label>
                <input
                  type="number"
                  value={formData.quantity_kg}
                  onChange={(e) => setFormData({...formData, quantity_kg: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="411001"
                  pattern="[1-9][0-9]{5}"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Village/Town, District, State"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shelf Life (days)
                </label>
                <input
                  type="number"
                  value={formData.shelf_life_days}
                  onChange={(e) => setFormData({...formData, shelf_life_days: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Min (₹/kg)
                </label>
                <input
                  type="number"
                  value={formData.price_range_min}
                  onChange={(e) => setFormData({...formData, price_range_min: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Max (₹/kg)
                </label>
                <input
                  type="number"
                  value={formData.price_range_max}
                  onChange={(e) => setFormData({...formData, price_range_max: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hindi Summary
              </label>
              <textarea
                value={formData.hindi_summary}
                onChange={(e) => setFormData({...formData, hindi_summary: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
                required
              />
            </div>

            {message && (
              <div className={`p-3 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Creating...' : '✅ Create Listing'}
              </button>
              
              <a
                href="/"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Dashboard
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
