import { S3 } from 'aws-sdk'
import { NextRequest, NextResponse } from 'next/server'

const s3 = new S3({
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
  secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  region: 'auto',
  signatureVersion: 'v4',
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
    await s3
      .putObject({
        Bucket: process.env.CLOUDFLARE_BUCKET_2!,
        Key: filename,
        Body: buffer,
        ContentType: 'image/webp',
        ACL: 'public-read',
      })
      .promise()

    const publicUrl = `https://pub-29ede69a4da644b9b81fa3dd5f8e9d6a.r2.dev/${filename}`

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('Fehler beim Hochladen:', error)
    return NextResponse.json({ error: 'Upload fehlgeschlagen' }, { status: 500 })
  }
}
