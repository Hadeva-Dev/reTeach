'use client'

import SectionHeader from './SectionHeader'

const inputClassName =
  'mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'

interface PromptConfig {
  title: string
  focus: string
  textbook: string
  chapters: string
  gradeLevel: string
  questionCount: number
  notes: string
}

interface DiagnosticFormProps {
  config: PromptConfig
  onConfigChange: <Key extends keyof PromptConfig>(key: Key, value: PromptConfig[Key]) => void
  promptCharacters: number
  error?: string | null
}

export default function DiagnosticForm({ config, onConfigChange, promptCharacters, error }: DiagnosticFormProps) {
  return (
    <form className="space-y-8">
      <section>
        <SectionHeader title="Overview" />
        <div className="mt-3 space-y-4">
          <div>
            <label htmlFor="title" className="text-sm font-medium text-foreground/80">
              Title
            </label>
            <input
              id="title"
              value={config.title}
              onChange={(e) => onConfigChange('title', e.target.value)}
              placeholder="Algebra II · Unit 4 check-in"
              className={inputClassName}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="focus" className="text-sm font-medium text-foreground/80">
              Prompt
            </label>
            <textarea
              id="focus"
              value={config.focus}
              onChange={(e) => onConfigChange('focus', e.target.value)}
              placeholder="Describe focus: topic, grade, tone."
              className={`${inputClassName} h-32 resize-none`}
            />
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1 font-medium text-gray-700 dark:text-gray-200 shadow-sm">
                {promptCharacters} characters
              </span>
              <span className="hidden sm:inline">
                Include outcomes, misconceptions, tone, constraints.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Context" />
        <div className="mt-3 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="textbook" className="text-sm font-medium text-foreground/80">
                Textbook
              </label>
              <input
                id="textbook"
                value={config.textbook}
                onChange={(e) => onConfigChange('textbook', e.target.value)}
                placeholder="Stewart Calculus 8e"
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="grade" className="text-sm font-medium text-foreground/80">
                Grade
              </label>
              <input
                id="grade"
                value={config.gradeLevel}
                onChange={(e) => onConfigChange('gradeLevel', e.target.value)}
                placeholder="Grade 10"
                className={inputClassName}
              />
            </div>
          </div>
          <div>
            <label htmlFor="chapters" className="text-sm font-medium text-foreground/80">
              Chapters
            </label>
            <input
              id="chapters"
              value={config.chapters}
              onChange={(e) => onConfigChange('chapters', e.target.value)}
              placeholder="Ch.2.1, Ch.2.2, Ch.2.4"
              className={inputClassName}
            />
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Notes" />
        <div className="mt-3 space-y-4">
          <div>
            <label htmlFor="notes" className="text-sm font-medium text-foreground/80">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={config.notes}
              onChange={(e) => onConfigChange('notes', e.target.value)}
              placeholder="Mention tone, pitfalls, or constraints."
              className={`${inputClassName} h-28 resize-none`}
            />
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Configuration" />
        <div className="mt-3">
          <label htmlFor="question-count" className="text-sm font-medium text-foreground/80">
            Questions
          </label>
          <input
            id="question-count"
            type="number"
            value={config.questionCount}
            onChange={(e) => {
              const value = Number(e.target.value)
              if (!Number.isNaN(value)) {
                onConfigChange('questionCount', value)
              }
            }}
            onBlur={(e) => {
              const value = Number(e.target.value)
              if (Number.isNaN(value) || value < 5 || value > 50) {
                onConfigChange('questionCount', Math.min(50, Math.max(5, value || 10)))
              }
            }}
            className={`${inputClassName} max-w-[160px]`}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            5–50 questions recommended.
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {error}
        </div>
      )}
    </form>
  )
}
