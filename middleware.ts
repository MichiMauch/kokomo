import { type NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const basicAuth = request.headers.get('authorization')
  const url = request.nextUrl

  if (url.pathname.startsWith('/admin')) {
    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1]
      const [user, pwd] = atob(authValue).split(':')

      if (user === process.env.ADMIN_USER && pwd === process.env.ADMIN_PASSWORD) {
        // Authentifizierung erfolgreich - leite weiter ohne das Layout zu beeinflussen
        return NextResponse.next()
      }
    }

    // Authentifizierung fehlgeschlagen - zeige Auth-Dialog
    return new NextResponse('Authentifizierung benötigt', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin-Bereich"',
      },
    })
  }

  // Für alle anderen Pfade - normal weiterleiten
  return NextResponse.next()
}

// Konfiguriere, für welche Pfade die Middleware ausgeführt werden soll
export const config = {
  matcher: ['/admin/:path*'],
}
