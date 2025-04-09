import { NextRequest, NextResponse } from 'next/server'
import matter from 'gray-matter'

interface GitHubFile {
  type: string
  name: string
  path: string
  sha: string
  download_url: string
  [key: string]: unknown
}

interface FileWithMeta {
  name: string
  path: string
  sha: string
  download_url: string
  date: string | null
  title: string
}

export async function GET() {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_REPO_OWNER
  const repo = process.env.GITHUB_REPO_NAME
  const path = process.env.GITHUB_PATH

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`

  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Fehler beim Laden der Posts' }, { status: 500 })
  }

  const data = await res.json()

  const mdxFiles = data.filter(
    (item: GitHubFile) => item.type === 'file' && item.name.endsWith('.mdx')
  )

  const filesWithMeta = await Promise.all(
    mdxFiles.map(async (item: GitHubFile): Promise<FileWithMeta | null> => {
      try {
        const contentRes = await fetch(item.download_url)
        const text = await contentRes.text()
        const { data: frontmatter } = matter(text)
        return {
          name: item.name,
          path: item.path,
          sha: item.sha,
          download_url: item.download_url,
          date: frontmatter.date || null,
          title: frontmatter.title || item.name.replace(/\.mdx$/, ''),
        }
      } catch {
        return null
      }
    })
  )

  const validFiles = filesWithMeta.filter(Boolean).sort((a: FileWithMeta, b: FileWithMeta) => {
    const dateA = new Date(a.date || '1970-01-01').getTime()
    const dateB = new Date(b.date || '1970-01-01').getTime()
    return dateB - dateA
  })

  return NextResponse.json({ files: validFiles })
}
