'use client'

import { useEffect, useRef, useState } from 'react'

// Detect iOS Safari
function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua)
  const webkit = /WebKit/.test(ua)
  const notChrome = !/CriOS/.test(ua)
  return iOS && webkit && notChrome
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [useStaticBackground, setUseStaticBackground] = useState(false)

  useEffect(() => {
    // On iOS Safari, use static background for better compatibility
    if (isIOSSafari()) {
      setUseStaticBackground(true)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    setCanvasDimensions()
    window.addEventListener('resize', setCanvasDimensions)

    // Colors from the KOKON logo
    const colors = {
      blue: '#00B2FF',
      green: '#00FF7F',
      beige: '#E6C288',
      black: '#000000',
    }

    // Create gradient background
    const createGradient = () => {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, 'rgba(0, 178, 255, 0.8)') // Blue
      gradient.addColorStop(0.5, 'rgba(0, 255, 127, 0.5)') // Green
      gradient.addColorStop(1, 'rgba(230, 194, 136, 0.8)') // Beige
      return gradient
    }

    // Bubble class for animated elements
    class Bubble {
      x: number
      y: number
      radius: number
      color: string
      speedX: number
      speedY: number

      constructor() {
        this.x = Math.random() * (canvas?.width || 0)
        this.y = Math.random() * (canvas?.height || 0)
        this.radius = Math.random() * 50 + 20
        this.color = [colors.blue, colors.green, colors.beige][Math.floor(Math.random() * 3)]
        this.speedX = Math.random() * 0.5 - 0.25
        this.speedY = Math.random() * 0.5 - 0.25
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        // Bounce off edges
        if (canvas && (this.x < 0 || this.x > canvas.width)) this.speedX *= -1
        if (canvas && (this.y < 0 || this.y > canvas.height)) this.speedY *= -1
      }

      draw() {
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = this.color + '30' // Add transparency
        ctx.fill()
        ctx.strokeStyle = this.color
        ctx.stroke()
      }
    }

    // Create bubbles
    const bubbles: Bubble[] = []
    for (let i = 0; i < 15; i++) {
      bubbles.push(new Bubble())
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw gradient background
      ctx.fillStyle = createGradient()
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw bubbles
      bubbles.forEach((bubble) => {
        bubble.update()
        bubble.draw()
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', setCanvasDimensions)
    }
  }, [])

  // Static CSS gradient background for iOS Safari
  if (useStaticBackground) {
    return (
      <div
        className="fixed top-0 left-0 -z-10 h-full w-full"
        style={{
          background:
            'linear-gradient(135deg, rgba(0, 178, 255, 0.8) 0%, rgba(0, 255, 127, 0.5) 50%, rgba(230, 194, 136, 0.8) 100%)',
        }}
      />
    )
  }

  return <canvas ref={canvasRef} className="fixed top-0 left-0 -z-10 h-full w-full" />
}
