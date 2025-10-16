import { create } from 'zustand'
import type { Topic, Question } from './schema'

interface Store {
  topics: Topic[]
  questions: Question[]
  formUrl: string | null
  sheetUrl: string | null

  setTopics: (topics: Topic[]) => void
  setQuestions: (questions: Question[]) => void
  setLinks: (formUrl: string, sheetUrl: string) => void

  addTopic: (topic: Topic) => void
  removeTopic: (topicId: string) => void
  updateTopic: (topicId: string, updates: Partial<Topic>) => void

  updateQuestion: (questionId: string, updates: Partial<Question>) => void
  removeQuestion: (questionId: string) => void
}

export const useStore = create<Store>((set) => ({
  topics: [],
  questions: [],
  formUrl: null,
  sheetUrl: null,

  setTopics: (topics) => set({ topics }),
  setQuestions: (questions) => set({ questions }),
  setLinks: (formUrl, sheetUrl) => set({ formUrl, sheetUrl }),

  addTopic: (topic) => set((state) => ({
    topics: [...state.topics, topic]
  })),

  removeTopic: (topicId) => set((state) => ({
    topics: state.topics.filter(t => t.id !== topicId)
  })),

  updateTopic: (topicId, updates) => set((state) => ({
    topics: state.topics.map(t =>
      t.id === topicId ? { ...t, ...updates } : t
    )
  })),

  updateQuestion: (questionId, updates) => set((state) => ({
    questions: state.questions.map(q =>
      q.id === questionId ? { ...q, ...updates } : q
    )
  })),

  removeQuestion: (questionId) => set((state) => ({
    questions: state.questions.filter(q => q.id !== questionId)
  })),
}))
