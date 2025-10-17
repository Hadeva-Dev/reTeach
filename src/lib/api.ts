import type { Topic, Question, TopicStat, Preview } from './schema'
import { fakePreview } from './fakeData'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Parse topics from syllabus text using AI backend
 */
export async function parseTopics(syllabusText: string): Promise<Topic[]> {
  try {
    const response = await fetch(`${API_BASE}/api/topics/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        syllabus_text: syllabusText,
        course_level: 'ug' // undergraduate
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to parse topics: ${response.statusText}`)
    }

    const data = await response.json()
    return data.topics || []

  } catch (error) {
    console.error('Error parsing topics:', error)
    throw error
  }
}

/**
 * Generate MCQ questions for given topics using AI backend
 */
export async function generateQuestions(
  topics: Topic[],
  _count: number = 20, // Unused - now always generates 3 per topic
  assessmentType: 'survey' | 'quiz' = 'quiz',
  textbookId?: string | null
): Promise<Question[]> {
  try {
    // Generate exactly 3 questions per topic
    const topicNames = topics.map(t => t.name)
    const countPerTopic = 3

    // Use survey endpoint for survey type, questions endpoint for quiz
    const endpoint = assessmentType === 'survey'
      ? `${API_BASE}/api/survey/generate`
      : `${API_BASE}/api/questions/generate`

    const requestBody: any = {
      topics: topicNames,
      count_per_topic: countPerTopic,
      difficulty: 'med',
      total_count: topicNames.length * countPerTopic  // Total = 3 * number of topics
    }

    // If textbook ID is provided, include it for textbook-based generation
    if (textbookId) {
      requestBody.textbook_id = textbookId
      requestBody.use_textbook = true
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Failed to generate questions: ${response.statusText}`)
    }

    const data = await response.json()

    // Transform backend response to match frontend schema
    const questions = (data.questions || []).map((q: any) => ({
      id: q.id,
      topic: q.topic,
      stem: q.stem,
      options: q.options?.slice(0, 3) ?? ['Yes', 'Maybe', 'No'],
      answerIndex: q.answerIndex,
      rationale: q.rationale,
      difficulty: q.difficulty,
      bloom: q.bloom
    }))

    return questions

  } catch (error) {
    console.error('Error generating questions:', error)
    throw error
  }
}

export async function createForm(
  title: string,
  questions: Question[]
): Promise<{ formUrl: string; sheetUrl: string; slug: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/forms/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        questions: questions.map(q => ({
          id: q.id,
          topic: q.topic,
          stem: q.stem,
          options: q.options,
          answer_index: q.answerIndex,
          rationale: q.rationale,
          difficulty: q.difficulty,
          bloom: q.bloom
        }))
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to publish form: ${response.statusText}`)
    }

    const data = await response.json()

    // Build full URL for student access
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    const formUrl = `${baseUrl}/form/${data.slug}`

    return {
      formUrl,
      sheetUrl: formUrl, // For now, use same URL (results will be in dashboard)
      slug: data.slug
    }
  } catch (error) {
    console.error('Error creating form:', error)
    throw error
  }
}

export async function fetchResults(formId: string): Promise<TopicStat[]> {
  // Stub: Return sample stats for demo
  // In production: GET from backend Google Sheets API
  await new Promise(resolve => setTimeout(resolve, 800))

  return [
    { topic: 'Introduction to Course', n: 45, correctPct: 78.5 },
    { topic: 'Core Concepts', n: 45, correctPct: 65.2 },
    { topic: 'Advanced Topics', n: 45, correctPct: 52.8 },
    { topic: 'Applications', n: 45, correctPct: 71.3 }
  ]
}

export async function fetchPreview(formId: string): Promise<Preview> {
  // Stub: Return composed preview payload
  // In production: aggregate metrics + distribution via backend
  await new Promise(resolve => setTimeout(resolve, 900))

  return {
    ...fakePreview,
    id: formId,
    title: fakePreview.title,
    updatedAt: fakePreview.updatedAt
  }
}
