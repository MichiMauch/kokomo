// Debug-Endpunkt zum Testen der Victron-API
import { NextResponse } from 'next/server'
import axios from 'axios'
import getVictronToken from '../../../lib/victronAuth'

// HTTP-Methode muss explizit exportiert werden

export async function GET() {
  try {
    console.log('Debug API für Victron aufgerufen')

    // Token abrufen
    let accessToken
    try {
      accessToken = await getVictronToken()
    } catch (error) {
      console.error('Token-Fehler:', error)
      return NextResponse.json(
        {
          error: 'Authentifizierung fehlgeschlagen',
          message: error instanceof Error ? error.message : 'Unbekannter Fehler',
        },
        { status: 500 }
      )
    }

    console.log('Debug-Token erhalten:', accessToken.substring(0, 10) + '...')
    const config = {
      headers: {
        'x-authorization': `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }

    // Verfügbare Installationen abfragen
    const installationsResponse = await axios.get(
      'https://vrmapi.victronenergy.com/v2/installations',
      config
    )

    console.log('Verfügbare Installationen:', JSON.stringify(installationsResponse.data))

    // Informationen zurückgeben
    return NextResponse.json({
      success: true,
      message: 'API-Zugriff erfolgreich',
      installations: installationsResponse.data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
    const errorData =
      error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: unknown } }).response?.data
        : undefined
    console.error('Fehler bei der Debug-API:', errorData || errorMessage)
    return NextResponse.json(
      {
        success: false,
        error: 'API-Fehler',
        message: errorMessage,
        responseData: errorData,
      },
      { status: 500 }
    )
  }
}
