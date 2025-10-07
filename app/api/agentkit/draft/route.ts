import { NextResponse } from 'next/server'
import { Agent, tool, run } from '@openai/agents'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'
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
 * Tool: Create a new draft MDX file
 */
const createDraftTool = tool({
  name: 'create_draft',
  description: 'Create a new draft MDX file with frontmatter',
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

    // Generate frontmatter and content
    const frontmatter = generateFrontmatter({
      title: topic,
      summary: summary || '',
      tags: tags || [],
      authors: ['Michi'],
    })

    const content = `${frontmatter}
# ${topic}

${summary || 'Fügen Sie hier den Inhalt Ihres Blogposts hinzu...'}

## Weitere Abschnitte

Hier können Sie weitere Inhalte ergänzen.
`

    // Write file
    try {
      fs.writeFileSync(filePath, content, 'utf-8')
      return {
        success: true,
        message: `Draft created successfully at: ${filePath}`,
        path: filePath,
        slug,
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
