'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'

// Definiere einen Typ für die Post-Daten
interface Post {
  path: string
  sha: string
  name: string
  title: string
  date: string
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function AdminPostList() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingPath, setDeletingPath] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/admin/api/list-posts')
        const data = await res.json()
        setPosts(data.files || [])
      } catch (err) {
        console.error('Fehler beim Laden der Posts', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  const deletePostNow = async (post: Post) => {
    try {
      setDeletingPath(post.path)
      const res = await fetch('/admin/api/delete-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: post.path,
          sha: post.sha,
          message: `🗑️ Delete: ${post.name}`,
        }),
      })

      if (res.ok) {
        toast.success('Beitrag gelöscht')
        setPosts((prev) => prev.filter((p) => p.path !== post.path))
      } else {
        toast.error('Fehler beim Löschen')
      }
    } catch (err) {
      toast.error('Fehler beim Löschen')
    } finally {
      setDeletingPath(null)
    }
  }

  const handleDeleteClick = (post: Post) => {
    toast(`Willst du diesen Beitrag wirklich löschen?`, {
      description: post.title,
      style: { backgroundColor: 'red', color: 'white' },
      action: {
        label: 'Ja, löschen',
        onClick: () => deletePostNow(post),
      },
    })
  }

  if (loading) return <p className="p-4">⏳ Beiträge werden geladen...</p>

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-bold">🗂️ Blogposts verwalten</h1>
      <ul className="space-y-3">
        {posts.map((post) => (
          <li key={post.path} className="flex items-center justify-between rounded border p-3">
            <div>
              <p className="text-base font-semibold text-gray-900">{post.title}</p>
              <p className="text-sm text-gray-600">{formatDate(post.date)}</p>
              <p className="text-xs text-gray-400">{post.name}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push(`/admin/posts/${post.name.replace(/\.mdx$/, '')}`)}
                className="cursor-pointer transition hover:bg-gray-100 hover:text-blue-600"
              >
                ✏️ Bearbeiten
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer text-gray-600 hover:text-red-600"
                onClick={() => handleDeleteClick(post)}
                disabled={deletingPath === post.path}
              >
                {deletingPath === post.path ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
