'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, Edit, Archive, Calendar, Users, Target, AlertTriangle, BookOpen } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { DiagnosticRow, TopicStat } from '@/lib/schema'

interface DiagSidePanelProps {
  open: boolean
  diag: DiagnosticRow | null
  miniStats: TopicStat[]
  onClose: () => void
  onViewResults: () => void
  onEdit: () => void
  onArchive: () => void
}

export default function DiagSidePanel({
  open,
  diag,
  miniStats,
  onClose,
  onViewResults,
  onEdit,
  onArchive
}: DiagSidePanelProps) {
  if (!diag) return null

  const getColor = (pct: number) => {
    if (pct >= 80) return 'url(#barGradientStrong)'
    if (pct >= 60) return 'url(#barGradientModerate)'
    return 'url(#barGradientFocus)'
  }

  // Close on Escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto focus:outline-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-title"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200/70 dark:border-gray-700/60 px-6 py-5 z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 id="panel-title" className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {diag.name}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 px-2 py-0.5 bg-gray-50 dark:bg-gray-800">
                      <BookOpen className="w-3 h-3" />
                      {diag.course}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 px-2 py-0.5 bg-gray-50 dark:bg-gray-800">
                      Sample Data
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50/70 dark:bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-200 shadow-sm">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(diag.createdAt).toLocaleDateString()}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
                  <Users className="w-3.5 h-3.5" />
                  {diag.responses} responses
                </span>
              </div>

              {/* Completion */}
              <div className="rounded-xl border border-indigo-100 dark:border-indigo-500/40 bg-indigo-50/60 dark:bg-indigo-500/10 px-5 py-4 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-200">
                  Completion Rate
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <p className="text-3xl font-semibold text-indigo-700 dark:text-indigo-200">
                    {diag.completionPct}%
                  </p>
                  <div className="relative flex-1 h-2.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${diag.completionPct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-xs font-medium text-indigo-700 dark:text-indigo-200">
                    {diag.completionPct}% complete
                  </span>
                </div>
              </div>

              {/* Weak Topics */}
              {diag.weakTopics.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                      Topics Needing Focus
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {diag.weakTopics.map((topic, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 shadow-sm hover:border-amber-300 transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {topic}
                      </span>
                    ))}
                  </div>
                  </div>
              )}

              {/* Mini Chart */}
              {miniStats.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                    Performance Overview
                  </h3>
                  <div className="rounded-xl border border-gray-200/70 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-5 shadow-sm hover:shadow-md transition-shadow">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={miniStats} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                        <defs>
                          <linearGradient id="barGradientStrong" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.95} />
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.75} />
                          </linearGradient>
                          <linearGradient id="barGradientModerate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#f97316" stopOpacity={0.65} />
                          </linearGradient>
                          <linearGradient id="barGradientFocus" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f97316" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#facc15" stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="topic"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          tick={{ fill: '#9ca3af', fontSize: 10 }}
                          tickLine={false}
                          axisLine={{ stroke: '#e5e7eb' }}
                          label={{ value: 'Topics', position: 'insideBottom', offset: -32, style: { fill: '#6b7280', fontSize: 12 } }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fill: '#9ca3af', fontSize: 10 }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickLine={false}
                          label={{ value: 'Avg Score %', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 12 } }}
                        />
                        <Tooltip
                          cursor={{ fill: 'transparent' }}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px',
                            boxShadow: '0 8px 20px rgba(15,23,42,0.08)'
                          }}
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Correct']}
                        />
                        <Bar dataKey="correctPct" radius={[8, 8, 0, 0]} barSize={24}>
                          {miniStats.map((entry, index) => {
                            const fill = getColor(entry.correctPct)
                            return <Cell key={`cell-${index}`} fill={fill} />
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                {diag.responses > 0 && (
                  <button
                    onClick={onViewResults}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-sm hover:shadow-md hover:from-indigo-500 hover:to-indigo-500 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    Preview Results
                  </button>
                )}
                <button
                  onClick={onEdit}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium shadow-sm hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-gray-800 transition-all"
                >
                  <Edit className="w-4 h-4" />
                  Edit Diagnostic
                </button>
                <button
                  onClick={onArchive}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium shadow-sm hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-gray-800 transition-all"
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
