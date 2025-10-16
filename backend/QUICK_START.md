# Quick Start - Test the Diagnostic Workflow

## What's Been Built

✅ **Complete working workflow** (without textbook parsing yet):
1. Syllabus → Topic extraction (Claude AI)
2. Topic → Diagnostic survey generation (Yes/No questions)
3. Interactive survey (collect student answers)
4. Gap analysis (identify weak topics <60%)
5. Study plan generation (personalized for weak topics)
6. Verification quiz (10 MCQ questions on weak topics)

## Test It Right Now!

### 1. Run the Simple Test
```bash
cd backend
source venv/bin/activate
python test_simple_workflow.py
```

### What It Does
```
Step 1: Parse syllabus → Extract 5-6 topics
Step 2: Generate survey → 5 Yes/No questions per topic (30 total)
Step 3: Interactive quiz → You answer y/n
Step 4: Gap analysis → Shows strong vs weak topics
Step 5: Study plan → Personalized plan for weak topics
Step 6: Verification quiz → 10 MCQ questions exported to JSON
```

### Example Session
```
DIAGNOSTIC LEARNING SYSTEM

[STEP 1] Parsing course syllabus...
✓ Extracted 6 topics:
  • t_001: Arrays and Lists [weight: 2.0]
  • t_002: Stacks and Queues [weight: 1.5]
  ...

[STEP 2] Generating diagnostic survey...
✓ Generated 30 survey questions

[STEP 3] Taking diagnostic survey...

Topic: Arrays and Lists
──────────────────────────────────────
  Can you implement a dynamic array? [y/n]: n
  Do you know the difference between arrays and linked lists? [y/n]: y
  ...

[STEP 4] Analyzing knowledge gaps...

KNOWLEDGE GAP ANALYSIS
══════════════════════════════════════
Overall Readiness: 58.3%

✓ Strong Topics (≥60%):
  • Stacks and Queues: 80% (4/5)

⚠ Weak Topics (<60%) - Need Study:
  • Arrays and Lists: 40% (2/5) - PRIORITY
  • Trees: 20% (1/5) - PRIORITY

[STEP 5] Generating study plan...

PERSONALIZED STUDY PLAN
══════════════════════════════════════
Total Estimated Time: 90 minutes

Step 1: Arrays and Lists [HIGH PRIORITY]
  Current Score: 40%

  Key Concepts to Review:
    • Dynamic array resizing
    • Array vs linked list trade-offs
    • Time complexity of operations

  Recommended Resources:
    • [VIDEO] Array Data Structures (15 min)
      https://www.khanacademy.org/...
    • [READING] Arrays Tutorial (20 min)

  Estimated Time: 45 minutes

[STEP 6] Generating verification quiz...
✓ Generated 10 verification questions

Files Generated:
  • study_plan_20241016_143025.json
  • verification_quiz_20241016_143025.json
```

## Test Data Locations

### For Syllabi
Put your course syllabi here:
```
backend/test_data/syllabi/
  ├── my_course.txt
  ├── another_course.md
  └── ...
```

### For Textbooks (Future)
Put textbook PDFs here:
```
backend/test_data/textbooks/
  ├── stewart_calculus.pdf
  ├── intro_to_algorithms.pdf
  └── ...
```

## Output Files

After running the workflow, find generated files in `backend/`:

### study_plan_*.json
```json
{
  "generated_at": "2024-10-16T14:30:25",
  "weak_topics": [...],
  "steps": [
    {
      "step": 1,
      "topic": "Arrays and Lists",
      "priority": "HIGH",
      "current_score": 40.0,
      "key_concepts": ["dynamic resizing", "time complexity"],
      "resources": [...],
      "estimated_minutes": 45
    }
  ],
  "total_estimated_minutes": 90
}
```

### verification_quiz_*.json
```json
{
  "quiz_id": "quiz_20241016_143025",
  "focus_topics": ["Arrays and Lists", "Trees"],
  "question_count": 10,
  "questions": [
    {
      "id": "q_001",
      "topic": "Arrays and Lists",
      "stem": "What is the time complexity of inserting at the end of a dynamic array?",
      "options": ["O(1) amortized", "O(n)", "O(log n)", "O(1) worst-case"],
      "answerIndex": 0,
      "rationale": "...",
      "difficulty": "med"
    }
  ]
}
```

## What Works Now

✅ Topic extraction from syllabus (Claude AI)
✅ Diagnostic survey generation (Yes/No questions)
✅ Interactive answer collection (terminal)
✅ Knowledge gap analysis (<60% = weak)
✅ Study plan generation (resources, time estimates)
✅ Verification quiz (10 MCQ questions)
✅ JSON export (study plan + quiz)
✅ Caching (faster on repeated runs)

## What's NOT Built Yet

❌ Textbook parsing (ToC extraction)
❌ Textbook library (reusable textbooks)
❌ Page range assignment (from textbook sections)
❌ Database storage (currently in-memory only)
❌ Progress tracking (mark readings complete)
❌ Web UI (terminal only for now)

## Database Migrations

If you want to use database storage, run these in Supabase SQL Editor:

```sql
-- Run in order:
001_initial_schema.sql       -- Base tables
002_diagnostic_schema.sql    -- Diagnostic system
003_textbook_library_schema.sql  -- Textbook library (NEW!)
```

### How to Run
1. Go to Supabase Dashboard
2. Click "SQL Editor" (left sidebar)
3. Click "New Query"
4. Copy entire SQL file
5. Paste and click "Run"
6. Verify success in "Table Editor"

## Architecture Overview

```
┌─────────────┐
│  Syllabus   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  Topic Extraction       │  ← Claude API
│  (Claude LLM)           │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Diagnostic Survey      │  ← 5 Y/N questions per topic
│  (Yes/No Questions)     │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Interactive Quiz       │  ← You answer
│  (Terminal Input)       │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Gap Analysis           │  ← Score < 60% = weak
│  (Identify Weak Topics) │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Study Plan Generator   │  ← Resources, time estimates
│  (Personalized Plan)    │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Verification Quiz      │  ← 10 MCQ on weak topics
│  (10 Questions)         │
└─────────────────────────┘
```

## Cost & Performance

### Claude API Costs (per run)
- Topic extraction: 1 call (~$0.01)
- Survey generation: 6 calls (~$0.06)
- Study plan: 2 calls (~$0.02)
- Verification quiz: 1 call (~$0.01)

**Total: ~$0.10 per complete workflow**

### Performance
- First run: ~60-90 seconds
- Cached runs: ~30 seconds
- Most time: Waiting for Claude API

### Caching
All Claude responses cached in `.cache/llm_responses/`
- Reuse survey questions for same syllabus
- Faster testing and development
- Clear cache: `rm -rf .cache/`

## Next Steps

### Phase 1: Test Current System
```bash
python test_simple_workflow.py
```

### Phase 2: Add Database Storage (Optional)
- Run SQL migrations in Supabase
- Update services to save to DB

### Phase 3: Build Textbook Parsing (Future)
- Parse ToC from PDF
- Extract chapter/section structure
- Map topics to page ranges
- Build reusable textbook library

## Troubleshooting

### "Module not found" errors
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### "ANTHROPIC_API_KEY not found"
Check `backend/.env` file has your API key

### Survey questions seem generic
Claude is working! Questions are intentionally simple (Yes/No format)

### Want to test without Claude API
Edit `test_simple_workflow.py` and hardcode sample questions

## Files You Should Know About

### Working Code
- `test_simple_workflow.py` - **RUN THIS!** Complete workflow
- `app/services/topic_parser.py` - Topic extraction (working)
- `app/services/question_generator.py` - Question generation (working)
- `app/services/llm_service.py` - Claude API client (working)

### Documentation
- `docs/DIAGNOSTIC_SYSTEM.md` - Full system specification
- `docs/TEXTBOOK_LIBRARY_SYSTEM.md` - Textbook approach
- `docs/IMPLEMENTATION_STATUS.md` - What's done vs. not done
- `QUICK_START.md` - This file!

### Database
- `supabase/001_initial_schema.sql` - Base tables
- `supabase/002_diagnostic_schema.sql` - Diagnostic system
- `supabase/003_textbook_library_schema.sql` - Textbook library

### Models (Type Definitions)
- `app/models/survey.py` - Survey data structures
- `app/models/study_plan.py` - Study plan data structures
- `app/models/resource.py` - Textbook data structures

## Example: Create Your Own Syllabus

Create `test_data/syllabi/my_course.txt`:

```
# Python Programming 101

## Course Topics

1. Variables and Data Types
   - int, float, str, bool
   - Type conversion

2. Control Flow
   - if/elif/else statements
   - for and while loops
   - break and continue

3. Functions
   - Defining functions
   - Parameters and return values
   - Variable scope

4. Lists and Dictionaries
   - Creating and modifying lists
   - Dictionary operations
   - List comprehensions

5. File I/O
   - Reading files
   - Writing files
   - Working with CSV
```

Then modify `test_simple_workflow.py` to load your file instead of `SAMPLE_SYLLABUS`.

## Questions?

Check these docs:
- **Full system design:** `docs/DIAGNOSTIC_SYSTEM.md`
- **Textbook strategy:** `docs/TEXTBOOK_LIBRARY_SYSTEM.md`
- **Implementation status:** `docs/IMPLEMENTATION_STATUS.md`

Or just run the test and see what happens!
```bash
python test_simple_workflow.py
```
