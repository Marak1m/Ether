'use client'

import { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { Listing } from '@/lib/supabase'
import { BuyerProfile } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { X, MapPin } from 'lucide-react'

function formatLocationDisplay(loc: string | null | undefined): string {
  if (!loc) return 'India'
  const parts = loc.split(',').map(s => s.trim())
  if (!/^\d{5,6}$/.test(parts[0])) return loc
  const pin = parts[0]
  const meaningful = parts.slice(1).filter(p => !/district/i.test(p) && p.toLowerCase() !== 'india')
  if (meaningful.length >= 2) return `${meaningful[0]}, ${meaningful[1]} — ${pin}`
  if (meaningful.length === 1) return `${meaningful[0]} — ${pin}`
  return loc
}

interface OfferModalProps {
  listing: Listing
  buyerProfile?: BuyerProfile | null
  onClose: () => void
}

const PICKUP_OPTIONS = [
  'Today morning (8 AM - 12 PM)',
  'Today afternoon (12 PM - 5 PM)',
  'Today evening (5 PM - 8 PM)',
  'Tomorrow morning (8 AM - 12 PM)',
  'Tomorrow afternoon (12 PM - 5 PM)',
]

const CROP_EMOJIS: Record<string, string> = {
  'Tomato': '🍅', 'Onion': '🧅', 'Potato': '🥔',
  'Rice': '🌾', 'Mango': '🥭', 'Cauliflower': '🥦',
  'Banana': '🍌',
}

export function OfferModal({ listing, buyerProfile, onClose }: OfferModalProps) {
  const reservePrice = listing.reserve_price ?? listing.price_range_min
  const cropEmoji = CROP_EMOJIS[listing.crop_type] || '🌿'

  // Portal: only render on client (avoid SSR document access)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [pricePerKg, setPricePerKg] = useState(reservePrice)
  const [pickupWindow, setPickupWindow] = useState(PICKUP_OPTIONS[0])
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Populate name/phone from profile once it arrives (async prop)
  useEffect(() => {
    if (buyerProfile) {
      setBuyerName(buyerProfile.business_name || buyerProfile.name || '')
      setBuyerPhone(buyerProfile.phone || '')
    }
  }, [buyerProfile])

  const profileName = !!(buyerProfile?.business_name || buyerProfile?.name)
  const profilePhone = !!buyerProfile?.phone

  const totalAmount = pricePerKg * listing.quantity_kg
  const commission = totalAmount * 0.02

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listing.id,
          buyer_name: buyerName,
          buyer_phone: buyerPhone || null,
          buyer_id: buyerProfile?.id || null,
          price_per_kg: pricePerKg,
          pickup_window: pickupWindow,
          message: message || null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.error === 'BELOW_RESERVE') {
          setError(`Below platform minimum. Please offer at least ₹${data.reserve_price}/kg.`)
          return
        }
        if (data.error === 'AUCTION_CLOSED') {
          setError('This auction has closed. No more offers can be submitted.')
          return
        }
        throw new Error(data.error || 'Failed to submit offer')
      }

      setSuccess(true)
      setTimeout(() => onClose(), 2000)
    } catch (err) {
      console.error('Offer submission error:', err)
      setError('Failed to submit offer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!mounted) return null

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* X button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-full p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center p-5 border-b bg-gradient-to-r from-green-50 to-blue-50">
          <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Submit Offer
          </h2>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4 animate-bounce">✅</div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">
              Offer Submitted!
            </h3>
            <p className="text-gray-600">
              The farmer will receive your offer via WhatsApp immediately.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Listing info */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                {listing.image_url ? (
                  <img
                    src={listing.image_url}
                    alt={listing.crop_type}
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded bg-green-50 flex items-center justify-center text-3xl flex-shrink-0">
                    {cropEmoji}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{listing.crop_type}</h3>
                  <p className="text-sm text-gray-600">
                    Grade {listing.quality_grade} • {listing.quantity_kg} kg
                  </p>
                  {listing.location && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {formatLocationDisplay(listing.location)}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Suggested: {formatCurrency(listing.price_range_min)} - {formatCurrency(listing.price_range_max)}/kg
              </p>
            </div>

            {/* Buyer name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name / Business Name *
              </label>
              <input
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                readOnly={profileName}
                placeholder="e.g., Raj Traders"
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${profileName ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
              />
              {profileName && (
                <p className="text-[10px] text-gray-400 mt-0.5">Auto-filled from your profile</p>
              )}
            </div>

            {/* Buyer phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (optional)
              </label>
              <input
                type="tel"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                readOnly={profilePhone}
                placeholder="+91 98765 43210"
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${profilePhone ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
              />
              {profilePhone && (
                <p className="text-[10px] text-gray-400 mt-0.5">Auto-filled from your profile</p>
              )}
            </div>

            {/* Price per kg */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Offer Price (₹/kg) *
              </label>
              <input
                type="number"
                required
                min={reservePrice}
                step="0.5"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <input
                type="range"
                min={reservePrice}
                max={listing.price_range_max + 10}
                step="0.5"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(parseFloat(e.target.value))}
                className="w-full mt-2"
              />
              {listing.reserve_price != null && (
                <p className="text-xs text-orange-600 mt-1">
                  🔒 Minimum ₹{listing.reserve_price}/kg
                </p>
              )}
            </div>

            {/* Pickup window */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Window *
              </label>
              <select
                required
                value={pickupWindow}
                onChange={(e) => setPickupWindow(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {PICKUP_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message to Farmer (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Any special requirements or notes..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {/* Summary */}
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span>Total Amount:</span>
                <span className="font-semibold">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Platform Fee (2%):</span>
                <span>{formatCurrency(commission)}</span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {submitting ? 'Submitting...' : 'Submit Offer'}
            </button>
          </form>
        )}
      </div>
    </div>
  )

  return ReactDOM.createPortal(modalContent, document.body)
}
