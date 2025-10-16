'use client'

import { useState } from 'react'
import { Copy, CheckCircle, ExternalLink } from 'lucide-react'

interface PublishCardProps {
  formUrl: string
  sheetUrl: string
}

export default function PublishCard({ formUrl, sheetUrl }: PublishCardProps) {
  const [copiedForm, setCopiedForm] = useState(false)
  const [copiedSheet, setCopiedSheet] = useState(false)

  const copyToClipboard = async (text: string, type: 'form' | 'sheet') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'form') {
        setCopiedForm(true)
        setTimeout(() => setCopiedForm(false), 2000)
      } else {
        setCopiedSheet(true)
        setTimeout(() => setCopiedSheet(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="space-y-4">
      {/* Google Form Link */}
      <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
              Google Form URL
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 font-mono truncate">
              {formUrl}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(formUrl, 'form')}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              aria-label="Copy form URL"
            >
              {copiedForm ? (
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
        {copiedForm && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            ✓ Copied to clipboard
          </p>
        )}
      </div>

      {/* Google Sheets Link */}
      <div className="p-6 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-green-900 dark:text-green-200 mb-2">
              Results Spreadsheet URL
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 font-mono truncate">
              {sheetUrl}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(sheetUrl, 'sheet')}
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              aria-label="Copy sheet URL"
            >
              {copiedSheet ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              aria-label="Open sheet in new tab"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
        {copiedSheet && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            ✓ Copied to clipboard
          </p>
        )}
      </div>
    </div>
  )
}
