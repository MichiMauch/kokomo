'use client'

import { createContext, useContext, useState, useEffect } from 'react'

type DraftData = {
  title: string
  date: string
  draft: boolean
  body?: string
}

type ContextType = {
  draftData: DraftData | null
  setDraftData: (data: DraftData) => void
}

const MdxDraftContext = createContext<ContextType>({
  draftData: null,
  setDraftData: () => {},
})

export const useMdxDraft = () => useContext(MdxDraftContext)

export const MdxDraftProvider = ({ children }: { children: React.ReactNode }) => {
  const [draftData, setDraftDataState] = useState<DraftData | null>(null)

  // Beim Mount localStorage lesen
  useEffect(() => {
    const stored = localStorage.getItem('mdx-draft')
    if (stored) {
      try {
        setDraftDataState(JSON.parse(stored))
      } catch (e) {
        console.error('❌ Fehler beim Parsen des gespeicherten Drafts', e)
      }
    }
  }, [])

  const setDraftData = (data: DraftData) => {
    setDraftDataState(data)
    localStorage.setItem('mdx-draft', JSON.stringify(data))
  }

  return (
    <MdxDraftContext.Provider value={{ draftData, setDraftData }}>
      {children}
    </MdxDraftContext.Provider>
  )
}
