# reTeach - Backend-Frontend Integration Guide

Complete guide for integrating the AI-powered diagnostic system with the Next.js frontend.

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                         │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐          │
│  │  /create   │  │  /students  │  │  /dashboard  │          │
│  │  (Prompt)  │  │  (Results)  │  │  (Overview)  │          │
│  └─────┬──────┘  └──────┬──────┘  └──────┬───────┘          │
│        │                │                 │                   │
│        └────────────────┴─────────────────┘                   │
│                         │                                     │
│                    lib/api.ts                                 │
│                         │                                     │
└─────────────────────────┼─────────────────────────────────────┘
                          │ HTTP/JSON
                          ↓
┌──────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Routers (/api/...)                              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐   │   │
│  │  │  topics    │  │ questions  │  │   surveys    │   │   │
│  │  │  /parse    │  │ /generate  │  │  /generate   │   │   │
│  │  └─────┬──────┘  └─────┬──────┘  └──────┬───────┘   │   │
│  └────────┼────────────────┼─────────────────┼───────────┘   │
│           │                │                 │               │
│  ┌────────┴────────────────┴─────────────────┴───────────┐   │
│  │                  Services Layer                        │   │
│  │  ┌──────────────┐  ┌─────────────────┐  ┌──────────┐ │   │
│  │  │ Topic Parser │  │Question Generator│  │LLM Service││  │
│  │  └──────┬───────┘  └────────┬─────────┘  └─────┬────┘ │   │
│  └─────────┼──────────────────┬─┼──────────────────┘      │   │
│            │                  │ │                          │   │
│            ↓                  ↓ ↓                          │   │
│  ┌─────────────────────────────────────────────────────┐  │   │
│  │           Claude API (Anthropic)                    │  │   │
│  │     - Topic extraction from syllabi                 │  │   │
│  │     - MCQ question generation                       │  │   │
│  │     - Diagnostic survey creation                    │  │   │
│  └─────────────────────────────────────────────────────┘  │   │
│                                                             │   │
│  ┌─────────────────────────────────────────────────────┐  │   │
│  │              Supabase Database                       │  │   │
│  │     - Topics, Questions, Surveys                     │  │   │
│  │     - Student responses & analytics                  │  │   │
│  └─────────────────────────────────────────────────────┘  │   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials:
# - SUPABASE_URL
# - SUPABASE_KEY
# - ANTHROPIC_API_KEY
```

### 2. Start Backend Server

```bash
cd backend
python app/main.py

# Or with auto-reload:
uvicorn app.main:app --reload --port 8000
```

Backend will run on `http://localhost:8000`

API Docs: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
# Install dependencies
npm install

# Configure environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start dev server
npm run dev
```

Frontend will run on `http://localhost:3000`

---

## 📡 API Endpoints

### Topics

**POST /api/topics/parse**
- Extract topics from syllabus text using AI
- Request:
  ```json
  {
    "syllabus_text": "Course syllabus content...",
    "course_level": "ug"  // hs, ug, grad
  }
  ```
- Response:
  ```json
  {
    "topics": [
      {
        "id": "t_001",
        "name": "Introduction to Calculus",
        "weight": 0.3,
        "prereqs": []
      }
    ]
  }
  ```

### Questions

**POST /api/questions/generate**
- Generate MCQ diagnostic questions using AI
- Request:
  ```json
  {
    "topics": ["Calculus", "Linear Algebra"],
    "count_per_topic": 5,
    "difficulty": "med"  // easy, med, hard
  }
  ```
- Response:
  ```json
  {
    "questions": [
      {
        "id": "q_001",
        "topic": "Calculus",
        "stem": "What is the derivative of x^2?",
        "options": ["2x", "x", "2", "x^2"],
        "answerIndex": 0,
        "rationale": "Using power rule...",
        "difficulty": "easy",
        "bloom": "remember"
      }
    ]
  }
  ```

### Surveys

**POST /api/survey/generate**
- Create diagnostic survey with Yes/No questions
- Request:
  ```json
  {
    "topics": ["t_001", "t_002"],
    "questions_per_topic": 5
  }
  ```
- Response:
  ```json
  {
    "survey": {
      "id": "survey_10q",
      "title": "Diagnostic Survey",
      "questions": [
        {
          "id": "sq_001",
          "topic_id": "t_001",
          "text": "Do you understand derivatives?",
          "cognitive_level": "understand"
        }
      ]
    }
  }
  ```

---

## 🔄 Data Flow

### Create Diagnostic Flow

1. **User Input** → `/create` page
   - User enters focus area or uploads syllabus

2. **Topic Parsing** → `POST /api/topics/parse`
   - Frontend calls backend with syllabus text
   - Backend uses Claude AI to extract topics
   - Returns structured topic list

3. **Question Generation** → `POST /api/questions/generate`
   - Frontend passes topics to backend
   - Backend generates MCQ questions using Claude
   - Returns questions with answers & rationale

4. **Review & Edit** → `/review` page
   - User can edit questions before publishing
   - Questions stored in Zustand state

5. **Publish** → Create Google Form (future)
   - Export questions to Google Forms
   - Share with students

### Student Assessment Flow

1. **Take Diagnostic** → Google Forms (future)
   - Students answer questions
   - Responses stored in Google Sheets

2. **Gap Analysis** → Backend processing
   - Analyze which topics students struggled with
   - Identify weak topics (<60% correct)

3. **Study Plan Generation** → `POST /api/study-plan/generate`
   - Backend creates personalized study plan
   - Includes textbook sections + Khan Academy links
   - Prioritized by weakness level

4. **View Results** → `/students` page
   - Teacher sees student performance
   - Preview individual student reports
   - Download study plans

---

## 🗄️ Database Schema

```sql
-- Core tables in Supabase

topics (
  id uuid PRIMARY KEY,
  course_id uuid,
  topic_id text UNIQUE,
  name text NOT NULL,
  weight float,
  order_index int
)

questions (
  id uuid PRIMARY KEY,
  question_id text UNIQUE,
  topic_id uuid REFERENCES topics(id),
  stem text NOT NULL,
  options jsonb NOT NULL,
  answer_index int NOT NULL,
  rationale text,
  difficulty text,
  bloom_level text
)

surveys (
  id uuid PRIMARY KEY,
  survey_id text UNIQUE,
  course_id uuid,
  title text NOT NULL,
  description text,
  total_questions int
)

survey_questions (
  id uuid PRIMARY KEY,
  survey_id uuid REFERENCES surveys(id),
  topic_id uuid REFERENCES topics(id),
  text text NOT NULL,
  cognitive_level text
)

survey_responses (
  id uuid PRIMARY KEY,
  survey_id uuid,
  student_id text,
  question_id uuid,
  answer boolean,
  submitted_at timestamptz
)
```

---

## 🛠️ Development Workflow

### Adding a New API Endpoint

1. **Create Router** (`backend/app/routers/`)
   ```python
   from fastapi import APIRouter

   router = APIRouter(prefix="/api/feature", tags=["feature"])

   @router.post("/action")
   async def do_action(data: RequestModel):
       # Implementation
       return {"result": "success"}
   ```

2. **Register Router** (`backend/app/main.py`)
   ```python
   from app.routers import feature
   app.include_router(feature.router)
   ```

3. **Add Frontend Function** (`src/lib/api.ts`)
   ```typescript
   export async function doAction(data: any) {
     const response = await fetch(`${API_BASE}/api/feature/action`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(data)
     })
     return response.json()
   }
   ```

4. **Use in Component**
   ```typescript
   import { doAction } from '@/lib/api'

   const result = await doAction({ ... })
   ```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Test topic parsing
python test_topic_parser.py

# Test question generation
python test_question_gen.py

# Test full workflow
python test_interactive_workflow.py
```

### Frontend Testing

```bash
# Start backend first
cd backend && uvicorn app.main:app --reload

# Then test frontend integration
cd .. && npm run dev
```

---

## 🐛 Troubleshooting

### CORS Errors
**Problem**: Frontend can't connect to backend

**Solution**: Check backend CORS settings in `backend/app/main.py`
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### API Connection Failed
**Problem**: `Failed to parse topics: Network error`

**Solutions**:
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Verify Anthropic API key in backend `.env`

### Database Errors
**Problem**: `Database health check failed`

**Solutions**:
1. Verify Supabase credentials in `backend/.env`
2. Run SQL migrations in Supabase dashboard
3. Check RLS policies allow access

---

## 📦 Deployment

### Backend (Render/Railway/Fly.io)

```bash
# Example for Railway
railway init
railway add
railway up

# Set environment variables in dashboard:
# - SUPABASE_URL
# - SUPABASE_KEY
# - ANTHROPIC_API_KEY
```

### Frontend (Vercel)

```bash
vercel init
vercel deploy

# Set environment variable:
# NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

---

## 🔑 Key Files

### Backend
- `app/main.py` - FastAPI application entry
- `app/routers/` - API endpoints
- `app/services/` - Business logic (AI, parsing)
- `app/models/` - Pydantic schemas
- `app/database.py` - Supabase client

### Frontend
- `src/lib/api.ts` - API client functions
- `src/lib/schema.ts` - Zod schemas
- `src/app/(dashboard)/create/page.tsx` - Diagnostic creation
- `src/app/(dashboard)/students/page.tsx` - Student results
- `src/components/StudentsTable.tsx` - Student data display

---

## 📚 Next Steps

1. **Implement Google Forms Integration**
   - Export questions to Google Forms
   - Collect responses from Google Sheets

2. **Add Study Plan Frontend**
   - Display personalized study plans
   - Show textbook sections + Khan Academy links

3. **Student Authentication**
   - Track individual student progress
   - Personalized dashboards

4. **Analytics Dashboard**
   - Class-wide performance metrics
   - Topic difficulty analysis
   - Progress tracking over time

---

## 📝 License

MIT

## 🤝 Contributing

See main README for contribution guidelines
