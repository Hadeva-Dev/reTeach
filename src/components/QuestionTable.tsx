'use client'

import type { Question } from '@/lib/schema'
import { Trash2 } from 'lucide-react'

interface QuestionTableProps {
  questions: Question[]
  onChange: (questions: Question[]) => void
}

export default function QuestionTable({ questions, onChange }: QuestionTableProps) {
  const handleStemChange = (questionId: string, stem: string) => {
    const updated = questions.map(q =>
      q.id === questionId ? { ...q, stem } : q
    )
    onChange(updated)
  }

  const handleRemove = (questionId: string) => {
    const updated = questions.filter(q => q.id !== questionId)
    onChange(updated)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Questions ({questions.length})
        </h3>
      </div>

      <div className="space-y-6">
        {questions.map((question, qIndex) => (
          <div
            key={question.id}
            className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg"
          >
            {/* Question Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                    Q{qIndex + 1}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                    {question.topic}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                    {question.difficulty}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleRemove(question.id)}
                className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300
                  hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                aria-label={`Delete question ${qIndex + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Question Stem */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Question
              </label>
              <textarea
                value={question.stem}
                onChange={(e) => handleStemChange(question.id, e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  text-sm resize-y"
                aria-label={`Question ${qIndex + 1} text`}
              />
            </div>

            {/* Options */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Learners respond with:
              </p>
              <div className="flex flex-wrap gap-2">
                {question.options.map((option, optIndex) => (
                  <span
                    key={optIndex}
                    className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    {option}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Use these self-check statements to gauge confidence; there is no single correct answer.
              </p>
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No questions generated yet
        </div>
      )}
    </div>
  )
}
