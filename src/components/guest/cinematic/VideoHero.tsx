'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { CINEMATIC_VIDEO_URL, VENUE_NAME, COUPLE_NAMES, WEDDING_DATE_DISPLAY } from '@/lib/cinematic-config'
import Countdown from '../Countdown'

interface VideoHeroProps {
  greeting: string
  weddingDate: string
}

export default function VideoHero({ greeting, weddingDate }: VideoHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const y = useTransform(scrollYProgress, [0, 0.6], [0, -120])
  const scale = useTransform(scrollYProgress, [0, 0.6], [1, 0.92])

  const [videoLoaded, setVideoLoaded] = useState(false)

  useEffect(() => {
    if (CINEMATIC_VIDEO_URL) {
      const v = document.createElement('video')
      v.src = CINEMATIC_VIDEO_URL
      v.addEventListener('loadeddata', () => setVideoLoaded(true), { once: true })
      v.load()
    }
  }, [])

  return (
    <motion.div
      ref={containerRef}
      style={{ opacity, y, scale }}
      className="relative h-screen w-full overflow-hidden"
    >
      {CINEMATIC_VIDEO_URL && videoLoaded ? (
        <>
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={CINEMATIC_VIDEO_URL} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/50" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-charcoal/90 to-sage-dark/80" />
      )}

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mb-6 text-sm tracking-[0.25em] text-white/70 uppercase"
        >
          Nos casamos
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 1 }}
          className="mb-4 text-5xl font-serif text-white md:text-7xl"
        >
          {COUPLE_NAMES.split(' & ')[0]}{' '}
          <span className="text-sage-light">&</span>{' '}
          {COUPLE_NAMES.split(' & ')[1]}
        </motion.h1>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 80 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mb-4 h-px bg-white/60"
        />

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="mb-2 text-lg font-serif text-white/80"
        >
          {WEDDING_DATE_DISPLAY}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="mb-8 text-sm tracking-widest uppercase text-white/60"
        >
          {VENUE_NAME}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.8 }}
          className="text-xs tracking-widest uppercase text-white/40"
        >
          Hola {greeting}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="mt-10"
        >
          <Countdown weddingDate={weddingDate} light />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2 text-white/40">
          <span className="text-xs tracking-widest uppercase">Desplza</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="h-6 w-px bg-white/40"
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
