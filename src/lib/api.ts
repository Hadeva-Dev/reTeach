import type { Topic, Question, TopicStat } from './schema'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

export async function parseTopics(syllabusText: string): Promise<Topic[]> {
  // Stub: Return sample topics for demo
  // In production: POST to backend AI service
  await new Promise(resolve => setTimeout(resolve, 1000))

  return [
    { id: '1', name: 'Introduction to Course', weight: 0.1, prereqs: [] },
    { id: '2', name: 'Core Concepts', weight: 0.3, prereqs: ['1'] },
    { id: '3', name: 'Advanced Topics', weight: 0.4, prereqs: ['2'] },
    { id: '4', name: 'Applications', weight: 0.2, prereqs: ['3'] }
  ]
}

export async function generateQuestions(
  topics: Topic[],
  count: number = 20
): Promise<Question[]> {
  // Stub: Return sample questions for demo
  // In production: POST to backend AI service
  await new Promise(resolve => setTimeout(resolve, 1500))

  const questions: Question[] = []
  const topicsWithWeight = topics.filter(t => t.weight > 0)

  for (let i = 0; i < count; i++) {
    const topic = topicsWithWeight[i % topicsWithWeight.length]
    questions.push({
      id: `q${i + 1}`,
      topic: topic.name,
      stem: `Sample question ${i + 1} about ${topic.name}?`,
      options: [
        'Option A',
        'Option B',
        'Option C',
        'Option D'
      ] as [string, string, string, string],
      answerIndex: Math.floor(Math.random() * 4),
      difficulty: ['easy', 'med', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'med' | 'hard',
      bloom: ['remember', 'understand', 'apply', 'analyze'][Math.floor(Math.random() * 4)] as any
    })
  }

  return questions
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
