import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'

// ⏱️ Konfiguration für maximale Ausführungszeit
export const maxDuration = 60 // ⏱️ bis zu 60 Sekunden erlaubt

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { title, plan } = await req.json()
  const { ziel, zielgruppe, gliederung } = plan as {
    ziel: string
    zielgruppe: string
    gliederung: string[]
  }

  let body = `# ${title}\n\n`

  for (const heading of gliederung) {
    const subPrompt = `Schreibe einen Abschnitt im Markdown-Format zum Thema "${heading}".
Der Abschnitt ist Teil eines Blogartikels mit dem Titel "${title}".
Ziel: ${ziel}
Zielgruppe: ${zielgruppe}
Der Text soll informativ, persönlich und hilfreich sein.
Verwende Zwischenüberschrift "## ${heading}" und schreibe 1–3 kurze Absätze.`

    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: subPrompt }],
      temperature: 0.8,
    })

    const result = chat.choices[0]?.message?.content?.trim() || ''
    body += result + '\n\n'
  }

  body += '_Erstellt mit Unterstützung von GPT-4_'

  return NextResponse.json({ body })
}
