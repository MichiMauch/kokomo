// app/api/generate-content-ideas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'

// ⏱️ Konfiguration für maximale Ausführungszeit
export const maxDuration = 60 // ⏱️ bis zu 60 Sekunden erlaubt

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // in .env.local speichern
})

export async function POST(req: NextRequest) {
  try {
    const { keywords } = await req.json()

    const prompt = `
Hier ist eine Liste von echten Suchanfragen von Nutzer:innen: 
${keywords.slice(0, 25).join(', ')}

- Du bist ein erfahrender Online-Publisher. 
- Bitte gib mir genau 10 kreative und konkrete Blogpost-Ideen als einfache, nummerierte Liste – jede Idee in einer neuen Zeile ohne Zusatztexte.
- Die Titel sollen neugierig machen und zum Klicken animieren. 
- Die Titel sollen in der DU Form sein.
- Verwende die schweizer Tastatur.
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    const text = completion.choices[0].message.content || ''
    const ideas = text.split('\n').filter((line) => line.trim() !== '')

    return NextResponse.json({ ideas })
  } catch (error) {
    console.error('GPT API-Fehler:', error)
    return NextResponse.json({ error: 'Fehler bei der Generierung' }, { status: 500 })
  }
}
