'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Props = {
  content: string
}

export default function MarkdownPreview({ content }: Props) {
  const preview = content.replaceAll(
    '{IMAGE_PATH}',
    'https://pub-29ede69a4da644b9b81fa3dd5f8e9d6a.r2.dev'
  )

  return (
    <div className="prose mt-8 max-w-none rounded bg-white p-4 shadow">
      <h2 className="mb-2 text-xl font-semibold">🔍 Vorschau</h2>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{preview}</ReactMarkdown>
    </div>
  )
}
