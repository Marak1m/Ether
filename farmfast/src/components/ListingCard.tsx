'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Listing } from '@/lib/supabase'
import { QualityBadge } from './QualityBadge'
import { RatingStars } from './RatingStars'
import { formatTime, formatCurrency } from '@/lib/utils'
import { MapPin, Package, Clock, TrendingUp, Navigation, Lock } from 'lucide-react'
import { OfferModal } from './OfferModal'
import { getCurrentUser } from '@/lib/auth'

interface ListingCardProps {
  listing: Listing & { distance?: number | null }
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function ListingCard({ listing }: ListingCardProps) {
  const router = useRouter()
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [auctionStatus, setAuctionStatus] = useState(listing.auction_status)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser()
      setIsAuthenticated(!!user)
    } catch {
      setIsAuthenticated(false)
    } finally {
      setCheckingAuth(false)
    }
  }

  // Countdown timer + auto-close polling
  const closeAuction = useCallback(async () => {
    try {
      await fetch(`/api/listings/${listing.id}/close-auction`, { method: 'POST' })
      setAuctionStatus('closed')
    } catch (err) {
      console.error('close-auction error:', err)
    }
  }, [listing.id])

  useEffect(() => {
    if (!listing.auction_closes_at || auctionStatus !== 'open') return

    const closesAt = new Date(listing.auction_closes_at).getTime()

    const tick = () => {
      const remaining = closesAt - Date.now()
      setTimeLeft(Math.max(0, remaining))
      if (remaining <= 0 && auctionStatus === 'open') {
        closeAuction()
      }
    }

    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [listing.auction_closes_at, auctionStatus, closeAuction])

  // Poll every 30s to close auction if past deadline
  useEffect(() => {
    if (!listing.auction_closes_at || auctionStatus !== 'open') return
    const poll = setInterval(async () => {
      if (Date.now() > new Date(listing.auction_closes_at!).getTime() && auctionStatus === 'open') {
        await closeAuction()
      }
    }, 30000)
    return () => clearInterval(poll)
  }, [listing.auction_closes_at, auctionStatus, closeAuction])

  const handleOfferClick = () => {
    if (!isAuthenticated) {
      router.push('/buyer/login')
      return
    }
    setShowOfferModal(true)
  }

  // Change 1: updated emoji map with user-specified crops + fallback 🌿
  const cropEmojis: Record<string, string> = {
    'Tomato': '🍅', 'Onion': '🧅', 'Potato': '🥔',
    'Rice': '🌾', 'Mango': '🥭', 'Cauliflower': '🥦',
    'Banana': '🍌',
  }
  const emoji = cropEmojis[listing.crop_type] || '🌿'

  const auctionIsOpen = auctionStatus === 'open'
  const auctionIsClosed = auctionStatus === 'closed'
  const auctionIsAccepted = auctionStatus === 'accepted'
  const offerCount = listing.offer_count ?? 0

  // Suppress unused warning — timeLeft drives auto-close logic in useEffect
  void timeLeft
  void formatCountdown

  return (
    <>
      <div className="glass-strong rounded-2xl border border-gray-100/50 card-glow p-5 transition-all duration-300">
        <div className="flex gap-4">
          {/* Image — Change 1: show emoji placeholder when image_url is null/empty */}
          <div className="flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 shadow-inner">
            {listing.image_url ? (
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
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl">{emoji}</div>
            )}
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
              {/* Change 2: null guard on shelf_life_days to prevent "Fresh d" */}
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>Fresh {listing.shelf_life_days ?? '?'}d</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span className="truncate">{listing.location}</span>
              </div>
            </div>

            {/* Price + Confidence */}
            <div className="flex items-center justify-between mb-1">
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

            {/* Change 3: Mandi label renamed + "no middleman markup" subtext */}
            {listing.mandi_modal_price != null && (
              <div className="mb-0.5">
                <p className="text-xs text-gray-400">
                  Market wholesale: ₹{listing.mandi_modal_price}/kg
                </p>
                <p className="text-[10px] text-emerald-600 font-medium">
                  Direct from farmer — no middleman markup
                </p>
              </div>
            )}
            {listing.reserve_price != null && (
              <p className="text-xs text-orange-500 flex items-center gap-1 mb-2">
                <Lock className="w-3 h-3 flex-shrink-0" />
                Minimum: ₹{listing.reserve_price}/kg
              </p>
            )}

            {/* Auction state */}
            {auctionIsAccepted ? (
              <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                ✅ Sold
              </div>
            ) : auctionIsClosed ? (
              <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                ⏰ Auction closed — awaiting decision
              </div>
            ) : auctionIsOpen ? (
              <div className="mb-2">
                {/* Change 4: countdown timer removed; offer count kept */}
                <p className="text-xs text-gray-500 mb-1.5">
                  {offerCount} offer{offerCount !== 1 ? 's' : ''} submitted
                </p>
                {/* Action button — only shown when auction is open */}
                <button
                  onClick={handleOfferClick}
                  disabled={checkingAuth}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-md shadow-green-100/50 hover:shadow-lg hover:shadow-green-200/50 hover:-translate-y-0.5 text-sm"
                >
                  {checkingAuth ? 'Loading...' : isAuthenticated ? '💼 Submit Offer' : '🔑 Login to Offer'}
                </button>
              </div>
            ) : (
              /* No auction fields — legacy listing */
              <button
                onClick={handleOfferClick}
                disabled={checkingAuth}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-md shadow-green-100/50 hover:shadow-lg hover:shadow-green-200/50 hover:-translate-y-0.5 text-sm"
              >
                {checkingAuth ? 'Loading...' : isAuthenticated ? '💼 Submit Offer' : '🔑 Login to Offer'}
              </button>
            )}
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
