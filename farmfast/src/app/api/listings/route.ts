import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calculateDistance } from '@/lib/utils'

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

    return NextResponse.json(filteredData)
  }

  return NextResponse.json(data)
}
