// lib/google-auth.ts
import { GoogleAuth } from 'google-auth-library'
import path from 'path'
import fs from 'fs'

export async function getAccessToken() {
  const encoded = process.env.GOOGLE_SEARCH_CONSOLE_KEY_JSON

  let auth: GoogleAuth

  if (encoded) {
    // 🟢 Produktion (z. B. Vercel): JSON aus Base64 laden
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
    const credentials = JSON.parse(decoded)

    auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })
  } else {
    // 🟡 Lokal: JSON-Datei von der Platte laden
    const keyPath = path.join(process.cwd(), 'secrets/kokomo-house-87b515243ff5.json')
    if (!fs.existsSync(keyPath)) {
      throw new Error('Lokale JSON-Datei für Google Search Console nicht gefunden.')
    }

    auth = new GoogleAuth({
      keyFile: keyPath,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })
  }

  const client = await auth.getClient()
  const tokenResponse = await client.getAccessToken()
  return tokenResponse?.token
}
