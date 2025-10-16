'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import QuestionTable from '@/components/QuestionTable'
import { createForm } from '@/lib/api'
import { useStore } from '@/lib/store'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function PreviewPage() {
  const router = useRouter()
  const questions = useStore((state) => state.questions)
  const setQuestions = useStore((state) => state.setQuestions)
  const setLinks = useStore((state) => state.setLinks)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState('Diagnostic Assessment')

  useEffect(() => {
    // Redirect if no questions
    if (questions.length === 0) {
      router.push('/upload')
    }
  }, [questions, router])

  const handlePublish = async () => {
    setLoading(true)
    setError(null)

    try {
      const { formUrl, sheetUrl } = await createForm(formTitle, questions)
      setLinks(formUrl, sheetUrl)
      router.push('/publish')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create form')
    } finally {
      setLoading(false)
    }
  }

  if (questions.length === 0) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/review')}
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400
              hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
            aria-label="Back to review"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Review
          </button>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Preview Questions
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Edit questions, options, and correct answers. Click the checkmark to set the correct answer.
          </p>
        </div>

        <div className="space-y-6">
          {/* Form Title */}
          <div className="card bg-white dark:bg-gray-900 p-6">
            <label
              htmlFor="form-title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Form Title
            </label>
            <input
              type="text"
              id="form-title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="e.g., Week 1 Diagnostic Assessment"
            />
          </div>

          {/* Questions Table */}
          <div className="card bg-white dark:bg-gray-900 p-6">
            <QuestionTable questions={questions} onChange={setQuestions} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Publish Button */}
          <button
            onClick={handlePublish}
            disabled={loading || !formTitle.trim() || questions.length === 0}
            className="w-full px-6 py-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300
              text-white font-semibold rounded-lg
              transition-all duration-200 shadow-lg hover:shadow-xl
              disabled:cursor-not-allowed disabled:shadow-none
              flex items-center justify-center gap-3"
            aria-label="Publish form"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Google Form...
              </>
            ) : (
              'Publish Form'
            )}
          </button>
        </div>
      </main>
    </div>
  )
}
