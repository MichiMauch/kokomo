'use client'

import { useState, useEffect } from 'react'
import Link from '@/components/Link'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'
import Image from 'next/image'
import { motion, useScroll, useSpring } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { poppins } from '../lib/fonts'
import tagData from 'app/tag-data.json'
import { InfiniteScroll } from '@/components/InfiniteScroll'
import BlogPostList from '@/components/blog-post-list'
import AnimatedBackground from '@/components/animated-background'
import AuthorProfile from '@/components/author-profile'

interface Post {
  slug: string
  date: string
  title: string
  summary: string
  tags: string[]
  images?: string | string[]
  draft?: boolean
}

export default function Home({ posts }: { posts: Post[] }) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isDark, setIsDark] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Get all tags from tag-data.json
  const tagCounts = tagData as Record<string, number>
  const allTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a])

  // Scroll progress indicator
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  // Mouse move effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Filter posts by selected tags and exclude drafts
  const filteredPosts = posts
    .filter((post) => post.draft !== true)
    .filter((post) => {
      // Wenn keine Tags ausgewählt sind, zeige alle Posts
      if (selectedTags.length === 0) return true

      // Ein Post wird angezeigt, wenn er mindestens einen der ausgewählten Tags hat
      return selectedTags.some((tag) => post.tags?.includes(tag))
    })

  // Nur fortfahren wenn gefilterte Posts vorhanden sind
  if (filteredPosts.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center text-gray-500 dark:text-gray-400">
        Keine Artikel verfügbar
      </div>
    )
  }

  return (
    <div
      className={cn(
        'min-h-screen transition-colors duration-500',
        isDark ? 'dark bg-gray-900' : '',
        poppins.variable
      )}
    >
      <AnimatedBackground />
      {/* Progress Bar */}
      <motion.div
        className="bg-primary-500 fixed top-0 right-0 left-0 z-50 h-1 origin-left"
        style={{ scaleX }}
      />
      {/* Author Profile */}
      <AuthorProfile />
      {/* Content */}
      <div className="mx-auto w-full max-w-7xl bg-transparent px-6 py-12">
        {' '}
        {/* Entferne mb-auto */}
        <BlogPostList posts={filteredPosts} />
      </div>
    </div>
  )
}
