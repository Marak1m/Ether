'use client'

import { MapPin, Phone, Package, TrendingUp, Clock } from 'lucide-react'
import { formatTime, formatCurrency } from '@/lib/utils'

// Joined type returned by GET /api/offers?buyer_id=<id>
interface BidWithListing {
  id: string
  listing_id: string
  buyer_id: string | null
  buyer_name: string
  buyer_phone: string | null
  price_per_kg: number
  total_amount: number
  pickup_time: string
  pickup_window: string | null
  message: string | null
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  listings: {
    crop_type: string
    quantity_kg: number
    location: string | null
    image_url: string | null
    farmer_phone: string
    price_range_min: number
    price_range_max: number
  } | null
}

const CROP_EMOJIS: Record<string, string> = {
  'Tomato': '🍅', 'Onion': '🧅', 'Potato': '🥔',
  'Rice': '🌾', 'Mango': '🥭', 'Cauliflower': '🥦',
  'Banana': '🍌',
}

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

interface BidCardProps {
  bid: BidWithListing
}

export function BidCard({ bid }: BidCardProps) {
  const listing = bid.listings
  const cropEmoji = listing ? (CROP_EMOJIS[listing.crop_type] || '🌿') : '🌿'
  const pickupLabel = bid.pickup_window || bid.pickup_time || '—'

  const isAccepted = bid.status === 'accepted'
  const isRejected = bid.status === 'rejected'

  return (
    <div className="glass-strong rounded-2xl border border-gray-100/50 overflow-hidden">
      {/* Accepted banner */}
      {isAccepted && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold text-center py-2.5 px-4">
          🎉 Deal Confirmed! Farmer will be in touch.
        </div>
      )}

      <div className="p-4">
        {/* Listing info row */}
        <div className="flex gap-3 mb-3">
          <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 shadow-inner">
            {listing?.image_url ? (
              <img
                src={listing.image_url}
                alt={listing.crop_type}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.innerHTML =
                      `<div class="w-full h-full flex items-center justify-center text-3xl">${cropEmoji}</div>`
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">{cropEmoji}</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base">
              {listing?.crop_type ?? 'Unknown Crop'}
              <span className="ml-1 text-sm">{cropEmoji}</span>
            </h3>
            {listing?.location && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {formatLocationDisplay(listing.location)}
              </p>
            )}
            {listing && (
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <Package className="w-3 h-3" />
                {listing.quantity_kg} kg
              </p>
            )}
          </div>

          {/* Status pill */}
          <div className="flex-shrink-0">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
              isAccepted
                ? 'bg-green-100 text-green-700'
                : isRejected
                ? 'bg-red-50 text-red-500'
                : 'bg-amber-50 text-amber-600'
            }`}>
              {isAccepted ? '✅ Accepted' : isRejected ? '❌ Not Selected' : '⏳ Pending'}
            </span>
          </div>
        </div>

        {/* Offer details */}
        <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            <span className="text-gray-500">Your offer:</span>
            <span className="font-bold text-green-600">{formatCurrency(bid.price_per_kg)}/kg</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <span>Total:</span>
            <span className="font-semibold text-gray-700">{formatCurrency(bid.total_amount)}</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2 text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Pickup:</span>
            <span className="text-gray-700">{pickupLabel}</span>
          </div>
          {bid.message && (
            <div className="col-span-2 text-gray-500 italic">
              &ldquo;{bid.message}&rdquo;
            </div>
          )}
        </div>

        {/* Farmer contact — visible only on accepted bids */}
        {isAccepted && listing?.farmer_phone && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-3">
            <p className="text-xs font-semibold text-teal-800 mb-1.5">📞 Farmer Contact</p>
            <a
              href={`tel:${listing.farmer_phone}`}
              className="flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-900 transition-colors"
            >
              <Phone className="w-4 h-4" />
              {listing.farmer_phone}
            </a>
          </div>
        )}

        {/* Submitted timestamp */}
        <p className="text-[10px] text-gray-400 text-right">
          Submitted {formatTime(bid.created_at)}
        </p>
      </div>
    </div>
  )
}
