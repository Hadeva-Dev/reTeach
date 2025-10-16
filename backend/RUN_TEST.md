# Run the Interactive Workflow - REAL TEST

## You Have Real Files Ready!

✅ Syllabus: `test_data/syllabi/syllabus.txt` (AP Physics C Mechanics)
✅ Textbook: `test_data/textbooks/textbook.pdf` (University Physics)

## Run the Complete Workflow

```bash
cd /home/dennis/Projects/reTeach/backend
source venv/bin/activate
python test_interactive_workflow.py
```

## What Will Happen

### Step 1: Syllabus Upload
```
Enter path to syllabus (PDF or TXT): test_data/syllabi/syllabus.txt
```

The script will:
- Load your AP Physics syllabus
- Parse it with Claude AI
- Extract 6-8 topics (kinematics, forces, energy, momentum, etc.)

### Step 2: Textbook Upload
```
Do you have a textbook PDF? [y/n]: y
Enter path to textbook PDF: test_data/textbooks/textbook.pdf
```

The script will:
- Parse the textbook structure (University Physics by Young & Freedman)
- Extract Table of Contents OR scan for chapter headers
- Build chapter/section → page number mappings
- Takes ~30-60 seconds for a large textbook

### Step 3: Topic Mapping
Automatically maps syllabus topics to textbook sections:
```
Mapping topics to textbook sections...
✓ Mapped topics to textbook:
  • Kinematics → Chapter 2: Motion Along a Straight Line (pages 35-68)
  • Forces → Chapter 4: Newton's Laws of Motion (pages 105-140)
  • Energy → Chapter 7: Energy and Work (pages 185-220)
  ...
```

### Step 4: Diagnostic Survey
You'll answer 5 Yes/No questions per topic (30-40 questions total):
```
Topic: Kinematics
──────────────────────────────────────
  Can you calculate velocity from position-time graphs? [y/n]: n
  Do you understand acceleration? [y/n]: y
  Can you solve projectile motion problems? [y/n]: n
  ...
```

### Step 5: Gap Analysis
Shows which topics you're weak on (<60%):
```
KNOWLEDGE GAP ANALYSIS
══════════════════════════════════════
Overall Readiness: 58.3%

✓ Strong Topics (≥60%):
  • Forces: 80% (4/5)
  • Momentum: 60% (3/5)

⚠ Weak Topics (<60%):
  • Kinematics: 40% (2/5) - NEEDS STUDY
  • Energy: 20% (1/5) - NEEDS STUDY
```

### Step 6: Personalized Study Plan
Gets specific page ranges from YOUR textbook:
```
PERSONALIZED STUDY PLAN
══════════════════════════════════════
Total Estimated Time: 90 minutes

Step 1: Kinematics [HIGH PRIORITY]
  Current Score: 40%

  📖 Reading Assignment:
     Source: University Physics 11th Edition
     Section: 2.2 - Instantaneous Velocity
     Pages: 42-49 (8 pages)
     Key Concepts: velocity, acceleration, derivatives

  ⏱  Estimated Time: 40 minutes
──────────────────────────────────────

Step 2: Energy [HIGH PRIORITY]
  Current Score: 20%

  📖 Reading Assignment:
     Source: University Physics 11th Edition
     Section: 7.1 - Work and Kinetic Energy
     Pages: 188-195 (8 pages)
     Key Concepts: work, kinetic energy, conservation

  ⏱  Estimated Time: 40 minutes
```

### Step 7: Verification Quiz
10 MCQ questions on your weak topics:
```
Q1. [Kinematics] An object moves with constant acceleration.
    If its velocity changes from 5 m/s to 15 m/s in 2 seconds,
    what is its acceleration?
    [ ] A. 2.5 m/s²
    [✓] B. 5 m/s²
    [ ] C. 10 m/s²
    [ ] D. 20 m/s²
```

## Output Files

After completion, you'll have:
- `study_plan_YYYYMMDD_HHMMSS.json` - Complete study plan with page numbers
- `verification_quiz_YYYYMMDD_HHMMSS.json` - 10 questions to verify learning

## Expected Performance

- **Syllabus parsing:** ~10 seconds
- **Textbook parsing:** ~30-60 seconds (one-time, then cached)
- **Topic mapping:** ~15 seconds
- **Survey generation:** ~30 seconds
- **Study plan generation:** ~20 seconds
- **Quiz generation:** ~10 seconds

**Total:** ~2-3 minutes (excluding your time answering questions)

## Your Real Test Case

**Course:** AP Physics C Mechanics
**Textbook:** University Physics 11th Edition by Young & Freedman
**Topics:** Kinematics, Forces, Energy, Momentum, Rotation, Oscillations, Gravitation

This is a REAL physics course with a REAL textbook - perfect for testing!

## If You Get Errors

### "pdfplumber not found"
```bash
pip install pdfplumber
```

### "Textbook parsing taking too long"
The PDF is probably large (19MB = ~1400 pages). First parsing takes time.
Subsequent runs will be much faster with caching.

### "No Table of Contents found"
Script will fallback to scanning pages for headers. This works but is slower.

### "Topics not mapping to textbook"
This can happen if:
- Textbook structure is complex
- Topic names don't match chapter titles
- Manual mapping might be needed

## Manual Testing

If you want to test step-by-step without the full workflow:

### Test PDF Text Extraction
```python
from app.utils.pdf_utils import extract_text_from_pdf

text = extract_text_from_pdf("test_data/syllabi/syllabus.txt")
print(f"Extracted {len(text)} characters")
```

### Test Textbook Parsing
```python
from app.utils.pdf_utils import parse_textbook_structure

structure = parse_textbook_structure("test_data/textbooks/textbook.pdf")
print(f"Found {len(structure['sections'])} sections")
for section in structure['sections'][:5]:
    print(f"  {section['section_number']}: {section['title']} (pages {section['page_start']}-{section['page_end']})")
```

### Test Topic Extraction
```python
from app.services.topic_parser import get_topic_parser

with open("test_data/syllabi/syllabus.txt") as f:
    syllabus = f.read()

parser = get_topic_parser()
topics = await parser.parse_topics(syllabus)
for topic in topics:
    print(f"  {topic.id}: {topic.name}")
```

## Ready to Run?

```bash
cd /home/dennis/Projects/reTeach/backend
source venv/bin/activate
python test_interactive_workflow.py
```

When prompted:
1. Enter: `test_data/syllabi/syllabus.txt`
2. Enter: `y` (yes, have textbook)
3. Enter: `test_data/textbooks/textbook.pdf`
4. Answer the diagnostic questions
5. Review your personalized study plan!

The system will create a complete study plan with SPECIFIC page ranges from YOUR University Physics textbook based on YOUR knowledge gaps!
