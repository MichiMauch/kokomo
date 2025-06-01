'use client'

import React from 'react'
import ImageList from '@mui/material/ImageList'
import ImageListItem from '@mui/material/ImageListItem'
import Box from '@mui/material/Box'
import Modal from '@mui/material/Modal'

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

  const decodedSrc = src.replace(/%7B/g, '{').replace(/%7D/g, '}')

  return decodedSrc
    .replace('{IMAGE_PATH}', process.env.NEXT_PUBLIC_CLOUDFLARE_R2_URL || '')
    .replace('%7BIMAGE_PATH%7D', process.env.NEXT_PUBLIC_CLOUDFLARE_R2_URL || '')
    .replace(/([^:]\/)\/+/g, '$1')
}

// Angepasste srcset Funktion ohne zusätzliche Spacing-Parameter
function srcset(image: string, size: number, rows = 1, cols = 1) {
  return {
    src: image,
    srcSet: `${image} 2x`,
  }
}

const getImagePattern = (index: number) => {
  const patterns = [
    { rows: 2, cols: 2 },
    { rows: 1, cols: 1 },
    { rows: 1, cols: 1 },
    { rows: 1, cols: 2 },
    { rows: 1, cols: 2 },
    { rows: 2, cols: 2 },
    { rows: 1, cols: 1 },
    { rows: 1, cols: 1 },
    { rows: 2, cols: 2 },
    { rows: 1, cols: 1 },
    { rows: 1, cols: 1 },
    { rows: 1, cols: 2 },
    { rows: 1, cols: 1 },
    { rows: 1, cols: 1 },
    { rows: 1, cols: 2 },
    { rows: 2, cols: 2 },
    { rows: 1, cols: 1 },
    { rows: 1, cols: 1 },
    { rows: 1, cols: 2 },
  ]
  return patterns[index % patterns.length]
}

export function Galerie({ images = [], className }: GalleryProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null)

  if (!images || images.length === 0) {
    console.warn('Galerie: No images provided')
    return null
  }

  const processedImages = images
    .map((img, index) => {
      let src = ''
      let alt = ''

      if (typeof img === 'string') {
        src = normalizeImageUrl(img)
        alt = `Image ${index + 1}`
      } else if ('src' in img && typeof img.src === 'string') {
        src = normalizeImageUrl(img.src)
        alt = img.alt || `Image ${index + 1}`
      } else if (React.isValidElement(img)) {
        const element = img as React.ReactElement<CustomImageProps>
        if (element.props?.src) {
          src = normalizeImageUrl(element.props.src)
          alt = element.props.alt || `Image ${index + 1}`
        }
      }

      const pattern = getImagePattern(index)

      return {
        img: src,
        title: alt,
        rows: pattern.rows,
        cols: pattern.cols,
      }
    })
    .filter((img) => img.img)

  const handleOpen = (imageSrc: string) => {
    setSelectedImage(imageSrc)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setSelectedImage(null)
  }

  return (
    <div className={className}>
      <ImageList
        sx={{
          width: '100%',
          height: 'auto',
          overflow: 'visible',
          m: '-1px', // Negativer Margin um Gaps zu kompensieren
          p: 0,
          gap: 0,
          '& .MuiImageListItem-root': {
            overflow: 'hidden',
            p: 0,
            m: 0,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              border: '1px solid transparent',
            },
            '& img': {
              width: 'calc(100% + 2px)', // Leicht übergroß um Gaps zu vermeiden
              height: 'calc(100% + 2px)',
              margin: '-1px',
              objectFit: 'cover',
              display: 'block',
              borderRadius: 0,
            },
          },
        }}
        variant="quilted"
        cols={4}
        rowHeight={121}
      >
        {processedImages.map((item, index) => (
          <ImageListItem
            key={item.img + index}
            cols={item.cols}
            rows={item.rows}
            sx={{
              cursor: 'pointer',
              overflow: 'hidden',
            }}
            onClick={() => handleOpen(item.img)}
          >
            <img
              {...srcset(item.img, 121, item.rows, item.cols)}
              alt={item.title}
              loading="lazy"
              style={{
                width: 'calc(100% + 2px)',
                height: 'calc(100% + 2px)',
                margin: '-1px',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </ImageListItem>
        ))}
      </ImageList>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="image-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
          },
        }}
      >
        <Box
          sx={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            outline: 'none',
            position: 'relative',
            '& img': {
              borderRadius: '8px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            },
          }}
          onClick={handleClose}
        >
          {selectedImage && (
            <img
              src={selectedImage || '/placeholder.svg'}
              alt="Full size"
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
              }}
            />
          )}
        </Box>
      </Modal>
    </div>
  )
}
