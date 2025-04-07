'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

export default function EditPostPage() {
  const { slug } = useParams()
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [filename, setFilename] = useState('')
  const [loading, setLoading] = useState(true)
  const [sha, setSha] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadPost = async () => {
      try {
        const res = await fetch(`../../../api/list-posts`)
        const data = await res.json()
        interface File {
          name: string
          download_url: string
          sha: string
        }

        const file = data.files.find((f: File) => f.name.replace(/\.mdx$/, '') === slug)
        if (!file) return toast.error('Beitrag nicht gefunden')

        const mdxRes = await fetch(file.download_url)
        const text = await mdxRes.text()
        setContent(text)
        setOriginalContent(text)
        setFilename(file.name)
        setSha(file.sha)
      } catch (err) {
        toast.error('Fehler beim Laden des Beitrags')
      } finally {
        setLoading(false)
      }
    }
    loadPost()
  }, [slug])

  const handleUpdate = async () => {
    setSaving(true)
    try {
      const res = await fetch('../../../api/publish-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filename,
          content,
          message: `🔧 Update: ${filename}`,
          sha,
        }),
      })

      if (res.ok) {
        toast.success('✅ Beitrag aktualisiert')
        setOriginalContent(content)
      } else {
        toast.error('Fehler beim Speichern')
      }
    } catch (err) {
      toast.error('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="p-4">⏳ Lade Beitrag...</p>

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">✏️ Bearbeite: {filename}</h1>
      <MDEditor height={500} value={content} onChange={(val) => setContent(val || '')} />
      <Textarea
        className="min-h-[200px] font-mono"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <Button onClick={handleUpdate} disabled={saving || content === originalContent}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : '💾 Änderungen speichern'}
      </Button>
    </div>
  )
}
