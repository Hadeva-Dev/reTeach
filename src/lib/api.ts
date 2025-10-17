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
  count: number = 20,
  assessmentType: 'survey' | 'quiz' = 'quiz',
  textbookId?: string | null
): Promise<Question[]> {
  try {
    // Calculate questions per topic
    const topicNames = topics.map(t => t.name)
    const countPerTopic = Math.max(1, Math.floor(count / topicNames.length))

    // Use survey endpoint for survey type, questions endpoint for quiz
    const endpoint = assessmentType === 'survey'
      ? `${API_BASE}/api/survey/generate`
      : `${API_BASE}/api/questions/generate`

    const requestBody: any = {
      topics: topicNames,
      count_per_topic: countPerTopic,
      difficulty: 'med'
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
      options: q.options.slice(0, 4) as [string, string, string, string],
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
): Promise<{ formUrl: string; sheetUrl: string }> {
  // Stub: Return sample URLs for demo
  // In production: POST to backend Google Forms API
  await new Promise(resolve => setTimeout(resolve, 1000))

  return {
    formUrl: `https://forms.google.com/sample/${Date.now()}`,
    sheetUrl: `https://docs.google.com/spreadsheets/sample/${Date.now()}`
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
