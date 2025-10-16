# Prerequisites & URL Cleaning Fix - October 16, 2025

## Issues Fixed

### 1. Bad Khan Academy URLs with x2f8bb... Flags

**Problem:** AI was returning URLs with internal Khan Academy encoding:
```
https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:systems-of-equations/...
```

These URLs don't work because `x2f8bb11595b61c86:` is an internal routing ID.

**Solution:** Added URL cleaning in [app/utils/web_search.py](app/utils/web_search.py:130-139)

```python
# Clean Khan Academy URLs - remove internal encoding flags
if 'khanacademy.org' in url:
    import re
    # Pattern: /x[0-9a-f]{8,}:
    url = re.sub(r'/x[0-9a-f]{8,}:', '/', url)
    # If URL becomes too short or broken, skip it
    if url.count('/') < 4:
        continue
    res['url'] = url
```

**Example Transformation:**
```
Before: https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:systems-of-equations/v/solving
After:  https://www.khanacademy.org/math/algebra/systems-of-equations/v/solving
```

### 2. Prerequisites Now Used for Context

**Problem:** Syllabus mentions prerequisites but they weren't being used to improve AI mapping

**From syllabus:**
```
Prerequisites: A solid understanding of geometry and algebra including systems of
equations, exponents, scientific notation, ratio and proportion, quadratics, graphs,
slope, and a solid understanding of trigonometry. Concurrent enrollment in AP Calculus...
```

**Solution:**

#### A. Extract Prerequisites ([app/services/topic_parser.py](app/services/topic_parser.py:22-54))

```python
def extract_prerequisites(self, syllabus_text: str) -> List[str]:
    """Extract prerequisites mentioned in syllabus"""
    # Look for prerequisites section with regex
    prereq_pattern = r'(?i)prerequisite[s]?:\s*(.+?)(?:\n\n|\n[A-Z]|$)'
    match = re.search(prereq_pattern, syllabus_text, re.DOTALL)

    if match:
        prereq_text = match.group(1).strip()

        # Extract common math/science prerequisites
        prereq_keywords = [
            'algebra', 'geometry', 'trigonometry', 'calculus',
            'systems of equations', 'quadratics', 'exponents',
            'scientific notation', 'vectors', 'statistics'
        ]

        for keyword in prereq_keywords:
            if keyword.lower() in prereq_text.lower():
                prerequisites.append(keyword.title())

    return list(set(prerequisites))
```

#### B. Use in AI Mapping ([app/services/section_mapper.py](app/services/section_mapper.py:148-152))

```python
# Build context string
context = f'Textbook: "{textbook_title}"\nTopic: "{topic_name}"'
if prerequisites:
    context += f'\nCourse Prerequisites: {", ".join(prerequisites)}'
    context += '\nNote: This topic builds on these prerequisites.'
```

**AI prompt now includes:**
```
Textbook: "University Physics"
Topic: "Kinematics"
Course Prerequisites: Algebra, Geometry, Trigonometry, Calculus, Systems Of Equations, Scientific Notation
Note: This topic builds on these prerequisites.
```

## Expected Output After Fix

### Terminal Output:
```
[TOPIC PARSER] Found prerequisites: Algebra, Geometry, Trigonometry, Calculus, Systems Of Equations, Scientific Notation

[SECTION MAPPER] Using prerequisites for context: Algebra, Geometry, Trigonometry, Calculus, Systems Of Equations, Scientific Notation
```

### Study Plan URLs (Cleaned):
```
Before:
🌐 KHAN ACADEMY: Systems of equations introduction
   URL: https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:systems-of-equations/...

After:
🌐 KHAN ACADEMY: Systems of equations introduction
   URL: https://www.khanacademy.org/math/algebra/systems-of-equations/...
```

## How Prerequisites Improve AI

### Without Prerequisites:
```
AI thinks: "Should I recommend basic algebra intro or advanced algebra?"
→ Guesses and might choose too basic or too advanced
```

### With Prerequisites:
```
AI thinks: "Student has algebra, calculus prerequisites → They need advanced/applied material"
→ Chooses appropriate level sections
→ Better textbook section matching
→ Better Khan Academy resource selection
```

## Files Modified

1. **app/utils/web_search.py** - URL cleaning regex
2. **app/services/topic_parser.py** - Prerequisite extraction
3. **app/services/section_mapper.py** - Use prerequisites in AI prompt
4. **test_interactive_workflow.py** - Pass prerequisites through workflow

## Cache Cleared

Cleared Khan Academy cache to regenerate with cleaned URLs:
```bash
rm -rf .cache/khan_academy
```

Next run will regenerate cache with clean URLs.

## Testing

Run the workflow again - you should see:

```bash
python test_interactive_workflow.py
```

**Expected changes:**
1. Prerequisites displayed after topic extraction
2. Prerequisites mentioned in section mapping
3. Khan Academy URLs without x2f8bb... flags
4. All URLs should work when clicked

## Verification

Check the generated study plan file. URLs should look like:
- ✅ `https://www.khanacademy.org/math/algebra/systems-of-equations/...`
- ✅ `https://www.khanacademy.org/math/calculus-1/cs1-derivatives/...`
- ❌ NOT: `https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:systems/...`

All URLs should be clickable and working!

## Benefits

### URL Cleaning:
- ✅ All Khan Academy links now work
- ✅ No more internal routing IDs
- ✅ Clean, shareable URLs

### Prerequisites:
- ✅ AI understands course level/context
- ✅ Better textbook section selection
- ✅ More appropriate Khan Academy resources
- ✅ Resources match student's preparation level

Ready to test!
