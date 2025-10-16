'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import Link from 'next/link'

interface HeroReadinessProps {
  courseName: string
  readinessPct: number
  onCreateNew: () => void
}

export default function HeroReadiness({ courseName, readinessPct, onCreateNew }: HeroReadinessProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl border border-indigo-100 dark:border-indigo-500/30 bg-white dark:bg-gray-900 p-6 md:p-10 shadow-[0_24px_60px_-35px_rgba(47,61,128,0.65)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/12 via-transparent to-purple-500/10 dark:from-indigo-500/18 dark:via-transparent dark:to-purple-500/14" />
      <div className="relative text-center max-w-2xl mx-auto">
        {/* Title */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.25em] font-semibold text-indigo-600 dark:text-indigo-300 mb-2">
            Class Readiness for
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white">
            {courseName}
          </h1>
        </div>

        {/* Metric */}
        <div className="mb-6">
          <p className="text-6xl md:text-7xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-500 bg-clip-text text-transparent">
            {readinessPct}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Average completion across active diagnostics
          </p>
        </div>

        {/* Primary CTA */}
        <Link href="/upload">
          <motion.button
            onClick={onCreateNew}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          >
            <Plus className="w-5 h-5" />
            Create New Diagnostic
          </motion.button>
        </Link>
      </div>
    </motion.div>
  )
}
