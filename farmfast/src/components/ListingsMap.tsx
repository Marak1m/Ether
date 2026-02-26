'use client'

import { useEffect, useRef, useState } from 'react'
import { Listing } from '@/lib/supabase'
import 'leaflet/dist/leaflet.css'

// Dynamic import to avoid SSR issues
let L: any = null

interface ListingsMapProps {
  listings: (Listing & { distance?: number | null })[]
  buyerLocation: { lat: number; lon: number } | null
  onListingClick?: (listing: Listing) => void
}

export function ListingsMap({ listings, buyerLocation, onListingClick }: ListingsMapProps) {
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load Leaflet dynamically (client-side only)
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return
      
      if (!L) {
        L = (await import('leaflet')).default
        
        // Fix for default marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })
      }
      
      setIsLoading(false)
    }
    
    loadLeaflet()
  }, [])

  useEffect(() => {
    if (isLoading || !L || !mapContainerRef.current) return

    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(
        buyerLocation ? [buyerLocation.lat, buyerLocation.lon] : [18.5204, 73.8567],
        11
      )

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current)
    }

    // Clear existing markers
    mapRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        mapRef.current?.removeLayer(layer)
      }
    })

    // Add buyer location marker (blue)
    if (buyerLocation && mapRef.current) {
      const buyerIcon = L.divIcon({
        className: 'custom-buyer-marker',
        html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      L.marker([buyerLocation.lat, buyerLocation.lon], { icon: buyerIcon })
        .addTo(mapRef.current)
        .bindPopup('<b>Your Location</b>')
    }

    // Add listing markers (green)
    listings.forEach((listing) => {
      if (listing.latitude && listing.longitude && mapRef.current) {
        const gradeColors: Record<string, string> = {
          A: '#10b981', // green
          B: '#f59e0b', // orange
          C: '#ef4444', // red
        }

        const color = gradeColors[listing.quality_grade] || '#6b7280'

        const listingIcon = L.divIcon({
          className: 'custom-listing-marker',
          html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">${listing.quality_grade}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        const marker = L.marker([listing.latitude, listing.longitude], { icon: listingIcon })
          .addTo(mapRef.current)
          .bindPopup(
            `<div style="min-width: 200px;">
              <b>${listing.crop_type}</b><br/>
              Grade: ${listing.quality_grade}<br/>
              Quantity: ${listing.quantity_kg} kg<br/>
              ${listing.distance ? `Distance: ${listing.distance} km` : ''}
            </div>`
          )

        if (onListingClick) {
          marker.on('click', () => onListingClick(listing))
        }
      }
    })

    // Fit bounds to show all markers
    if (listings.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(
        listings
          .filter((l) => l.latitude && l.longitude)
          .map((l) => [l.latitude!, l.longitude!] as [number, number])
      )

      if (buyerLocation) {
        bounds.extend([buyerLocation.lat, buyerLocation.lon])
      }

      mapRef.current.fitBounds(bounds, { padding: [50, 50] })
    }

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [listings, buyerLocation, onListingClick, isLoading])

  if (isLoading) {
    return (
      <div className="w-full h-[500px] rounded-lg shadow-md border border-gray-200 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[500px] rounded-lg shadow-md border border-gray-200"
      style={{ zIndex: 0 }}
    />
  )
}
