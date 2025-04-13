// AdminCommentManager.tsx
'use client'

import { useEffect, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { MessageSquareReply, CheckCircle, XCircle, Trash2, Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

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

  const showCustomToast = (message: string, success = true) => {
    toast.custom(() => (
      <div
        className={`${
          success ? 'bg-primary-500' : 'bg-red-600'
        } flex items-center gap-2 rounded px-4 py-2 text-sm font-medium text-white shadow`}
      >
        {success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />} {message}
      </div>
    ))
  }

  const handleReply = async () => {
    if (!selectedIssue || !selectedParentId || !reply.trim()) return
    setLoading(true)

    const resUser = await fetch('/api/github-user')
    const userData = await resUser.json()

    const cleanedReply = reply
      .split('\n')
      .filter((line) => !/^parent_id: \d+$/.test(line.trim()))
      .join('\n')
      .trim()

    const fullMessage = `[APPROVED]\n\n**${userData.name}** (${userData.email})\n\nparent_id: ${selectedParentId}\n\n${cleanedReply}`

    const res = await fetch('/api/github-comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issue_number: selectedIssue,
        message: fullMessage,
        parent_id: selectedParentId,
      }),
    })

    if (res.ok) {
      setReply('')
      showCustomToast('Antwort wurde erfolgreich gesendet ✅')
      const updated = await res.json()
      setComments((prev) => [...prev, { ...updated, issue_id: selectedIssue }])
    } else {
      showCustomToast('Fehler beim Antworten ❌', false)
    }

    setLoading(false)
  }

  const handleApprove = async (comment: Comment) => {
    const approvedBody = comment.body.replace('[PENDING]', '[APPROVED]')
    const res = await fetch('/api/github-comments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_id: comment.id, body: approvedBody }),
    })

    if (res.ok) {
      const updated = await res.json()
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, body: updated.body } : c))
      )
      showCustomToast('Kommentar freigegeben ✅')
    } else {
      showCustomToast('Fehler beim Freigeben ❌', false)
    }
  }

  const handleDelete = async (comment: Comment) => {
    const res = await fetch('/api/github-comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_id: comment.id }),
    })

    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== comment.id))
      showCustomToast('Kommentar gelöscht 🗑️')
    } else {
      showCustomToast('Fehler beim Löschen ❌', false)
    }
  }

  const handleEdit = async (comment: Comment) => {
    if (!editContent.trim()) return
    setSavingEdit(true)

    const res = await fetch('/api/github-comments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_id: comment.id, body: editContent.trim() }),
    })

    if (res.ok) {
      const updated = await res.json()
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, body: updated.body } : c))
      )
      setEditingId(null)
      setEditContent('')
      showCustomToast('Kommentar aktualisiert ✏️')
    } else {
      showCustomToast('Fehler beim Bearbeiten ❌', false)
    }

    setSavingEdit(false)
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
      {Object.entries(groupedComments)
        .sort(([, a], [, b]) => {
          const newestA = Math.max(...a.map((c) => new Date(c.created_at).getTime()))
          const newestB = Math.max(...b.map((c) => new Date(c.created_at).getTime()))
          return newestB - newestA
        })
        .map(([issueId, group]) => (
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
                  {editingId === comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="text-sm"
                      />
                      <button
                        onClick={() => handleEdit(comment)}
                        className="bg-primary-500 hover:bg-primary-300 cursor-pointer rounded px-3 py-1 text-sm text-white"
                      >
                        {savingEdit ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Speichern…
                          </span>
                        ) : (
                          '💾 Speichern'
                        )}
                      </button>
                    </div>
                  ) : (
                    <p className="whitespace-pre-line text-gray-800">{comment.body}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {comment.body.includes('[PENDING]') && (
                      <button
                        onClick={() => handleApprove(comment)}
                        className="cursor-pointer rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-500"
                      >
                        ✅ Freigeben
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(comment)}
                      className="cursor-pointer rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-500"
                    >
                      🗑️ Löschen
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(comment.id)
                        setEditContent(comment.body)
                      }}
                      className="cursor-pointer rounded bg-yellow-600 px-3 py-1 text-sm text-white hover:bg-yellow-500"
                    >
                      ✏️ Bearbeiten
                    </button>
                    <button
                      onClick={() => {
                        setSelectedIssue(Number(issueId))
                        setSelectedParentId(comment.id)
                        setReply('')
                      }}
                      className="bg-primary-500 hover:bg-primary-300 cursor-pointer rounded px-3 py-1 text-sm text-white"
                    >
                      💬 Antworten
                    </button>
                    {selectedParentId === comment.id && (
                      <div className="mt-4 w-full space-y-2">
                        <Textarea
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          placeholder="Antwort verfassen…"
                        />
                        <Button
                          onClick={async () => {
                            await handleReply()
                            setSelectedParentId(null)
                            setSelectedIssue(null)
                          }}
                          disabled={loading || !reply.trim()}
                          className="bg-primary-500 hover:bg-primary-300 cursor-pointer"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <MessageSquareReply className="h-4 w-4 animate-pulse" /> Antwort wird
                              gesendet…
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <MessageSquareReply className="h-4 w-4" /> Antwort senden
                            </span>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  )
}
