import { NextResponse } from 'next/server'
import { saveMidjourneyPrompt, SavedMidjourneyPrompt } from '@/lib/db'

// API-Route zum Speichern eines Midjourney-Prompts
export async function POST(request: Request) {
  try {
    // Daten aus der Anfrage extrahieren
    const promptData = await request.json()

    // Überprüfen, ob alle erforderlichen Daten vorhanden sind
    if (!promptData || !promptData.prompt_text) {
      return NextResponse.json(
        { error: 'Keine vollständigen Prompt-Daten gefunden' },
        { status: 400 }
      )
    }

    // Konvertierung in das erwartete Format
    const dbPrompt: SavedMidjourneyPrompt = {
      prompt_text: promptData.prompt_text,
      scene: promptData.scene,
      location: promptData.location,
      time_of_day: promptData.timeOfDay,
      atmosphere: promptData.atmosphere,
      mood: promptData.mood,
      style: promptData.style,
      extra_details: promptData.extraDetails,
      custom_prompt: promptData.customPrompt,
      version: promptData.version,
      style_setting: promptData.styleSetting,
      aspect_ratio: promptData.aspectRatio,
      quality: promptData.quality,
      stylize: promptData.stylize,
      image_url: promptData.imageUrl,
      labels: promptData.labels,
      is_favorite: promptData.isFavorite || false,
    }

    // Prompt in der Datenbank speichern
    const result = await saveMidjourneyPrompt(dbPrompt)

    // Erfolgreiche Antwort zurückgeben
    return NextResponse.json({
      success: true,
      message: 'Prompt erfolgreich gespeichert',
      id: result.id ? Number(result.id) : null,
    })
  } catch (error) {
    console.error('Fehler bei der Prompt-Speicherung:', error)
    return NextResponse.json(
      {
        error: 'Ein unerwarteter Fehler ist aufgetreten',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler',
      },
      { status: 500 }
    )
  }
}
