'use client'

import type React from 'react'
import { useState } from 'react'
import {
  Button,
  TextField,
  Box,
  Typography,
  Snackbar,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material'
import MailOutlineIcon from '@mui/icons-material/MailOutline'

interface NewsletterFormProps {
  align?: 'left' | 'center'
}

export function NewsletterForm({ align = 'center' }: NewsletterFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  const handleClose = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ein Fehler ist aufgetreten')
      }

      setSnackbar({
        open: true,
        message: data.message,
        severity: 'success',
      })
      setEmail('')
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        severity: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  // Wrapper styles based on alignment
  const wrapperStyles = {
    width: '100%',
    ...(align === 'center'
      ? {
          display: 'flex',
          justifyContent: 'center',
        }
      : {}),
  }

  return (
    <div style={wrapperStyles}>
      <Paper
        elevation={0}
        sx={{
          py: 4,
          px: align === 'center' ? 4 : 0,
          backgroundColor: 'transparent',
          width: align === 'center' ? 'auto' : '100%',
          maxWidth: align === 'center' ? 'sm' : 'none',
        }}
      >
        <Box textAlign={align} mb={3}>
          <Typography variant="h4" component="h3" gutterBottom>
            Newsletter abonnieren
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Abonniere doch den KOKOMO Newsletter, um über die neusten Inhalte informiert zu
            werden.{' '}
          </Typography>
        </Box>

        <form onSubmit={subscribe}>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              width: '100%',
            }}
          >
            <TextField
              fullWidth
              type="email"
              variant="outlined"
              placeholder="deine@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper',
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                minWidth: 'auto',
                px: 3,
                whiteSpace: 'nowrap',
                backgroundColor: '#05DE66',
                '&:hover': {
                  backgroundColor: '#04C65C',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <>
                  <MailOutlineIcon sx={{ mr: 1 }} />
                  Anmelden
                </>
              )}
            </Button>
          </Box>
        </form>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleClose}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    </div>
  )
}
