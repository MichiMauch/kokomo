'use client'

import { Loader2 } from 'lucide-react'

export default function SpinnerModal({ text = 'Lade…' }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-80 space-y-4 rounded-xl bg-white px-6 py-6 text-center shadow-xl">
        {/* 🔄 Spinner oben */}
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-700" />
        </div>

        {/* ✍️ Typing-GIF darunter */}
        <img src="/static/images/typing.gif" alt="Ladeanimation" className="mx-auto h-16 w-auto" />

        {/* Beschreibung */}
        <p className="text-sm text-gray-700">{text}</p>
      </div>
    </div>
  )
}
