'use client'

import { useEffect, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { MessageSquareReply } from 'lucide-react'

interface Comment {
  id: number
  body: string
  user: {
    login: string
    avatar_url: string
  }
  created_at: string
  issue_url: string
  issue_id?: number
}

export default function AdminCommentManager() {
  const [comments, setComments] = useState<Comment[]>([])
  const [reply, setReply] = useState('')
  const [selectedIssue, setSelectedIssue] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchComments = async () => {
      const res = await fetch('/api/github-comments')
      const data = await res.json()
      const grouped = data.map((c: Comment) => ({
        ...c,
        issue_id: parseInt(c.issue_url.split('/').pop() || '0'),
      }))
      setComments(grouped)
    }
    fetchComments()
  }, [])

  const handleReply = async () => {
    if (!selectedIssue || !reply.trim()) return
    setLoading(true)

    const res = await fetch('/api/github-comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issue_number: selectedIssue, message: reply.trim() }),
    })

    if (res.ok) {
      setReply('')
      alert('Antwort gesendet ✅')
    } else {
      alert('Fehler beim Antworten ❌')
    }
    setLoading(false)
  }

  const groupedComments = comments.reduce((acc: Record<number, Comment[]>, comment) => {
    if (!comment.issue_id) return acc
    if (!acc[comment.issue_id]) acc[comment.issue_id] = []
    acc[comment.issue_id].push(comment)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">💬 Blog-Kommentare verwalten</h1>
      {Object.entries(groupedComments).map(([issueId, group]) => (
        <div key={issueId} className="rounded border bg-white p-4 shadow">
          <h2 className="mb-2 text-sm font-semibold text-gray-600">📝 Issue #{issueId}</h2>
          <ul className="space-y-4">
            {group.map((comment, idx) => (
              <li
                key={comment.id}
                className={`relative rounded border p-3 transition ${
                  idx > 0
                    ? 'ml-6 border-l-4 border-blue-200 bg-blue-50 before:absolute before:top-4 before:left-[-24px] before:h-4 before:w-4 before:rounded-full before:border before:border-blue-300 before:bg-white'
                    : ''
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <img
                    src={comment.user.avatar_url}
                    alt="avatar"
                    className="h-6 w-6 rounded-full"
                  />
                  <strong>{comment.user.login}</strong>
                  <span className="text-sm text-gray-500">
                    ({new Date(comment.created_at).toLocaleString()})
                  </span>
                </div>
                <p className="whitespace-pre-line text-gray-800">{comment.body}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Antwort verfassen…"
            />
            <Button
              onClick={() => setSelectedIssue(Number(issueId))}
              disabled={loading || !reply.trim()}
            >
              {loading && selectedIssue === Number(issueId) ? (
                <span className="flex items-center gap-2">
                  <MessageSquareReply className="h-4 w-4 animate-pulse" /> Antwort wird gesendet…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <MessageSquareReply className="h-4 w-4" /> Antwort senden
                </span>
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
