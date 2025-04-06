'use client'

import { useEffect, useRef, useState } from 'react'
import BlogTeaser from './blog-teaser'

interface Post {
  slug: string
  date: string
  title: string
  summary: string
  tags: string[]
  images?: string | string[]
  draft?: boolean
}

interface BlogListProps {
  posts: Post[]
}

export default function BlogList({ posts }: BlogListProps) {
  const [scrollY, setScrollY] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div ref={listRef} className="mx-auto max-w-7xl px-6 pb-32">
      <div className="w-full">
        {posts.map((post, index) => (
          <BlogTeaser
            key={post.slug}
            post={post}
            index={index}
            scrollY={scrollY}
            totalPosts={posts.length}
          />
        ))}
      </div>
    </div>
  )
}
