'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, useInView } from 'framer-motion'
import { Tags, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Define the formatDate function
const formatDate = (dateString: string, locale: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString(locale, options)
}

interface Post {
  slug: string
  date: string
  title: string
  summary: string
  tags: string[]
  images?: string | string[]
  draft?: boolean
}

// Seeded random number generator
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

const colors = [
  '#00B2FF',
  '#E6C288',
  '#00FF7F',
  '#9333ea',
  '#14b8a6',
  '#f97316',
  '#E6C288',
  '#22c55e',
]

const BlogPost = ({ post, index }: { post: Post; index: number }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.01 })
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const getPosition = useMemo(() => {
    if (isMobile) {
      return {
        top: `${index * 420}px`,
        left: 'calc(50% - 140px)', // Center the card (half of the card width)
        zIndex: 10 - (index % 5),
        rotate: 0,
      }
    }

    const isLeft = index % 2 === 0
    const verticalOffset = index * 300 - (index > 0 ? index * 50 : 0)
    const horizontalBase = isLeft ? 10 : 50
    const horizontalVariation = (index % 4) * 3
    const rotation = isLeft ? ((index % 10) - 5) * 0.3 : ((index % 10) - 5) * -0.3

    return {
      top: `${verticalOffset}px`,
      left: `${isLeft ? horizontalBase + horizontalVariation : horizontalBase + horizontalVariation}%`,
      zIndex: 10 - (index % 5),
      rotate: rotation,
    }
  }, [index, isMobile])

  const position = getPosition
  const color = colors[index % colors.length]

  return (
    <motion.div
      ref={ref}
      className="absolute w-[280px] cursor-pointer overflow-hidden rounded-xl border-4 bg-white shadow-lg md:w-[320px]"
      style={{
        top: position.top,
        left: position.left,
        transform: isMobile ? 'none' : 'translateX(-50%)',
        rotate: `${position.rotate}deg`,
        zIndex: position.zIndex,
        transformOrigin: 'center center',
        borderColor: color,
      }}
      initial={{ opacity: 50, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{
        scale: 1.03,
        rotate: 0,
        zIndex: 50,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        transition: { duration: 0.2 },
      }}
      onClick={() => router.push(`/tiny-house/${post.slug}`)}
    >
      <div className="relative h-40">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${post.images || '/placeholder.svg'})` }}
        />
      </div>
      <div className="flex flex-col justify-between space-y-2 p-4 md:space-y-2">
        {/* Füge auf mobilen Geräten mehr Abstand zwischen den Elementen hinzu */}
        <div>
          <h2 className="mb-2 line-clamp-2 text-lg font-bold">{post.title}</h2>
          <p className="text-sm text-gray-600">{post.summary}</p>
        </div>
        <div className="mt-4">
          <button
            className="flex w-full items-center justify-center rounded py-1.5 text-sm font-medium text-white"
            style={{ backgroundColor: color, cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation() // Verhindert, dass der Klick auf den Button das Teaser-Click-Event auslöst
              router.push(`/tiny-house/${post.slug}`)
            }}
          >
            Weiterlesen <ChevronRight size={14} className="ml-1" />
          </button>
        </div>
      </div>
      <div
        className="absolute -top-3 -right-3 size-6 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div
        className="absolute -bottom-3 -left-3 size-6 rounded-full"
        style={{ backgroundColor: color }}
      />
    </motion.div>
  )
}

export default function BlogPostList({ posts }: { posts: Post[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ height: `${posts.length * 350}px` }} // Feste Höhe basierend auf der Anzahl der Posts
      >
        <div className="absolute top-0 bottom-0 left-1/2 z-0 w-0.5 bg-gradient-to-b from-[#00B2FF] via-[#00FF7F] to-[#E6C288]" />
        {posts.map((post, index) => (
          <div key={post.slug} className="flex justify-center">
            <BlogPost post={post} index={index} />
          </div>
        ))}
        {[...Array(10)].map((_, i) => {
          const top = i * ((posts.length * 350) / 10) // Passe die Höhe der Dekorationen an
          return (
            <motion.div
              key={`deco-${i}`}
              className="absolute left-1/2 size-4 -translate-x-1/2 transform rounded-full border-2 bg-white"
              style={{
                top: `${top}px`,
                borderColor: i % 3 === 0 ? '#00B2FF' : i % 3 === 1 ? '#00FF7F' : '#E6C288',
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.2,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
