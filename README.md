# reTeach - AI Diagnostic Question Generator

An EdTech platform that generates diagnostic multiple-choice questions from course syllabi, publishes them to Google Forms, and analyzes student performance.

## Features

- **Upload Syllabus** - Paste text or upload PDF/TXT files
- **Review Topics** - Extract and weight learning objectives
- **Preview Questions** - Edit AI-generated MCQs
- **Publish Form** - Create Google Forms with QR codes
- **View Results** - Analyze student performance by topic

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (state management)
- Recharts (data visualization)
- Zod (validation)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/              # Next.js pages
│   ├── upload/       # Syllabus upload
│   ├── review/       # Topic weighting
│   ├── preview/      # Question editing
│   ├── publish/      # Form publication
│   └── results/      # Performance analysis
├── components/       # React components
│   ├── NavBar.tsx
│   ├── FileDrop.tsx
│   ├── TopicList.tsx
│   ├── QuestionTable.tsx
│   └── ResultsChart.tsx
└── lib/             # Utilities
    ├── schema.ts    # Zod schemas
    ├── store.ts     # Zustand store
    └── api.ts       # API functions
```

## API Integration

Currently uses stub functions in \`lib/api.ts\`. To connect to a real backend:

1. Update \`parseTopics()\` to call your syllabus parsing API
2. Update \`generateQuestions()\` to call your MCQ generation API
3. Update \`createForm()\` to integrate with Google Forms API
4. Update \`fetchResults()\` to pull from Google Sheets API

## Environment Variables

Create \`.env.local\`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## License

MIT
