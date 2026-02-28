import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'farmfast-images'

/**
 * Upload a produce image to S3 (private bucket).
 * Returns the S3 key (NOT a public URL) — use getPresignedUrl() to serve it.
 */
export async function uploadProduceImage(
    imageBuffer: Buffer,
    farmerPhone: string,
    listingId?: string
): Promise<string> {
    const cleanPhone = farmerPhone.replace(/[^0-9]/g, '')
    const timestamp = Date.now()
    const key = `produce-images/${cleanPhone}/${listingId || timestamp}.jpg`

    try {
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: imageBuffer,
            ContentType: 'image/jpeg',
        })

        await s3Client.send(command)
        console.log(`Image uploaded to S3: s3://${BUCKET_NAME}/${key}`)

        // Return the S3 key — NOT a public URL
        return key
    } catch (error) {
        console.error('S3 upload error:', error)
        throw new Error('Failed to upload image to S3')
    }
}

/**
 * Generate a pre-signed URL for an S3 image key.
 * Valid for 1 hour by default. Use this when serving images to the frontend.
 */
export async function getPresignedUrl(
    key: string,
    expiresInSeconds: number = 3600
): Promise<string> {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        })

        const url = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds })
        return url
    } catch (error) {
        console.error('Pre-signed URL generation error:', error)
        throw new Error('Failed to generate pre-signed URL')
    }
}

/**
 * Check if a string is an S3 key (not a full URL).
 * S3 keys start with "produce-images/" and don't start with "http".
 */
export function isS3Key(value: string): boolean {
    return value.startsWith('produce-images/') && !value.startsWith('http')
}

/**
 * Resolve an image reference to a displayable URL.
 * - If it's already a full URL (http/https), return as-is.
 * - If it's an S3 key, generate a pre-signed URL.
 */
export async function resolveImageUrl(imageRef: string): Promise<string> {
    if (!imageRef) return ''
    if (imageRef.startsWith('http')) return imageRef
    return getPresignedUrl(imageRef)
}
