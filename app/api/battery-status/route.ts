import { NextResponse } from 'next/server'
import axios from 'axios'
import getVictronToken from '../../../lib/victronAuth'

// Vereinfachte getToken-Funktion, die unsere neue Implementierung aus lib/victronAuth verwendet
async function getToken() {
  try {
    return await getVictronToken()
  } catch (error) {
    console.error('Fehler bei der Token-Authentifizierung:', error)
    throw new Error('Authentifizierung fehlgeschlagen')
  }
}

export async function GET() {
  try {
    console.log('Battery Status API aufgerufen')

    // Token abrufen
    let accessToken
    try {
      accessToken = await getToken()
    } catch (error) {
      console.error('Token-Fehler:', error)
      // Bei Fehler direkt mit dem zufälligen Wert antworten
      const randomCharge = Math.floor(Math.random() * (95 - 75 + 1)) + 75
      return NextResponse.json({
        batteryCharge: randomCharge,
        source: 'random-fallback',
        timestamp: new Date().toISOString(),
      })
    }

    console.log('Token erhalten, rufe Batteriestatus ab...')
    const config = {
      headers: {
        'x-authorization': `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }

    // Direkt die Statistiken der Installation abrufen mit bekannter ID
    // Diese ID wurde aus dem solar-dashboard-Projekt übernommen
    const installationId = '193415' // Die ID Ihrer Victron-Installation
    console.log(`Verwende feste Installations-ID: ${installationId}`)

    // Gemäß API-Dokumentation
    // GET /installations/{idSite}/stats - Installation statistics
    const response = await axios.get(
      `https://vrmapi.victronenergy.com/v2/installations/${installationId}/stats`,
      {
        ...config,
        params: {
          interval: '15mins',
          type: 'live_feed',
          // Spezifische Zeitparameter können hier hinzugefügt werden, falls nötig
          // start: Math.floor(Date.now() / 1000) - 86400, // Letzten Tag abfragen (optional)
        },
      }
    )

    console.log('Batteriestatus erhalten:', {
      status: response.status,
      hasData: !!response.data,
      hasRecords: !!response.data?.records,
      hasBatteryStatus: !!response.data?.records?.bs,
      batteryStatusLength: response.data?.records?.bs?.length || 0,
      recordsFormat: JSON.stringify(response.data?.records).slice(0, 200) + '...', // Beispiel des Formats anzeigen
    })

    // Wir extrahieren nur die relevanten Batteriedaten
    const data = response.data
    let batteryCharge = null

    // Loggen wir die genaue Struktur der Daten
    console.log('Vollständige Datenstruktur:', JSON.stringify(data).slice(0, 500) + '...')

    if (data.records?.bs && data.records.bs.length > 0) {
      const lastBatteryEntry = data.records.bs[data.records.bs.length - 1]
      console.log('Letzter Batterieeintrag:', lastBatteryEntry)

      // Im solar-dashboard ist es das zweite Element (index 1)
      // Aus der BatteryDisplay.tsx von solar-dashboard: lastBatteryEntry[1]
      batteryCharge =
        lastBatteryEntry && Array.isArray(lastBatteryEntry) && lastBatteryEntry.length > 1
          ? lastBatteryEntry[1]
          : null
      console.log('Extrahierter Batterieladezustand:', batteryCharge)
    } else {
      console.log('Keine Batteriestatus-Daten gefunden in:', data.records)
    }

    // Nicht-numerische Werte erkennen
    if (batteryCharge === null || isNaN(Number(batteryCharge))) {
      console.log('Batterieladezustand ist ungültig:', batteryCharge)
      // Fallback auf letzten bekannten Wert oder Standard
      return NextResponse.json({
        batteryCharge: 85, // Fallback-Wert
        source: 'victron-api-fallback',
        reason: 'Ungültiger Ladezustand in API-Antwort',
        timestamp: new Date().toISOString(),
      })
    }

    // Nur den extrahierten Batterieladezustand zurückgeben
    console.log('Sende Antwort mit Batterieladezustand:', batteryCharge)
    return NextResponse.json({
      batteryCharge: Number(batteryCharge), // Sicherstellen, dass es eine Zahl ist
      source: 'victron-api',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Fehler beim Abrufen der Batteriedaten:', error.response?.data || error.message)
    // Festen Fallback-Wert verwenden statt zufällig (vermeidet Hydration-Probleme)
    return NextResponse.json({
      batteryCharge: 85,
      source: 'error-fallback',
      timestamp: new Date().toISOString(),
      error: error.message || 'Unbekannter Fehler',
    })
  }
}
