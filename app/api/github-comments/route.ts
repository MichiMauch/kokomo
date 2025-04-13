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
  const { issue_number, message, parent_id } = await req.json()

  const finalMessage = parent_id ? `${message}\n\nparent_id: ${parent_id}` : message

  const res = await fetch(
    `${GITHUB_API}/repos/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/issues/${issue_number}/comments`,
    {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body: finalMessage }),
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Antwort konnte nicht erstellt werden' }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const { comment_id, body } = await req.json()

  const res = await fetch(
    `${GITHUB_API}/repos/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/issues/comments/${comment_id}`,
    {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Kommentar konnte nicht bearbeitet werden' }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { comment_id } = await req.json()

  const res = await fetch(
    `${GITHUB_API}/repos/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/issues/comments/${comment_id}`,
    {
      method: 'DELETE',
      headers,
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Kommentar konnte nicht gelöscht werden' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
