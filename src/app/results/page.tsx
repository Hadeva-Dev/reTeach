'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import NavBar from '@/components/NavBar'
import ResultsChart from '@/components/ResultsChart'
import { fetchResults } from '@/lib/api'
import type { TopicStat } from '@/lib/schema'
import { Loader2, RefreshCw, ArrowLeft } from 'lucide-react'

function ResultsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const formId = searchParams.get('formId') || 'demo'

  const [stats, setStats] = useState<TopicStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadResults = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchResults(formId)
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch results')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResults()
  }, [formId])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <NavBar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/publish')}
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400
              hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
            aria-label="Back to publish"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Publish
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Student Results
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Diagnostic assessment performance by topic
              </p>
            </div>

            <button
              onClick={loadResults}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300
                text-white font-medium rounded-lg
                transition-colors flex items-center gap-2
                disabled:cursor-not-allowed"
              aria-label="Refresh results"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Loading State */}
          {loading && stats.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading results...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Results */}
          {!loading && stats.length > 0 && (
            <>
              <div className="card bg-white dark:bg-gray-900 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Performance by Topic
                </h2>
                <ResultsChart stats={stats} />
              </div>

              {/* Detailed Table */}
              <div className="card bg-white dark:bg-gray-900 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Detailed Results
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Topic
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Responses
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          % Correct
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map((stat, index) => {
                        const status = stat.correctPct >= 80 ? 'Mastery' :
                                       stat.correctPct >= 70 ? 'Good' :
                                       stat.correctPct >= 60 ? 'Review' : 'Focus'
                        const statusColor = stat.correctPct >= 80 ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10' :
                                            stat.correctPct >= 70 ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10' :
                                            stat.correctPct >= 60 ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10' :
                                            'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10'

                        return (
                          <tr
                            key={index}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                              {stat.topic}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                              {stat.n}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                              {stat.correctPct.toFixed(1)}%
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                {status}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* No Results Yet */}
          {!loading && stats.length === 0 && !error && (
            <div className="card bg-white dark:bg-gray-900 p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No responses yet. Students haven't submitted the form.
              </p>
              <button
                onClick={loadResults}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Check Again
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <NavBar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  )
}
