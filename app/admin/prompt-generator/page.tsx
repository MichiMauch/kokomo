import { Metadata } from 'next'
import MidjourneyPromptBuilder from '@/components/admin/MidjourneyPromptBuilder'

export const metadata: Metadata = {
  title: 'Midjourney Prompt Generator',
  description: 'Erstelle optimierte Prompts für Midjourney',
}

export default function PromptGeneratorPage() {
  return (
    <div className="mt-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Midjourney Prompt Generator</h1>
        <p className="text-muted-foreground mt-2">
          Erstelle optimierte Prompts für Midjourney-Bilder, die zu deinem Tiny House Content
          passen.
        </p>
      </div>

      <MidjourneyPromptBuilder />
    </div>
  )
}
