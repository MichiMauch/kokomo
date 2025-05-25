// Prüfe die richtige Syntax für db.execute
import { db } from './db'

async function checkExecute() {
  try {
    // Beispiel für eine einfache Abfrage
    const result = await db.execute('SELECT 1')
    console.log('Ergebnis:', result)

    // Beispiel mit Parametern
    const result2 = await db.execute('SELECT ? as test', [123])
    console.log('Ergebnis 2:', result2)

    // Test mit einem Objekt
    const result3 = await db.execute({
      sql: 'SELECT ? as test',
      args: [456],
    })
    console.log('Ergebnis 3:', result3)
  } catch (error) {
    console.error('Fehler:', error)
  }
}
