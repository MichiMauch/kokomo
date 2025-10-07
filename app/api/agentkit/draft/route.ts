import { NextResponse } from 'next/server'
import { Agent, tool, run } from '@openai/agents'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'
import OpenAI from 'openai'
import {
  slugify,
  ensureDir,
  generateFrontmatter,
  draftExists,
  getDraftPath,
  readMdxFile,
  getFirstParagraph,
} from '@/lib/agentkit-utils'

// Force Node.js runtime for file system operations
export const runtime = 'nodejs'
export const maxDuration = 60

const DRAFTS_DIR = path.join(process.cwd(), 'data/tiny-house/drafts')

// Initialize OpenAI client for content generation
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Tool: Check if a draft exists for a given topic
 */
const checkDraftTool = tool({
  name: 'check_draft',
  description: 'Check if a draft MDX file exists for a given topic',
  parameters: z.object({
    topic: z.string().describe('The topic to check for'),
  }),
  execute: async ({ topic }: { topic: string }) => {
    const slug = slugify(topic)
    const exists = draftExists(slug, DRAFTS_DIR)

    if (exists) {
      const filePath = getDraftPath(slug, DRAFTS_DIR)
      return {
        exists: true,
        slug,
        path: filePath,
        message: `Draft exists at: ${filePath}`,
      }
    }

    return {
      exists: false,
      slug,
      message: `No draft found for topic "${topic}"`,
    }
  },
})

/**
 * Tool: Summarize an existing draft
 */
const summarizeDraftTool = tool({
  name: 'summarize_draft',
  description: 'Read and summarize an existing draft MDX file',
  parameters: z.object({
    path: z.string().describe('The file path to the draft'),
  }),
  execute: async ({ path: filePath }: { path: string }) => {
    try {
      const { frontmatter, content } = readMdxFile(filePath)
      const preview = getFirstParagraph(content)

      return {
        success: true,
        frontmatter,
        preview,
        message: `Draft summary retrieved successfully`,
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to read draft: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  },
})

/**
 * Tool: Create a new draft MDX file with AI-generated content
 */
const createDraftTool = tool({
  name: 'create_draft',
  description:
    'Create a new draft MDX file with AI-generated blog post content about Tiny House living',
  parameters: z.object({
    topic: z.string().describe('The topic/title of the draft'),
    summary: z.string().nullable().optional().describe('Optional summary of the draft'),
    tags: z.array(z.string()).nullable().optional().describe('Optional tags for the draft'),
  }),
  execute: async ({
    topic,
    summary = '',
    tags = [],
  }: {
    topic: string
    summary?: string | null
    tags?: string[] | null
  }) => {
    const slug = slugify(topic)
    const filePath = getDraftPath(slug, DRAFTS_DIR)

    // Check if draft already exists
    if (draftExists(slug, DRAFTS_DIR)) {
      return {
        success: false,
        message: `Draft already exists at: ${filePath}`,
        path: filePath,
      }
    }

    // Ensure drafts directory exists
    ensureDir(DRAFTS_DIR)

    try {
      // Generate blog post content with GPT-4
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Du bist ein erfahrener Tiny-House-Blogger, der für das KOKOMO Tiny House Blog schreibt.
Du schreibst authentische, persönliche Blogposts aus der Ich-Perspektive (wir/unser Tiny House).
Der Blog dokumentiert das Leben in einem autarken Tiny House (Wohnwagon) in der Schweiz.

Schreibe einen vollständigen, strukturierten Blogpost mit:
- Einer einleitenden persönlichen Anekdote oder Erfahrung
- 3-5 Hauptabschnitten mit aussagekräftigen Zwischenüberschriften (##)
- Praktischen Tipps und konkreten Erfahrungen
- Einer persönlichen Zusammenfassung am Ende
- Nutze eine freundliche, nahbare Sprache
- Verwende "wir" statt "ich"
- Integriere konkrete Zahlen und Details wo passend
- Formatierung: Markdown, keine HTML-Tags`,
          },
          {
            role: 'user',
            content: `Schreibe einen Blogpost zum Thema: "${topic}"${summary ? `\n\nKurzbeschreibung: ${summary}` : ''}

Der Post sollte ca. 800-1200 Wörter haben und unsere praktischen Erfahrungen im KOKOMO Tiny House widerspiegeln.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2500,
      })

      const generatedContent = completion.choices[0]?.message?.content || ''

      // Generate frontmatter
      const frontmatter = generateFrontmatter({
        title: topic,
        summary: summary || '',
        tags: tags || [],
        authors: ['Michi'],
      })

      const content = `${frontmatter}
${generatedContent}
`

      // Write file
      fs.writeFileSync(filePath, content, 'utf-8')

      return {
        success: true,
        message: `Draft with AI-generated content created successfully at: ${filePath}`,
        path: filePath,
        slug,
        wordCount: generatedContent.split(/\s+/).length,
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to create draft: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  },
})

/**
 * POST /api/agentkit/draft
 * Main API handler for draft operations
 */
export async function POST(req: Request) {
  try {
    const { topic } = await req.json()

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    // Check for API key (AgentKit uses OPENAI_API_KEY from environment)
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
    }

    // Optional: Check if AgentKit is enabled
    if (process.env.AGENTKIT_ENABLED === 'false') {
      return NextResponse.json({ error: 'AgentKit is disabled' }, { status: 403 })
    }

    // Initialize agent (uses OPENAI_API_KEY from environment)
    const agent = new Agent({
      name: 'draft-agent',
      instructions: `You are a helpful assistant that manages draft blog posts for a Tiny House blog.

Your tasks:
1. Check if a draft exists for the given topic
2. If it exists, provide a summary
3. If it doesn't exist, create a new draft with appropriate frontmatter

Always be helpful and provide clear feedback about what you did.`,
      model: 'gpt-4',
      tools: [checkDraftTool, summarizeDraftTool, createDraftTool],
    })

    // Execute agent with the topic
    const result = await run(
      agent,
      `Check if a draft exists for the topic: "${topic}". If it exists, summarize it. If not, create a new draft.`
    )

    // Extract the agent's response from the final output
    const agentOutput = result.finalOutput || 'No response'

    return NextResponse.json({
      success: true,
      agent_output: agentOutput,
    })
  } catch (error) {
    console.error('❌ AgentKit Draft API Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
