'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, X } from 'lucide-react'

interface FileDropProps {
  onText: (text: string) => void
}

export default function FileDrop({ onText }: FileDropProps) {
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const extractText = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'txt') {
      return await file.text()
    }

    if (ext === 'pdf') {
      // For PDF files, return a placeholder for now
      // In production, use pdfjs-dist to extract text
      return `[PDF Upload: ${file.name}]\n\nPDF text extraction requires additional setup.\n\nFor demo: paste syllabus text manually or use a .txt file.`
    }

    throw new Error('Unsupported file type. Please use .txt or .pdf files.')
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setError(null)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      try {
        const text = await extractText(files[0])
        setFileName(files[0].name)
        onText(text)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process file')
      }
    }
  }, [onText])

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setError(null)

    const files = e.target.files
    if (files && files[0]) {
      try {
        const text = await extractText(files[0])
        setFileName(files[0].name)
        onText(text)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process file')
      }
    }
  }, [onText])

  const handleClear = () => {
    setFileName(null)
    setError(null)
    onText('')
  }

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-8
          transition-all duration-200 cursor-pointer
          ${dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
          }
        `}
      >
        <input
          type="file"
          id="file-upload"
          accept=".txt,.pdf"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Upload syllabus file"
        />

        <div className="flex flex-col items-center justify-center gap-4 text-center pointer-events-none">
          {fileName ? (
            <>
              <FileText className="w-12 h-12 text-green-600" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{fileName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  File uploaded successfully
                </p>
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="pointer-events-auto mt-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-2"
                aria-label="Clear uploaded file"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Drop your syllabus here
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  or click to browse (.txt or .pdf)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}
