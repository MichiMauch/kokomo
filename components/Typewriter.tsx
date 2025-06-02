import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

interface TypewriterProps {
  text: string
  speed?: number
  onComplete?: () => void
}

const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 30, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(true)

  // Blinkender Cursor
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible((prev) => !prev)
    }, 500)

    return () => clearInterval(cursorInterval)
  }, [])

  useEffect(() => {
    // Reset wenn neuer Text kommt
    setDisplayedText('')
    setCurrentIndex(0)
    setIsComplete(false)
  }, [text])

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, speed)

      return () => clearTimeout(timer)
    } else if (!isComplete) {
      setIsComplete(true)
      onComplete?.()
    }
  }, [currentIndex, text, speed, isComplete, onComplete])

  return (
    <div className="prose dark:prose-dark max-w-none">
      <ReactMarkdown>{displayedText}</ReactMarkdown>
      {!isComplete && (
        <span
          className={`ml-1 inline-block h-4 w-2 bg-current ${cursorVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}
        ></span>
      )}
    </div>
  )
}

export default Typewriter
