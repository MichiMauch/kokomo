'use client'

import type React from 'react'

import { useState, useCallback } from 'react'
import { Button, TextField, Box, Grid } from '@mui/material'

interface CommentFormProps {
  onSubmit: (data: { name: string; email: string; comment: string }) => Promise<void>
  isReply?: boolean
  onCancel?: () => void
  isSubmitting: boolean
}

export default function CommentForm({
  onSubmit,
  isReply,
  onCancel,
  isSubmitting,
}: CommentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    comment: '',
  })

  const [errors, setErrors] = useState({
    name: false,
    email: false,
    comment: false,
  })

  const validateForm = useCallback(() => {
    const newErrors = {
      name: !formData.name.trim(),
      email: !formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
      comment: !formData.comment.trim(),
    }
    setErrors(newErrors)
    return !Object.values(newErrors).some(Boolean)
  }, [formData])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!validateForm()) return

      try {
        await onSubmit(formData)
        setFormData({ name: '', email: '', comment: '' })
      } catch (error) {
        console.error('Failed to submit comment:', error)
      }
    },
    [formData, onSubmit, validateForm]
  )

  const handleChange = useCallback(
    (field: keyof typeof formData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }))
      },
    []
  )

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={handleChange('name')}
            error={errors.name}
            helperText={errors.name ? 'Name is required' : ''}
            disabled={isSubmitting}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="E-Mail"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            error={errors.email}
            helperText={errors.email ? 'Valid email is required' : ''}
            disabled={isSubmitting}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={isReply ? 'Deine Antwort' : 'Kommentar'}
            value={formData.comment}
            onChange={handleChange('comment')}
            error={errors.comment}
            helperText={errors.comment ? 'Comment is required' : ''}
            disabled={isSubmitting}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" gap={1}>
            {isReply && onCancel && (
              <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
                Abbrechen
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{
                backgroundColor: '#05DE66', // Hintergrundfarbe geändert
                '&:hover': {
                  backgroundColor: '#04C65C', // Hover-Farbe
                },
              }}
            >
              {isSubmitting
                ? 'Wird versendet...'
                : isReply
                  ? 'Antwort abschicken'
                  : 'Kommentar abschicken'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  )
}
