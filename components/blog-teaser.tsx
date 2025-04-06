'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { Calendar } from 'lucide-react'
import Link from '@/components/Link'
import { formatDate } from 'pliny/utils/formatDate'
import siteMetadata from '@/data/siteMetadata'

interface Post {
  slug: string
  date: string
  title: string
  summary: string
  tags: string[]
  images?: string | string[]
  draft?: boolean
}

interface BlogTeaserProps {
  post: Post
  index: number
  scrollY: number
  totalPosts: number
}

export default function BlogTeaser({ post, index, scrollY, totalPosts }: BlogTeaserProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [elementTop, setElementTop] = useState(0)
  const [elementHeight, setElementHeight] = useState(0)
  const [windowHeight, setWindowHeight] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false) // Initialize isMobile state

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    observer.observe(element)
    return () => observer.unobserve(element)
  }, [])

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const updatePosition = () => {
      const rect = element.getBoundingClientRect()
      setElementTop(rect.top + window.scrollY)
      setElementHeight(rect.height)
      setWindowHeight(window.innerHeight)
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Add a global style to ensure proper mobile layout
  useEffect(() => {
    // Only run on client side
    const style = document.createElement('style')
    style.innerHTML = `
      @media (max-width: 767px) {
        .blog-teaser-container > * {
          width: 100% !important;
          max-width: 100% !important;
          flex-basis: 100% !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const calculateParallax = () => {
    if (elementTop === 0) return 0

    const relativeScroll = scrollY - elementTop + windowHeight
    const percentScrolled = relativeScroll / (elementHeight + windowHeight * 0.5)

    return Math.max(0, Math.min(1, percentScrolled)) * 150
  }

  const parallaxValue = calculateParallax()

  const gradients = [
    { bg: 'from-emerald-500/65 to-teal-700/65', border: 'border-emerald-400/30' },
    { bg: 'from-blue-500/65 to-indigo-700/65', border: 'border-blue-400/30' },
    { bg: 'from-rose-500/65 to-pink-700/65', border: 'border-rose-400/30' },
    { bg: 'from-amber-500/65 to-orange-700/65', border: 'border-amber-400/30' },
    { bg: 'from-violet-500/65 to-purple-700/65', border: 'border-violet-400/30' },
    { bg: 'from-red-500/65 to-red-800/65', border: 'border-red-400/30' },
    { bg: 'from-cyan-500/65 to-sky-700/65', border: 'border-cyan-400/30' },
    { bg: 'from-lime-500/65 to-green-700/65', border: 'border-lime-400/30' },
  ]

  const colorIndex = index % gradients.length
  const gradient = gradients[colorIndex]

  const teaserStyle = {
    zIndex: totalPosts - index, // Reverse z-index so first items appear on top
    marginTop: index === 0 ? '0' : isMobile ? '-1rem' : '2rem',
    transform: isMobile ? 'none' : `translateY(${parallaxValue * 0.1}px)`,
  }

  return (
    <div
      ref={ref}
      className={`relative ${
        isMobile ? '!flex-basis-100 mb-16 min-h-[60vh] !w-full !max-w-full' : 'min-h-[70vh]'
      } w-full overflow-hidden rounded-2xl transition-all duration-700 md:min-h-[80vh] ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        ...teaserStyle,
        order: isMobile ? index : 'unset', // Ensure proper stacking order on mobile
        position: 'relative',
        display: 'block',
        width: '100%',
      }}
    >
      {/* Bild als Hintergrund ohne Overlay */}
      <div
        className="absolute inset-0 z-10 w-full"
        style={{
          transform: isMobile ? 'none' : `translateY(${parallaxValue * 0.1}px)`,
        }}
      >
        <Image
          src={typeof post.images === 'string' ? post.images : '/placeholder.svg'}
          alt={post.title}
          fill
          className="w-full object-cover"
          priority={index < 2}
        />
      </div>

      <div className="relative z-20 flex h-full w-full flex-col justify-center p-8 md:p-16">
        <div
          className="mx-auto w-full max-w-2xl"
          style={{
            transform: isMobile ? 'none' : `translateY(${parallaxValue * 0.2}px)`,
          }}
        >
          {/* Text-Box mit farbigem, transparentem Hintergrund */}
          <div
            className={`bg-gradient-to-br ${gradient.bg} rounded-xl p-6 shadow-xl backdrop-blur-sm md:p-8 ${gradient.border}`}
          >
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white/90 md:text-base">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(post.date, siteMetadata.locale)}</span>
            </div>
            <h2 className="mb-6 text-3xl font-bold text-white md:text-5xl">{post.title}</h2>
            <p className="text-lg text-white/90 md:text-xl">{post.summary}</p>
            <Link
              href={`/tiny-house/${post.slug}`}
              className="hover:bg-opacity-90 mt-8 inline-block rounded-full bg-white px-6 py-3 font-medium text-gray-900 transition-all"
            >
              Weiterlesen
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
