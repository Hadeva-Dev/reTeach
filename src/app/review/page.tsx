'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import TopicList from '@/components/TopicList'
import { generateQuestions } from '@/lib/api'
import { useStore } from '@/lib/store'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function ReviewPage() {
  const router = useRouter()
  const topics = useStore((state) => state.topics)
  const setTopics = useStore((state) => state.setTopics)
  const setQuestions = useStore((state) => state.setQuestions)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(20)

  useEffect(() => {
    // Redirect if no topics
    if (topics.length === 0) {
      router.push('/upload')
    }
  }, [topics, router])

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      const questions = await generateQuestions(topics, questionCount)
      setQuestions(questions)
      router.push('/preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate questions')
    } finally {
      setLoading(false)
    }
  }

  if (topics.length === 0) {
    return null // Will redirect
  }

  const totalWeight = topics.reduce((sum, t) => sum + t.weight, 0)
  const isWeightValid = Math.abs(totalWeight - 1) < 0.01
  const canGenerate = isWeightValid && !loading

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <NavBar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/upload')}
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400
              hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
            aria-label="Back to upload"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Upload
          </button>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Review Topics
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Adjust topic weights and add or remove topics. Weights should sum to 1.00.
          </p>
        </div>

        <div className="space-y-6">
          {/* Topic List */}
          <div className="card bg-white dark:bg-gray-900 p-6">
            <TopicList topics={topics} onChange={setTopics} />
          </div>

          {/* Question Count */}
          <div className="card bg-white dark:bg-gray-900 p-6">
            <label
              htmlFor="question-count"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Number of questions to generate
            </label>
            <input
              type="number"
              id="question-count"
              min="5"
              max="50"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value) || 20)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Recommended: 15-25 questions for a diagnostic assessment
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full px-6 py-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300
              text-white font-semibold rounded-lg
              transition-all duration-200 shadow-lg hover:shadow-xl
              disabled:cursor-not-allowed disabled:shadow-none
              flex items-center justify-center gap-3"
            aria-label="Generate questions"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating {questionCount} Questions...
              </>
            ) : (
              `Generate ${questionCount} Questions`
            )}
          </button>

          {!isWeightValid && (
            <p className="text-center text-sm text-amber-600 dark:text-amber-400">
              ⚠ Adjust topic weights to sum to 1.00 before generating questions
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
