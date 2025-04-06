import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export default function SectionContainer({ children, className }: Props) {
  return (
    <div className={`mx-auto max-w-[1440px] bg-transparent px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  )
}
