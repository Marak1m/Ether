import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWeeklyDigest } from '@/lib/digest'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all distinct farmer phones that have listings
  const { data, error } = await supabase
    .from('listings')
    .select('farmer_phone')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const phones = Array.from(new Set((data ?? []).map((r: { farmer_phone: string }) => r.farmer_phone)))

  let count = 0
  for (const phone of phones) {
    try {
      await sendWeeklyDigest(phone)
      count++
    } catch (err) {
      console.error(`[weekly-digest] Failed for ${phone}:`, err)
    }
  }

  return NextResponse.json({ success: true, count })
}
