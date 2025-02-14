'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CustomImageProps {
  src: string
  alt: string
  width?: string | number
  height?: string | number
  className?: string
  priority?: boolean
}

interface GalleryProps {
  images: (React.ReactElement<CustomImageProps> | string | { src: string; alt?: string })[]
  className?: string
}

// Hilfsfunktion zum Normalisieren der Bild-URL
const normalizeImageUrl = (src: string): string => {
  if (src.startsWith('http')) return src

  // Decode URL-encoded brackets first
  const decodedSrc = src.replace(/%7B/g, '{').replace(/%7D/g, '}')

  return decodedSrc
    .replace('{IMAGE_PATH}', process.env.NEXT_PUBLIC_CLOUDFLARE_R2_URL || '')
    .replace('%7BIMAGE_PATH%7D', process.env.NEXT_PUBLIC_CLOUDFLARE_R2_URL || '')
    .replace(/([^:]\/)\/+/g, '$1')
}

// Komponente als Galerie exportieren
export function Galerie({ images = [], className }: GalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  console.log('Galerie received raw images:', images) // Debug log

  // Only render if we have images
  if (!images || images.length === 0) {
    console.warn('Galerie: No images provided')
    return null
  }

  const processedImages = images.map((img, index) => {
    if (typeof img === 'string') {
      const normalizedSrc = normalizeImageUrl(img)
      console.log('Processing string image:', { original: img, normalized: normalizedSrc })
      return (
        <Image
          key={`image-${index}`}
          src={normalizedSrc || '/placeholder.svg'}
          alt={`Image ${index + 1}`}
          width={800}
          height={600}
          className="object-cover"
        />
      )
    }

    if ('src' in img && typeof img.src === 'string') {
      const normalizedSrc = normalizeImageUrl(img.src)
      console.log('Processing object image:', { original: img.src, normalized: normalizedSrc })
      return (
        <Image
          key={`image-${index}`}
          src={normalizedSrc || '/placeholder.svg'}
          alt={img.alt || `Image ${index + 1}`}
          width={800}
          height={600}
          className="object-cover"
        />
      )
    }

    // Wenn es bereits ein React Element ist
    if (React.isValidElement(img)) {
      const element = img as React.ReactElement<CustomImageProps>
      if (element.props?.src) {
        const normalizedSrc = normalizeImageUrl(element.props.src)
        console.log('Processing React element image:', {
          original: element.props.src,
          normalized: normalizedSrc,
        })
        return React.cloneElement(element, {
          ...element.props,
          src: normalizedSrc,
          className: `object-cover w-full h-full ${element.props.className || ''}`,
        })
      }
    }

    return img
  })

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % processedImages.length)
  }

  const goToPrevious = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + processedImages.length) % processedImages.length
    )
  }

  return (
    <div className={`group relative aspect-[4/3] w-full ${className || ''}`}>
      <div className="relative h-full w-full overflow-hidden rounded-lg">
        {processedImages.map((imageElement, index) => (
          <div
            key={`slide-${index}`}
            className={`absolute h-full w-full transition-transform duration-300 ease-in-out ${
              index === currentIndex
                ? 'translate-x-0'
                : index < currentIndex
                  ? '-translate-x-full'
                  : 'translate-x-full'
            }`}
          >
            {React.cloneElement(imageElement as React.ReactElement<CustomImageProps>, {
              priority: index === currentIndex,
            })}
          </div>
        ))}
      </div>
      {processedImages.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {processedImages.map((_, index) => (
              <button
                key={`dot-${index}`}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
