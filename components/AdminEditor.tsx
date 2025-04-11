'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { convertImageToWebP } from '@/lib/convertToWebP'
import { toast } from 'sonner'
import { Loader2, ClipboardCopy } from 'lucide-react'
import MarkdownPreview from '@/components/MarkdownPreview'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import { useSearchParams } from 'next/navigation'
import { useMdxDraft } from '@/components/context/mdx-draft-context'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

const AdminEditor = () => {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [tags, setTags] = useState('')
  const [authors, setAuthors] = useState('default')
  const [summary, setSummary] = useState('')
  const [draft, setDraft] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [markdownImageFile, setMarkdownImageFile] = useState<File | null>(null)
  const [type, setType] = useState('Blog')
  const [body, setBody] = useState('')
  const [mdxContent, setMdxContent] = useState('')
  const [uploadingTitleImage, setUploadingTitleImage] = useState(false)
  const [uploadingMarkdownImage, setUploadingMarkdownImage] = useState(false)
  const [markdownPathSnippet, setMarkdownPathSnippet] = useState('')
  const [publishing, setPublishing] = useState(false)

  const params = useSearchParams()
  const { draftData } = useMdxDraft()

  useEffect(() => {
    const titleFromQuery = params?.get('title')

    if ((draftData && draftData.title) || titleFromQuery) {
      if (draftData?.title) {
        setTitle(draftData.title)
        setDate(draftData.date || new Date().toISOString().split('T')[0])
        setDraft(draftData.draft ?? true)
      } else if (titleFromQuery) {
        setTitle(titleFromQuery)
        setDate(new Date().toISOString().split('T')[0])
        setDraft(true)
      }
    }
  }, [draftData, params])

  const generateMDX = () => {
    const frontmatter = `---\ntitle: '${title}'\ndate: '${date}'\ntags: [${tags
      .split(',')
      .map((tag) => `'${tag.trim()}'`)
      .join(
        ', '
      )}]\nauthors: ['${authors}']\nsummary: '${summary}'\ndraft: ${draft}\nimages: '${imageUrl}'\ntype: '${type}'\n---\n\n`

    setMdxContent(frontmatter + body)
  }

  const handleImageUpload = async () => {
    if (!imageFile) return toast.error('Bitte ein Bild auswählen')
    setUploadingTitleImage(true)
    try {
      const webpBlob = await convertImageToWebP(imageFile)
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      const filename = `${slug}-titelbild.webp`
      const formData = new FormData()
      formData.append('file', new File([webpBlob], filename, { type: 'image/webp' }))

      const res = await fetch('/admin/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Fehler beim Upload')

      const data = await res.json()
      setImageUrl(data.url)
      toast.success('Titelbild erfolgreich hochgeladen')
    } catch (error) {
      console.error(error)
      toast.error('Upload fehlgeschlagen')
    } finally {
      setUploadingTitleImage(false)
    }
  }

  const handleMarkdownImageUpload = async () => {
    if (!markdownImageFile) return toast.error('Bitte ein Bild auswählen')
    setUploadingMarkdownImage(true)
    try {
      const webpBlob = await convertImageToWebP(markdownImageFile)
      const originalName = markdownImageFile.name
      const webpName = originalName.endsWith('.webp')
        ? originalName
        : originalName.replace(/\.[^.]+$/, '.webp')

      const formData = new FormData()
      formData.append('file', new File([webpBlob], webpName, { type: 'image/webp' }))

      const res = await fetch('/admin/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Fehler beim Upload')

      const markdown = `![]({IMAGE_PATH}/${webpName})`
      setMarkdownPathSnippet(markdown)
      toast.success('Bild für Markdown hochgeladen')
    } catch (error) {
      console.error(error)
      toast.error('Upload fehlgeschlagen')
    } finally {
      setUploadingMarkdownImage(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('In Zwischenablage kopiert')
    } catch (err) {
      toast.error('Kopieren fehlgeschlagen')
    }
  }

  const handlePublish = async () => {
    setPublishing(true)
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.mdx`
    try {
      const res = await fetch('/admin/api/publish-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filename,
          content: mdxContent,
          message: `📝 Neuer Blogpost: ${title}`,
        }),
      })

      if (res.ok) {
        toast.success('🚀 Beitrag veröffentlicht und an GitHub gepusht')
      } else {
        toast.error('Fehler beim Push')
      }
    } catch (err) {
      console.error(err)
      toast.error('Fehler beim Veröffentlichen')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">📝 Blogpost Editor</h1>
      <Input placeholder="Titel" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Input
        placeholder="Tags (kommagetrennt)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />
      <Input placeholder="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="draft"
          checked={draft}
          onChange={(e) => setDraft(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="draft" className="text-sm text-gray-700">
          Beitrag als <strong>Entwurf</strong> speichern
        </label>
      </div>

      <div className="space-y-2">
        <label htmlFor="title-image-upload" className="block font-medium">
          Titelbild hochladen
        </label>
        <Input
          id="title-image-upload"
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
        <Button onClick={handleImageUpload} disabled={uploadingTitleImage}>
          {uploadingTitleImage ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            '📤 Titelbild hochladen'
          )}
        </Button>
        {imageUrl && <p className="text-sm text-gray-500">Bild-URL: {imageUrl}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="markdown-image-upload" className="block font-medium">
          Markdown-Bild hochladen
        </label>
        <Input
          id="markdown-image-upload"
          type="file"
          accept="image/*"
          onChange={(e) => setMarkdownImageFile(e.target.files?.[0] || null)}
        />
        <Button onClick={handleMarkdownImageUpload} disabled={uploadingMarkdownImage}>
          {uploadingMarkdownImage ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            '📤 Markdown-Bild hochladen'
          )}
        </Button>
        {markdownPathSnippet && (
          <div className="flex items-center justify-between rounded bg-gray-100 p-2 font-mono text-sm text-gray-700">
            <span>{markdownPathSnippet}</span>
            <button
              className="ml-4 rounded p-1 hover:bg-gray-200"
              onClick={() => copyToClipboard(markdownPathSnippet)}
              title="Kopieren"
            >
              <ClipboardCopy className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <MDEditor height={400} value={body} onChange={(val) => setBody(val || '')} preview="edit" />

      <Button onClick={generateMDX}>📄 MDX generieren</Button>

      {mdxContent && (
        <div>
          <h2 className="mt-8 text-xl font-semibold">📄 Generierter MDX-Inhalt</h2>
          <Textarea className="min-h-[300px] font-mono" value={mdxContent} readOnly />
          <div className="mt-4">
            <Button onClick={handlePublish} disabled={publishing}>
              {publishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                '🚀 Veröffentlichen & an GitHub pushen'
              )}
            </Button>
          </div>
        </div>
      )}

      {body && <MarkdownPreview content={body} />}
    </div>
  )
}

export default AdminEditor
