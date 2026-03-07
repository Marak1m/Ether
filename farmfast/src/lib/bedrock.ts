/* eslint-disable @typescript-eslint/no-explicit-any */
// Amazon Bedrock — Nova Lite (image grading with tool use) + Nova Micro (Hindi chat)
// Uses ConverseCommand with agentic tool loop to fetch live mandi prices during grading.

import {
  BedrockRuntimeClient,
  ConverseCommand,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'
import { getMandiPriceFromDB } from '@/lib/mandi-sync'

const AWS_REGION = process.env.AWS_REGION || 'us-east-1'

const client = new BedrockRuntimeClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GradeResult {
  crop_type: string
  grade: 'A' | 'B' | 'C'
  confidence: number
  shelf_life_days: number
  price_range_min: number
  price_range_max: number
  mandi_price: number
  reserve_price: number
  hindi_summary: string
}

// Keep old type alias for any existing code that still references it
export type QualityGradeResult = GradeResult & {
  quality_factors: { color: string; surface: string; uniformity: string }
}

// ─── Tool definition ──────────────────────────────────────────────────────────

const MANDI_TOOL = {
  name: 'get_mandi_price',
  description:
    "Gets today's wholesale mandi modal price for a crop in a given Indian district from the database.",
  inputSchema: {
    json: {
      type: 'object',
      properties: {
        crop_type: { type: 'string', description: 'Crop name in English' },
        district: { type: 'string', description: 'Indian district name' },
      },
      required: ['crop_type', 'district'],
    },
  },
}

// ─── Nova Lite: image grading with agentic tool loop ─────────────────────────

export async function gradeWithAgentTools(
  imageBase64: string,
  farmerDistrict: string,
  modelId = 'amazon.nova-lite-v1:0'
): Promise<GradeResult> {
  // Strip data-URL prefix if present, then decode base64 → raw bytes
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '')
  const imageBytes = Buffer.from(cleanBase64, 'base64')

  const systemPrompt = `You are an agricultural AI agent for FarmFast India.
Step 1: Identify the crop and grade it A/B/C based on visual quality.
Step 2: Call get_mandi_price for this crop in ${farmerDistrict}.
Step 3: Return ONLY valid JSON (no markdown, no extra text):
{
  "crop_type": "crop name in English",
  "grade": "A" or "B" or "C",
  "confidence": 0-100,
  "shelf_life_days": number,
  "price_range_min": realistic Indian price in rupees per kg,
  "price_range_max": realistic Indian price in rupees per kg,
  "mandi_price": the value returned by get_mandi_price,
  "reserve_price": MAX(mandi_price, price_range_min * 0.85),
  "hindi_summary": "एक वाक्य में ग्रेड और भाव की जानकारी"
}
Grade A: <10% defects. Grade B: 10-30%. Grade C: >30%.`

  const messages: any[] = [
    {
      role: 'user',
      content: [
        {
          image: {
            format: 'jpeg',
            // Must be Uint8Array (Buffer extends Uint8Array) — NOT a base64 string
            source: { bytes: imageBytes },
          },
        },
        { text: systemPrompt },
      ],
    },
  ]

  let response = await client.send(
    new ConverseCommand({
      modelId,
      messages,
      toolConfig: { tools: [{ toolSpec: MANDI_TOOL }] },
      inferenceConfig: { maxTokens: 1024, temperature: 0.1 },
    })
  )

  // Agentic loop: handle tool_use stops
  while (response.stopReason === 'tool_use') {
    const assistantContent = response.output?.message?.content ?? []

    // Find the toolUse block
    const toolUseBlock = assistantContent.find((b: any) => b.toolUse)
    if (!toolUseBlock?.toolUse) break

    const { toolUseId, name, input } = toolUseBlock.toolUse as any

    let toolResult: string
    if (name === 'get_mandi_price') {
      const price = await getMandiPriceFromDB(input.crop_type, input.district)
      toolResult = String(price)
    } else {
      toolResult = '0'
    }

    // Push assistant turn and tool result into messages
    messages.push({ role: 'assistant', content: assistantContent })
    messages.push({
      role: 'user',
      content: [
        {
          toolResult: {
            toolUseId,
            content: [{ text: toolResult }],
          },
        },
      ],
    })

    response = await client.send(
      new ConverseCommand({
        modelId,
        messages,
        toolConfig: { tools: [{ toolSpec: MANDI_TOOL }] },
        inferenceConfig: { maxTokens: 1024, temperature: 0.1 },
      })
    )
  }

  // Parse final JSON from the text content block
  const finalContent = response.output?.message?.content ?? []
  const textBlock = finalContent.find((b: any) => b.text)
  if (!textBlock?.text) throw new Error('No text content in Bedrock response')

  const cleaned = textBlock.text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  return JSON.parse(cleaned) as GradeResult
}

// ─── gradeWithFallback: Nova Lite → Nova Pro → null ───────────────────────────

export async function gradeWithFallback(
  imageBase64: string,
  district: string
): Promise<GradeResult | null> {
  try {
    return await gradeWithAgentTools(imageBase64, district, 'amazon.nova-lite-v1:0')
  } catch (err) {
    console.error('[bedrock] Nova Lite failed, retrying with Nova Pro:', err)
  }
  try {
    return await gradeWithAgentTools(imageBase64, district, 'amazon.nova-pro-v1:0')
  } catch (err) {
    console.error('[bedrock] Nova Pro also failed:', err)
  }
  return null
}

// ─── Nova Micro: Hindi chat responses (text only, unchanged) ─────────────────

export async function generateHindiResponse(
  userMessage: string,
  context: string
): Promise<string> {
  const payload = {
    messages: [
      {
        role: 'user',
        content: [
          {
            text: `You are FarmFast assistant. Context: ${context}
User said: ${userMessage}
Reply in Hindi in 1-2 friendly sentences.`,
          },
        ],
      },
    ],
    inferenceConfig: { maxTokens: 256, temperature: 0.7 },
  }

  const command = new InvokeModelCommand({
    modelId: 'amazon.nova-micro-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  })

  try {
    const response = await client.send(command)
    const resultJson = JSON.parse(new TextDecoder().decode(response.body))
    return resultJson.output.message.content[0].text
  } catch (error: any) {
    console.error('Bedrock Nova Micro SDK error:', error)
    throw new Error(`Bedrock SDK API error: ${error.message}`)
  }
}
