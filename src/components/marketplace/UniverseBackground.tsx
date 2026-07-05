'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

export function UniverseBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { resolvedTheme } = useTheme()
  const themeRef = useRef(resolvedTheme)

  useEffect(() => {
    themeRef.current = resolvedTheme
  }, [resolvedTheme])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    canvas.width = width
    canvas.height = height

    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    window.addEventListener('resize', handleResize)

    // Setup Optimized Stars (No heavy nebulae or shooting stars)
    const numStars = 800 // Reduced count for better performance
    const stars: { x: number, y: number, z: number, o: number, size: number }[] = []
    
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * 2000,
        o: Math.random(),
        size: Math.random() * 1.5 + 0.5
      })
    }

    let animationFrameId: number
    let time = 0

    const render = () => {
      time += 0.002
      const isLight = themeRef.current === 'light'
      
      // Base space color
      ctx.fillStyle = isLight ? '#f8fafc' : '#02000a'
      ctx.fillRect(0, 0, width, height)

      // Render Stars
      const cx = width / 2
      const cy = height / 2

      for (let i = 0; i < numStars; i++) {
        const star = stars[i]
        star.z -= 0.5
        if (star.z <= 0) {
          star.z = 2000
          star.x = (Math.random() - 0.5) * width * 2
          star.y = (Math.random() - 0.5) * height * 2
        }

        const scale = 800 / star.z
        const px = cx + star.x * scale
        const py = cy + star.y * scale
        const radius = star.size * scale

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const twinkle = Math.sin(time * 10 + star.x) * 0.5 + 0.5
          const opacity = Math.min(1, Math.max(0.1, (1 - star.z / 2000) * twinkle)) * 0.8 // Slightly dimmer so text is readable

          ctx.beginPath()
          ctx.arc(px, py, radius, 0, Math.PI * 2)
          // In light mode use subtle slate, in dark mode use white
          ctx.fillStyle = isLight ? `rgba(71, 85, 105, ${opacity})` : `rgba(255, 255, 255, ${opacity})`
          ctx.fill()
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, []) // Empty dependency array prevents canvas recreation loops

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-3]"
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
      }}
    />
  )
}
