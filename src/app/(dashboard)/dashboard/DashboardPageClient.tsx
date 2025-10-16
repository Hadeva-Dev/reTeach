'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import HeroReadiness from '@/components/HeroReadiness'
import KpiCard from '@/components/KpiCard'
import DiagnosticsTable from '@/components/DiagnosticsTable'
import DiagSidePanel from '@/components/dashboard/DiagSidePanel'
import { AlertCircle, Target, ChevronDown } from 'lucide-react'
import { fakeDiagnostics, fakeTopicStats } from '@/lib/fakeData'
import type { DiagnosticRow, TopicStat } from '@/lib/schema'

export default function DashboardPageClient() {
  const router = useRouter()
  const [diagnostics] = useState<DiagnosticRow[]>(fakeDiagnostics)
  const [selectedDiag, setSelectedDiag] = useState<DiagnosticRow | null>(null)
  const [sidePanelOpen, setSidePanelOpen] = useState(false)

  // Get unique courses
  const courses = useMemo(() => {
    const uniqueCourses = [...new Set(diagnostics.map(d => d.course))]
    return uniqueCourses.sort()
  }, [diagnostics])

  const [selectedCourse, setSelectedCourse] = useState<string>(courses[0] || 'All Courses')

  // Filter diagnostics by selected course
  const courseDiagnostics = useMemo(() => {
    return diagnostics.filter(d => d.course === selectedCourse && d.status === 'active')
  }, [diagnostics, selectedCourse])

  // Compute readiness % for selected course only
  const readinessPct = useMemo(() => {
    const withResponses = courseDiagnostics.filter(d => d.responses > 0)
    if (withResponses.length === 0) return 0

    const avgCompletion = withResponses.reduce((sum, d) => sum + d.completionPct, 0) / withResponses.length
    return Math.round(avgCompletion)
  }, [courseDiagnostics])

  // Count diagnostics needing attention in selected course
  const needsAttentionCount = useMemo(() => {
    return courseDiagnostics.filter(d => d.completionPct < 70).length
  }, [courseDiagnostics])

  // Get top weak topic for selected course
  const topWeakTopic = useMemo(() => {
    const withResponses = courseDiagnostics.filter(d => d.responses > 0)
    const allWeakTopics = withResponses.flatMap(d => d.weakTopics)

    const topicCounts = new Map<string, number>()
    allWeakTopics.forEach(topic => {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
    })

    if (topicCounts.size === 0) return null

    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])[0][0]
  }, [courseDiagnostics])

  // Handlers
  const handleCreate = () => {
    router.push('/create')
  }

  const handleView = (id: string) => {
    // Find the diagnostic and open side panel instead of redirecting
    const diag = diagnostics.find(d => d.id === id)
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
      router.push(`/results?formId=${selectedDiag.id}`)
    }
  }

  const handleEditFromPanel = () => {
    if (selectedDiag) {
      router.push(`/review?id=${selectedDiag.id}`)
    }
  }

  const handleArchiveFromPanel = () => {
    if (selectedDiag) {
      alert(`Archive diagnostic ${selectedDiag.id} (not implemented)`)
      handleCloseSidePanel()
    }
  }

  const miniStats: TopicStat[] = fakeTopicStats.slice(0, 5)

  // Course selector component to pass to navbar
  const courseSelector = (
    <div className="flex items-center gap-2">
      <label htmlFor="course-select" className="text-sm font-medium text-gray-600 dark:text-gray-400">
        Course:
      </label>
      <div className="relative">
        <select
          id="course-select"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="appearance-none pl-3 pr-8 py-1.5 text-sm font-semibold bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          aria-label="Select course"
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
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        {/* Hero: Centered readiness metric + CTA */}
        <HeroReadiness
          courseName={selectedCourse}
          readinessPct={readinessPct}
          onCreateNew={handleCreate}
        />

        {/* Secondary KPIs: Row of 2 cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Only show Needs Attention if count > 0 */}
          {needsAttentionCount > 0 && (
            <KpiCard
              icon={AlertCircle}
              iconBgColor="bg-amber-100 dark:bg-amber-900/30"
              iconColor="text-amber-600 dark:text-amber-400"
              label="Needs Attention"
              value={needsAttentionCount}
              subtext={<span className="text-xs">Diagnostics below 70% completion</span>}
              delay={0.1}
            />
          )}

          {/* Top Weak Topic */}
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

        {/* Diagnostics Table */}
        <div className="mt-12">
          <DiagnosticsTable
            rows={courseDiagnostics}
            onRowClick={handleRowClick}
            onView={handleView}
          />
        </div>

        {/* Slide-over Panel for Row Details */}
        <DiagSidePanel
          open={sidePanelOpen}
          diag={selectedDiag}
          miniStats={miniStats}
          onClose={handleCloseSidePanel}
          onViewResults={handleViewResultsFromPanel}
          onEdit={handleEditFromPanel}
          onArchive={handleArchiveFromPanel}
        />

      </div>
    </DashboardLayout>
  )
}
