// Victron-Authentifizierung für kokomo2-Projekt
// Basierend auf der offiziellen API-Dokumentation: https://vrm-api-docs.victronenergy.com/#/operations/auth/login
import axios from 'axios'

const VICTRON_LOGIN_URL = 'https://vrmapi.victronenergy.com/v2/auth/login'
const DEFAULT_EXPIRES_IN = 24 * 60 * 60 // Standardmäßig 24 Stunden

// Korrekte Anmeldedaten für die Victron API
// WICHTIG: Diese sollten in einer Produktionsumgebung durch Umgebungsvariablen ersetzt werden
const VICTRON_USERNAME = 'michi.mauch@gmail.com'
const VICTRON_PASSWORD = 'cgv9ZEC6unc*ftb4wzh'

async function getVictronToken() {
  try {
    console.log('Starte Victron-Token-Generierung gemäß API-Dokumentation...')

    // Anmeldedaten entweder aus Umgebungsvariablen oder Fallback-Werten
    const username = process.env.VICTRON_USERNAME || VICTRON_USERNAME
    const password = process.env.VICTRON_PASSWORD || VICTRON_PASSWORD

    console.log('Authentifizierung mit:', {
      username: username ? username.substring(0, 3) + '...' : 'nicht verfügbar',
    })

    // Entsprechend der API-Dokumentation
    // POST /auth/login mit JSON-Body
    console.log('Sende Login-Anfrage mit:', {
      username: username.substring(0, 3) + '...',
      passwordLength: password ? password.length : 0,
      loginUrl: VICTRON_LOGIN_URL,
    })

    const response = await axios.post(
      VICTRON_LOGIN_URL,
      {
        username,
        password,
        remember_me: true, // Wichtig: Längere Token-Gültigkeit
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    )

    if (response.status !== 200) {
      console.error('Fehlerhafte Antwort von Victron API:', response.status)
      throw new Error('Fehler bei der Victron-API-Anfrage')
    }

    console.log('API-Antwortformat:', {
      hasData: !!response.data,
      status: response.status,
      hasToken: !!response.data?.token,
      hasIdUser: !!response.data?.idUser,
    })

    // Laut API-Dokumentation enthält die Antwort ein token-Feld
    const token = response.data.token
    if (!token) {
      console.error('Kein Token in der Antwort gefunden:', response.data)
      throw new Error('Kein Token in der API-Antwort')
    }

    console.log('Token erfolgreich generiert')
    return token
  } catch (error) {
    console.error('Fehler beim Abrufen des Victron-Tokens:', error.response?.data || error.message)
    throw error
  }
}

export default getVictronToken
