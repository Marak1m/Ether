import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calculateDistance } from '@/lib/utils'
import { resolveImageUrl } from '@/lib/s3'

// Resolve S3 keys to pre-signed URLs for all listings
async function resolveListingImages(listings: any[]): Promise<any[]> {
  return Promise.all(
    listings.map(async (listing) => {
      if (listing.image_url && !listing.image_url.startsWith('http')) {
        try {
          listing.image_url = await resolveImageUrl(listing.image_url)
        } catch {
          // Keep original value if resolution fails
        }
      }
      return listing
    })
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'active'
  const grade = searchParams.get('grade')
  const buyerLat = searchParams.get('lat')
  const buyerLon = searchParams.get('lon')
  const radius = parseInt(searchParams.get('radius') || '15')

  let query = supabase
    .from('listings')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (grade) {
    query = query.eq('quality_grade', grade)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Filter by radius if buyer location provided
  if (buyerLat && buyerLon && data) {
    const lat = parseFloat(buyerLat)
    const lon = parseFloat(buyerLon)

    const filteredData = data
      .map(listing => {
        if (listing.latitude && listing.longitude) {
          const distance = calculateDistance(lat, lon, listing.latitude, listing.longitude)
          return { ...listing, distance: Math.round(distance * 10) / 10 }
        }
        return { ...listing, distance: null }
      })
      .filter(listing => listing.distance === null || listing.distance <= radius)
      .sort((a, b) => (a.distance || 999) - (b.distance || 999))

    const resolved = await resolveListingImages(filteredData)
    return NextResponse.json(resolved)
  }

  const resolved = await resolveListingImages(data || [])
  return NextResponse.json(resolved)
}
