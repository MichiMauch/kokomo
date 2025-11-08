import { NextResponse, NextRequest } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import OpenAI from 'openai'

// Initialisiere OpenAI
const openai = new OpenAI()

// Types
interface VectorDBItem {
  title: string
  slug: string
  text: string
  embedding: number[]
}

interface RelevantChunk extends VectorDBItem {
  similarity: number
}

// In-Memory Cache für Vector DB (12 MB!)
let vectorDBCache: VectorDBItem[] | null = null
let isLoadingCache = false

// Funktion zum Laden der Vektordatenbank (wird beim Build generiert)
async function loadVectorDB(): Promise<VectorDBItem[] | null> {
  // Return cached version if available
  if (vectorDBCache) return vectorDBCache

  // Wait if already loading
  if (isLoadingCache) {
    while (isLoadingCache) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return vectorDBCache
  }

  isLoadingCache = true
  try {
    const dbPath = path.join(process.cwd(), 'public', 'static', 'vector-db.json')
    const data = await fs.readFile(dbPath, 'utf8')
    vectorDBCache = JSON.parse(data) as VectorDBItem[]
    console.log(`✅ Vector DB loaded and cached (${vectorDBCache.length} items)`)
    return vectorDBCache
  } catch (error) {
    console.error('Error loading vector database:', error)
    return null
  } finally {
    isLoadingCache = false
  }
}

// Kosinus-Ähnlichkeit berechnen
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum: number, a: number, i: number) => sum + a * vecB[i], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum: number, a: number) => sum + a * a, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum: number, b: number) => sum + b * b, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

// Die relevantesten Textabschnitte finden
function findRelevantChunks(
  userQueryEmbedding: number[],
  vectorDB: VectorDBItem[],
  topK = 3
): RelevantChunk[] {
  if (!vectorDB || !vectorDB.length) return []

  // Berechne die Ähnlichkeit für jeden Chunk
  const similarities: RelevantChunk[] = vectorDB.map((item) => ({
    ...item,
    similarity: cosineSimilarity(userQueryEmbedding, item.embedding),
  }))

  // Sortiere nach Ähnlichkeit und wähle die Top-K
  return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, topK)
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()

    if (!query) {
      return NextResponse.json({ error: 'Keine Frage angegeben' }, { status: 400 })
    }

    // Lade die Vektordatenbank
    const vectorDB = await loadVectorDB()
    if (!vectorDB) {
      return NextResponse.json(
        {
          error: 'Vektordatenbank nicht verfügbar',
        },
        { status: 500 }
      )
    }

    // Erzeuge Embedding für die Nutzeranfrage
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      dimensions: 1536,
    })

    const queryEmbedding = embeddingResponse.data[0].embedding

    // Finde die relevantesten Chunks
    const relevantChunks = findRelevantChunks(queryEmbedding, vectorDB)

    if (relevantChunks.length === 0) {
      return NextResponse.json({
        answer:
          'Leider konnte ich keine relevanten Informationen zu deiner Frage in unseren Blogposts finden.',
      })
    }

    // Erstelle einen Kontext aus den relevanten Chunks
    const context = relevantChunks
      .map((chunk) => {
        return `TEXTABSCHNITT [Aus Artikel: ${chunk.title}]:
${chunk.text}
---`
      })
      .join('\n\n')

    // Sende Anfrage an GPT
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Du bist KOKOBOT, ein hilfreicher Assistent für den Blog kokomo.house. Deine Aufgabe ist es, Fragen direkt zu beantworten, indem du dich auf die bereitgestellten Textabschnitte stützt.
          
Wichtige Regeln:
1. Antworte DIREKT auf die Frage, ohne Formulierungen wie "Der Artikel beschreibt..." oder "Laut dem Text...". Sprich als ob du selbst die Expertise hast.
2. Antworte NUR auf Basis der bereitgestellten Textabschnitte.
3. Wenn die Frage nicht mit den bereitgestellten Informationen beantwortet werden kann, sage höflich, dass du dazu keine Informationen hast.
4. Erfinde KEINE Informationen.
5. Formuliere deine Antworten in einem freundlichen, informativen Stil.
6. Verwende Markdown für die Formatierung, wenn sinnvoll.
7. Berücksichtige die Schweizer Tastatur bei deinen Antworten (z.B. ä, ö, ü und andere Schweizer Schreibweisen).

Die Frage bezieht sich auf Inhalte des kokomo.house Blogs, der sich mit Themen wie Tiny Houses, nachhaltigem Leben und Minimalismus beschäftigt.`,
        },
        {
          role: 'user',
          content: `Basierend auf den folgenden Textabschnitten, beantworte bitte diese Frage direkt und knapp:
          
FRAGE: ${query}

${context}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    })

    return NextResponse.json({
      answer: chatCompletion.choices[0].message.content,
      sources: relevantChunks.map((chunk) => ({
        title: chunk.title,
        slug: chunk.slug,
      })),
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten' }, { status: 500 })
  }
}
