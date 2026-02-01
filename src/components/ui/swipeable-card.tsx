'use client'

import { useState, useRef, useCallback, ReactNode } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SwipeableCardProps {
  children: ReactNode
  onEdit?: () => void
  onDelete?: () => void
  editColor?: string
  deleteColor?: string
  className?: string
}

const SWIPE_THRESHOLD = 80
const VELOCITY_THRESHOLD = 0.5

export function SwipeableCard({
  children,
  onEdit,
  onDelete,
  editColor = 'bg-blue-500',
  deleteColor = 'bg-red-500',
  className,
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)
  const startTimeRef = useRef(0)
  const currentXRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX
    startTimeRef.current = Date.now()
    currentXRef.current = translateX
    setIsDragging(true)
  }, [translateX])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return

    const currentX = e.touches[0].clientX
    const diff = currentX - startXRef.current
    const newTranslateX = currentXRef.current + diff

    // Limit swipe distance
    const maxSwipe = 100
    const clampedTranslate = Math.max(-maxSwipe, Math.min(maxSwipe, newTranslateX))

    setTranslateX(clampedTranslate)
  }, [isDragging])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    const endTime = Date.now()
    const timeDiff = endTime - startTimeRef.current
    const velocity = Math.abs(translateX - currentXRef.current) / timeDiff

    // Check if swipe was fast enough or far enough
    const isVelocitySwipe = velocity > VELOCITY_THRESHOLD
    const isDistanceSwipe = Math.abs(translateX) > SWIPE_THRESHOLD

    if (isVelocitySwipe || isDistanceSwipe) {
      if (translateX > 0 && onEdit) {
        // Swipe right - Edit
        setTranslateX(0)
        setTimeout(() => onEdit(), 100)
      } else if (translateX < 0 && onDelete) {
        // Swipe left - Delete
        setTranslateX(0)
        setTimeout(() => onDelete(), 100)
      } else {
        setTranslateX(0)
      }
    } else {
      // Return to original position
      setTranslateX(0)
    }
  }, [isDragging, translateX, onEdit, onDelete])

  // Calculate opacity for action indicators
  const editOpacity = Math.min(1, Math.max(0, translateX / SWIPE_THRESHOLD))
  const deleteOpacity = Math.min(1, Math.max(0, -translateX / SWIPE_THRESHOLD))

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-xl", className)}
    >
      {/* Edit action background (swipe right) */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-24 flex items-center justify-center transition-opacity",
          editColor
        )}
        style={{ opacity: editOpacity }}
      >
        <div className="flex flex-col items-center text-white">
          <Pencil className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">Edit</span>
        </div>
      </div>

      {/* Delete action background (swipe left) */}
      <div
        className={cn(
          "absolute inset-y-0 right-0 w-24 flex items-center justify-center transition-opacity",
          deleteColor
        )}
        style={{ opacity: deleteOpacity }}
      >
        <div className="flex flex-col items-center text-white">
          <Trash2 className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">Delete</span>
        </div>
      </div>

      {/* Main card content */}
      <div
        className={cn(
          "relative bg-card touch-pan-y",
          isDragging ? "" : "transition-transform duration-200 ease-out"
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
