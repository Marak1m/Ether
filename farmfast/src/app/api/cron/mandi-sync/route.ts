import { NextRequest, NextResponse } from 'next/server'
import { syncMandiPrices } from '@/lib/mandi-sync'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await syncMandiPrices()

  return NextResponse.json({
    success: true,
    synced_at: new Date().toISOString(),
  })
}
