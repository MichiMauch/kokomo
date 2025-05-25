'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/components/ui/card'
import { Button } from '@/components/components/ui/button'
import { Copy as CopyIcon, ExternalLink, Star, Trash2 } from 'lucide-react'
import { Textarea } from '@/components/components/ui/textarea'
import { Badge } from '@/components/components/ui/badge'
import { SavedMidjourneyPrompt } from '@/lib/db'

export default function SavedPromptsPage() {
  const [prompts, setPrompts] = useState<SavedMidjourneyPrompt[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Prompts beim Laden der Seite abrufen
  useEffect(() => {
    async function loadPrompts() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/get-midjourney-prompts')

        if (!response.ok) {
          throw new Error('Fehler beim Laden der Prompts')
        }

        const data = await response.json()
        setPrompts(data)
      } catch (error) {
        console.error('Fehler beim Laden der Prompts:', error)
        toast.error('Fehler beim Laden', {
          description: 'Die gespeicherten Prompts konnten nicht geladen werden.',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPrompts()
  }, [])

  // Prompt in die Zwischenablage kopieren
  const copyPrompt = (promptText: string) => {
    navigator.clipboard.writeText(promptText)
    toast.success('Prompt kopiert!', {
      description: 'Der Prompt wurde in die Zwischenablage kopiert.',
    })
  }

  // Formatiere das Unix-Timestamp als lesbares Datum
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Zeige die Parameter als Badges an
  const renderParameterBadges = (prompt: SavedMidjourneyPrompt) => {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="secondary">{prompt.version}</Badge>
        <Badge variant="secondary">{prompt.style_setting}</Badge>
        <Badge variant="secondary">{prompt.aspect_ratio}</Badge>
        <Badge variant="secondary">{prompt.quality}</Badge>
        <Badge variant="secondary">{prompt.stylize}</Badge>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Lade gespeicherte Prompts...</p>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Gespeicherte Midjourney-Prompts</h1>

      {prompts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Noch keine Prompts gespeichert. Generiere und speichere Prompts im Prompt-Generator.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {prompts.map((prompt) => (
            <Card key={prompt.id} className="flex h-full flex-col">
              <CardHeader>
                <CardTitle className="text-lg">Prompt #{prompt.id}</CardTitle>
                <CardDescription>
                  Erstellt am {prompt.created_at ? formatDate(prompt.created_at) : 'Unbekannt'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <Textarea
                  readOnly
                  className="mb-4 h-32 font-mono text-sm"
                  value={prompt.prompt_text}
                />

                {renderParameterBadges(prompt)}
              </CardContent>
              <CardFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 cursor-pointer"
                  onClick={() => copyPrompt(prompt.prompt_text)}
                >
                  <CopyIcon className="mr-2 h-4 w-4" /> Kopieren
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
