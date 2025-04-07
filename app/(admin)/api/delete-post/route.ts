import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_REPO_OWNER
  const repo = process.env.GITHUB_REPO_NAME
  const branch = process.env.GITHUB_BRANCH || 'main'

  const { path, sha, message } = await req.json()

  if (!path || !sha) {
    return NextResponse.json({ error: 'Pfad oder SHA fehlt' }, { status: 400 })
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'DELETE',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: message || `🗑️ Datei gelöscht: ${path}`,
      sha,
      branch,
    }),
  })

  if (!res.ok) {
    const error = await res.json()
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
