// app/api/generate-content-ideas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'

// ⏱️ Konfiguration für maximale Ausführungszeit
export const maxDuration = 60 // ⏱️ bis zu 60 Sekunden erlaubt

// Verbesserte Fehlerbehandlung bei der Initialisierung
if (!process.env.OPENAI_API_KEY) {
  console.error('Fehlender API-Schlüssel: OPENAI_API_KEY ist nicht definiert')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // in .env.local speichern
})

export async function POST(req: NextRequest) {
  try {
    const { keywords } = await req.json()

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      console.error('Ungültige Keywords erhalten:', keywords)
      return NextResponse.json({ error: 'Ungültige Keywords' }, { status: 400 })
    }

    const prompt = `
Hier ist eine Liste von echten Suchanfragen von Nutzer:innen: 
${keywords.slice(0, 25).join(', ')}

- Du bist ein erfahrender Online-Publisher. 
- Bitte gib mir genau 10 kreative und konkrete Blogpost-Ideen als einfache, nummerierte Liste – jede Idee in einer neuen Zeile ohne Zusatztexte.
- Die Titel sollen neugierig machen und zum Klicken animieren. 
- Die Titel sollen in der DU Form sein.
- Verwende die schweizer Tastatur.
`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      })

      const text = completion.choices[0].message.content || ''
      const ideas = text.split('\n').filter((line) => line.trim() !== '')

      return NextResponse.json({ ideas })
    } catch (apiError) {
      console.error('OpenAI API-Fehler:', apiError)
      return NextResponse.json(
        { error: `OpenAI API-Fehler: ${apiError.message || 'Unbekannter Fehler'}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Allgemeiner Fehler bei der Generierung:', error)
    return NextResponse.json(
      { error: `Fehler bei der Generierung: ${error.message || 'Unbekannter Fehler'}` },
      { status: 500 }
    )
  }
}
