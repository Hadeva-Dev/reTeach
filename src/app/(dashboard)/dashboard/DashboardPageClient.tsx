'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import HeroReadiness from '@/components/HeroReadiness'
import KpiCard from '@/components/KpiCard'
import DiagnosticsTable from '@/components/DiagnosticsTable'
import DiagSidePanel from '@/components/dashboard/DiagSidePanel'
import { Target, ChevronDown, Trophy } from 'lucide-react'
import type { DiagnosticRow, TopicStat } from '@/lib/schema'
import { fetchDiagnosticsOverview, fetchResults, deleteForm } from '@/lib/api'

export default function DashboardPageClient() {
  const router = useRouter()
  const [diagnostics, setDiagnostics] = useState<DiagnosticRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDiag, setSelectedDiag] = useState<DiagnosticRow | null>(null)
  const [sidePanelOpen, setSidePanelOpen] = useState(false)
  const [miniStats, setMiniStats] = useState<TopicStat[]>([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string>('All Courses')
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadDiagnostics = async () => {
      try {
        setLoading(true)
        const data = await fetchDiagnosticsOverview()
        if (!isMounted) return
        setDiagnostics(data)
        setError(null)
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Failed to load diagnostics')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadDiagnostics()

    return () => {
      isMounted = false
    }
  }, [])

  const courses = useMemo(() => {
    const unique = Array.from(new Set(diagnostics.map((d) => d.course))).sort()
    return ['All Courses', ...unique]
  }, [diagnostics])

  useEffect(() => {
    if (!courses.includes(selectedCourse)) {
      setSelectedCourse('All Courses')
    }
  }, [courses, selectedCourse])

  const courseDiagnostics = useMemo(() => {
    return diagnostics.filter((diagnostic) => {
      const isActive =
        diagnostic.status === 'active' || diagnostic.status === 'published'
      if (!isActive) return false
      if (selectedCourse !== 'All Courses' && diagnostic.course !== selectedCourse) {
        return false
      }
      return true
    })
  }, [diagnostics, selectedCourse])

  const readinessPct = useMemo(() => {
    const withResponses = courseDiagnostics.filter((d) => d.responses > 0)
    if (withResponses.length === 0) return 0
    const avgCompletion =
      withResponses.reduce((sum, d) => sum + d.completionPct, 0) /
      withResponses.length
    return Math.round(avgCompletion)
  }, [courseDiagnostics])

  const topWeakTopic = useMemo(() => {
    const topicCounts = new Map<string, number>()
    courseDiagnostics.forEach((diag) => {
      diag.weakTopics.forEach((topic) => {
        if (!topic) return
        topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1)
      })
    })

    if (topicCounts.size === 0) return null

    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  }, [courseDiagnostics])

  const strongestTopic = useMemo(() => {
    const topicScores = new Map<string, number>()
    courseDiagnostics.forEach((diag) => {
      diag.strongTopics.forEach((topic, index) => {
        if (!topic) return
        const weight = Math.max(1, 3 - index)
        topicScores.set(topic, (topicScores.get(topic) ?? 0) + weight)
      })
    })

    if (topicScores.size === 0) return null

    return Array.from(topicScores.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  }, [courseDiagnostics])

  useEffect(() => {
    let isMounted = true

    const loadMiniStats = async () => {
      if (!selectedDiag || selectedDiag.responses === 0) {
        setMiniStats([])
        setStatsLoading(false)
        return
      }

      try {
        setStatsLoading(true)
        const data = await fetchResults(selectedDiag.slug ?? selectedDiag.id)
        if (!isMounted) return
        setMiniStats(data.topics.slice(0, 5))
      } catch (err) {
        if (!isMounted) return
        console.error('Failed to fetch diagnostic stats', err)
        setMiniStats([])
      } finally {
        if (isMounted) {
          setStatsLoading(false)
        }
      }
    }

    loadMiniStats()

    return () => {
      isMounted = false
    }
  }, [selectedDiag])

  const handleCreate = () => {
    router.push('/create')
  }

  const handleView = (id: string) => {
    const diag = diagnostics.find((d) => d.id === id)
    if (diag) {
      setSelectedDiag(diag)
      setSidePanelOpen(true)
    }
  }

  const handleRowClick = (row: DiagnosticRow) => {
    setSelectedDiag(row)
    setSidePanelOpen(true)
  }

  const handleCloseSidePanel = () => {
    setSidePanelOpen(false)
    setTimeout(() => setSelectedDiag(null), 300)
  }

  const handleViewResultsFromPanel = () => {
    if (selectedDiag) {
      router.push(`/results?formId=${selectedDiag.slug ?? selectedDiag.id}`)
    }
  }

  const handleEditFromPanel = () => {
    if (selectedDiag) {
      router.push(`/review?id=${selectedDiag.slug ?? selectedDiag.id}`)
    }
  }

  const handleDelete = async (slug: string) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this diagnostic? This action cannot be undone.'
    )
    if (!confirmDelete) return

    try {
      setDeletingSlug(slug)
      await deleteForm(slug)
      setDiagnostics((prev) => prev.filter((diag) => diag.slug !== slug))
      if (selectedDiag?.slug === slug) {
        setSelectedDiag(null)
        setSidePanelOpen(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete diagnostic')
    } finally {
      setDeletingSlug(null)
    }
  }

  const courseSelector = (
    <div className="flex items-center gap-2">
      <label
        htmlFor="course-select"
        className="text-sm font-medium text-gray-600 dark:text-gray-400"
      >
        Course:
      </label>
      <div className="relative">
        <select
          id="course-select"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="appearance-none pl-3 pr-8 py-1.5 text-sm font-semibold bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Select course"
          disabled={courses.length <= 1}
        >
          {courses.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>
    </div>
  )

  return (
    <DashboardLayout navbarSlot={courseSelector}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 space-y-12">
        <HeroReadiness
          courseName={selectedCourse}
          readinessPct={readinessPct}
          onCreateNew={handleCreate}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {strongestTopic && (
            <KpiCard
              icon={Trophy}
              iconBgColor="bg-emerald-100 dark:bg-emerald-900/30"
              iconColor="text-emerald-600 dark:text-emerald-400"
              label="Strongest Topic"
              value={strongestTopic}
              subtext={<span className="text-xs">Highest-performing topic this term</span>}
              delay={0.1}
            />
          )}

          {topWeakTopic && (
            <KpiCard
              icon={Target}
              iconBgColor="bg-red-100 dark:bg-red-900/30"
              iconColor="text-red-600 dark:text-red-400"
              label="Top Weak Topic"
              value={topWeakTopic}
              delay={0.2}
            />
          )}
        </div>

        <div className="space-y-4">
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          )}

          {loading && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
              Loading diagnostics...
            </div>
          )}

          <DiagnosticsTable
            rows={courseDiagnostics}
            onRowClick={handleRowClick}
            onView={handleView}
            onDelete={handleDelete}
            deletingId={deletingSlug}
          />
        </div>

        <DiagSidePanel
          open={sidePanelOpen}
          diag={selectedDiag}
          miniStats={miniStats}
          loadingTopics={statsLoading}
          onClose={handleCloseSidePanel}
          onViewResults={handleViewResultsFromPanel}
          onEdit={handleEditFromPanel}
          onDelete={() => {
            if (selectedDiag) {
              handleDelete(selectedDiag.slug ?? selectedDiag.id)
            }
          }}
          deletingId={deletingSlug}
        />
      </div>
    </DashboardLayout>
  )
}
