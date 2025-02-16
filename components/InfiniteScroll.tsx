'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
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

interface InfiniteScrollProps {
  initialPosts: Post[]
  allPosts: Post[]
}

export function InfiniteScroll({ initialPosts, allPosts }: InfiniteScrollProps) {
  // Filter draft posts once at component initialization
  const filteredAllPosts = allPosts.filter((post) => post.draft !== true)
  const filteredInitialPosts = initialPosts.filter((post) => post.draft !== true)

  const [posts, setPosts] = useState(filteredInitialPosts)
  const [currentPage, setCurrentPage] = useState(1)
  const loadMoreRef = useRef(null)
  const POSTS_PER_PAGE = 9

  // Memoize the function to get next posts
  const getNextPosts = useCallback(
    (page: number) => {
      const startIndex = page * POSTS_PER_PAGE
      const endIndex = startIndex + POSTS_PER_PAGE
      return filteredAllPosts.slice(startIndex, endIndex)
    },
    [filteredAllPosts]
  )

  // Load more posts
  const loadMorePosts = useCallback(() => {
    const nextPosts = getNextPosts(currentPage)
    if (nextPosts.length === 0) return

    setPosts((prevPosts) => [...prevPosts, ...nextPosts])
    setCurrentPage((prev) => prev + 1)
  }, [currentPage, getNextPosts])

  // Setup intersection observer
  useEffect(() => {
    if (!loadMoreRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting && posts.length < filteredAllPosts.length) {
          loadMorePosts()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [posts.length, filteredAllPosts.length, loadMorePosts])

  // Wenn keine initialen Posts vorhanden sind, render nichts
  if (filteredInitialPosts.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {posts.map((post, idx) => {
          const { slug, date, title, summary, images } = post
          const imageUrl = typeof images === 'string' ? images : null

          return (
            <motion.article
              key={slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.3,
                delay: Math.min(idx * 0.05, 0.3),
              }}
              className="group relative transform overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:bg-gray-800"
            >
              <Link href={`/tiny-house/${slug}`} className="absolute inset-0 z-10" />
              {imageUrl && (
                <div className="aspect-video overflow-hidden">
                  <Image
                    src={imageUrl || '/placeholder.svg'}
                    alt={title}
                    width={700}
                    height={475}
                    className="h-full w-full transform object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="eager"
                    priority={idx < 6}
                  />
                </div>
              )}
              <div className="p-6">
                <time className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(date, siteMetadata.locale)}
                </time>
                <h2 className="group-hover:text-primary-500 dark:group-hover:text-primary-400 mt-2 text-xl font-bold text-gray-900 transition-colors dark:text-white">
                  {title}
                </h2>
                <p className="mt-3 line-clamp-3 text-gray-600 dark:text-gray-300">{summary}</p>
                <Link
                  href={`/tiny-house/${slug}`}
                  className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 mt-4 inline-flex items-center"
                >
                  Lesen <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </motion.article>
          )
        })}
      </AnimatePresence>

      {/* Loading trigger element - nur anzeigen wenn es noch mehr Posts gibt */}
      {posts.length < filteredAllPosts.length && (
        <div ref={loadMoreRef} className="col-span-full h-1" />
      )}
    </div>
  )
}
