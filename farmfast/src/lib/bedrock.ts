import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from "@aws-sdk/client-bedrock-runtime"

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
})

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
                bytes: imageBase64  // Nova uses bytes directly
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

  const command = new InvokeModelCommand({
    modelId: "amazon.nova-lite-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload)
  })

  const response = await client.send(command)
  const body = JSON.parse(new TextDecoder().decode(response.body))
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

  const command = new InvokeModelCommand({
    modelId: "amazon.nova-micro-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload)
  })

  const response = await client.send(command)
  const body = JSON.parse(new TextDecoder().decode(response.body))
  return body.output.message.content[0].text
}
