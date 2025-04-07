import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const basicAuth = request.headers.get('authorization')

  const url = request.nextUrl

  if (url.pathname.startsWith('/admin')) {
    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1]
      const [user, pwd] = atob(authValue).split(':')

      if (user === process.env.ADMIN_USER && pwd === process.env.ADMIN_PASSWORD) {
        return NextResponse.next()
      }
    }

    return new NextResponse('Authentifizierung benötigt', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin-Bereich"',
      },
    })
  }

  return NextResponse.next()
}
