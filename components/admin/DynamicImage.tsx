import NextImage from 'next/image'
import { useState, useEffect } from 'react'

interface DynamicImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
}

/**
 * Eine Komponente, die dynamisch ein next/image mit Fehlerbehandlung rendert,
 * mit Fallback auf ein unoptimiertes Bild wenn nötig
 */
export default function DynamicImage({ src, alt, width, height, className }: DynamicImageProps) {
  const [error, setError] = useState(false)
  const [imageSrc, setImageSrc] = useState(src)

  // Aktualisiert die Bildquelle, wenn sich der src-Prop ändert
  useEffect(() => {
    setImageSrc(src)
    setError(false) // Fehler zurücksetzen, wenn sich die Quelle ändert
  }, [src])

  const handleImageError = () => {
    console.warn(`Fehler beim Laden des Bildes: ${src}`)
    setError(true)
  }

  // Wenn ein Fehler auftritt oder die src ungültig ist, verwenden wir ein fallback Bild
  if (error || !imageSrc) {
    return (
      <NextImage
        src="/static/images/placeholder.svg"
        alt={alt || 'Platzhalter Bild'}
        width={width}
        height={height}
        className={className}
        unoptimized
      />
    )
  }

  return (
    <NextImage
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleImageError}
      priority={true} // Priorität setzen für bessere LCP
      unoptimized
    />
  )
}
