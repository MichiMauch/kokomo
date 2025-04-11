// components/context/mdx-draft-context.tsx
'use client'

import { createContext, useContext, useState } from 'react'

type DraftData = {
  title: string
  date: string
  draft: boolean
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
  const [draftData, setDraftData] = useState<DraftData | null>(null)
  return (
    <MdxDraftContext.Provider value={{ draftData, setDraftData }}>
      {children}
    </MdxDraftContext.Provider>
  )
}
