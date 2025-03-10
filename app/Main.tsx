'use client'

import { useState, useEffect } from 'react'
import Link from '@/components/Link'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'
import { NewsletterForm } from '@/components/NewsletterForm'
import Image from 'next/image'
import { motion, useScroll, useSpring } from 'framer-motion'
import { ChevronRight, Tags, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { poppins } from '../lib/fonts'
import tagData from 'app/tag-data.json'
import { InfiniteScroll } from '@/components/InfiniteScroll'

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
        isDark ? 'dark bg-gray-900' : 'bg-gray-50',
        poppins.variable
      )}
    >
      {/* Progress Bar */}
      <motion.div
        className="bg-primary-500 fixed top-0 right-0 left-0 z-50 h-1 origin-left"
        style={{ scaleX }}
      />

      {/* Header */}
      <div className="relative overflow-hidden px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 mx-auto max-w-7xl text-center"
        >
          <Image
            src="/static/images/logo.svg"
            alt={siteMetadata.headerTitle}
            width={500}
            height={125}
            className="mx-auto mb-6"
            priority
          />
          <p className="font-poppins mx-auto max-w-2xl text-xl text-black dark:text-gray-300">
            {siteMetadata.description}
          </p>
        </motion.div>

        {/* Floating shapes background */}
        <div
          className="absolute inset-0 z-0 overflow-hidden"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          }}
        >
          {[...Array(5)].map((_, i) => {
            const baseX = i === 0 ? 0 : i === 1 ? 25 : i === 2 ? 50 : i === 3 ? 75 : 90
            const baseY = i === 0 ? 10 : i === 1 ? 40 : i === 2 ? 20 : i === 3 ? 50 : 30
            return (
              <motion.div
                key={i}
                className="absolute rounded-full opacity-50 mix-blend-multiply blur-lg filter dark:opacity-40"
                initial={{
                  x: `${baseX}%`,
                  y: `${baseY}%`,
                }}
                animate={{
                  x: [`${baseX}%`, `${baseX + 15}%`, `${baseX - 15}%`, `${baseX}%`],
                  y: [`${baseY}%`, `${baseY - 15}%`, `${baseY + 15}%`, `${baseY}%`],
                  scale: [1, 1.3, 0.7, 1],
                }}
                transition={{
                  duration: 15 + i * 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                }}
                style={{
                  background:
                    i === 0
                      ? '#2CC7FF'
                      : i === 1
                        ? '#05DE66'
                        : i === 2
                          ? '#E9BA6B'
                          : i === 3
                            ? '#01ABE7'
                            : '#14A54D',
                  width: i === 1 || i === 2 ? '45vw' : '40vw',
                  height: i === 1 || i === 2 ? '45vw' : '40vw',
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Tag Filter */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 py-4 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80"
      >
        <div className="scrollbar scrollbar-w-2 scrollbar-thumb-primary-500 mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-6 pb-2">
          <Tags className="h-5 w-5" />
          {allTags.map((tag) => (
        <button
          key={tag}
          onClick={() =>
            setSelectedTags((prev) =>
          prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
            )
          }
          className={cn(
            'flex cursor-pointer items-center rounded-full px-4 py-1 text-sm whitespace-nowrap transition-all',
            selectedTags.includes(tag)
          ? 'bg-primary-500 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          )}
        >
          {/* Ersetze Bindestriche durch Leerzeichen in der Anzeige *
          </div>{`${tag.replace(/-/g, ' ')} (${tagCounts[tag]})`}
          {selectedTags.includes(tag) && <X className="ml-2 h-4 w-4" />}
        </button>
          ))}
        </div>
      </motion.div> */}

      {/* Posts Grid */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Featured Row */}
        {filteredPosts.length > 0 && (
          <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Featured Post */}
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="group relative flex transform flex-col overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl lg:col-span-2 dark:bg-gray-800"
            >
              <div className="flex h-full flex-col">
                <Link
                  href={`/tiny-house/${filteredPosts[0].slug}`}
                  className="relative aspect-[16/9] overflow-hidden"
                >
                  <Image
                    src={
                      typeof filteredPosts[0].images === 'string'
                        ? filteredPosts[0].images
                        : '/placeholder.svg'
                    }
                    alt={filteredPosts[0].title}
                    width={900}
                    height={510}
                    className="h-full w-full transform object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </Link>
                <div className="flex flex-1 flex-col justify-end p-4">
                  <time className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(filteredPosts[0].date, siteMetadata.locale)}
                  </time>
                  <Link href={`/tiny-house/${filteredPosts[0].slug}`}>
                    <h2 className="group-hover:text-primary-500 dark:group-hover:text-primary-400 mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                      {filteredPosts[0].title}
                    </h2>
                  </Link>
                  <Link
                    href={`/tiny-house/${filteredPosts[0].slug}`}
                    className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 mt-2 inline-flex items-center"
                  >
                    Lesen <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.article>

            {/* Recent Posts List */}
            <div className="flex h-full flex-col justify-between space-y-2">
              {filteredPosts.slice(1, 4).map((post, idx) => (
                <motion.article
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="group flex flex-1 transform flex-col justify-center rounded-2xl bg-white p-4 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:bg-gray-800"
                >
                  <time className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(post.date, siteMetadata.locale)}
                  </time>
                  <Link href={`/tiny-house/${post.slug}`}>
                    <h3 className="group-hover:text-primary-500 dark:group-hover:text-primary-400 mt-1 text-lg font-semibold text-gray-900 transition-colors dark:text-white">
                      {post.title}
                    </h3>
                  </Link>
                  <Link
                    href={`/tiny-house/${post.slug}`}
                    className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 mt-2 inline-flex items-center"
                  >
                    Lesen <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>
        )}

        {/* Infinite Scroll Posts */}
        <InfiniteScroll
          initialPosts={filteredPosts.slice(4, 13)}
          allPosts={filteredPosts.slice(4)}
        />
      </div>
    </div>
  )
}
