'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Listing } from '@/lib/supabase'
import { QualityBadge } from './QualityBadge'
import { RatingStars } from './RatingStars'
import { formatTime, formatCurrency } from '@/lib/utils'
import { MapPin, Package, Clock, TrendingUp, Navigation } from 'lucide-react'
import { OfferModal } from './OfferModal'
import { getCurrentUser } from '@/lib/auth'

interface ListingCardProps {
  listing: Listing & { distance?: number | null }
}

export function ListingCard({ listing }: ListingCardProps) {
  const router = useRouter()
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser()
      setIsAuthenticated(!!user)
    } catch (error) {
      setIsAuthenticated(false)
    } finally {
      setCheckingAuth(false)
    }
  }

  const handleOfferClick = () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      router.push('/buyer/login')
      return
    }
    setShowOfferModal(true)
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-5">
        <div className="flex gap-4">
          {/* Image with fallback */}
          <div className="flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden bg-gray-100">
            <img
              src={listing.image_url}
              alt={listing.crop_type}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to a colored placeholder with crop emoji
                const cropEmojis: Record<string, string> = {
                  'Tomato': '🍅', 'Onion': '🧅', 'Potato': '🥔',
                  'Mango': '🥭', 'Banana': '🍌', 'default': '🌾'
                }
                const emoji = cropEmojis[listing.crop_type] || cropEmojis.default
                e.currentTarget.style.display = 'none'
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.innerHTML = 
                    `<div class="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-green-50 to-emerald-100">${emoji}</div>`
                }
              }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-black">
                  {listing.crop_type}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <QualityBadge grade={listing.quality_grade} size="sm" />
                  {listing.distance !== undefined && listing.distance !== null && (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                      <Navigation className="w-3 h-3" />
                      {listing.distance} km away
                    </span>
                  )}
                </div>
                {(listing as any).farmer_rating > 0 && (
                  <div className="mt-1">
                    <RatingStars 
                      rating={(listing as any).farmer_rating} 
                      size="sm" 
                      showNumber={true}
                    />
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {formatTime(listing.created_at)}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-1 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>{listing.quantity_kg} kg available</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{listing.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Fresh for {listing.shelf_life_days} days</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium text-green-600">
                  {formatCurrency(listing.price_range_min)} - {formatCurrency(listing.price_range_max)}/kg
                </span>
              </div>
            </div>

            {/* Quality factors */}
            <div className="flex gap-2 mb-3">
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                Color: {listing.quality_factors.color.slice(0, 20)}...
              </span>
              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                Confidence: {listing.confidence_score}%
              </span>
            </div>

            {/* Action button */}
            <button
              onClick={handleOfferClick}
              disabled={checkingAuth}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {checkingAuth ? 'Loading...' : isAuthenticated ? 'Submit Offer' : 'Login to Submit Offer'}
            </button>
          </div>
        </div>
      </div>

      {showOfferModal && (
        <OfferModal
          listing={listing}
          onClose={() => setShowOfferModal(false)}
        />
      )}
    </>
  )
}
