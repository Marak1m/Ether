import { NextRequest, NextResponse } from 'next/server'
import { filterPrices, getCommoditySummaries, generateTrendData, getCommodities, getStates } from '@/lib/mandi'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const commodity = searchParams.get('commodity') || undefined
    const state = searchParams.get('state') || undefined
    const action = searchParams.get('action') || 'prices'

    try {
        switch (action) {
            case 'summaries':
                return NextResponse.json(getCommoditySummaries())

            case 'trend':
                if (!commodity) {
                    return NextResponse.json({ error: 'commodity parameter required' }, { status: 400 })
                }
                return NextResponse.json(generateTrendData(commodity))

            case 'commodities':
                return NextResponse.json(getCommodities())

            case 'states':
                return NextResponse.json(getStates())

            case 'prices':
            default:
                return NextResponse.json(filterPrices(commodity, state))
        }
    } catch (error) {
        console.error('Mandi prices API error:', error)
        return NextResponse.json({ error: 'Failed to fetch mandi prices' }, { status: 500 })
    }
}
