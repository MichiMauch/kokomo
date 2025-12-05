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
  listAllPosts,
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
 * Tool: List all blog posts in data/tiny-house/
 */
const listPostsTool = tool({
  name: 'list_all_posts',
  description:
    'List all blog posts in data/tiny-house/ with their titles, summaries, tags, and draft status. Use this to find existing posts related to a topic.',
  parameters: z.object({}),
  execute: async () => {
    const posts = listAllPosts(POSTS_DIR)

    return {
      total: posts.length,
      posts: posts.map((post) => ({
        filename: post.filename,
        title: post.title,
        summary: post.summary,
        tags: post.tags,
        draft: post.draft,
        path: post.path,
      })),
      message: `Found ${posts.length} blog posts in data/tiny-house/`,
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

Your workflow:
1. FIRST: Use list_all_posts to get ALL existing blog posts with their titles, summaries, and tags
2. ANALYZE: Compare the user's topic with all existing post titles and summaries
3. DECIDE: Determine if any existing post is similar enough to the requested topic
   - Consider semantic similarity, not just exact word matches
   - "Wasser auffangen" is similar to "Wasser auffangen, Natur bewahren"
   - Posts with overlapping keywords/concepts are likely related
4. IF SIMILAR POST EXISTS:
   - Use summarize_post to get details about the similar post
   - Inform the user that a similar post already exists
   - Provide the post title, summary, and path
   - Do NOT create a new draft
5. IF NO SIMILAR POST EXISTS:
   - Create a new draft post with draft: true using create_draft

Important rules:
- ALWAYS list all posts first before deciding
- Use your AI intelligence to detect semantic similarity
- Be conservative: if unsure, show the user existing posts rather than creating duplicates
- New posts are created directly in data/tiny-house/ with draft: true in frontmatter

Always be helpful and provide clear feedback about what you did.`,
      model: 'gpt-4',
      tools: [listPostsTool, summarizeDraftTool, createDraftTool],
    })

    // Execute agent with the topic
    const result = await run(
      agent,
      `The user wants to create a blog post about: "${topic}".

First, list all existing posts and check if any are similar to this topic.
If you find a similar post, tell the user about it and do NOT create a new draft.
If no similar posts exist, create a new draft with draft: true.`
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
