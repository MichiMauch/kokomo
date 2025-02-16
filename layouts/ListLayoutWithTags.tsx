'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { slug } from 'github-slugger'
import { formatDate } from 'pliny/utils/formatDate'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import tagData from 'app/tag-data.json'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { ChevronRight, Tags, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { poppins } from '../lib/fonts'

interface PaginationProps {
  totalPages: number
  currentPage: number
}
interface ListLayoutProps {
  posts: CoreContent<Blog>[]
  title: string
  initialDisplayPosts?: CoreContent<Blog>[]
  pagination?: PaginationProps
  maxDisplay?: number // Hinzufügen von maxDisplay
}

function Pagination({ totalPages, currentPage }: PaginationProps) {
  const pathname = usePathname()
  if (!pathname) return null
  const segments = pathname.split('/')
  const lastSegment = segments[segments.length - 1]
  const basePath = pathname
    .replace(/^\//, '') // Remove leading slash
    .replace(/\/page\/\d+$/, '') // Remove any trailing /page
  console.log(pathname)
  console.log(basePath)
  const prevPage = currentPage - 1 > 0
  const nextPage = currentPage + 1 <= totalPages

  return (
    <div className="space-y-2 pt-6 pb-8 md:space-y-5">
      <nav className="flex justify-between">
        {!prevPage && (
          <button className="cursor-auto disabled:opacity-50" disabled={!prevPage}>
            Previous
          </button>
        )}
        {prevPage && (
          <Link
            href={currentPage - 1 === 1 ? `/${basePath}/` : `/${basePath}/page/${currentPage - 1}`}
            rel="prev"
          >
            Previous
          </Link>
        )}
        <span>
          {currentPage} of {totalPages}
        </span>
        {!nextPage && (
          <button className="cursor-auto disabled:opacity-50" disabled={!nextPage}>
            Next
          </button>
        )}
        {nextPage && (
          <Link href={`/${basePath}/page/${currentPage + 1}`} rel="next">
            Next
          </Link>
        )}
      </nav>
    </div>
  )
}

export default function ListLayoutWithTags({
  posts,
  title,
  initialDisplayPosts = [],
  pagination,
  maxDisplay = 10, // Standardwert für maxDisplay
}: ListLayoutProps) {
  const pathname = usePathname()
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  const sortedTags = tagKeys.sort((a, b) => tagCounts[b] - tagCounts[a])

  const displayPosts = initialDisplayPosts.length > 0 ? initialDisplayPosts : posts

  // Get all unique tags
  const allTags = Array.from(new Set(posts.flatMap((post) => post.tags)))
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Filter posts by selected tags and exclude drafts
  const filteredPosts = displayPosts
    .filter((post) => !post.draft) // Ausschließen von Entwürfen
    .filter(
      (post) => selectedTags.length === 0 || post.tags.some((tag) => selectedTags.includes(tag))
    )

  return (
    <>
      <div>
        <div className="pt-6 pb-6">
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:hidden sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
            {title}
          </h1>
        </div>
        <div className="flex sm:space-x-24">
          <div className="hidden h-full max-h-screen max-w-[280px] min-w-[280px] flex-wrap overflow-auto rounded-sm bg-gray-50 pt-5 shadow-md sm:flex dark:bg-gray-900/70 dark:shadow-gray-800/40">
            <div className="px-6 py-4">
              {pathname && pathname.startsWith('/tiny-house') ? (
                <h3 className="text-primary-500 font-bold uppercase">All Posts</h3>
              ) : (
                <Link
                  href={`/tiny-house`}
                  className="hover:text-primary-500 dark:hover:text-primary-500 font-bold text-gray-700 uppercase dark:text-gray-300"
                >
                  All Posts
                </Link>
              )}
              <ul>
                {sortedTags.map((t) => {
                  return (
                    <li key={t} className="my-3">
                      {pathname && decodeURI(pathname.split('/tags/')[1]) === slug(t) ? (
                        <h3 className="text-primary-500 inline px-3 py-2 text-sm font-bold uppercase">
                          {`${t} (${tagCounts[t]})`}
                        </h3>
                      ) : (
                        <Link
                          href={`/tags/${slug(t)}`}
                          className="hover:text-primary-500 dark:hover:text-primary-500 px-3 py-2 text-sm font-medium text-gray-500 uppercase dark:text-gray-300"
                          aria-label={`View posts tagged ${t}`}
                        >
                          {`${t} (${tagCounts[t]})`}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
          <div>
            {/* Tag Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 py-4 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80"
              style={{ scrollbarColor: '#05DE66 #E3F9ED', scrollbarWidth: 'thin' }}
            >
              <div className="scrollbar-thin scrollbar-thumb-primary-500 scrollbar-track-gray-200 dark:scrollbar-track-gray-700 mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-6 pb-2">
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
                    {tag}
                    {selectedTags.includes(tag) && <X className="ml-2 h-4 w-4" />}
                  </button>
                ))}
              </div>
            </motion.div>

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

              {/* Regular Posts Grid */}
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.slice(4, maxDisplay).map((post, idx) => {
                  const { slug, date, title, summary, images } = post
                  const imageUrl = typeof images === 'string' ? images : null

                  return (
                    <motion.article
                      key={slug}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
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
                        <p className="mt-3 line-clamp-3 text-gray-600 dark:text-gray-300">
                          {summary}
                        </p>
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
              </div>

              {/* View All Posts */}
              {posts.length > maxDisplay && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-12 text-center"
                >
                  <Link
                    href="/tiny-house"
                    className="bg-primary-500 hover:bg-primary-600 inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-medium text-white transition-colors"
                  >
                    View All Posts <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
