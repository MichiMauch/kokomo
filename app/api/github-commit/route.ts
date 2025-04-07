import { NextResponse } from 'next/server'

export async function GET() {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_REPO_OWNER
  const repo = process.env.GITHUB_REPO_NAME

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/main`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Fehler beim Laden des Commits' }, { status: 500 })
  }

  const commit = await res.json()
  return NextResponse.json(commit)
}
