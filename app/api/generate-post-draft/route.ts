import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'

// ⏱️ Konfiguration für maximale Ausführungszeit
export const maxDuration = 60 // ⏱️ bis zu 60 Sekunden erlaubt

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function cleanMarkdown(content: string): string {
  return content
    .replace(/^# .*\n?/g, '') // Entfernt erste Markdown-Überschrift
    .replace(/^```(?:markdown)?\n?/g, '') // Entfernt evtl. startenden Markdown-Codeblock
    .replace(/```$/g, '') // Entfernt endenden Codeblock
    .trim()
}

export async function POST(req: Request) {
  const { title } = await req.json()

  const prompt = `Schreibe einen Blogpost-Entwurf im Markdown-Format für das Thema "${title}".
Der Beitrag soll:
- auf Hochdeutsch geschrieben sein, jedoch im Stil einer Schweizer Tastatur (z. B. korrekte Anführungszeichen, keine typografischen Varianten)
- mit einer kurzen Einleitung starten (ohne Haupttitel – dieser wird separat vergeben)
- fünf bis sechs Absätze enthalten, die das Thema interessant, informativ und persönlich behandeln
- Zwischentitel im Format ## Zwischenüberschrift verwenden
- keine Markdown-Codeblöcke verwenden
- am Ende nicht abschliessen mit Fazit oder Call-to-Action

Gib nur den reinen Markdown-Inhalt zurück – ohne Umschliessung mit \`\`\` oder ähnlichem.`

  const chat = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  })

  const rawBody = chat.choices[0]?.message?.content?.trim() || ''
  const cleanedBody = cleanMarkdown(rawBody)

  return NextResponse.json({ body: cleanedBody })
}
