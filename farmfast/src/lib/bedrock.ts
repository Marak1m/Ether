// Amazon Bedrock — Nova Lite (image grading) + Nova Micro (Hindi chat)
// Uses Bedrock API Key (Bearer token) for authentication

const BEDROCK_API_KEY = process.env.BEDROCK_API_KEY || ''
const AWS_REGION = process.env.AWS_REGION || 'us-east-1'

const BEDROCK_ENDPOINT = `https://bedrock-runtime.${AWS_REGION}.amazonaws.com`

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

// ─── Amazon Nova Lite: Image grading (multimodal) ─────────────────────────────
export async function gradeProduceImage(
  imageBase64: string
): Promise<QualityGradeResult> {

  const payload = {
    messages: [
      {
        role: "user",
        content: [
          {
            image: {
              format: "jpeg",
              source: {
                bytes: imageBase64
              }
            }
          },
          {
            text: `You are an expert agricultural quality inspector in India.
Analyze this produce image and return ONLY valid JSON (no markdown):
{
  "crop_type": "crop name in English",
  "grade": "A" or "B" or "C",
  "confidence": 0-100,
  "shelf_life_days": number,
  "quality_factors": {
    "color": "brief description",
    "surface": "brief description",
    "uniformity": "brief description"
  },
  "price_range_min": realistic Indian mandi price in rupees per kg,
  "price_range_max": realistic Indian mandi price in rupees per kg,
  "hindi_summary": "एक वाक्य में ग्रेड और भाव की जानकारी"
}
Grade A: <10% defects. Grade B: 10-30% defects. Grade C: >30% defects.`
          }
        ]
      }
    ],
    inferenceConfig: {
      maxTokens: 1024,
      temperature: 0.1
    }
  }

  const response = await fetch(
    `${BEDROCK_ENDPOINT}/model/amazon.nova-lite-v1:0/invoke`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${BEDROCK_API_KEY}`
      },
      body: JSON.stringify(payload)
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Bedrock Nova Lite error (${response.status}):`, errorText)
    throw new Error(`Bedrock API error: ${response.status} — ${errorText}`)
  }

  const body = await response.json()
  const text = body.output.message.content[0].text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  return JSON.parse(text) as QualityGradeResult
}

// ─── Amazon Nova Micro: Hindi chat responses (text only, ultra cheap) ─────────
export async function generateHindiResponse(
  userMessage: string,
  context: string
): Promise<string> {

  const payload = {
    messages: [
      {
        role: "user",
        content: [
          {
            text: `You are FarmFast assistant. Context: ${context}
User said: ${userMessage}
Reply in Hindi in 1-2 friendly sentences.`
          }
        ]
      }
    ],
    inferenceConfig: {
      maxTokens: 256,
      temperature: 0.7
    }
  }

  const response = await fetch(
    `${BEDROCK_ENDPOINT}/model/amazon.nova-micro-v1:0/invoke`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${BEDROCK_API_KEY}`
      },
      body: JSON.stringify(payload)
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Bedrock Nova Micro error (${response.status}):`, errorText)
    throw new Error(`Bedrock API error: ${response.status} — ${errorText}`)
  }

  const body = await response.json()
  return body.output.message.content[0].text
}
