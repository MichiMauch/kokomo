import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// OpenAI-Client initialisieren
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Kein Prompt angegeben' }, { status: 400 })
    }

    // DALL-E-3 API aufrufen
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
    })

    // Bild-URL aus der Antwort extrahieren
    const imageUrl = response.data[0]?.url

    if (!imageUrl) {
      throw new Error('Keine Bild-URL in der API-Antwort')
    }

    return NextResponse.json({ imageUrl })
  } catch (error: unknown) {
    console.error('Fehler bei der DALL-E-Bildgenerierung:', error)

    let errorMessage = 'Unbekannter Fehler'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      {
        error: 'Fehler bei der Bildgenerierung',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
