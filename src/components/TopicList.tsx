'use client'

import { useState } from 'react'
import type { Topic } from '@/lib/schema'
import { Trash2, Plus, GripVertical } from 'lucide-react'

interface TopicListProps {
  topics: Topic[]
  onChange: (topics: Topic[]) => void
}

export default function TopicList({ topics, onChange }: TopicListProps) {
  const [newTopicName, setNewTopicName] = useState('')

  const handleWeightChange = (topicId: string, weight: number) => {
    const updated = topics.map(t =>
      t.id === topicId ? { ...t, weight } : t
    )
    onChange(updated)
  }

  const handleRemove = (topicId: string) => {
    const updated = topics.filter(t => t.id !== topicId)
    onChange(updated)
  }

  const handleAdd = () => {
    if (!newTopicName.trim()) return

    const newTopic: Topic = {
      id: `topic-${Date.now()}`,
      name: newTopicName.trim(),
      weight: 0.1,
      prereqs: []
    }

    onChange([...topics, newTopic])
    setNewTopicName('')
  }

  const totalWeight = topics.reduce((sum, t) => sum + t.weight, 0)
  const isWeightValid = Math.abs(totalWeight - 1) < 0.01 // Allow 1% tolerance

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Topics ({topics.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Total weight: {totalWeight.toFixed(2)}
            {!isWeightValid && (
              <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">
                ⚠ Should sum to 1.00
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Topic List */}
      <div className="space-y-3">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
          >
            {/* Drag Handle (visual only for now) */}
            <div className="cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <GripVertical className="w-5 h-5" />
            </div>

            {/* Topic Name */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {topic.name}
              </p>
            </div>

            {/* Weight Slider */}
            <div className="flex items-center gap-3 min-w-[200px]">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={topic.weight}
                onChange={(e) => handleWeightChange(topic.id, parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-blue-600
                  [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                aria-label={`Weight for ${topic.name}`}
              />
              <span className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300 w-12 text-right">
                {(topic.weight * 100).toFixed(0)}%
              </span>
            </div>

            {/* Delete Button */}
            <button
              onClick={() => handleRemove(topic.id)}
              className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300
                hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
              aria-label={`Delete ${topic.name}`}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Topic */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTopicName}
          onChange={(e) => setNewTopicName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add new topic..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500"
          aria-label="New topic name"
        />
        <button
          onClick={handleAdd}
          disabled={!newTopicName.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300
            text-white font-medium rounded-lg transition-colors
            disabled:cursor-not-allowed flex items-center gap-2"
          aria-label="Add topic"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>
    </div>
  )
}
