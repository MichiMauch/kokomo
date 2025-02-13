import TOCInline from 'pliny/ui/TOCInline'
import Pre from 'pliny/ui/Pre'
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import Image from 'next/image'
import CustomLink from './Link'
import TableWrapper from './TableWrapper'

// Erweiterte ImageProps für unsere CustomImage Komponente
interface CustomImageProps {
  src: string
  alt: string
  width?: string | number
  height?: string | number
  className?: string
}

// Hilfsfunktion zum Normalisieren der Bild-URL
const normalizeImageUrl = (src: string): string => {
  if (src.startsWith('http')) return src

  return src
    .replace('{IMAGE_PATH}', process.env.NEXT_PUBLIC_CLOUDFLARE_R2_URL || '')
    .replace('%7BIMAGE_PATH%7D', process.env.NEXT_PUBLIC_CLOUDFLARE_R2_URL || '')
    .replace(/([^:]\/)\/+/g, '$1')
}

// Erweiterte Image Komponente
const CustomImage = ({ src, alt, width, height, className, ...props }: CustomImageProps) => {
  const imageUrl = normalizeImageUrl(src)

  // Standardwerte für Bildgrößen
  const finalWidth = typeof width === 'string' ? Number.parseInt(width, 10) : width || 800
  const finalHeight = typeof height === 'string' ? Number.parseInt(height, 10) : height || 600

  // Wichtig: Kein umschließendes div, um Hydration-Fehler zu vermeiden
  return (
    <Image
      src={imageUrl || '/placeholder.svg'}
      alt={alt}
      width={finalWidth}
      height={finalHeight}
      className={`rounded-lg ${className || ''}`}
      loading="lazy"
      {...props}
    />
  )
}

export const components: MDXComponents = {
  Image: CustomImage,
  TOCInline,
  pre: Pre,
  table: TableWrapper,
  BlogNewsletterForm,
  // Füge die img-Komponente hinzu, um auch Standard-Markdown-Bilder zu verarbeiten
  img: CustomImage,
}

export default components
