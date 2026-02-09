import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { OpenAI } from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const contentDir = path.join(process.cwd(), 'data', 'tiny-house')

async function generateSummary(title, content) {
  try {
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

    return response.choices[0]?.message?.content?.trim() || ''
  } catch (error) {
    console.error(`Fehler bei der Generierung für "${title}":`, error.message)
    return null
  }
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY nicht gefunden in .env')
    process.exit(1)
  }

  const files = fs.readdirSync(contentDir).filter(file => file.endsWith('.mdx'))

  for (const file of files) {
    const filePath = path.join(contentDir, file)
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const { data, content } = matter(fileContent)

    console.log(`Verarbeite: ${file}...`)
    const summary = await generateSummary(data.title, content)

    if (summary) {
      data.summary = summary
      const updatedContent = matter.stringify(content, data)
      fs.writeFileSync(filePath, updatedContent)
      console.log(`✅ Update für ${file} (Länge: ${summary.length})`)
    }
  }
}

main()
