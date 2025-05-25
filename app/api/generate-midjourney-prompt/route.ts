import { NextResponse } from 'next/server'

// Typdefinition für das Anfrage-Format
type MidjourneyPromptInput = {
  scene: string
  location: string
  timeOfDay: string
  atmosphere: string
  mood: string
  style: string
  extraDetails: string
  customPrompt: string
  version: string
  styleSetting: string
  aspectRatio: string
  quality: string
  stylize: string
}

// API-Route zum Generieren eines Midjourney-Prompts mit ChatGPT
export async function POST(request: Request) {
  try {
    // Daten aus der Anfrage extrahieren
    const promptData: MidjourneyPromptInput = await request.json()

    // Überprüfen, ob alle erforderlichen Daten vorhanden sind
    if (!promptData) {
      return NextResponse.json({ error: 'Keine Prompt-Daten gefunden' }, { status: 400 })
    }

    // Konfiguration für die OpenAI API-Anfrage
    const openaiEndpoint = 'https://api.openai.com/v1/chat/completions'
    const apiKey = process.env.OPENAI_API_KEY

    // Überprüfen, ob der API-Schlüssel konfiguriert ist
    if (!apiKey) {
      console.error('OpenAI API Key fehlt')
      return NextResponse.json(
        { error: 'API-Konfiguration fehlt', localFallback: true },
        { status: 500 }
      )
    }

    // Systemprompt und Benutzerprompt für ChatGPT
    const systemMessage = `Du bist ein Experte für Midjourney-Prompts. Deine Aufgabe ist es, aus den gegebenen Eingaben einen optimierten, wirkungsvollen Prompt für Midjourney zu erstellen. 
    Midjourney reagiert am besten auf klare, präzise und bildhafte Beschreibungen. 
    Benutze keine Anführungszeichen im Prompt.
    Benutze keine Wörter wie "Bild", "Foto" oder "Darstellung", sondern beschreibe direkt die Szene.
    Schreibe in englischer Sprache, da Midjourney am besten auf Englisch funktioniert.
    Gib nur den fertigen Prompt zurück, keine Einleitung oder Erklärung.`

    let userPromptContent

    // Benutzerdefinierter Prompt oder generierter Prompt
    if (promptData.customPrompt.trim()) {
      userPromptContent = `Verbessere folgenden benutzerdefinierten Midjourney-Prompt mit deinem Expertenwissen und übersetze ihn ins Englische, falls er nicht bereits auf Englisch ist. Der Prompt sollte gut funktionieren und optimale Ergebnisse liefern: "${promptData.customPrompt.trim()}"

      Diese Parameter werden bereits hinzugefügt, also lasse sie weg: ${promptData.version} ${promptData.styleSetting} ${promptData.aspectRatio} ${promptData.quality} ${promptData.stylize}`
    } else {
      // Deutsche zu englische Stil-Übersetzung
      const styleTranslation: Record<string, string> = {
        fotorealistisch: 'photorealistic',
        'studio ghibli': 'studio ghibli',
        'digitale malerei': 'digital painting',
        kinematografisch: 'cinematic',
        architektonisch: 'architectural',
        drohnenfotografie: 'drone photography',
        innenraumdesign: 'interior design',
        'gemütliches interieur': 'cozy interior',
        gartenfotografie: 'garden photography',
      }

      // Englischer Stil
      const englishStyle = styleTranslation[promptData.style] || promptData.style

      userPromptContent = `Erstelle einen optimierten Midjourney-Prompt basierend auf folgenden Eingaben. Der Prompt sollte eine zusammenhängende, detaillierte Beschreibung sein, die besser ist als nur die Aneinanderreihung der Eingaben, und auf Englisch verfasst werden:

      - Szene: ${promptData.scene}
      - Ort: ${promptData.location}
      - Tageszeit: ${promptData.timeOfDay}
      - Atmosphäre: ${promptData.atmosphere}
      - Stimmung: ${promptData.mood}
      - Stil: ${englishStyle}
      - Zusätzliche Details: ${promptData.extraDetails}

      Diese Parameter werden bereits hinzugefügt, also lasse sie weg: ${promptData.version} ${promptData.styleSetting} ${promptData.aspectRatio} ${promptData.quality} ${promptData.stylize}`
    }

    // Anfrage an die OpenAI API senden
    const response = await fetch(openaiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userPromptContent },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      console.error('OpenAI API Fehler:', await response.text())
      return NextResponse.json(
        { error: 'Fehler bei der Anfrage an die OpenAI API', localFallback: true },
        { status: 500 }
      )
    }

    const data = await response.json()
    const generatedPromptText = data.choices[0].message.content.trim()

    // Parameter anhängen
    const parameters = [
      promptData.version,
      promptData.styleSetting,
      promptData.aspectRatio,
      promptData.quality,
      promptData.stylize,
    ].join(' ')

    // Vollständigen Prompt zurückgeben
    return NextResponse.json({ prompt: `${generatedPromptText} ${parameters}` })
  } catch (error) {
    console.error('Fehler bei der Prompt-Generierung:', error)
    return NextResponse.json(
      {
        error: 'Ein unerwarteter Fehler ist aufgetreten',
        localFallback: true,
        message: error instanceof Error ? error.message : 'Unbekannter Fehler',
      },
      { status: 500 }
    )
  }
}
