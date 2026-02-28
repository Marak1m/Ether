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
      router.push('/buyer/login')
      return
    }
    setShowOfferModal(true)
  }

  const cropEmojis: Record<string, string> = {
    'Tomato': '🍅', 'Onion': '🧅', 'Potato': '🥔',
    'Mango': '🥭', 'Banana': '🍌', 'Cabbage': '🥬',
    'Wheat': '🌾', 'Rice': '🍚', 'Apple': '🍎',
  }
  const emoji = cropEmojis[listing.crop_type] || '🌾'

  return (
    <>
      <div className="glass-strong rounded-2xl border border-gray-100/50 card-glow p-5 transition-all duration-300">
        <div className="flex gap-4">
          {/* Image */}
          <div className="flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 shadow-inner">
            <img
              src={listing.image_url}
              alt={listing.crop_type}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.innerHTML =
                    `<div class="w-full h-full flex items-center justify-center text-5xl">${emoji}</div>`
                }
              }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                  {listing.crop_type}
                  <span className="text-sm">{emoji}</span>
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <QualityBadge grade={listing.quality_grade} size="sm" />
                  {listing.distance !== undefined && listing.distance !== null && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                      <Navigation className="w-2.5 h-2.5" />
                      {listing.distance} km
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
              <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-full flex-shrink-0">
                {formatTime(listing.created_at)}
              </span>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-500 mb-3">
              <div className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-gray-400" />
                <span>{listing.quantity_kg} kg</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>Fresh {listing.shelf_life_days}d</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span className="truncate">{listing.location}</span>
              </div>
            </div>

            {/* Price + Confidence */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                <span className="font-bold text-green-600 text-sm">
                  {formatCurrency(listing.price_range_min)} - {formatCurrency(listing.price_range_max)}/kg
                </span>
              </div>
              <span className="text-[10px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-bold">
                {listing.confidence_score}% AI
              </span>
            </div>

            {/* Action button */}
            <button
              onClick={handleOfferClick}
              disabled={checkingAuth}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-md shadow-green-100/50 hover:shadow-lg hover:shadow-green-200/50 hover:-translate-y-0.5 text-sm"
            >
              {checkingAuth ? 'Loading...' : isAuthenticated ? '💼 Submit Offer' : '🔑 Login to Offer'}
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
