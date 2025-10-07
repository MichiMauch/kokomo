import { slug } from 'github-slugger'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

/**
 * Generate a URL-safe slug from a topic string
 */
export function slugify(topic: string): string {
  return slug(topic)
}

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
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Calculate similarity score between two strings (0-1, higher is more similar)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length)
  if (maxLength === 0) return 1.0
  const distance = levenshteinDistance(str1, str2)
  return 1 - distance / maxLength
}

/**
 * Find similar posts in the posts directory
 */
export function findSimilarPosts(
  searchSlug: string,
  postsDir: string,
  similarityThreshold: number = 0.6
): Array<{ slug: string; filename: string; similarity: number; path: string }> {
  if (!fs.existsSync(postsDir)) {
    return []
  }

  const files = fs
    .readdirSync(postsDir)
    .filter((file) => file.endsWith('.mdx'))
    .map((filename) => {
      const fileSlug = filename.replace('.mdx', '')

      // Check if search slug is contained in the filename
      const containsMatch = fileSlug.includes(searchSlug) || searchSlug.includes(fileSlug)

      // Calculate similarity score
      const similarity = calculateSimilarity(searchSlug, fileSlug)

      // Boost similarity if one contains the other
      const finalSimilarity = containsMatch ? Math.max(similarity, 0.75) : similarity

      return {
        slug: fileSlug,
        filename,
        similarity: finalSimilarity,
        path: path.join(postsDir, filename),
      }
    })
    .filter((file) => file.similarity >= similarityThreshold)
    .sort((a, b) => b.similarity - a.similarity)

  return files
}
