/**
 * MidjourneyPromptBuilder.tsx
 * Eine Komponente zum Erstellen optimierter Prompts für Midjourney
 */
'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  Check,
  Copy as CopyIcon,
  Info as InfoIcon,
  Loader2,
  RefreshCw,
  Save,
  Image as ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import DynamicImage from './DynamicImage'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/components/ui/card'
import { Label } from '@/components/components/ui/label'
import { Input } from '@/components/components/ui/input'
import { Textarea } from '@/components/components/ui/textarea'
import { Button } from '@/components/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/components/ui/tooltip'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/components/ui/accordion'

// Typdefinitionen für die Prompt-Eingaben
type MidjourneyPromptInput = {
  scene: string // z.B. "modernes Tiny House"
  location: string // z.B. "im Wald"
  timeOfDay: string // z.B. "goldene Stunde"
  atmosphere: string // z.B. "neblig, friedlich"
  mood: string // z.B. "warm, gemütlich"
  style:
    | 'fotorealistisch'
    | 'studio ghibli'
    | 'digitale malerei'
    | 'kinematografisch'
    | 'architektonisch'
    | 'drohnenfotografie'
    | 'innenraumdesign'
    | 'gemütliches interieur'
    | 'gartenfotografie'
  extraDetails: string // zusätzliche Details, optional
  customPrompt: string // Benutzerdefinierter Prompt
  version: string // z.B. "--v 6"
  styleSetting: string // z.B. "--style raw"
  aspectRatio: string // z.B. "--ar 3:2"
  quality: string // z.B. "--quality 2"
  stylize: string // z.B. "--stylize 0"
}

// Vorschläge für jede Kategorie zur besseren Inspiration
const suggestions = {
  scene: [
    'modernes Tiny House',
    'Holzhütte',
    'minimalistisches Container-Haus',
    'autarkes Tiny House',
    'kompaktes nachhaltiges Haus',
    'Tiny House Innenraum',
    'rustikaler Innenraum',
    'minimalistischer Innenraum',
    'gemütliches Wohnzimmer',
    'platzsparende Küche',
    'Schlafbereich im Dachgeschoss',
    'Garten mit Tiny House',
    'Außenterrasse',
    'Sitzbereich im Garten',
  ],
  location: [
    'im Wald',
    'am See',
    'auf einem Berg',
    'auf einer Wiese',
    'am Strand',
    'in ländlicher Umgebung',
    'in einem Garten',
    'umgeben von Blumen',
    'neben einem Bach',
    'in einem gemütlichen Tal',
    'innen',
    'mit Panoramafenstern',
  ],
  timeOfDay: [
    'Sonnenaufgang',
    'goldene Stunde',
    'Mittag',
    'Sonnenuntergang',
    'blaue Stunde',
    'Nacht mit Sternen',
  ],
  atmosphere: [
    'neblig',
    'klarer Himmel',
    'leichter Regen',
    'dunstig',
    'verschneit',
    'fallende Herbstblätter',
    'gemütlich',
    'warm',
    'hell und luftig',
    'stimmungsvoll',
  ],
  mood: [
    'warm und gemütlich',
    'friedlich',
    'lebendig',
    'ruhig',
    'dramatisch',
    'heimelig',
    'einladend',
    'rustikaler Charme',
    'minimalistisch',
  ],
}

// Parameter-Optionen
const parameterOptions = {
  version: [
    { value: '--v 6', label: 'Version 6 (aktuell)' },
    { value: '--v 5.2', label: 'Version 5.2' },
    { value: '--v 5.1', label: 'Version 5.1' },
    { value: '--v 5', label: 'Version 5' },
    { value: '--v 4', label: 'Version 4' },
  ],
  styleSetting: [
    { value: '--style raw', label: 'Raw (ohne kreative Interpretation)' },
    { value: '--style cute', label: 'Niedlich' },
    { value: '--style expressive', label: 'Expressiv' },
    { value: '--style scenic', label: 'Landschaftlich' },
  ],
  aspectRatio: [
    { value: '--ar 16:9', label: '16:9 (Breitbild)' },
    { value: '--ar 3:2', label: '3:2 (Standard Querformat)' },
    { value: '--ar 4:3', label: '4:3 (Standard)' },
    { value: '--ar 1:1', label: '1:1 (Quadratisch)' },
    { value: '--ar 2:3', label: '2:3 (Hochformat)' },
    { value: '--ar 9:16', label: '9:16 (Smartphone)' },
  ],
  quality: [
    { value: '--quality 0.25', label: '0.25 (Schnell)' },
    { value: '--quality 0.5', label: '0.5 (Standard)' },
    { value: '--quality 1', label: '1 (Gut)' },
    { value: '--quality 2', label: '2 (Detailliert)' },
  ],
  stylize: [
    { value: '--stylize 0', label: '0 (Keine Stilisierung)' },
    { value: '--stylize 50', label: '50 (Leichte Stilisierung)' },
    { value: '--stylize 100', label: '100 (Moderate Stilisierung)' },
    { value: '--stylize 250', label: '250 (Starke Stilisierung)' },
    { value: '--stylize 750', label: '750 (Sehr starke Stilisierung)' },
  ],
}

// Fest definierte Midjourney-Parameter (als Standard-Werte)
const DEFAULT_MIDJOURNEY_PARAMS = {
  version: '--v 6',
  styleSetting: '--style raw',
  aspectRatio: '--ar 3:2',
  quality: '--quality 2',
  stylize: '--stylize 0',
}

// Funktion zum Generieren eines optimierten Midjourney-Prompts
async function generateMidjourneyPromptWithAI(input: MidjourneyPromptInput): Promise<string> {
  try {
    // Wenn ein benutzerdefinierter Prompt vorhanden ist, sende diesen an die API
    const promptData = {
      scene: input.scene,
      location: input.location,
      timeOfDay: input.timeOfDay,
      atmosphere: input.atmosphere,
      mood: input.mood,
      style: input.style,
      extraDetails: input.extraDetails,
      customPrompt: input.customPrompt,
      version: input.version,
      styleSetting: input.styleSetting,
      aspectRatio: input.aspectRatio,
      quality: input.quality,
      stylize: input.stylize,
    }

    // Anfrage an die API senden
    const response = await fetch('/api/generate-midjourney-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(promptData),
    })

    if (!response.ok) {
      const errorData = await response.json()

      // Wenn die API einen Local-Fallback anfordert
      if (errorData.localFallback) {
        console.warn('API fordert Fallback an:', errorData.error)
        return generateMidjourneyPromptFallback(input)
      }

      throw new Error(`API-Fehler: ${errorData.error || response.statusText}`)
    }

    const data = await response.json()
    return data.prompt
  } catch (error) {
    console.error('Fehler bei der AI-Prompt-Generierung:', error)

    // Fallback zur lokalen Generierung
    return generateMidjourneyPromptFallback(input)
  }
}

// Fallback-Funktion zur lokalen Generierung des Prompts ohne API
function generateMidjourneyPromptFallback(input: MidjourneyPromptInput): string {
  // Deutsche zu englische Stil-Übersetzung für MJ
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

  // Basis-Prompt zusammenstellen (englisch für MJ)
  let core = `A ${input.scene}`

  if (input.location) {
    core += ` ${input.location}`
  }

  if (input.timeOfDay) {
    core += `, ${input.timeOfDay}`
  }

  if (input.atmosphere) {
    core += `, ${input.atmosphere}`
  }

  if (input.mood) {
    core += `, ${input.mood}`
  }

  // Style hinzufügen (übersetzen ins Englische für MJ)
  const englishStyle = styleTranslation[input.style] || input.style
  core += `, ${englishStyle} style, cinematic lighting, highly detailed`

  // Extra Details hinzufügen, falls vorhanden
  if (input.extraDetails) {
    core += `, ${input.extraDetails}`
  }

  // Parameter anhängen
  const parameters = [
    input.version,
    input.styleSetting,
    input.aspectRatio,
    input.quality,
    input.stylize,
  ].join(' ')

  return `${core} ${parameters}`
}

export default function MidjourneyPromptBuilder() {
  // State für alle Eingabefelder
  const [inputs, setInputs] = useState<MidjourneyPromptInput>({
    scene: '',
    location: '',
    timeOfDay: '',
    atmosphere: '',
    mood: '',
    style: 'fotorealistisch',
    extraDetails: '',
    customPrompt: '',
    version: '--v 6',
    styleSetting: '--style raw',
    aspectRatio: '--ar 3:2',
    quality: '--quality 2',
    stylize: '--stylize 0',
  })

  // State für generierten Prompt
  const [generatedPrompt, setGeneratedPrompt] = useState('')

  // State für Ladezustand während der Prompt-Generierung
  const [isGenerating, setIsGenerating] = useState(false)

  // State für Ladezustand während der Prompt-Speicherung
  const [isSaving, setIsSaving] = useState(false)

  // State für DALL-E Bildgenerierung
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState('')

  // Ref für das Textarea-Element
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null)

  // State für Kopieren-Button
  const [copied, setCopied] = useState(false)

  // Funktion zum Aktualisieren der Eingaben
  const handleInputChange = (field: keyof MidjourneyPromptInput, value: string) => {
    setInputs((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Funktion zum Generieren des Prompts
  const handleGeneratePrompt = async () => {
    // Prüfen, ob die Szene angegeben wurde, wenn kein benutzerdefinierter Prompt vorliegt
    if (!inputs.scene && !inputs.customPrompt.trim()) {
      toast.error('Fehler bei der Prompt-Generierung', {
        description: 'Bitte wähle mindestens eine Szene aus oder gib einen eigenen Prompt ein.',
      })
      return
    }

    try {
      setIsGenerating(true)

      // API-basierte Generierung mit ChatGPT
      const prompt = await generateMidjourneyPromptWithAI(inputs)
      setGeneratedPrompt(prompt)

      // Zur Output-Sektion scrollen
      setTimeout(() => {
        if (promptTextareaRef.current) {
          promptTextareaRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } catch (error) {
      console.error('Fehler bei der Prompt-Generierung:', error)
      toast.error('Fehler bei der Prompt-Generierung', {
        description: 'Es gab ein Problem beim Generieren des Prompts. Bitte versuche es erneut.',
      })

      // Fallback zur lokalen Generierung
      const fallbackPrompt = generateMidjourneyPromptFallback(inputs)
      setGeneratedPrompt(fallbackPrompt)

      toast.info('Fallback-Modus aktiviert', {
        description: 'Der Prompt wurde lokal generiert, ohne KI-Optimierung.',
      })
    } finally {
      setIsGenerating(false)
    }
  } // Funktion zum Kopieren des Prompts
  const handleCopyPrompt = () => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt)
      setCopied(true)
      toast.success('Prompt kopiert!', {
        description: 'Der Prompt wurde in die Zwischenablage kopiert.',
      })

      // Nach 2 Sekunden zurücksetzen
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    }
  }

  // Funktion zum Speichern des Prompts in der Datenbank
  const handleSavePrompt = async () => {
    if (!generatedPrompt) {
      toast.error('Kein Prompt zum Speichern', {
        description: 'Bitte generiere zuerst einen Prompt.',
      })
      return
    }

    try {
      setIsSaving(true)

      // Daten für die API vorbereiten
      const promptData = {
        prompt_text: generatedPrompt,
        scene: inputs.scene,
        location: inputs.location,
        timeOfDay: inputs.timeOfDay,
        atmosphere: inputs.atmosphere,
        mood: inputs.mood,
        style: inputs.style,
        extraDetails: inputs.extraDetails,
        customPrompt: inputs.customPrompt,
        version: inputs.version,
        styleSetting: inputs.styleSetting,
        aspectRatio: inputs.aspectRatio,
        quality: inputs.quality,
        stylize: inputs.stylize,
        // Optional: Bild-URL kann später hinzugefügt werden
        imageUrl: '',
        // Optional: Tags/Labels können später hinzugefügt werden
        labels: '',
        isFavorite: false,
      }

      // API-Anfrage zum Speichern des Prompts
      const response = await fetch('/api/save-midjourney-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptData),
      })

      if (!response.ok) {
        throw new Error('Fehler beim Speichern des Prompts')
      }

      const result = await response.json()

      toast.success('Prompt gespeichert!', {
        description: `Der Prompt wurde erfolgreich in der Datenbank gespeichert (ID: ${result.id}).`,
      })
    } catch (error) {
      console.error('Fehler beim Speichern des Prompts:', error)
      toast.error('Fehler beim Speichern', {
        description: 'Der Prompt konnte nicht gespeichert werden. Bitte versuche es erneut.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Funktion zum Füllen eines Felds mit einem zufälligen Vorschlag
  const fillRandomSuggestion = (
    field: 'scene' | 'location' | 'timeOfDay' | 'atmosphere' | 'mood'
  ) => {
    const fieldSuggestions = suggestions[field]
    const randomIndex = Math.floor(Math.random() * fieldSuggestions.length)

    handleInputChange(field, fieldSuggestions[randomIndex])
  } // Funktion zum Hinzufügen von Prompt-Begriffen zum extraDetails-Feld
  const addPromptTerm = (term: string) => {
    const newValue = inputs.extraDetails ? `${inputs.extraDetails}, ${term}` : term
    handleInputChange('extraDetails', newValue)

    // Toast-Benachrichtigung anzeigen
    toast.success(`"${term}" hinzugefügt`, {
      description: 'Der Begriff wurde zu den zusätzlichen Details hinzugefügt',
      duration: 2000, // 2 Sekunden anzeigen
    })
  }

  // Funktion zum Generieren eines Bildes mit DALL-E
  const handleGenerateImage = async () => {
    if (!generatedPrompt) {
      toast.error('Kein Prompt für die Bildgenerierung', {
        description: 'Bitte generiere zuerst einen Prompt.',
      })
      return
    }

    try {
      setIsGeneratingImage(true)
      setGeneratedImageUrl('')

      // DALL-E API aufrufen
      const response = await fetch('/api/generate-dalle-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: generatedPrompt }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Fehler bei der Bildgenerierung')
      }

      const data = await response.json()
      setGeneratedImageUrl(data.imageUrl)

      // Toast-Benachrichtigung anzeigen
      toast.success('Bild generiert!', {
        description: 'Das Bild wurde erfolgreich mit DALL-E generiert.',
      })
    } catch (error) {
      console.error('Fehler bei der DALL-E Bildgenerierung:', error)
      toast.error('Fehler bei der Bildgenerierung', {
        description:
          error instanceof Error ? error.message : 'Es gab ein Problem bei der Bildgenerierung.',
      })
    } finally {
      setIsGeneratingImage(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prompt-Eingaben</CardTitle>
          <CardDescription>
            Fülle die Felder aus, um deinen Midjourney-Prompt zu erstellen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Szene */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-3">
              <Label htmlFor="scene" className="mb-1 block">
                Szene
                <span className="ml-1 text-red-500">*</span>
              </Label>
              <Select
                value={inputs.scene}
                onValueChange={(value) => handleInputChange('scene', value)}
              >
                <SelectTrigger id="scene" className="w-full">
                  <SelectValue placeholder="Wähle eine Szene" />
                </SelectTrigger>
                <SelectContent>
                  {suggestions.scene.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fillRandomSuggestion('scene')}
                      className="h-10 w-10"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zufällige Szene vorschlagen</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Ort */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-3">
              <Label htmlFor="location" className="mb-1 block">
                Ort
              </Label>
              <Select
                value={inputs.location}
                onValueChange={(value) => handleInputChange('location', value)}
              >
                <SelectTrigger id="location" className="w-full">
                  <SelectValue placeholder="Wähle einen Ort" />
                </SelectTrigger>
                <SelectContent>
                  {suggestions.location.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fillRandomSuggestion('location')}
                      className="h-10 w-10"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zufälligen Ort vorschlagen</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Tageszeit */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-3">
              <Label htmlFor="timeOfDay" className="mb-1 block">
                Tageszeit
              </Label>
              <Select
                value={inputs.timeOfDay}
                onValueChange={(value) => handleInputChange('timeOfDay', value)}
              >
                <SelectTrigger id="timeOfDay" className="w-full">
                  <SelectValue placeholder="Wähle eine Tageszeit" />
                </SelectTrigger>
                <SelectContent>
                  {suggestions.timeOfDay.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fillRandomSuggestion('timeOfDay')}
                      className="h-10 w-10"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zufällige Tageszeit vorschlagen</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Atmosphäre */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-3">
              <Label htmlFor="atmosphere" className="mb-1 block">
                Atmosphäre
              </Label>
              <Select
                value={inputs.atmosphere}
                onValueChange={(value) => handleInputChange('atmosphere', value)}
              >
                <SelectTrigger id="atmosphere" className="w-full">
                  <SelectValue placeholder="Wähle eine Atmosphäre" />
                </SelectTrigger>
                <SelectContent>
                  {suggestions.atmosphere.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fillRandomSuggestion('atmosphere')}
                      className="h-10 w-10"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zufällige Atmosphäre vorschlagen</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Stimmung */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-3">
              <Label htmlFor="mood" className="mb-1 block">
                Stimmung
              </Label>
              <Select
                value={inputs.mood}
                onValueChange={(value) => handleInputChange('mood', value)}
              >
                <SelectTrigger id="mood" className="w-full">
                  <SelectValue placeholder="Wähle eine Stimmung" />
                </SelectTrigger>
                <SelectContent>
                  {suggestions.mood.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fillRandomSuggestion('mood')}
                      className="h-10 w-10"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zufällige Stimmung vorschlagen</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Stil (Dropdown) */}
          <div>
            <Label htmlFor="style" className="mb-1 block">
              Stil
            </Label>
            <Select
              value={inputs.style}
              onValueChange={(value) =>
                handleInputChange('style', value as MidjourneyPromptInput['style'])
              }
            >
              <SelectTrigger id="style" className="w-full">
                <SelectValue placeholder="Wähle einen Stil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fotorealistisch">Fotorealistisch</SelectItem>
                <SelectItem value="studio ghibli">Studio Ghibli</SelectItem>
                <SelectItem value="digitale malerei">Digitale Malerei</SelectItem>
                <SelectItem value="kinematografisch">Kinematografisch</SelectItem>
                <SelectItem value="architektonisch">Architektonisch</SelectItem>
                <SelectItem value="drohnenfotografie">Drohnenfotografie</SelectItem>
                <SelectItem value="innenraumdesign">Innenraumdesign</SelectItem>
                <SelectItem value="gemütliches interieur">Gemütliches Interieur</SelectItem>
                <SelectItem value="gartenfotografie">Gartenfotografie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prompt-Verbesserungen und Hilfen */}
          <div className="mt-4 border-t pt-4">
            <h3 className="mb-2 text-lg font-medium">Prompt-Hilfen & Verbesserungen</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Wähle aus diesen Listen Begriffe, die du in deine zusätzlichen Details einfügen
              möchtest.
            </p>

            <Accordion type="multiple" className="w-full">
              {/* Technische Verbesserungen */}
              <AccordionItem value="tech-improvements">
                <AccordionTrigger className="text-base font-medium">
                  🔧 Technische Verbesserungen (Auflösung & Schärfe)
                </AccordionTrigger>
                <AccordionContent>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-2 text-left font-medium">Begriff</th>
                          <th className="pb-2 text-left font-medium">Wirkung</th>
                          <th className="w-20 pb-2 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="py-2 font-mono">4k oder 8k</td>
                          <td className="py-2">extrem hohe Auflösung, viele Details</td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 cursor-pointer"
                              onClick={() => addPromptTerm('4k')}
                            >
                              +
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono">high detail</td>
                          <td className="py-2">
                            betont feine Strukturen (z. B. Holz, Stoff, Haut, Pflanzen)
                          </td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 cursor-pointer"
                              onClick={() => addPromptTerm('high detail')}
                            >
                              +
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono">sharp focus</td>
                          <td className="py-2">kein Weichzeichner – alles gestochen scharf</td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 cursor-pointer"
                              onClick={() => addPromptTerm('sharp focus')}
                            >
                              +
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono">hyperrealistic</td>
                          <td className="py-2">
                            fast wie ein Foto, aber mit überzeichneter Klarheit
                          </td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 cursor-pointer"
                              onClick={() => addPromptTerm('hyperrealistic')}
                            >
                              +
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono">ultrarealistic</td>
                          <td className="py-2">noch eine Stufe intensiver als photorealistisch</td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 cursor-pointer"
                              onClick={() => addPromptTerm('ultrarealistic')}
                            >
                              +
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono">realistic lighting</td>
                          <td className="py-2">Lichtverhalten wie bei echten Kameras</td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 cursor-pointer"
                              onClick={() => addPromptTerm('realistic lighting')}
                            >
                              +
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Kameratechnik & Perspektive */}
              <AccordionItem value="camera-perspective">
                <AccordionTrigger className="text-base font-medium">
                  🎥 Kameratechnik & Perspektive
                </AccordionTrigger>
                <AccordionContent>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-2 text-left font-medium">Begriff</th>
                          <th className="pb-2 text-left font-medium">Wirkung</th>
                          <th className="w-20 pb-2 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="py-2 font-mono">wide angle lens</td>
                          <td className="py-2">Weitwinkel-Effekt, gibt Tiefe und Kontext</td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 cursor-pointer"
                              onClick={() => addPromptTerm('wide angle lens')}
                            >
                              +
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono">macro</td>
                          <td className="py-2">
                            extreme Nahaufnahme, Details wie Staub, Poren, Blütenblattstruktur
                          </td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 cursor-pointer"
                              onClick={() => addPromptTerm('macro')}
                            >
                              +
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono">depth of field</td>
                          <td className="py-2">unscharfer Hintergrund, wie bei Porträtfotos</td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 cursor-pointer"
                              onClick={() => addPromptTerm('depth of field')}
                            >
                              +
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono">cinematic lighting</td>
                          <td className="py-2">
                            kinoreife Lichtkomposition (Spotlights, Gegenlicht, weiche Schatten)
                          </td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 cursor-pointer"
                              onClick={() => addPromptTerm('cinematic lighting')}
                            >
                              +
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono">soft shadows</td>
                          <td className="py-2">stimmungsvolle, weiche Übergänge im Licht</td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 cursor-pointer"
                              onClick={() => addPromptTerm('soft shadows')}
                            >
                              +
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono">volumetric lighting</td>
                          <td className="py-2">
                            Lichtstrahlen in Nebel / Staub sichtbar (z. B. durchs Fenster)
                          </td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 cursor-pointer"
                              onClick={() => addPromptTerm('volumetric lighting')}
                            >
                              +
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Stimmung & Textur */}
              <AccordionItem value="mood-texture">
                <AccordionTrigger className="text-base font-medium">
                  🎨 Stimmung & Textur
                </AccordionTrigger>
                <AccordionContent>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-2 text-left font-medium">Begriff</th>
                          <th className="pb-2 text-left font-medium">Wirkung</th>
                          <th className="w-20 pb-2 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="py-2 font-mono">warm tones</td>
                          <td className="py-2">goldene, gemütliche Farben</td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 cursor-pointer"
                              onClick={() => addPromptTerm('warm tones')}
                            >
                              +
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono">cold color grading</td>
                          <td className="py-2">
                            bläulicher Look wie in modernen Sci-Fi-Produktionen
                          </td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 cursor-pointer"
                              onClick={() => addPromptTerm('cold color grading')}
                            >
                              +
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono">moody atmosphere</td>
                          <td className="py-2">dramatisch, dunkel, melancholisch</td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 cursor-pointer"
                              onClick={() => addPromptTerm('moody atmosphere')}
                            >
                              +
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono">soft textures</td>
                          <td className="py-2">flauschig, pastellig, sanft</td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 cursor-pointer"
                              onClick={() => addPromptTerm('soft textures')}
                            >
                              +
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono">gritty</td>
                          <td className="py-2">rau, industriell, ungeschönt</td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 cursor-pointer"
                              onClick={() => addPromptTerm('gritty')}
                            >
                              +
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Extra Details Eingabefeld */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="extraDetails" className="mb-1">
                  Zusätzliche Details
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="text-muted-foreground h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Füge hier zusätzliche Details oder Stichworte hinzu, die in den Prompt
                        einfließen sollen. Nutze die Tabellen oben zur Inspiration.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="extraDetails"
                placeholder="z.B. 4K, hohe Detailgenauigkeit, Weitwinkelobjektiv"
                value={inputs.extraDetails}
                onChange={(e) => handleInputChange('extraDetails', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Eigener Prompt */}
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="customPrompt" className="mb-1">
                Eigener Prompt (Optional)
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="text-muted-foreground h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Du kannst hier einen komplett eigenen Prompt eingeben. Wenn ausgefüllt, werden
                      die obigen Felder ignoriert und nur dieser Text plus die Parameter verwendet.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="customPrompt"
              placeholder="Eigenen Prompt eingeben (überschreibt die Felder oben)"
              value={inputs.customPrompt}
              onChange={(e) => handleInputChange('customPrompt', e.target.value)}
              className="w-full"
            />
          </div>

          {/* Parameter */}
          <div className="mt-8 border-t pt-4">
            <h3 className="mb-4 text-lg font-medium">Midjourney Parameter</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Version */}
              <div>
                <Label htmlFor="version" className="mb-1 block">
                  Version
                </Label>
                <Select
                  value={inputs.version}
                  onValueChange={(value) => handleInputChange('version', value)}
                >
                  <SelectTrigger id="version" className="w-full">
                    <SelectValue placeholder="Wähle eine Version" />
                  </SelectTrigger>
                  <SelectContent>
                    {parameterOptions.version.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Style Setting */}
              <div>
                <Label htmlFor="styleSetting" className="mb-1 block">
                  Style Setting
                </Label>
                <Select
                  value={inputs.styleSetting}
                  onValueChange={(value) => handleInputChange('styleSetting', value)}
                >
                  <SelectTrigger id="styleSetting" className="w-full">
                    <SelectValue placeholder="Wähle einen Style" />
                  </SelectTrigger>
                  <SelectContent>
                    {parameterOptions.styleSetting.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Aspect Ratio */}
              <div>
                <Label htmlFor="aspectRatio" className="mb-1 block">
                  Seitenverhältnis
                </Label>
                <Select
                  value={inputs.aspectRatio}
                  onValueChange={(value) => handleInputChange('aspectRatio', value)}
                >
                  <SelectTrigger id="aspectRatio" className="w-full">
                    <SelectValue placeholder="Wähle ein Seitenverhältnis" />
                  </SelectTrigger>
                  <SelectContent>
                    {parameterOptions.aspectRatio.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quality */}
              <div>
                <Label htmlFor="quality" className="mb-1 block">
                  Qualität
                </Label>
                <Select
                  value={inputs.quality}
                  onValueChange={(value) => handleInputChange('quality', value)}
                >
                  <SelectTrigger id="quality" className="w-full">
                    <SelectValue placeholder="Wähle eine Qualitätsstufe" />
                  </SelectTrigger>
                  <SelectContent>
                    {parameterOptions.quality.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stylize */}
              <div>
                <Label htmlFor="stylize" className="mb-1 block">
                  Stilisierung
                </Label>
                <Select
                  value={inputs.stylize}
                  onValueChange={(value) => handleInputChange('stylize', value)}
                >
                  <SelectTrigger id="stylize" className="w-full">
                    <SelectValue placeholder="Wähle eine Stilisierungsstufe" />
                  </SelectTrigger>
                  <SelectContent>
                    {parameterOptions.stylize.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleGeneratePrompt}
                  className="w-full cursor-pointer"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Prompt wird generiert...
                    </>
                  ) : (
                    'Prompt generieren'
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Klicken, um einen optimierten Midjourney-Prompt zu erstellen</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>

      {/* Output-Sektion */}
      {generatedPrompt && (
        <Card>
          <CardHeader>
            <CardTitle>Generierter Midjourney-Prompt</CardTitle>
            <CardDescription>
              Hier ist dein optimierter Prompt für Midjourney. Kopiere ihn und füge ihn in Discord
              ein.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              ref={promptTextareaRef}
              value={generatedPrompt}
              readOnly
              className="h-32 font-mono text-sm"
            />
            <div className="text-muted-foreground mt-2 text-xs">
              <p>
                <strong>Verwendete Parameter:</strong>
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>
                  <code className="text-primary">{inputs.version}</code>:{' '}
                  {parameterOptions.version.find((v) => v.value === inputs.version)?.label}
                </li>
                <li>
                  <code className="text-primary">{inputs.styleSetting}</code>:{' '}
                  {
                    parameterOptions.styleSetting.find((v) => v.value === inputs.styleSetting)
                      ?.label
                  }
                </li>
                <li>
                  <code className="text-primary">{inputs.aspectRatio}</code>:{' '}
                  {parameterOptions.aspectRatio.find((v) => v.value === inputs.aspectRatio)?.label}
                </li>
                <li>
                  <code className="text-primary">{inputs.quality}</code>:{' '}
                  {parameterOptions.quality.find((v) => v.value === inputs.quality)?.label}
                </li>
                <li>
                  <code className="text-primary">{inputs.stylize}</code>:{' '}
                  {parameterOptions.stylize.find((v) => v.value === inputs.stylize)?.label}
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between gap-2">
            <Button
              onClick={handleCopyPrompt}
              className="flex-1 cursor-pointer"
              variant={copied ? 'outline' : 'default'}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Kopiert
                </>
              ) : (
                <>
                  <CopyIcon className="mr-2 h-4 w-4" /> Prompt kopieren
                </>
              )}
            </Button>
            <Button
              onClick={handleSavePrompt}
              variant="outline"
              className="flex-1 cursor-pointer"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Wird gespeichert...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Prompt speichern
                </>
              )}
            </Button>
            <Button
              onClick={handleGenerateImage}
              variant="secondary"
              className="flex-1 cursor-pointer"
              disabled={isGeneratingImage}
            >
              {isGeneratingImage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Bild wird generiert...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" /> Mit DALL-E generieren
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Generiertes DALL-E Bild */}
      {generatedImageUrl && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Generiertes DALL-E Bild</CardTitle>
            <CardDescription>
              Hier ist das mit DALL-E generierte Bild basierend auf deinem Prompt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md">
              <DynamicImage
                src={generatedImageUrl}
                alt="Von DALL-E generiertes Bild"
                width={1024}
                height={1024}
                className="h-auto w-full object-cover"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full cursor-pointer"
              onClick={() => window.open(generatedImageUrl, '_blank')}
            >
              Bild in voller Größe öffnen
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
