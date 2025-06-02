import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { OpenAI } from 'openai'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Lade .env.local
dotenv.config({ path: '.env.local' })

// Erstelle __dirname Äquivalent für ES Module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialisiere OpenAI mit API-Schlüssel
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Verzeichnisse, die MDX-Dateien enthalten
const contentDirs = [
  path.join(process.cwd(), 'data', 'tiny-house'),
  // Weitere Verzeichnisse können hier hinzugefügt werden
]

// Funktion zum Finden aller MDX-Dateien in einem Verzeichnis
function getMdxFiles(dir) {
  const mdxFiles = []
  const items = fs.readdirSync(dir)

  for (const item of items) {
    const itemPath = path.join(dir, item)
    const stats = fs.statSync(itemPath)

    if (stats.isDirectory()) {
      mdxFiles.push(...getMdxFiles(itemPath))
    } else if (item.endsWith('.mdx')) {
      mdxFiles.push(itemPath)
    }
  }

  return mdxFiles
}

// Funktion zum Extrahieren von Text aus MDX
async function extractTextFromMdx(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContent)
  
  // Wandle Markdown in HTML um, ignoriere komplexe Komponenten
  const processedContent = await remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(content)
  
  // Konvertiere HTML in reinen Text (sehr einfache Methode)
  let plainText = processedContent.toString()
    .replace(/<[^>]*>/g, '') // Entferne HTML-Tags
    .replace(/\n+/g, '\n') // Reduziere multiple Zeilenumbrüche
  
  return {
    metadata: {
      title: data.title || '',
      date: data.date || '',
      summary: data.summary || '',
      tags: data.tags || [],
      slug: path.basename(filePath, '.mdx'),
      path: filePath,
    },
    content: plainText
  }
}

// Funktion zum Aufteilen des Textes in Chunks
function splitIntoChunks(text, chunkSize = 1000, overlap = 200) {
  if (!text || text.length <= chunkSize) return [text]
  
  const chunks = []
  let start = 0
  
  while (start < text.length) {
    // Bestimme Ende des aktuellen Chunks
    let end = start + chunkSize
    
    // Wenn wir nicht am Ende des Textes sind und das Ende nicht an einer Satzgrenze ist,
    // versuche das Ende an einem sinnvollen Punkt zu setzen
    if (end < text.length) {
      // Suche nach dem nächsten Absatz oder Satzende
      const nextParagraph = text.indexOf('\n\n', end - 100)
      const nextSentence = text.indexOf('. ', end - 100)
      
      if (nextParagraph > 0 && nextParagraph < end + 150) {
        end = nextParagraph + 2
      } else if (nextSentence > 0 && nextSentence < end + 100) {
        end = nextSentence + 2
      }
    }
    
    chunks.push(text.slice(start, Math.min(end, text.length)))
    
    // Setze start unter Berücksichtigung des Overlaps
    start = end - overlap
  }
  
  return chunks
}

// Funktion zum Erstellen von Embeddings
async function createEmbeddings(texts) {
  const batchSize = 20 // Anzahl der Texte pro Batch
  let allEmbeddings = []
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: batch,
        dimensions: 1536
      })
      
      const batchEmbeddings = response.data.map(item => item.embedding)
      allEmbeddings = [...allEmbeddings, ...batchEmbeddings]
      
      console.log(`Batch ${i / batchSize + 1} von ${Math.ceil(texts.length / batchSize)} verarbeitet`)
    } catch (error) {
      console.error('Fehler beim Erstellen der Embeddings:', error)
      // Füge leere Embeddings für den gesamten Batch hinzu, um die Struktur zu erhalten
      allEmbeddings = [...allEmbeddings, ...Array(batch.length).fill([])]
    }
    
    // Warte kurz, um Rate Limits zu vermeiden
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  return allEmbeddings
}

// Hauptfunktion zum Generieren der Vektordatenbank
async function generateVectorDatabase() {
  try {
    console.log('Starte Generierung der Vektordatenbank...')
    
    // Sammle alle MDX-Dateien aus den angegebenen Verzeichnissen
    let allMdxFiles = []
    for (const dir of contentDirs) {
      allMdxFiles = [...allMdxFiles, ...getMdxFiles(dir)]
    }
    
    console.log(`Gefunden: ${allMdxFiles.length} MDX-Dateien`)
    
    // Verarbeite jede MDX-Datei
    const processedFiles = []
    for (const filePath of allMdxFiles) {
      try {
        const { metadata, content } = await extractTextFromMdx(filePath)
        // Ignoriere Drafts
        if (metadata.draft === true) continue
        
        const chunks = splitIntoChunks(content)
        
        processedFiles.push({
          metadata,
          chunks
        })
        
        console.log(`Verarbeitet: ${metadata.title}`)
      } catch (error) {
        console.error(`Fehler beim Verarbeiten von ${filePath}:`, error)
      }
    }
    
    // Erstelle eine flache Liste aller Chunks mit Metadaten
    const allChunksWithMetadata = []
    for (const file of processedFiles) {
      for (const [index, chunk] of file.chunks.entries()) {
        allChunksWithMetadata.push({
          text: chunk,
          title: file.metadata.title,
          slug: file.metadata.slug,
          chunkIndex: index
        })
      }
    }
    
    console.log(`Erstelle Embeddings für ${allChunksWithMetadata.length} Textabschnitte...`)
    
    // Erstelle Embeddings für alle Chunks
    const embeddingTexts = allChunksWithMetadata.map(item => item.text)
    const embeddings = await createEmbeddings(embeddingTexts)
    
    // Kombiniere Chunks und Embeddings
    const vectorDB = allChunksWithMetadata.map((item, index) => ({
      ...item,
      embedding: embeddings[index]
    }))
    
    // Speichere die Vektordatenbank als JSON
    const outputDir = path.join(process.cwd(), 'public', 'static')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    const outputPath = path.join(outputDir, 'vector-db.json')
    fs.writeFileSync(outputPath, JSON.stringify(vectorDB), 'utf8')
    
    console.log(`Vektordatenbank erfolgreich erstellt: ${outputPath}`)
    console.log(`Anzahl der Textabschnitte in der Datenbank: ${vectorDB.length}`)
    
  } catch (error) {
    console.error('Fehler bei der Generierung der Vektordatenbank:', error)
  }
}

// Führe die Hauptfunktion aus
generateVectorDatabase()
