'use client'

import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'
import { useRef } from 'react'

interface CinematicSectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  bgColor?: string
  minHeight?: string
  drawLine?: MotionValue<number>
}

const DIRECTION_MAP = {
  up: { y: 60, x: 0 },
  down: { y: -60, x: 0 },
  left: { x: -60, y: 0 },
  right: { x: 60, y: 0 },
  none: { x: 0, y: 0 },
}

export default function CinematicSection({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  bgColor = 'bg-cream',
  minHeight = 'min-h-screen',
}: CinematicSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'start 0.25'],
  })

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1])
  const motionValues = DIRECTION_MAP[direction]
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [motionValues.y, 0],
  )
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    [motionValues.x, 0],
  )

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y, x }}
      className={`${minHeight} ${bgColor} relative flex items-center ${className}`}
    >
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: 80 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, delay }}
        className="mx-auto mb-8 h-px bg-sage/40"
      />
      {children}
    </motion.div>
  )
}

export function StaggerChildren({
  children,
  staggerDelay = 0.12,
  className = '',
}: {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function FadeInUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] },
        },
      }}
    >
      {children}
    </motion.div>
  )
}
