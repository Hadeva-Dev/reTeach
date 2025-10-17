import { create } from 'zustand'
import type { Topic, Question } from './schema'

interface Store {
  topics: Topic[]
  questions: Question[]
  formUrl: string | null
  formSlug: string | null
  formId: string | null

  setTopics: (topics: Topic[]) => void
  setQuestions: (questions: Question[]) => void
  setPublishInfo: (info: { formUrl: string; formSlug: string; formId: string | null }) => void
  clearPublishInfo: () => void

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
  formSlug: null,
  formId: null,

  setTopics: (topics) => set({ topics }),
  setQuestions: (questions) => set({ questions }),
  setPublishInfo: ({ formUrl, formSlug, formId }) => set({ formUrl, formSlug, formId }),
  clearPublishInfo: () => set({ formUrl: null, formSlug: null, formId: null }),

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
