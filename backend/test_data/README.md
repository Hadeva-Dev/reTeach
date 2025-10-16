# Test Data Directory

Use this folder for testing the diagnostic workflow.

## Structure

```
test_data/
├── syllabi/          ← Put your course syllabi here (.txt, .md, .pdf)
├── textbooks/        ← Put your textbook PDFs here
└── README.md         ← This file
```

## Usage

### For Syllabus Testing

1. **Create or paste a syllabus:**
   ```bash
   # Create a text file
   nano test_data/syllabi/my_course_syllabus.txt
   ```

2. **Or use the sample:**
   The test script already has a built-in Data Structures syllabus

### For Textbook Testing (Future)

1. **Upload your textbook PDF:**
   ```bash
   cp /path/to/textbook.pdf test_data/textbooks/
   ```

2. **Supported formats:**
   - PDF files (.pdf)
   - Must be text-based (not scanned images)
   - Recommended: <100 MB file size

## Running Tests

### Simple Workflow (Current)
```bash
cd backend
source venv/bin/activate
python test_simple_workflow.py
```

This will:
1. Parse syllabus → Extract topics
2. Generate diagnostic survey (Yes/No questions)
3. Interactively collect your answers
4. Analyze knowledge gaps
5. Generate study plan for weak topics
6. Create 10-question verification quiz
7. Export JSON files

### Output Files

Generated files will be saved in `backend/`:
- `study_plan_YYYYMMDD_HHMMSS.json`
- `verification_quiz_YYYYMMDD_HHMMSS.json`

## Example Syllabus Format

Create `test_data/syllabi/sample.txt`:

```
# Introduction to Python Programming

## Topics Covered

1. Variables and Data Types
   - Integers, floats, strings
   - Type conversion

2. Control Flow
   - If/else statements
   - Loops (for, while)

3. Functions
   - Defining functions
   - Parameters and return values
   - Scope

4. Data Structures
   - Lists and tuples
   - Dictionaries and sets

5. File I/O
   - Reading and writing files
   - Working with CSV and JSON
```

## Tips

- **Syllabi:** Should have clear topic headings
- **Textbooks:** Table of contents at beginning helps parsing
- **File names:** Use descriptive names (e.g., `calculus_1_syllabus.txt`)
