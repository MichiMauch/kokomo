import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'

// ⏱️ Konfiguration für maximale Ausführungszeit
export const maxDuration = 60 // ⏱️ bis zu 60 Sekunden erlaubt

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { title } = await req.json()

  const prompt = `Du bist Content-Strategist für einen Tiny-House-Blog. Plane einen Blogpost mit dem Titel "${title}".
Erstelle:
- eine klare Zielsetzung
- eine präzise Zielgruppenbeschreibung
- eine Gliederung mit 3–5 Zwischenüberschriften
Gib das Ergebnis als JSON zurück mit den Feldern: "ziel", "zielgruppe", "gliederung"` // GPT wird gebeten, JSON zu liefern

  const chat = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  })

  const raw = chat.choices[0]?.message?.content || '{}'

  try {
    const json = JSON.parse(raw)
    return NextResponse.json(json)
  } catch (err) {
    console.error('❌ Fehler beim JSON-Parsing:', err)
    return NextResponse.json({ error: 'Parsing failed', raw }, { status: 500 })
  }
}
