import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'farmfast-images'

/**
 * Upload a produce image to S3
 * @param imageBuffer - The image data as a Buffer
 * @param farmerPhone - Farmer's phone number (used for folder structure)
 * @param listingId - Optional listing ID for naming
 * @returns The public S3 URL of the uploaded image
 */
export async function uploadProduceImage(
    imageBuffer: Buffer,
    farmerPhone: string,
    listingId?: string
): Promise<string> {
    // Clean phone number for use as folder name
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

        // Return the S3 URL
        const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`

        console.log(`Image uploaded to S3: ${s3Url}`)
        return s3Url
    } catch (error) {
        console.error('S3 upload error:', error)
        throw new Error('Failed to upload image to S3')
    }
}
