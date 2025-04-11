import { NextRequest, NextResponse } from 'next/server'

const GITHUB_API = 'https://api.github.com'
const headers = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
}

export async function GET() {
  const res = await fetch(
    `${GITHUB_API}/repos/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/issues/comments`,
    { headers }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Fehler beim Laden der Kommentare' }, { status: 500 })
  }

  const comments = await res.json()
  return NextResponse.json(comments)
}

export async function POST(req: NextRequest) {
  const { issue_number, message } = await req.json()

  const res = await fetch(
    `${GITHUB_API}/repos/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/issues/${issue_number}/comments`,
    {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body: message }),
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Antwort konnte nicht erstellt werden' }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
