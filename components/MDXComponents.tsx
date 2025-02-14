'use client'

import * as React from 'react'
import TOCInline from 'pliny/ui/TOCInline'
import Pre from 'pliny/ui/Pre'
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import Image from 'next/image'
import CustomLink from './Link'
import TableWrapper from './TableWrapper'
import { Galerie as GalerieComponent } from './MDXGallery'

// Erweiterte ImageProps für unsere CustomImage Komponente
interface CustomImageProps {
  src: string
  alt: string
  width?: string | number
  height?: string | number
  className?: string
}

interface MDXProps {
  children?: React.ReactNode
  src?: string
  alt?: string
  type?: string | React.ComponentType
  props?: Record<string, unknown>
  mdxType?: string
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

// Type Guard Funktionen
const isImageProps = (props: unknown): props is CustomImageProps => {
  return typeof props === 'object' && props !== null && 'src' in props
}

const isMDXProps = (props: unknown): props is MDXProps => {
  return typeof props === 'object' && props !== null
}

// Erweiterte Image Komponente
const CustomImage = ({ src, alt, width, height, className, ...props }: CustomImageProps) => {
  const imageUrl = normalizeImageUrl(src)
  console.log('CustomImage rendering with URL:', imageUrl) // Debug log

  const finalWidth = typeof width === 'string' ? Number.parseInt(width, 10) : width || 800
  const finalHeight = typeof height === 'string' ? Number.parseInt(height, 10) : height || 600

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

/**
 * groupConsecutiveImages: Gruppiert aufeinanderfolgende Bilder in einer Galerie
 */
const groupConsecutiveImages = (children: React.ReactNode[]): React.ReactNode[] => {
  const groups: React.ReactNode[] = []
  let currentGroup: React.ReactElement<CustomImageProps>[] = []

  const pushGroup = () => {
    if (currentGroup.length > 1) {
      console.log(
        'Creating gallery with images:',
        currentGroup.map((img) => img.props.src)
      ) // Debug log
      groups.push(
        <GalerieComponent
          key={`gallery-${currentGroup.map((img) => img.props.src).join('-')}`}
          images={currentGroup.map((img) =>
            React.cloneElement(img, {
              className: `${img.props.className || ''} w-full h-full`,
            })
          )}
        />
      )
    } else if (currentGroup.length === 1) {
      groups.push(currentGroup[0])
    }
    currentGroup = []
  }

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const props = child.props as MDXProps

      if (child.type === CustomImage || isImageProps(props)) {
        console.log('Found image:', props.src) // Debug log
        currentGroup.push(child as React.ReactElement<CustomImageProps>)
      } else if (
        child.type === 'p' &&
        props.children &&
        React.Children.toArray(props.children).some(
          (c) =>
            React.isValidElement(c) &&
            (c.type === CustomImage || (isMDXProps(c.props) && isImageProps(c.props)))
        )
      ) {
        // Handle images wrapped in paragraphs
        React.Children.forEach(props.children, (grandChild) => {
          if (
            React.isValidElement(grandChild) &&
            (grandChild.type === CustomImage ||
              (isMDXProps(grandChild.props) && isImageProps(grandChild.props)))
          ) {
            currentGroup.push(grandChild as React.ReactElement<CustomImageProps>)
          }
        })
      } else {
        pushGroup()
        groups.push(child)
      }
    } else {
      pushGroup()
      if (child !== null && child !== undefined) {
        groups.push(child)
      }
    }
  })

  pushGroup()
  return groups
}

// MDX Wrapper Component
const MDXWrapper = ({ children }: { children: React.ReactNode }) => {
  console.log('MDXWrapper received children count:', React.Children.count(children)) // Debug log
  const flatChildren = React.Children.toArray(children).filter(
    (child) => child !== null && (typeof child !== 'string' || child.trim() !== '')
  )
  const processed = groupConsecutiveImages(flatChildren)
  console.log('Processed children count:', processed.length) // Debug log
  return <>{processed}</>
}

type GalleryImage = string | React.ReactElement<CustomImageProps> | { src: string; alt?: string }

// Angepasste Galerie-Komponente für MDX
const MDXGalerie = (props: { images: GalleryImage[] }) => {
  console.log('MDXGalerie props received:', props) // Debug log

  // Konvertiere die Bilder in das richtige Format
  const processedImages = React.useMemo(() => {
    if (!props.images || !Array.isArray(props.images)) {
      console.warn('MDXGalerie: Invalid or missing images prop')
      return []
    }

    return props.images.map((img, index): React.ReactElement<CustomImageProps> => {
      if (React.isValidElement(img)) {
        return img as React.ReactElement<CustomImageProps>
      }

      // Wenn es ein einfaches Objekt ist, erstelle ein CustomImage
      if (typeof img === 'object' && 'src' in img) {
        return (
          <CustomImage
            key={`gallery-image-${index}`}
            src={img.src}
            alt={img.alt || `Gallery image ${index + 1}`}
          />
        )
      }

      // Wenn es ein String ist (URL), erstelle ein CustomImage
      if (typeof img === 'string') {
        return (
          <CustomImage
            key={`gallery-image-${index}`}
            src={img}
            alt={`Gallery image ${index + 1}`}
          />
        )
      }

      console.warn('Invalid image object:', img)
      return <CustomImage key={`gallery-image-${index}`} src="/placeholder.svg" alt="Placeholder" />
    })
  }, [props.images])

  return <GalerieComponent images={processedImages} />
}

// MDX Components mit korrekter Typisierung
const mdxComponents = {
  Image: CustomImage,
  img: CustomImage,
  Galerie: MDXGalerie,
  wrapper: MDXWrapper,
  TOCInline,
  pre: Pre,
  a: CustomLink,
  table: TableWrapper,
  BlogNewsletterForm,
} as MDXComponents

export { mdxComponents as components, GalerieComponent as Galerie }
export default mdxComponents
