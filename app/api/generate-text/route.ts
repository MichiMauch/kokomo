import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'

export async function POST(request: Request) {
  try {
    // Sichere Verwendung des API-Schlüssels (nur auf dem Server verfügbar)
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return NextResponse.json({ error: 'API-Schlüssel ist nicht konfiguriert' }, { status: 500 })
    }

    // Erstellen des OpenAI Clients
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    })

    // Request-Daten auslesen
    const body = await request.json()
    const { title, plan } = body

    // OpenAI API aufrufen
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: `Erstelle einen ersten Blogpost für den Titel "${title}" mit folgender Struktur: Ziel: ${plan.ziel}, Zielgruppe: ${plan.zielgruppe}, Gliederung: ${plan.gliederung.join(', ')}. Verwende Markdown mit Zwischenüberschriften. Verwende die schweizer Tastatur.`,
        },
      ],
    })

    // Ergebnis zurückgeben
    return NextResponse.json({
      content: response.choices[0]?.message?.content?.trim() || '',
    })
  } catch (error) {
    console.error('Fehler bei der Text-Generierung:', error)
    const message = error instanceof Error ? error.message : 'Fehler bei der Text-Generierung'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
