'use client'

import { useState, useMemo } from 'react'
import { Download, Eye, Search, Users, X, CheckCircle2, XCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

interface Student {
  id: string
  name: string
  email: string
  lastSubmission: string | null
  weakTopics: string[]
  score?: number
  questionsAttempted?: number
  totalQuestions?: number
}

const MOCK_STUDENTS: Student[] = [
  { id: '1', name: 'Alex Chen', email: 'alex.chen@school.edu', lastSubmission: '2025-10-13', weakTopics: ['Chain Rule', 'Implicit Diff'], score: 72, questionsAttempted: 18, totalQuestions: 25 },
  { id: '2', name: 'Maya Lopez', email: 'maya.lopez@school.edu', lastSubmission: '2025-10-11', weakTopics: ['Cell Membrane'], score: 88, questionsAttempted: 22, totalQuestions: 25 },
  { id: '3', name: 'Samir Patel', email: 'samir.patel@school.edu', lastSubmission: null, weakTopics: [] },
  { id: '4', name: 'Jordan Kim', email: 'jordan.kim@school.edu', lastSubmission: '2025-10-15', weakTopics: ['Integration', 'L\'Hopital\'s Rule', 'Series'], score: 64, questionsAttempted: 16, totalQuestions: 25 },
  { id: '5', name: 'Taylor Smith', email: 'taylor.smith@school.edu', lastSubmission: '2025-10-14', weakTopics: ['Vectors'], score: 92, questionsAttempted: 23, totalQuestions: 25 },
]

export default function StudentsTable() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null)

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_STUDENTS
    const query = searchQuery.toLowerCase()
    return MOCK_STUDENTS.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // Select all toggle
  const allSelected = filteredStudents.length > 0 && filteredStudents.every((s) => selectedIds.has(s.id))
  const someSelected = filteredStudents.some((s) => selectedIds.has(s.id))

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredStudents.map((s) => s.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  // Action handlers
  const handleDownloadAll = () => {
    alert('Stub: download all PDFs')
  }

  const handleDownloadSelected = () => {
    const count = selectedIds.size
    alert(`Stub: download ${count} PDFs`)
  }

  const handleDownloadQuiz = (name: string) => {
    alert(`Stub: download quiz for ${name}`)
  }

  const handleViewStudent = (student: Student) => {
    setPreviewStudent(student)
  }

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400 dark:text-gray-600'
    if (score >= 90) return 'text-green-600 dark:text-green-400'
    if (score >= 70) return 'text-blue-600 dark:text-blue-400'
    if (score >= 50) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBg = (score?: number) => {
    if (!score) return 'bg-gray-100 dark:bg-gray-800'
    if (score >= 90) return 'bg-green-50 dark:bg-green-950/20'
    if (score >= 70) return 'bg-blue-50 dark:bg-blue-950/20'
    if (score >= 50) return 'bg-amber-50 dark:bg-amber-950/20'
    return 'bg-red-50 dark:bg-red-950/20'
  }

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label="Search students"
          />
        </div>

        {/* Bulk Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDownloadAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download All</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadSelected}
            disabled={selectedIds.size === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download Selected</span>
            {selectedIds.size > 0 && <span className="sm:hidden">({selectedIds.size})</span>}
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <Users className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No students yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
              {searchQuery ? 'No students match your search.' : 'Student responses will appear here once they submit the Google Form.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="w-12 px-4 py-3.5 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected && !allSelected
                      }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-2 focus:ring-indigo-400"
                      aria-label="Select all students"
                    />
                  </th>
                  <th className="px-4 py-3.5 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Name
                  </th>
                  <th className="px-4 py-3.5 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Email
                  </th>
                  <th className="px-4 py-3.5 text-left text-sm font-medium text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                    Last Submission
                  </th>
                  <th className="px-4 py-3.5 text-left text-sm font-medium text-gray-600 dark:text-gray-300 hidden md:table-cell">
                    Weak Topics
                  </th>
                  <th className="px-4 py-3.5 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(student.id)}
                        onChange={() => toggleSelect(student.id)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-2 focus:ring-indigo-400"
                        aria-label={`Select ${student.name}`}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.name}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                        {student.email}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(student.lastSubmission)}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1.5">
                        {student.weakTopics.length === 0 ? (
                          <span className="text-sm text-gray-400 dark:text-gray-600">—</span>
                        ) : (
                          <>
                            {student.weakTopics.slice(0, 2).map((topic, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800"
                              >
                                {topic}
                              </span>
                            ))}
                            {student.weakTopics.length > 2 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                +{student.weakTopics.length - 2}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewStudent(student)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          aria-label={`View ${student.name}`}
                        >
                          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadQuiz(student.name)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          aria-label={`Download quiz for ${student.name}`}
                        >
                          <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Note */}
      {filteredStudents.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          All quizzes are generated drafts. Per-student exports include personalized versions.
        </p>
      )}

      {/* Preview Popover */}
      <AnimatePresence>
        {previewStudent && (
          <>
            {/* Invisible backdrop to close */}
            <div
              onClick={() => setPreviewStudent(null)}
              className="fixed inset-0 z-40"
            />

            {/* Popover */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="fixed top-4 right-4 w-80 z-50"
            >
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {previewStudent.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {previewStudent.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewStudent(null)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 ml-2"
                    aria-label="Close preview"
                  >
                    <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {previewStudent.score !== undefined ? (
                    <>
                      {/* Score */}
                      <div className={`rounded-lg p-3 text-center ${getScoreBg(previewStudent.score)}`}>
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Score
                        </div>
                        <div className={`text-3xl font-bold ${getScoreColor(previewStudent.score)}`}>
                          {previewStudent.score}%
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                        <div className="flex items-center gap-1 mb-1">
                          <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Questions Attempted
                          </span>
                        </div>
                        <div className="text-base font-semibold text-gray-900 dark:text-white">
                          {previewStudent.questionsAttempted}/{previewStudent.totalQuestions}
                        </div>
                      </div>

                      {/* Weak Topics */}
                      {previewStudent.weakTopics.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <XCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-medium text-gray-900 dark:text-white">
                              Weak Topics
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {previewStudent.weakTopics.map((topic, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <Users className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        No quiz data available
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
