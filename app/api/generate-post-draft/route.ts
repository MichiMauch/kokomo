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

  const prompt = `Schreibe einen Blogpost-Entwurf im Markdown-Format zum Thema "${title}".

  Ziel: Ein lebendiger, informativer und persönlicher Blogpost, der Leser:innen abholt, unterhält und echten Mehrwert bietet.
  
  Der Beitrag soll:
  - auf Hochdeutsch geschrieben sein, unter Verwendung der Schweizer Tastatur
  - konsequent in der DU-Form verfasst sein
  - eine Länge von 500–800 Wörtern erreichen
  - mit einer neugierig machenden Einleitung starten – etwa mit einer kleinen persönlichen Szene, einem Gedankenexperiment oder einer Frage (ohne Haupttitel – dieser wird separat vergeben)
  - insgesamt 5–6 Absätze enthalten, die jeweils ein Unterthema tiefgehend behandeln
  
  Hinweise zur Tiefe und Struktur:
  - Jeder dieser Absätze soll 200–250 Wörter umfassen
  - Jeder Absatz behandelt einen eigenen Aspekt des Themas – mit erklärendem Teil, persönlichem Ton, ggf. Beispiel oder Szene
  - Verwende wenn passend Aufzählungen oder nummerierte Listen, aber immer eingebettet in den Fliesstext
  - Verwende Zwischenüberschriften im Format ## Zwischenüberschrift
  - Baue mindestens einen Link zu einer vertrauenswürdigen externen Quelle ein
  - Verwende *kein* Markdown-Codeblock (\`\`\`) – gib nur reinen Markdown-Text zurück
  - Schliess den Beitrag mit einem klaren Fazit oder einem motivierenden Call-to-Action ab
  
  Schreibe so, als würdest du einer Freundin oder einem Freund beim Kaffee das Thema erklären – persönlich, greifbar, mit Tiefe und Herz.`

  const chat = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  })

  const rawBody = chat.choices[0]?.message?.content?.trim() || ''
  const cleanedBody = cleanMarkdown(rawBody)

  return NextResponse.json({ body: cleanedBody })
}
