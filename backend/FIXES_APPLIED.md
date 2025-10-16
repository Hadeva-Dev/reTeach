# Fixes Applied - 2025-10-16

## Summary
Fixed all errors from initial test run and implemented requested features.

## Changes Made

### 1. Fixed pdfplumber Installation
**Problem:** Textbook parsing failed with "pdfplumber not installed" error

**Solution:** Installed pdfplumber dependency
```bash
pip install pdfplumber
```

### 2. Fixed Question Object Subscriptable Error
**Problem:**
```
TypeError: 'Question' object is not subscriptable
print(f"Q{i}. [{q['topic']}] {q['stem']}")
```

**Solution:** Convert Pydantic Question objects to dicts before accessing
```python
# Before (broken):
for i, q in enumerate(questions[:3], 1):
    print(f"Q{i}. [{q['topic']}] {q['stem']}")

# After (fixed):
for i, q_obj in enumerate(questions[:3], 1):
    q = q_obj.model_dump()
    print(f"Q{i}. [{q['topic']}] {q['stem']}")
```

**File:** [test_interactive_workflow.py](test_interactive_workflow.py)

### 3. Added User Information Collection
**Feature:** Prompt for user name and email at start of workflow

**Implementation:** Created `get_user_info()` function
```python
def get_user_info():
    name = input("\nEnter your name: ").strip()
    email = input("Enter your email (optional): ").strip()
    safe_name = "".join(c if c.isalnum() else "_" for c in name.lower())
    return {
        'name': name,
        'email': email or "Not provided",
        'safe_name': safe_name
    }
```

**File:** [test_interactive_workflow.py](test_interactive_workflow.py)

### 4. Created Text Export Functions
**Feature:** Export study plans and quizzes as formatted text files (not just JSON)

**Implementation:** Created new utility module with two functions:
- `export_study_plan_as_text()` - Formats study plan with headers, steps, page ranges
- `export_quiz_as_text()` - Formats quiz with questions, answer key, scoring guide

**File:** [app/utils/text_export.py](app/utils/text_export.py)

**Example Output:**
```
======================================================================
                    PERSONALIZED STUDY PLAN
======================================================================
Student: John Doe
Email: john@example.com
Course: AP Physics C Mechanics
Generated: 2025-10-16 14:30:00

Total Estimated Time: 90 minutes
Priority Topics: 2

======================================================================
STEP 1: KINEMATICS [HIGH PRIORITY]
======================================================================
Current Knowledge: 40%
...
```

### 5. Updated Export Filenames with Username
**Feature:** Include user's name in exported filenames for easy identification

**Implementation:**
```python
# Study plan exports
txt_filename = f"{user_info['safe_name']}_study_plan.txt"
json_filename = f"{user_info['safe_name']}_study_plan.json"

# Quiz exports
txt_filename = f"{user_info['safe_name']}_quiz.txt"
json_filename = f"{user_info['safe_name']}_quiz.json"
```

**Example filenames:**
- `john_doe_study_plan.txt`
- `john_doe_quiz.txt`

### 6. Limited Resources to Khan Academy Only
**Feature:** Prevent broken links by only suggesting stable Khan Academy resources

**Implementation:** Updated LLM prompts in study plan generation
```python
prompt = f"""...
IMPORTANT: Only suggest Khan Academy resources - no YouTube, no external links.
If you recommend resources, use this format:
{{
  "resources": [
    {{"type": "khan_academy", "title": "Introduction to [Topic]", "duration": 15}}
  ]
}}
"""
```

**File:** [test_interactive_workflow.py](test_interactive_workflow.py) (lines ~280-290)

## Testing Instructions

Run the updated workflow:
```bash
cd /home/dennis/Projects/reTeach/backend
source venv/bin/activate
python test_interactive_workflow.py
```

When prompted:
1. Enter your name: `Your Name`
2. Enter your email: `your.email@example.com` (optional)
3. Syllabus path: `test_data/syllabi/syllabus.txt`
4. Have textbook? `y`
5. Textbook path: `test_data/textbooks/textbook.pdf`
6. Answer diagnostic questions with y/n
7. Review generated study plan and quiz

## Expected Output Files

After completion:
- `your_name_study_plan.txt` - Formatted study plan
- `your_name_study_plan.json` - Machine-readable study plan
- `your_name_quiz.txt` - Formatted quiz with answer key
- `your_name_quiz.json` - Machine-readable quiz

## All Requested Features Implemented ✓

- ✅ pdfplumber installed
- ✅ Question object error fixed
- ✅ Quiz exported as text file
- ✅ User name/email collection added
- ✅ Resources limited to Khan Academy only
- ✅ Filenames include username

Ready for testing!
