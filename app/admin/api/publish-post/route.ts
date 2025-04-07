import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { path, content, message } = await req.json()

  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_REPO_OWNER
  const repo = process.env.GITHUB_REPO_NAME
  const branch = process.env.GITHUB_BRANCH || 'main'

  const fullPath = `${process.env.GITHUB_PATH}/${path}`

  const getShaRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${fullPath}`,
    { headers: { Authorization: `token ${token}` } }
  )

  let sha: string | undefined = undefined
  if (getShaRes.status === 200) {
    const shaData = await getShaRes.json()
    sha = shaData.sha
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${fullPath}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: message || `📝 neuer Blogpost: ${path}`,
      content: Buffer.from(content).toString('base64'),
      branch,
      ...(sha && { sha }),
    }),
  })

  const data = await res.json()
  return NextResponse.json(data)
}
