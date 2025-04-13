// app/api/github-user/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch GitHub user' }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json({
    name: data.name,
    email: data.email ?? 'michi@kokomo.house', // fallback falls E-Mail nicht öffentlich
  })
}
