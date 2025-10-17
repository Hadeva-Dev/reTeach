'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ClipboardList, CheckCircle } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface FormInfo {
  form_id: string
  title: string
  total_questions: number
  status: string
}

export default function FormPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [step, setStep] = useState<'info' | 'questions' | 'complete'>('info')
  const [formInfo, setFormInfo] = useState<FormInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Student info
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Session
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Fetch form info on load
  useEffect(() => {
    if (!slug) return

    const fetchFormInfo = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE}/api/forms/${slug}`)

        if (!response.ok) {
          throw new Error('Form not found')
        }

        const data = await response.json()
        setFormInfo(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load form')
      } finally {
        setLoading(false)
      }
    }

    fetchFormInfo()
  }, [slug])

  // Handle student info submission
  const handleStartForm = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !email.trim()) {
      setError('Please enter your name and email')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/api/forms/${slug}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() })
      })

      if (!response.ok) {
        throw new Error('Failed to start form')
      }

      const data = await response.json()
      setSessionId(data.session_id)
      setStep('questions')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start form')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading form...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !formInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
              Form Not Found
            </h2>
            <p className="text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {step === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
                  <ClipboardList className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                  {formInfo?.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {formInfo?.total_questions} questions • ~{Math.ceil((formInfo?.total_questions || 0) * 1.5)} minutes
                </p>
              </div>

              {/* Student Info Form */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Enter Your Information
                </h2>

                <form onSubmit={handleStartForm} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Jane Smith"
                      className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="jane.smith@school.edu"
                      className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !name.trim() || !email.trim()}
                    className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      'Start Diagnostic →'
                    )}
                  </button>
                </form>

                <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
                  Your information will be used to track your progress and provide personalized feedback.
                </p>
              </div>
            </motion.div>
          )}

          {step === 'questions' && sessionId && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
                <p className="text-center text-gray-600 dark:text-gray-400">
                  Question interface coming soon...
                </p>
                <p className="text-center text-sm text-gray-500 dark:text-gray-500 mt-4">
                  Session ID: {sessionId}
                </p>
              </div>
            </motion.div>
          )}

          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                  <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Thank You!
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                  Your responses have been submitted successfully.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
