import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function sendWhatsAppMessage(
  to: string,
  body: string,
  mediaUrl?: string
) {
  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER!,
      to: `whatsapp:${to}`,
      body,
      ...(mediaUrl && { mediaUrl: [mediaUrl] })
    })
    return message
  } catch (error) {
    console.error('Twilio send error:', error)
    throw error
  }
}

export function formatPhoneNumber(phone: string): string {
  // Remove whatsapp: prefix if present
  return phone.replace('whatsapp:', '')
}
