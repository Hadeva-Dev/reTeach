# Interactive Diagnostic Learning System

## Overview

An intelligent, personalized learning system that diagnoses knowledge gaps, generates targeted study plans, and verifies learning through adaptive assessments.

## Architecture

```
┌──────────────┐
│   Syllabus   │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│   Topic Extraction   │  ← Claude API
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Diagnostic Survey    │  ← 3-5 Yes/No questions per topic
│ (Knowledge Check)    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐     ┌─────────────────┐
│  Gap Analysis        │ ←──→│ Textbook PDF    │
│  (Identify Weak)     │     │ (Optional)      │
└──────┬───────────────┘     └─────────────────┘
       │                              │
       │                              │
       ▼                              ▼
┌──────────────────────┐     ┌─────────────────┐
│ Study Plan Generator │ ←───│ Page Search     │  ← RAG/Claude
│                      │     │ (Find relevant) │
└──────┬───────────────┘     └─────────────────┘
       │
       ▼
┌──────────────────────┐
│ Verification Quiz    │  ← 10 MCQ on weak topics
│ (Confirm Learning)   │
└──────────────────────┘
```

## User Flow

### 1. Syllabus Upload
**Input:** Text or file path
**Action:** Parse course structure and extract topics
**Output:** List of 5-8 core topics with prerequisites

**Example:**
```
Topics extracted:
  t_001: Limits and Continuity (weight: 1.5)
  t_002: Derivatives (weight: 2.0) [prereq: t_001]
  t_003: Chain Rule (weight: 1.8) [prereq: t_002]
  ...
```

### 2. Resource Upload (Optional)
**Input:** Path to textbook PDF or assignment files
**Action:** Extract and index content page-by-page
**Output:** Searchable document store

**Supported formats:**
- PDF textbooks
- Assignment PDFs
- Lecture slides (future)

### 3. Diagnostic Survey
**Generation:** 3-5 yes/no questions per topic
**Purpose:** Quickly assess current knowledge

**Question Types:**
- **Conceptual:** "Do you understand the definition of a limit?"
- **Procedural:** "Can you find the derivative of x³?"
- **Application:** "Can you use the chain rule to differentiate composite functions?"

**Example Survey:**
```
Topic: Derivatives
─────────────────
Q1: Can you find the derivative of a polynomial function? [Y/N]
Q2: Do you know the power rule for differentiation? [Y/N]
Q3: Can you differentiate x⁵ + 3x² - 7? [Y/N]
Q4: Do you understand what a derivative represents? [Y/N]
Q5: Can you find the slope of a tangent line using derivatives? [Y/N]
```

### 4. Gap Analysis
**Input:** Survey responses (Yes/No per question)
**Processing:**
- Calculate score per topic (e.g., 2/5 = 40%)
- Identify "weak" topics (< 60% correct)
- Rank by priority (weight × gap size)

**Output:**
```
Knowledge Gap Analysis
══════════════════════
Strong Topics (≥60%):
  ✓ Limits (4/5 = 80%)
  ✓ Basic Functions (5/5 = 100%)

Weak Topics (<60%):
  ⚠ Derivatives (2/5 = 40%) - Priority: HIGH
  ⚠ Chain Rule (1/5 = 20%) - Priority: HIGH
  ⚠ Integration (3/5 = 60%) - Priority: MEDIUM
```

### 5. Study Plan Generation
**For Each Weak Topic:**

#### A. Search Textbook (if provided)
**Method 1 - Simple (Claude-based):**
```python
1. Extract text from PDF pages
2. Send to Claude with prompt:
   "Given this textbook content, identify the pages that cover [topic].
    Return page ranges of 3-10 pages that are most essential."
3. Parse Claude response for page numbers
```

**Method 2 - Advanced (RAG-based):**
```python
1. Chunk textbook into page-level segments
2. Generate embeddings for each page
3. Embed topic query
4. Vector similarity search
5. Return top-k most relevant pages
```

#### B. Generate Reading Assignment
**Output Structure:**
```json
{
  "topic": "Derivatives",
  "priority": 1,
  "resources": [
    {
      "type": "reading",
      "source": "Stewart Calculus (8th ed)",
      "pages": "142-149",
      "page_count": 8,
      "estimated_time": "35 minutes",
      "key_concepts": [
        "Definition of derivative",
        "Power rule",
        "Derivative notation"
      ],
      "why_relevant": "Covers foundational derivative concepts you missed in the survey"
    },
    {
      "type": "practice",
      "source": "Stewart Calculus (8th ed)",
      "section": "3.2",
      "problems": "#1-8, #15-20",
      "estimated_time": "25 minutes"
    }
  ]
}
```

#### C. Full Study Plan
```json
{
  "student_id": "uuid",
  "course_id": "uuid",
  "generated_at": "2024-10-16T14:30:00Z",

  "summary": {
    "topics_tested": 6,
    "topics_strong": 3,
    "topics_weak": 3,
    "overall_readiness": "58%",
    "estimated_study_time": "3.5 hours"
  },

  "weak_topics": [
    {
      "topic_id": "t_002",
      "topic_name": "Derivatives",
      "survey_score": "2/5",
      "readiness": "40%"
    }
  ],

  "study_plan": [
    {
      "step": 1,
      "topic": "Derivatives",
      "priority": "HIGH",
      "resources": [...],
      "goals": [
        "Understand the definition of a derivative",
        "Master the power rule",
        "Apply derivatives to find slopes"
      ]
    }
  ],

  "verification_quiz": {
    "quiz_id": "uuid",
    "question_count": 10,
    "focus_topics": ["Derivatives", "Chain Rule", "Integration"],
    "file": "verification_quiz_uuid.json"
  }
}
```

### 6. Verification Quiz
**Purpose:** Confirm that weak topics have been mastered

**Specifications:**
- Exactly 10 MCQ questions
- Only covers identified weak topics
- Proportional distribution (if 2 weak topics: 5 questions each)
- Difficulty: Medium-Hard
- Includes detailed explanations

**Example Question:**
```json
{
  "id": "vq_001",
  "topic": "Derivatives",
  "stem": "If f(x) = 3x⁴ - 2x² + 5, what is f'(x)?",
  "options": [
    "12x³ - 4x",
    "12x³ - 2x",
    "3x³ - 2x",
    "12x⁴ - 4x²"
  ],
  "answerIndex": 0,
  "rationale": "Using the power rule, differentiate each term: d/dx(3x⁴) = 12x³, d/dx(-2x²) = -4x, d/dx(5) = 0. Therefore f'(x) = 12x³ - 4x.",
  "difficulty": "med",
  "bloom": "apply"
}
```

## Technical Implementation

### Database Schema

#### New Tables

**1. resources**
```sql
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    resource_type VARCHAR(50) CHECK (resource_type IN ('textbook', 'assignment', 'slides', 'other')),
    file_path TEXT NOT NULL,
    file_size_mb DECIMAL(10,2),
    total_pages INTEGER,
    metadata JSONB DEFAULT '{}',
    indexed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**2. resource_pages** (for searchability)
```sql
CREATE TABLE resource_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    content TEXT,
    word_count INTEGER,
    has_images BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    UNIQUE(resource_id, page_number)
);

CREATE INDEX idx_resource_pages_content ON resource_pages USING gin(to_tsvector('english', content));
```

**3. diagnostic_surveys**
```sql
CREATE TABLE diagnostic_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    questions JSONB NOT NULL, -- Array of survey questions
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**4. survey_responses**
```sql
CREATE TABLE survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID REFERENCES diagnostic_surveys(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    answer BOOLEAN NOT NULL, -- Yes = true, No = false
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

**5. study_plans**
```sql
CREATE TABLE study_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    survey_id UUID REFERENCES diagnostic_surveys(id),
    weak_topics JSONB NOT NULL, -- Array of weak topic IDs
    plan_data JSONB NOT NULL, -- Full study plan structure
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
```

**6. reading_assignments**
```sql
CREATE TABLE reading_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_plan_id UUID REFERENCES study_plans(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    page_start INTEGER NOT NULL,
    page_end INTEGER NOT NULL,
    estimated_minutes INTEGER,
    key_concepts JSONB,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Services

#### 1. ResourceParserService
**File:** `app/services/resource_parser.py`

**Responsibilities:**
- Upload PDF files
- Extract text page-by-page using `pdfplumber`
- Store in database with metadata
- Build searchable index

**Key Methods:**
```python
async def upload_resource(file_path: str, course_id: UUID) -> Resource
async def extract_pages(resource_id: UUID) -> List[PageContent]
async def search_pages(query: str, resource_id: UUID) -> List[PageMatch]
```

#### 2. DiagnosticSurveyService
**File:** `app/services/diagnostic_survey.py`

**Responsibilities:**
- Generate 3-5 yes/no questions per topic
- Questions assess basic understanding
- Store survey structure

**Key Methods:**
```python
async def generate_survey(topics: List[Topic]) -> Survey
async def save_survey(survey: Survey, course_id: UUID) -> UUID
async def analyze_responses(responses: List[SurveyResponse]) -> GapAnalysis
```

**Question Generation Strategy:**
```python
# Prompt template
"""
Generate 5 diagnostic yes/no questions for the topic: {topic_name}

Questions should:
1. Be answerable with Yes/No
2. Test understanding at different levels (remember, understand, apply)
3. Be clear and unambiguous
4. Avoid trick questions

Return JSON array:
[
  {
    "id": "sq_001",
    "text": "Can you find the derivative of x³?",
    "cognitive_level": "apply"
  }
]
"""
```

#### 3. StudyPlanGeneratorService
**File:** `app/services/study_plan_generator.py`

**Responsibilities:**
- Match weak topics to textbook content
- Generate precise page ranges (3-10 pages)
- Create structured study plan
- Estimate time requirements

**Key Methods:**
```python
async def generate_study_plan(
    weak_topics: List[Topic],
    resources: List[Resource]
) -> StudyPlan

async def find_relevant_pages(
    topic: Topic,
    resource: Resource
) -> List[PageRange]

async def estimate_study_time(plan: StudyPlan) -> int  # minutes
```

**Search Algorithm (Simple):**
```python
1. Get topic name and description
2. Extract sample pages from textbook (ToC, index, first 20 pages)
3. Send to Claude:
   "This textbook covers [topic]. Based on the table of contents
    and sample content, identify the most essential 3-10 pages
    that cover this topic. Return page ranges only."
4. Parse response for page numbers
5. Validate ranges (3-10 pages, within book bounds)
```

#### 4. VerificationQuizService
**File:** `app/services/verification_quiz.py`

**Responsibilities:**
- Generate exactly 10 MCQ questions
- Focus on weak topics only
- Higher difficulty than survey
- Include detailed explanations

**Key Methods:**
```python
async def generate_verification_quiz(
    weak_topics: List[Topic],
    study_plan: StudyPlan
) -> Quiz
```

**Reuses:** Existing `QuestionGeneratorService` with adjusted parameters:
```python
questions = await question_generator.generate_questions(
    topics=[t.name for t in weak_topics],
    count_per_topic=calculate_distribution(weak_topics, total=10),
    difficulty=Difficulty.MEDIUM,
    purpose="verification"
)
```

### Models

#### survey.py
```python
class SurveyQuestion(BaseModel):
    id: str
    topic_id: str
    text: str
    cognitive_level: str  # remember, understand, apply

class Survey(BaseModel):
    id: str
    course_id: str
    questions: List[SurveyQuestion]

class SurveyResponse(BaseModel):
    survey_id: str
    student_id: Optional[str]
    topic_id: str
    question_id: str
    answer: bool  # True = Yes, False = No

class GapAnalysis(BaseModel):
    total_topics: int
    strong_topics: List[str]
    weak_topics: List[WeakTopic]
    overall_readiness: float  # percentage
```

#### study_plan.py
```python
class PageRange(BaseModel):
    start: int
    end: int
    page_count: int

class ReadingAssignment(BaseModel):
    topic: str
    source: str
    pages: PageRange
    estimated_minutes: int
    key_concepts: List[str]
    why_relevant: str

class PracticeAssignment(BaseModel):
    topic: str
    source: str
    section: str
    problems: str
    estimated_minutes: int

class StudyPlanStep(BaseModel):
    step_number: int
    topic: str
    priority: str  # HIGH, MEDIUM, LOW
    resources: List[Union[ReadingAssignment, PracticeAssignment]]
    goals: List[str]

class StudyPlan(BaseModel):
    id: str
    course_id: str
    student_id: Optional[str]
    summary: Dict[str, Any]
    weak_topics: List[WeakTopic]
    study_plan: List[StudyPlanStep]
    verification_quiz_id: str
    estimated_total_time: int  # minutes
```

#### resource.py
```python
class Resource(BaseModel):
    id: str
    course_id: str
    title: str
    resource_type: str  # textbook, assignment, slides
    file_path: str
    total_pages: int
    indexed: bool

class PageContent(BaseModel):
    page_number: int
    content: str
    word_count: int
    has_images: bool
```

## Interactive Script

### test_interactive_workflow.py

```python
#!/usr/bin/env python3
"""
Interactive Diagnostic Learning Workflow
Complete end-to-end personalized learning system
"""

import asyncio
from pathlib import Path
from rich.console import Console
from rich.prompt import Prompt, Confirm
from rich.table import Table
from rich.progress import track

console = Console()

async def main():
    console.print("[bold cyan]Interactive Diagnostic Learning System[/bold cyan]")
    console.print("="*60)

    # Step 1: Syllabus Input
    console.print("\n[bold]Step 1: Course Syllabus[/bold]")
    syllabus_path = Prompt.ask("Enter syllabus file path or paste text")

    syllabus_text = load_syllabus(syllabus_path)

    # Parse topics
    console.print("\n[yellow]Parsing topics with Claude...[/yellow]")
    topics = await parse_topics(syllabus_text)

    display_topics_table(topics)

    # Step 2: Resource Upload
    console.print("\n[bold]Step 2: Learning Resources (Optional)[/bold]")
    has_textbook = Confirm.ask("Do you have a textbook PDF?")

    resource = None
    if has_textbook:
        textbook_path = Prompt.ask("Enter textbook PDF path")
        console.print("\n[yellow]Uploading and indexing textbook...[/yellow]")
        resource = await upload_and_index_resource(textbook_path)
        console.print(f"[green]✓[/green] Indexed {resource.total_pages} pages")

    # Step 3: Diagnostic Survey
    console.print("\n[bold]Step 3: Knowledge Diagnostic[/bold]")
    console.print("Answer Yes/No to assess your current understanding\n")

    survey = await generate_survey(topics)
    responses = []

    for topic in topics:
        console.print(f"\n[cyan]Topic: {topic.name}[/cyan]")
        console.print("─" * 60)

        topic_questions = [q for q in survey.questions if q.topic_id == topic.id]

        for q in topic_questions:
            answer = Confirm.ask(f"  {q.text}")
            responses.append(SurveyResponse(
                topic_id=topic.id,
                question_id=q.id,
                answer=answer
            ))

    # Step 4: Gap Analysis
    console.print("\n[bold]Step 4: Analyzing Results...[/bold]")
    gap_analysis = await analyze_gaps(responses, topics)

    display_gap_analysis(gap_analysis)

    # Step 5: Generate Study Plan
    if gap_analysis.weak_topics:
        console.print("\n[bold]Step 5: Generating Study Plan...[/bold]")

        study_plan = await generate_study_plan(
            weak_topics=gap_analysis.weak_topics,
            resources=[resource] if resource else []
        )

        display_study_plan(study_plan)

        # Step 6: Verification Quiz
        console.print("\n[bold]Step 6: Generating Verification Quiz...[/bold]")
        quiz = await generate_verification_quiz(gap_analysis.weak_topics)

        # Export
        export_study_plan(study_plan, "study_plan.json")
        export_quiz(quiz, "verification_quiz.json")

        console.print("\n[green]✓ Study plan exported to: study_plan.json[/green]")
        console.print("[green]✓ Verification quiz exported to: verification_quiz.json[/green]")
    else:
        console.print("\n[green]✓ No weak topics identified! You're well prepared.[/green]")

if __name__ == "__main__":
    asyncio.run(main())
```

## Usage Examples

### Example 1: With Textbook
```bash
$ python test_interactive_workflow.py

Interactive Diagnostic Learning System
============================================================

Step 1: Course Syllabus
Enter syllabus file path: calculus_syllabus.txt

Parsing topics with Claude...

Extracted Topics:
  t_001: Limits (weight: 1.5)
  t_002: Derivatives (weight: 2.0)
  t_003: Integration (weight: 1.8)

Step 2: Learning Resources (Optional)
Do you have a textbook PDF? Yes
Enter textbook PDF path: stewart_calculus.pdf

Uploading and indexing textbook...
✓ Indexed 892 pages

Step 3: Knowledge Diagnostic

Topic: Derivatives
────────────────────────────────────────────────────────────
  Can you find the derivative of x³? Yes
  Do you know the power rule? Yes
  Can you apply the chain rule? No
  Can you differentiate composite functions? No
  Do you understand implicit differentiation? No

...

Step 4: Analyzing Results...

Knowledge Gap Analysis
══════════════════════════════════════════════════════════
Strong Topics (≥60%):
  ✓ Limits (4/5 = 80%)

Weak Topics (<60%):
  ⚠ Derivatives (2/5 = 40%) - Priority: HIGH
  ⚠ Integration (2/5 = 40%) - Priority: HIGH

Step 5: Generating Study Plan...

Study Plan Generated
══════════════════════════════════════════════════════════
Estimated Total Time: 2.5 hours

Topic: Derivatives [Priority: HIGH]
  📖 Reading: Stewart Calculus, pages 145-152 (8 pages, ~35 min)
     Key Concepts: Power rule, Product rule, Quotient rule
  ✏️  Practice: Section 3.2, problems #1-10 (~25 min)

Topic: Integration [Priority: HIGH]
  📖 Reading: Stewart Calculus, pages 298-306 (9 pages, ~40 min)
     Key Concepts: Definite integrals, Fundamental Theorem
  ✏️  Practice: Section 5.3, problems #1-8 (~30 min)

Step 6: Generating Verification Quiz...

✓ Study plan exported to: study_plan.json
✓ Verification quiz exported to: verification_quiz.json

Next steps:
1. Follow the study plan
2. Complete readings and practice problems
3. Take the verification quiz to confirm mastery
```

### Example 2: Without Textbook
```bash
$ python test_interactive_workflow.py

...

Step 2: Learning Resources (Optional)
Do you have a textbook PDF? No

Step 3: Knowledge Diagnostic
...

Step 5: Generating Study Plan...

Note: No textbook provided. Study plan will include general resources.

Study Plan Generated
══════════════════════════════════════════════════════════
Topic: Derivatives [Priority: HIGH]
  📚 Recommended Resource: Khan Academy - Derivatives
  🎯 Focus Areas:
     - Power rule
     - Chain rule
     - Product and quotient rules
  ⏱️  Estimated Time: 45 minutes
```

## Configuration

### Environment Variables
```bash
# Existing
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://...
SUPABASE_KEY=...

# New
UPLOADS_DIR=uploads          # Where to store PDFs
MAX_PDF_SIZE_MB=50          # Max textbook size
PAGES_PER_READING=8         # Target reading length
MIN_SURVEY_QUESTIONS=3      # Per topic
MAX_SURVEY_QUESTIONS=5      # Per topic
```

### Dependencies
```txt
# Existing dependencies
fastapi==0.115.0
...

# New dependencies
pdfplumber==0.11.0          # PDF text extraction
rich==13.7.0                # Terminal UI
sentence-transformers==2.2.2  # Optional: for embeddings
numpy==1.24.3               # Optional: for vector ops
```

## Performance Considerations

### PDF Processing
- **Large textbooks (800+ pages):** 30-60 seconds to extract and index
- **Optimization:** Cache extracted text, index once
- **Memory:** Stream pages rather than loading entire PDF

### Claude API Calls
- **Survey generation:** 1 call per topic (~6 calls)
- **Study plan:** 1 call per weak topic + 1 for page search
- **Verification quiz:** 1 call total
- **Total:** ~10-15 API calls per workflow
- **Cost:** ~$0.50-1.00 per complete workflow

### Caching Strategy
- Cache survey questions per syllabus hash
- Cache textbook page extractions permanently
- Cache Claude responses for identical prompts

## Future Enhancements

### Phase 2 Features
1. **Spaced Repetition:** Schedule follow-up quizzes
2. **Progress Tracking:** Monitor completion of study plan
3. **Adaptive Difficulty:** Adjust based on quiz performance
4. **Multiple Resources:** Combine textbook + lecture notes + videos
5. **Collaborative:** Share study plans with classmates

### Phase 3 Features
1. **Video Integration:** Extract transcripts, link to Khan Academy
2. **Practice Problem Generator:** Create unlimited practice
3. **Flashcard Generation:** Auto-generate Anki decks
4. **Study Group Matching:** Find peers with similar gaps

## Troubleshooting

### PDF Extraction Fails
- **Issue:** `pdfplumber` can't read PDF
- **Solution:** Try `PyMuPDF` as fallback
- **Prevention:** Validate PDF before upload

### Claude Returns Invalid Page Ranges
- **Issue:** Pages outside book bounds or too wide
- **Solution:** Add validation, prompt Claude for correction
- **Fallback:** Use table of contents extraction

### Low Survey Accuracy
- **Issue:** Yes/No questions too ambiguous
- **Solution:** Refine prompts, add examples
- **Alternative:** Use confidence scale (1-5) instead of binary

## Conclusion

This system transforms passive learning into an active, personalized experience:

1. **Diagnose** knowledge gaps quickly (5-10 minutes)
2. **Prescribe** precise learning materials (specific pages)
3. **Verify** understanding through targeted assessment
4. **Iterate** until mastery is achieved

By combining LLMs (Claude) with traditional educational resources (textbooks), we create an intelligent tutor that adapts to each student's needs.
