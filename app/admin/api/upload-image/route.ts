import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'

const s3Client = new S3Client({
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
  },
  region: 'auto',
})

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'Kein Bild hochgeladen' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const filename = file.name

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET_2!,
      Key: filename,
      Body: buffer,
      ContentType: 'image/webp',
      ACL: 'public-read',
    })

    await s3Client.send(command)

    const publicUrl = `https://pub-29ede69a4da644b9b81fa3dd5f8e9d6a.r2.dev/${filename}`

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('Fehler beim Hochladen:', error)
    return NextResponse.json({ error: 'Upload fehlgeschlagen' }, { status: 500 })
  }
}
