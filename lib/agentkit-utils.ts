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
