import { z } from 'zod'

export const Topic = z.object({
  id: z.string(),
  name: z.string(),
  weight: z.number().min(0).max(1),
  prereqs: z.array(z.string()).default([])
})

export const Question = z.object({
  id: z.string(),
  topic: z.string(),
  stem: z.string(),
  options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  answerIndex: z.number().int().min(0).max(3),
  rationale: z.string().optional(),
  difficulty: z.enum(['easy', 'med', 'hard']).default('easy'),
  bloom: z.enum(['remember', 'understand', 'apply', 'analyze']).default('remember')
})

export const TopicStat = z.object({
  topic: z.string(),
  n: z.number().int(),
  correctPct: z.number()
})

export type Topic = z.infer<typeof Topic>
export type Question = z.infer<typeof Question>
export type TopicStat = z.infer<typeof TopicStat>
