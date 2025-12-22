import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { slugify } from './slugify'

// Re-export slugify for backwards compatibility
export { slugify }

/**
 * Ensure a directory exists, creating it if necessary
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

/**
 * Generate MDX frontmatter for a draft post
 */
export function generateFrontmatter(data: {
  title: string
  summary?: string
  tags?: string[]
  authors?: string[]
}): string {
  const { title, summary = '', tags = [], authors = ['default'] } = data
  const date = new Date().toISOString().split('T')[0]

  return `---
title: '${title}'
date: '${date}'
tags: [${tags.map((tag) => `'${tag}'`).join(', ')}]
authors: [${authors.map((author) => `'${author}'`).join(', ')}]
summary: '${summary}'
draft: true
images: ''
type: 'Blog'
---

`
}

/**
 * Read and parse frontmatter from an MDX file
 */
export function readMdxFile(filePath: string): {
  frontmatter: Record<string, unknown>
  content: string
} {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(fileContent)
  return { frontmatter: data, content }
}

/**
 * Get the first paragraph of content (for preview)
 */
export function getFirstParagraph(content: string): string {
  const paragraphs = content.trim().split('\n\n')
  return paragraphs[0] || ''
}

/**
 * Check if a draft file exists
 */
export function draftExists(slug: string, draftsDir: string): boolean {
  const filePath = path.join(draftsDir, `${slug}.mdx`)
  return fs.existsSync(filePath)
}

/**
 * Get the full path for a draft file
 */
export function getDraftPath(slug: string, draftsDir: string): string {
  return path.join(draftsDir, `${slug}.mdx`)
}

/**
 * List all blog posts in the posts directory with their metadata
 */
export function listAllPosts(postsDir: string): Array<{
  filename: string
  slug: string
  title: string
  summary: string
  tags: string[]
  draft: boolean
  path: string
}> {
  if (!fs.existsSync(postsDir)) {
    return []
  }

  const files = fs
    .readdirSync(postsDir)
    .filter((file) => file.endsWith('.mdx'))
    .map((filename) => {
      const filePath = path.join(postsDir, filename)
      const fileSlug = filename.replace('.mdx', '')

      try {
        const { frontmatter } = readMdxFile(filePath)

        return {
          filename,
          slug: fileSlug,
          title: (frontmatter.title as string) || '',
          summary: (frontmatter.summary as string) || '',
          tags: (frontmatter.tags as string[]) || [],
          draft: (frontmatter.draft as boolean) || false,
          path: filePath,
        }
      } catch {
        // If frontmatter reading fails, return basic info
        return {
          filename,
          slug: fileSlug,
          title: fileSlug,
          summary: '',
          tags: [],
          draft: false,
          path: filePath,
        }
      }
    })

  return files
}
