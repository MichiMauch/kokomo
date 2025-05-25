/**
 * Hilfsfunktionen für API-Aufrufe
 */

/**
 * Fügt eine Verzögerung zwischen API-Aufrufen ein, um Rate-Limiting zu vermeiden
 * @param ms Zeit in Millisekunden
 * @returns Promise, das nach der angegebenen Zeit resolvet
 */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Führt eine Funktion mit Verzögerung aus
 * @param fn Die auszuführende Funktion
 * @param delayMs Verzögerung in Millisekunden
 * @returns Ergebnis der Funktion
 */
export async function withDelay<T>(fn: () => Promise<T>, delayMs: number = 1000): Promise<T> {
  await delay(delayMs)
  return fn()
}

/**
 * Führt eine Funktion mit Wiederholungsversuchen aus
 * @param fn Die auszuführende Funktion
 * @param maxRetries Maximale Anzahl an Wiederholungsversuchen
 * @param delayMs Verzögerung zwischen den Versuchen in Millisekunden
 * @returns Ergebnis der Funktion oder Error bei Fehlschlag
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 2000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Bei Wiederholungsversuchen warten wir länger
      if (attempt > 0) {
        const backoffTime = delayMs * Math.pow(2, attempt - 1)
        console.log(`Wiederholungsversuch ${attempt + 1}/${maxRetries} nach ${backoffTime}ms...`)
        await delay(backoffTime)
      }

      return await fn()
    } catch (error) {
      lastError = error as Error
      console.warn(`Fehler bei Versuch ${attempt + 1}/${maxRetries}:`, error)
    }
  }

  throw lastError!
}
