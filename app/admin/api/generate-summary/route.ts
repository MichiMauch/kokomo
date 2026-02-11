import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'

export async function POST(request: Request) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return NextResponse.json({ error: 'API-Schlüssel ist nicht konfiguriert' }, { status: 500 })
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    })

    const body = await request.json()
    const { title, content } = body

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein Experte für Tiny Houses und schreibst ansprechende Teaser-Texte für einen Blog. Deine Zusammenfassungen sind prägnant und fesselnd.',
        },
        {
          role: 'user',
          content: `Erstelle eine Zusammenfassung für den Blogpost mit dem Titel "${title}".
          Inhalt des Posts: ${content.substring(0, 4000)}

          WICHTIGE ANFORDERUNGEN:
          1. Die Zusammenfassung muss GENAU so lang sein, dass sie in einer Teaser-Box gut aussieht.
          2. Die ideale Länge liegt zwischen 160 und 180 Zeichen.
          3. Die Zusammenfassung darf auf keinen Fall länger als 180 Zeichen sein.
          4. Verwende Schweizer Rechtschreibung (kein ß, sondern ss).
          5. Der Text soll NICHT mit "..." enden, sondern ein vollständiger, abgeschlossener Gedankengang sein.
          6. Gib NUR den Text der Zusammenfassung zurück, keine Anführungszeichen oder Einleitungen.`,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    })

    return NextResponse.json({
      summary: response.choices[0]?.message?.content?.trim() || '',
    })
  } catch (error) {
    console.error('Fehler bei der Zusammenfassungs-Generierung:', error)
    const message = error instanceof Error ? error.message : 'Fehler bei der Zusammenfassungs-Generierung'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
