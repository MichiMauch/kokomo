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
  findSimilarPosts,
} from '@/lib/agentkit-utils'

// Force Node.js runtime for file system operations
export const runtime = 'nodejs'
export const maxDuration = 60

const POSTS_DIR = path.join(process.cwd(), 'data/tiny-house')

// Initialize OpenAI client for content generation
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Tool: Check if a post exists for a given topic in data/tiny-house/
 */
const checkDraftTool = tool({
  name: 'check_post',
  description:
    'Check if a blog post MDX file exists for a given topic in data/tiny-house/. Returns exact matches and similar posts.',
  parameters: z.object({
    topic: z.string().describe('The topic to check for'),
  }),
  execute: async ({ topic }: { topic: string }) => {
    const slug = slugify(topic)

    // Check for exact match first
    const exactMatch = draftExists(slug, POSTS_DIR)

    if (exactMatch) {
      const filePath = getDraftPath(slug, POSTS_DIR)
      return {
        exactMatch: true,
        slug,
        path: filePath,
        similarPosts: [],
        message: `Exact match found at: ${filePath}`,
      }
    }

    // Find similar posts using fuzzy matching
    const similarPosts = findSimilarPosts(slug, POSTS_DIR, 0.6)

    if (similarPosts.length > 0) {
      const topMatches = similarPosts.slice(0, 5).map((post) => ({
        filename: post.filename,
        slug: post.slug,
        similarity: Math.round(post.similarity * 100),
        path: post.path,
      }))

      return {
        exactMatch: false,
        slug,
        similarPosts: topMatches,
        message: `No exact match found for "${topic}", but ${similarPosts.length} similar post(s) found. Top matches: ${topMatches.map((p) => `${p.filename} (${p.similarity}% similar)`).join(', ')}`,
      }
    }

    return {
      exactMatch: false,
      slug,
      similarPosts: [],
      message: `No posts found for topic "${topic}" (no exact or similar matches)`,
    }
  },
})

/**
 * Tool: Summarize an existing post
 */
const summarizeDraftTool = tool({
  name: 'summarize_post',
  description: 'Read and summarize an existing blog post MDX file',
  parameters: z.object({
    path: z.string().describe('The file path to the post'),
  }),
  execute: async ({ path: filePath }: { path: string }) => {
    try {
      const { frontmatter, content } = readMdxFile(filePath)
      const preview = getFirstParagraph(content)

      return {
        success: true,
        frontmatter,
        preview,
        message: `Post summary retrieved successfully`,
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to read post: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  },
})

/**
 * Tool: Create a new draft MDX file with AI-generated content in data/tiny-house/
 */
const createDraftTool = tool({
  name: 'create_draft',
  description:
    'Create a new draft blog post with AI-generated content in data/tiny-house/ (with draft: true)',
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
    const filePath = getDraftPath(slug, POSTS_DIR)

    // Check if post already exists
    if (draftExists(slug, POSTS_DIR)) {
      return {
        success: false,
        message: `Post already exists at: ${filePath}`,
        path: filePath,
      }
    }

    // Ensure posts directory exists
    ensureDir(POSTS_DIR)

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

      // Generate frontmatter with draft: true
      const frontmatter = generateFrontmatter({
        title: topic,
        summary: summary || '',
        tags: tags || [],
        authors: ['default'],
      })

      const content = `${frontmatter}
${generatedContent}
`

      // Write file to data/tiny-house/
      fs.writeFileSync(filePath, content, 'utf-8')

      return {
        success: true,
        message: `Draft with AI-generated content created successfully at: ${filePath} (draft: true)`,
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
      name: 'blog-post-agent',
      instructions: `You are a helpful assistant that manages blog posts for the KOKOMO Tiny House blog.

Your tasks:
1. Check if a blog post exists for the given topic in data/tiny-house/
2. If an EXACT match exists, provide a summary with frontmatter details
3. If SIMILAR posts exist (similarity >= 60%), inform the user about them and ask if they want to:
   - Use one of the existing similar posts instead
   - Create a new draft anyway (only if the topic is truly different)
4. If NO posts exist (no exact or similar matches), create a new draft post with draft: true in data/tiny-house/

IMPORTANT RULES:
- Do NOT create a new draft if similar posts exist (>= 60% similarity) without first informing the user
- When similar posts are found, list them with their similarity scores and suggest the user review them
- Only create new drafts when there are truly no related posts, or when the user explicitly confirms despite similar posts existing
- New posts are created directly in data/tiny-house/ (not in a drafts subfolder) with draft: true in frontmatter

Always be helpful and provide clear feedback about what you did.`,
      model: 'gpt-4',
      tools: [checkDraftTool, summarizeDraftTool, createDraftTool],
    })

    // Execute agent with the topic
    const result = await run(
      agent,
      `Check if a blog post exists for the topic: "${topic}" in data/tiny-house/. If it exists, summarize it. If not, create a new draft post with draft: true.`
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
