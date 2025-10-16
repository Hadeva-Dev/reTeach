'use client'

import { motion } from 'framer-motion'

export default function ReTeachBackground() {
  return (
    <>
      {/* Animated gradient orbs - green and orange theme */}
      <motion.div
        className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-emerald-200/25 via-green-200/20 to-teal-200/25 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 40, 0],
          y: [0, 25, 0],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-br from-lime-200/20 via-emerald-200/25 to-green-200/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -35, 0],
          y: [0, 45, 0],
          rotate: [0, -120, 0],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-40 left-1/4 w-72 h-72 bg-gradient-to-br from-green-300/20 via-emerald-300/25 to-teal-300/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          x: [0, 50, 0],
          y: [0, -35, 0],
          rotate: [0, 180, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-20 right-1/3 w-64 h-64 bg-gradient-to-br from-orange-200/15 via-amber-200/20 to-yellow-200/15 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.18, 1],
          x: [0, -45, 0],
          y: [0, 38, 0],
          rotate: [0, -90, 0],
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-to-br from-green-200/15 via-teal-200/18 to-emerald-200/15 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.12, 1],
          x: [0, 30, 0],
          y: [0, -30, 0],
          rotate: [0, 360, 0],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute top-60 right-1/4 w-60 h-60 bg-gradient-to-br from-orange-200/12 via-amber-100/15 to-lime-200/12 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.14, 1],
          x: [0, -28, 0],
          y: [0, 32, 0],
          rotate: [0, 150, 0],
        }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </>
  )
}
