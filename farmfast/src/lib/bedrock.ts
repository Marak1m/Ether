import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"

const bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

// ─── Models ────────────────────────────────────────────────────
// Sonnet  → vision + accurate grading (used for image analysis)
// Haiku   → fast text responses (used for chat/Hindi responses)
const SONNET_MODEL = "anthropic.claude-3-5-sonnet-20241022-v2:0"
const HAIKU_MODEL = "anthropic.claude-3-haiku-20240307-v1:0"

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

/**
 * Grade a produce image using Claude 3.5 Sonnet (vision model).
 * Returns structured quality assessment with crop type, grade, price range, etc.
 */
export async function gradeProduceImage(
    imageBase64: string
): Promise<QualityGradeResult> {
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
        const requestBody = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 1024,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: "image/jpeg",
                                data: imageBase64,
                            },
                        },
                        {
                            type: "text",
                            text: prompt,
                        },
                    ],
                },
            ],
        }

        const command = new InvokeModelCommand({
            modelId: SONNET_MODEL,
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(requestBody),
        })

        const response = await bedrockClient.send(command)
        const responseBody = JSON.parse(new TextDecoder().decode(response.body))

        const text = responseBody.content[0].text

        // Remove markdown code blocks if present
        const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

        const gradeResult = JSON.parse(jsonText) as QualityGradeResult

        // Validate required fields
        if (!gradeResult.crop_type || !gradeResult.grade || !gradeResult.hindi_summary) {
            throw new Error('Invalid response structure from Bedrock')
        }

        return gradeResult
    } catch (error) {
        console.error('AWS Bedrock Sonnet API error:', error)
        throw new Error('Failed to grade produce image')
    }
}

/**
 * Generate a Hindi chat response using Claude 3 Haiku (fast, text-only).
 * Used for conversational WhatsApp messages that don't need vision.
 */
export async function generateChatResponse(
    prompt: string
): Promise<string> {
    try {
        const requestBody = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 512,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: prompt,
                        },
                    ],
                },
            ],
        }

        const command = new InvokeModelCommand({
            modelId: HAIKU_MODEL,
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(requestBody),
        })

        const response = await bedrockClient.send(command)
        const responseBody = JSON.parse(new TextDecoder().decode(response.body))

        return responseBody.content[0].text
    } catch (error) {
        console.error('AWS Bedrock Haiku API error:', error)
        throw new Error('Failed to generate chat response')
    }
}
