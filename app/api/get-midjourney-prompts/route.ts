import { NextResponse } from 'next/server'
import { getMidjourneyPromptById, getAllMidjourneyPrompts } from '@/lib/db'

// API-Route zum Abrufen von Midjourney-Prompts
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    // Wenn eine ID angegeben ist, nur diesen Prompt abrufen
    if (id) {
      const prompt = await getMidjourneyPromptById(Number(id))

      if (!prompt) {
        return NextResponse.json({ error: 'Prompt nicht gefunden' }, { status: 404 })
      }

      return NextResponse.json(prompt)
    }

    // Ansonsten alle Prompts abrufen
    const prompts = await getAllMidjourneyPrompts()
    return NextResponse.json(prompts)
  } catch (error) {
    console.error('Fehler beim Abrufen der Prompts:', error)
    return NextResponse.json(
      {
        error: 'Ein unerwarteter Fehler ist aufgetreten',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler',
      },
      { status: 500 }
    )
  }
}
