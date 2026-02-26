import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export interface QualityGradeResult {
  crop_type: string
  grade: 'A' | 'B' | 'C'
  confidence: number
  shelf_life_days: number
  quality_factors: {
    color: string
    surface: string
    uniformity: string
  }
  price_range_min: number
  price_range_max: number
  hindi_summary: string
}

export async function gradeProduceImage(
  imageBase64: string
): Promise<QualityGradeResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  const prompt = `You are an expert agricultural quality inspector in India analyzing produce for market grading.

Analyze this produce image and return ONLY a valid JSON response (no markdown, no code blocks) with this exact structure:

{
  "crop_type": "name of the crop in English (e.g., Tomato, Onion, Potato)",
  "grade": "A" or "B" or "C",
  "confidence": 85,
  "shelf_life_days": 5,
  "quality_factors": {
    "color": "description of color quality",
    "surface": "description of surface condition",
    "uniformity": "description of size/shape consistency"
  },
  "price_range_min": 14,
  "price_range_max": 16,
  "hindi_summary": "One friendly sentence in Hindi explaining the grade to the farmer"
}

Grading criteria:
- Grade A (Premium): 90%+ quality, vibrant color, no visible defects, uniform size, firm texture. Price: Market rate + 15-20%
- Grade B (Standard): 70-89% quality, good color, minor surface marks acceptable, mostly uniform. Price: Market rate ± 5%
- Grade C (Economy): Below 70% quality, acceptable for processing, visible defects, size variation. Price: Market rate - 15-25%

Be realistic and honest. Most produce is Grade B. Only exceptional produce is Grade A.`

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
    ])

    const text = result.response.text()
    
    // Remove markdown code blocks if present
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const gradeResult = JSON.parse(jsonText) as QualityGradeResult
    
    // Validate required fields
    if (!gradeResult.crop_type || !gradeResult.grade || !gradeResult.hindi_summary) {
      throw new Error('Invalid response structure from Gemini')
    }
    
    return gradeResult
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error('Failed to grade produce image')
  }
}
