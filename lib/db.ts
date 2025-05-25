// lib/db.ts
import { createClient } from '@libsql/client'

// Erstelle einen Client für die Turso-Datenbank mit Umgebungsvariablen
export const db = createClient({
  url: process.env.TURSO_DB_URL as string,
  authToken: process.env.TURSO_DB_TOKEN as string,
})

// Typdefinition für einen Midjourney-Prompt in der Datenbank
export type SavedMidjourneyPrompt = {
  id?: number
  prompt_text: string
  scene?: string
  location?: string
  time_of_day?: string
  atmosphere?: string
  mood?: string
  style?: string
  extra_details?: string
  custom_prompt?: string
  version: string
  style_setting: string
  aspect_ratio: string
  quality: string
  stylize: string
  created_at?: number
  image_url?: string
  labels?: string
  is_favorite?: boolean
}

// Typ für valide Datenbankparameter, die nicht undefined sein dürfen
type DbParam = string | number | boolean | null

// Hilfsfunktion zum Konvertieren von BigInt-Werten
function convertBigIntProps<T>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const key in obj) {
    if (typeof obj[key] === 'bigint') {
      result[key] = Number(obj[key])
    } else {
      result[key] = obj[key]
    }
  }
  return result as T
}

/**
 * Speichert einen Midjourney-Prompt in der Datenbank
 */
export async function saveMidjourneyPrompt(
  promptData: SavedMidjourneyPrompt
): Promise<{ success: boolean; id: number | null }> {
  try {
    const sql = `INSERT INTO midjourney_prompts (
      prompt_text, scene, location, time_of_day, atmosphere, mood, style, 
      extra_details, custom_prompt, version, style_setting, aspect_ratio, 
      quality, stylize, image_url, labels, is_favorite
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

    const args: DbParam[] = [
      promptData.prompt_text,
      promptData.scene || null,
      promptData.location || null,
      promptData.time_of_day || null,
      promptData.atmosphere || null,
      promptData.mood || null,
      promptData.style || null,
      promptData.extra_details || null,
      promptData.custom_prompt || null,
      promptData.version,
      promptData.style_setting,
      promptData.aspect_ratio,
      promptData.quality,
      promptData.stylize,
      promptData.image_url || null,
      promptData.labels || null,
      promptData.is_favorite ? 1 : 0,
    ]

    const result = await db.execute(sql, args)

    return {
      success: true,
      id: result.lastInsertRowid ? Number(result.lastInsertRowid) : null,
    }
  } catch (error: unknown) {
    console.error('Fehler beim Speichern des Prompts:', error)
    throw error
  }
}

/**
 * Lädt alle gespeicherten Midjourney-Prompts aus der Datenbank
 */
export async function getAllMidjourneyPrompts(): Promise<SavedMidjourneyPrompt[]> {
  try {
    const sql = `SELECT * FROM midjourney_prompts ORDER BY created_at DESC`
    const result = await db.execute(sql)

    // BigInt-Werte in reguläre Zahlen konvertieren, da JSON keine BigInt unterstützt
    return result.rows.map((row) =>
      convertBigIntProps<SavedMidjourneyPrompt>(row as Record<string, unknown>)
    )
  } catch (error: unknown) {
    console.error('Fehler beim Laden der Prompts:', error)
    throw error
  }
}

/**
 * Lädt einen einzelnen Midjourney-Prompt anhand der ID
 */
export async function getMidjourneyPromptById(id: number): Promise<SavedMidjourneyPrompt | null> {
  try {
    const sql = `SELECT * FROM midjourney_prompts WHERE id = ?`
    const result = await db.execute(sql, [id])

    if (result.rows.length === 0) {
      return null
    }

    // BigInt-Werte in reguläre Zahlen konvertieren
    return convertBigIntProps<SavedMidjourneyPrompt>(result.rows[0] as Record<string, unknown>)
  } catch (error: unknown) {
    console.error(`Fehler beim Laden des Prompts mit ID ${id}:`, error)
    throw error
  }
}

/**
 * Aktualisiert einen Midjourney-Prompt
 */
export async function updateMidjourneyPrompt(
  id: number,
  promptData: Partial<SavedMidjourneyPrompt>
): Promise<{ success: boolean }> {
  try {
    // Erstelle dynamisches SQL basierend auf den zu aktualisierenden Feldern
    const fields = Object.keys(promptData).filter((key) => key !== 'id')
    if (fields.length === 0) {
      return { success: true } // Nichts zu aktualisieren
    }

    const setClause = fields.map((field) => `${field} = ?`).join(', ')
    const values: DbParam[] = fields.map((field) => {
      const value = promptData[field as keyof SavedMidjourneyPrompt]
      return value === undefined ? null : value
    })

    // Füge ID am Ende für die WHERE-Klausel hinzu
    values.push(id)

    const sql = `UPDATE midjourney_prompts SET ${setClause} WHERE id = ?`
    await db.execute(sql, values)

    return { success: true }
  } catch (error: unknown) {
    console.error(`Fehler beim Aktualisieren des Prompts mit ID ${id}:`, error)
    throw error
  }
}

/**
 * Löscht einen Midjourney-Prompt anhand der ID
 */
export async function deleteMidjourneyPrompt(id: number): Promise<{ success: boolean }> {
  try {
    const sql = `DELETE FROM midjourney_prompts WHERE id = ?`
    await db.execute(sql, [id])

    return { success: true }
  } catch (error: unknown) {
    console.error(`Fehler beim Löschen des Prompts mit ID ${id}:`, error)
    throw error
  }
}
