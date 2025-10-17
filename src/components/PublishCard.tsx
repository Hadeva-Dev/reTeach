'use client'

import { useState } from 'react'
import { Copy, CheckCircle, ExternalLink } from 'lucide-react'

interface PublishCardProps {
  formUrl: string
}

export default function PublishCard({ formUrl }: PublishCardProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
            Form URL
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 font-mono truncate">
            {formUrl}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(formUrl)}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            aria-label="Copy form URL"
          >
            {copied ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            aria-label="Open form in new tab"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
      {copied && (
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
          Copied to clipboard
        </p>
      )}
    </div>
  )
}
