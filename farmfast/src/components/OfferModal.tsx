'use client'

import { useState } from 'react'
import { Listing } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { X } from 'lucide-react'

interface OfferModalProps {
  listing: Listing
  onClose: () => void
}

export function OfferModal({ listing, onClose }: OfferModalProps) {
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [pricePerKg, setPricePerKg] = useState(listing.price_range_min)
  const [pickupTime, setPickupTime] = useState('Within 2 hours')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const totalAmount = pricePerKg * listing.quantity_kg
  const commission = totalAmount * 0.02

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listing.id,
          buyer_name: buyerName,
          buyer_phone: buyerPhone || null,
          price_per_kg: pricePerKg,
          pickup_time: pickupTime,
          message: message || null
        })
      })

      if (!response.ok) throw new Error('Failed to submit offer')

      setSuccess(true)
      setTimeout(() => onClose(), 2000)
    } catch (error) {
      console.error('Offer submission error:', error)
      alert('Failed to submit offer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-green-50 to-blue-50">
          <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Submit Offer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-full p-1"
          >
            <X className="w-5 h-5" />
          </button>
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
                <img
                  src={listing.image_url}
                  alt={listing.crop_type}
                  className="w-16 h-16 rounded object-cover"
                />
                <div>
                  <h3 className="font-semibold">{listing.crop_type}</h3>
                  <p className="text-sm text-gray-600">
                    Grade {listing.quality_grade} • {listing.quantity_kg} kg
                  </p>
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
                placeholder="e.g., Raj Traders"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
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
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Price per kg */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Offer Price (₹/kg) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.5"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <input
                type="range"
                min={listing.price_range_min - 5}
                max={listing.price_range_max + 5}
                step="0.5"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(parseFloat(e.target.value))}
                className="w-full mt-2"
              />
            </div>

            {/* Pickup time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Time *
              </label>
              <select
                required
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option>Within 2 hours</option>
                <option>Within 4 hours</option>
                <option>Same day evening</option>
                <option>Next morning</option>
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
}
