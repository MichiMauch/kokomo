'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2, BookOpen, Send, User } from 'lucide-react'
import PageTitle from '@/components/PageTitle'
import SectionContainer from '@/components/SectionContainer'
import Link from '@/components/Link'
import ReactMarkdown from 'react-markdown'
import Typewriter from '@/components/Typewriter'
import Image from 'next/image'

// Matomo Tracking-Typ
interface MatomoTracking {
  push: (args: [string, ...unknown[]]) => void
}

declare global {
  interface Window {
    _paq: MatomoTracking | undefined
  }
}

interface Source {
  title: string
  slug: string
}

interface Message {
  content: string
  role: 'user' | 'assistant'
  sources?: Source[]
  isTyping?: boolean
}

export default function KokobotPage() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      content:
        'Hallo! Ich bin KOKOBOT, dein Tiny House Assistent. Stelle mir eine Frage zu unseren Blogposts über Tiny Houses, nachhaltiges Leben oder Minimalismus.',
      role: 'assistant',
      isTyping: true,
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Überprüfen, ob derzeit Text getippt wird
  const isTypingInProgress = messages.some((msg) => msg.isTyping)

  const prevMessagesLengthRef = useRef(messages.length)
  const prevTypingStatusRef = useRef(isTypingInProgress)

  // Scroll-Funktion, die nur im Chat-Container scrollt
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const scrollHeight = chatContainerRef.current.scrollHeight
      chatContainerRef.current.scrollTo({
        top: scrollHeight,
        behavior: 'smooth',
      })
    }
  }

  useEffect(() => {
    // Scroll nur, wenn eine neue Nachricht hinzugefügt wurde
    // oder wenn der Typing-Status sich geändert hat (von typing zu nicht-typing)
    const hasNewMessage = messages.length > prevMessagesLengthRef.current
    const typingJustCompleted = prevTypingStatusRef.current && !isTypingInProgress

    if (hasNewMessage || typingJustCompleted) {
      scrollToBottom()
    }

    // Aktualisiere die Refs mit den aktuellen Werten
    prevMessagesLengthRef.current = messages.length
    prevTypingStatusRef.current = isTypingInProgress
  }, [messages, isTypingInProgress])

  useEffect(() => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus()
    }
  }, [isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      content: input,
      role: 'user',
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError('')

    // Matomo-Tracking für die Suchanfrage
    if (typeof window !== 'undefined' && window._paq) {
      try {
        window._paq.push(['trackSiteSearch', input, 'KOKOBOT', 0])
        console.log('KOKOBOT-Suche getrackt:', input)
      } catch (error) {
        console.error('Fehler beim Tracking:', error)
      }
    }

    try {
      const response = await fetch('/api/kokobot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: input }),
      })

      if (!response.ok) {
        throw new Error('Fehler bei der Anfrage')
      }

      const data = await response.json()

      // Füge zuerst eine leere Nachricht mit isTyping: true hinzu
      const assistantMessage: Message = {
        content: data.answer,
        role: 'assistant',
        sources: data.sources,
        isTyping: true,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      console.error('Fehler:', err)
      setError('Es ist ein Fehler aufgetreten. Bitte versuche es später noch einmal.')

      // Fehler-Nachricht als Assistent-Nachricht anzeigen
      if (error) {
        setMessages((prev) => [
          ...prev,
          {
            content: error,
            role: 'assistant',
          },
        ])
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SectionContainer>
      <div className="flex flex-col space-y-8">
        <div className="space-y-2">
          <PageTitle>KOKOBOT - Dein Tiny House Assistent</PageTitle>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            Stelle Fragen zu unseren Tiny Houses, nachhaltigen Lebensstilen und minimalistischem
            Wohnen. KOKOBOT gibt dir Antworten basierend auf unseren Blogartikeln.
          </p>
        </div>

        <div className="flex h-[calc(100vh-220px)] flex-col overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-900">
          {/* Chat Messages */}
          <div ref={chatContainerRef} className="flex-1 space-y-6 overflow-y-auto p-4">
            <div className="flex flex-col">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn mb-6`}
                >
                  <div
                    className={`flex max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full ${
                        message.role === 'user' ? 'ml-2 bg-blue-500 text-white' : 'mr-2'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <Image
                          src="/static/images/kokobot.svg"
                          alt="KOKOBOT"
                          width={32}
                          height={32}
                        />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>

                    <div
                      className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        {message.isTyping ? (
                          <Typewriter
                            text={message.content}
                            speed={15}
                            onComplete={() => {
                              setMessages((prev) =>
                                prev.map((msg, i) =>
                                  i === idx ? { ...msg, isTyping: false } : msg
                                )
                              )
                            }}
                          />
                        ) : (
                          <div className="prose dark:prose-dark max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>

                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <BookOpen className="mr-1 h-3 w-3" />
                            <span className="font-semibold">Quellen:</span>
                          </div>
                          <ul className="mt-1 ml-4 space-y-1">
                            {message.sources.map((source, sidx) => (
                              <li key={sidx}>
                                <Link
                                  href={`/tiny-house/${source.slug}`}
                                  className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                                >
                                  {source.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-4 mb-2 rounded-md bg-red-50 p-2 text-red-500 dark:bg-red-900/20">
              {error}
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <form onSubmit={handleSubmit} className="relative">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Stelle eine Frage zu unseren Blogthemen..."
                className="min-h-[60px] resize-none rounded-lg border border-gray-300 pr-12 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-800"
                disabled={isLoading || isTypingInProgress}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isLoading && !isTypingInProgress) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim() || isTypingInProgress}
                className="absolute right-3 bottom-3 rounded-md p-2"
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                <span className="sr-only">Senden</span>
              </Button>
            </form>
            <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
              Powered by KOKOMO Tiny House Blog und OpenAI
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  )
}
