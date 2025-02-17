'use client'

import type React from 'react'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Divider,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material'
import { Reply as ReplyIcon } from '@mui/icons-material'
import { getOrCreateIssue, createIssueComment, getIssueComments } from '../lib/github'
import { formatDateTime } from '../utils/date-formatter'
import siteMetadata from '@/data/siteMetadata'
import CommentForm from './CommentForm'
import { getAvatarUrl } from '../utils/avatar'

interface CommentsProps {
  slug: string
}

interface Comment {
  id: number
  body: string
  user: {
    login: string
    avatar_url: string
  }
  created_at: string
}

interface ParsedComment {
  id: number
  name: string
  email?: string
  body: string
  date: string
  avatar: string
  parentId?: number
  replies?: ParsedComment[]
}

export default function Comments({ slug }: CommentsProps) {
  const [comments, setComments] = useState<ParsedComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [showSnackbar, setShowSnackbar] = useState(false)
  const [submitterName, setSubmitterName] = useState('')

  const loadComments = useCallback(async () => {
    try {
      const issue = await getOrCreateIssue(slug)
      const fetchedComments = await getIssueComments(issue.number)

      const parsedComments = await Promise.all(
        fetchedComments.map((comment) => parseComment(comment))
      )

      const validComments = parsedComments.filter(
        (comment): comment is NonNullable<ParsedComment> => comment !== null
      )
      setComments(buildCommentHierarchy(validComments))
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleSubmit = useCallback(
    async (formData: { name: string; email: string; comment: string }) => {
      setIsSubmitting(true)
      try {
        const issue = await getOrCreateIssue(slug)
        await createIssueComment(issue.number, {
          ...formData,
          parentId: replyingTo || undefined,
        })
        setReplyingTo(null)
        await loadComments()
        setSubmitterName(formData.name)
        setShowSnackbar(true)
      } catch (error) {
        alert('Failed to post comment')
      } finally {
        setIsSubmitting(false)
      }
    },
    [slug, replyingTo, loadComments]
  )

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return
    }
    setShowSnackbar(false)
  }

  const CommentComponent = useCallback(
    ({ comment, depth = 0 }: { comment: ParsedComment; depth?: number }) => (
      <Box ml={depth * 4}>
        <Box mb={2} p={2} bgcolor="action.hover" borderRadius={1}>
          <Box display="flex" alignItems="center" mb={1}>
            <Avatar src={comment.avatar} alt={comment.name} sx={{ width: 32, height: 32, mr: 1 }} />
            <Box>
              <Typography variant="subtitle2">{comment.name}</Typography>
              <Typography variant="caption" color="textSecondary">
                {formatDateTime(comment.date, siteMetadata.locale)}
              </Typography>
            </Box>
            <IconButton size="small" sx={{ ml: 'auto' }} onClick={() => setReplyingTo(comment.id)}>
              <ReplyIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography variant="body2">{comment.body}</Typography>

          {replyingTo === comment.id && (
            <Box mt={2}>
              <CommentForm
                onSubmit={handleSubmit}
                isReply
                onCancel={() => setReplyingTo(null)}
                isSubmitting={isSubmitting}
              />
            </Box>
          )}
        </Box>

        {comment.replies?.map((reply) => (
          <CommentComponent key={reply.id} comment={reply} depth={depth + 1} />
        ))}
      </Box>
    ),
    [replyingTo, isSubmitting, handleSubmit]
  )

  return (
    <>
      <Card>
        <CardContent>
          {isLoading ? (
            <Box textAlign="center" py={3}>
              <Typography>Kommentare laden...</Typography>
            </Box>
          ) : (
            <Box mb={4}>
              {comments.length === 0 ? (
                <Typography color="textSecondary" textAlign="center">
                  Es gibt hier noch keine Kommentare. Sei die erste Person die Kommentiert! <br />
                  Die E-Mail Adresse wird nicht veröffentlicht.
                </Typography>
              ) : (
                comments.map((comment) => <CommentComponent key={comment.id} comment={comment} />)
              )}
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {!replyingTo && (
            <>
              <CommentForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            </>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          <Typography variant="body2">
            Vielen Dank für deinen Kommentar{submitterName ? `, ${submitterName}` : ''}. Nach einer
            Prüfung wird dieser freigeschaltet. Weiterhin noch viel Spass auf kokomo.house.
          </Typography>
        </Alert>
      </Snackbar>
    </>
  )
}

async function parseComment(comment: Comment): Promise<ParsedComment | null> {
  if (!comment.body.includes('[APPROVED]')) {
    return null
  }

  const lines = comment.body.split('\n').filter((line) => line.trim())
  const userLine = lines.find((line) => line.includes('**') && line.includes('@'))

  if (!userLine) {
    return null
  }

  const nameMatch = userLine.match(/\*\*(.*?)\*\*/)
  const emailMatch = userLine.match(/$$(.*?)$$/)
  const name = nameMatch ? nameMatch[1] : comment.user.login
  const email = emailMatch ? emailMatch[1] : undefined

  const parentIdMatch = comment.body.match(/parent_id: (\d+)/)
  const parentId = parentIdMatch ? Number.parseInt(parentIdMatch[1]) : undefined

  const commentLines = lines.filter(
    (line) =>
      !line.includes('[APPROVED]') &&
      !line.includes('**') &&
      !line.includes('@') &&
      !line.includes('parent_id:')
  )
  const commentText = commentLines.join('\n').trim()

  const avatar = await getAvatarUrl(name, email)

  return {
    id: comment.id,
    name,
    email,
    body: commentText,
    date: comment.created_at,
    avatar,
    parentId,
  }
}

function buildCommentHierarchy(flatComments: ParsedComment[]): ParsedComment[] {
  const commentMap = new Map<number, ParsedComment>()
  const rootComments: ParsedComment[] = []

  flatComments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] })
  })

  flatComments.forEach((comment) => {
    const commentWithReplies = commentMap.get(comment.id)!
    if (comment.parentId && commentMap.has(comment.parentId)) {
      const parent = commentMap.get(comment.parentId)!
      parent.replies = parent.replies || []
      parent.replies.push(commentWithReplies)
    } else {
      rootComments.push(commentWithReplies)
    }
  })

  return rootComments
}
