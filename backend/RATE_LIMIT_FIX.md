# Rate Limit Fix - October 16, 2025

## The Problem

You hit a rate limit error:
```
RateLimitError: Error code: 429
This request would exceed your organization's maximum usage increase rate
for input tokens per minute.
```

**Root Cause:** Sending ALL 716 sections to AI in each request

**Token Math:**
- 716 sections × ~30 tokens/section = ~21,000 tokens per request
- 6 topics × 21,000 tokens = ~126,000 tokens in rapid succession
- This exceeded the rate limit for "usage increase rate"

**Additional Issue:** The syllabus is about **Math** (Algebra, Calculus) but the textbook is about **Physics**, so there are naturally no matches. The AI was processing tons of irrelevant sections.

## The Solution

### 1. Pre-Filtering with Keywords (Massive Token Reduction)

Added `_keyword_filter()` method that does a first-pass filter BEFORE sending to AI:

```python
def _keyword_filter(self, topic_name: str, sections: List[Dict], top_k: int = 50):
    """Pre-filter sections using simple keyword matching"""
    topic_keywords = set(topic_name.lower().split())

    scored_sections = []
    for i, section in enumerate(sections):
        title_lower = section['title'].lower()

        score = 0
        for keyword in topic_keywords:
            if keyword in title_lower:
                score += 2  # Title match

        if score > 0:
            scored_sections.append((score, i, section))

    # Return top 50 matches
    return sorted(scored_sections, reverse=True)[:50]
```

**Impact:**
- **Before:** Send 716 sections (~21,000 tokens) to AI
- **After:** Send max 50 sections (~1,500 tokens) to AI
- **Reduction:** **93% fewer tokens per request!**

### 2. Rate Limiting Between Calls

Added 2-second delay between topic mappings:

```python
for i, topic in enumerate(topics):
    # ... map topic ...

    # Rate limiting: wait 2 seconds between calls
    if i < len(topics) - 1:
        await asyncio.sleep(2)
```

**Impact:**
- Spreads out API calls over time
- Avoids "usage increase rate" limits
- For 6 topics: adds 10 seconds total (acceptable)

### 3. Graceful Handling of No Matches

When keyword filter finds nothing, skip AI call entirely:

```python
filtered = self._keyword_filter(topic_name, sections, top_k=50)

if not filtered:
    print(f"    ⚠ No keyword matches found")
    return []  # Don't call AI at all

print(f"    → Pre-filtered to {len(filtered)} candidate sections")
# Only call AI with filtered sections
```

**Impact:**
- Saves API calls when there are obviously no matches
- Math syllabus + Physics textbook = no keyword matches = no AI calls needed

## Expected Output After Fix

### Scenario 1: Good Matches (Physics syllabus + Physics textbook)

```
[SECTION MAPPER] Mapping 6 topics to 716 sections using AI...
  → Mapping: Kinematics
    → Pre-filtered to 45 candidate sections
    ✓ Found 3 relevant section(s)
  [Waiting 2 seconds...]
  → Mapping: Forces
    → Pre-filtered to 38 candidate sections
    ✓ Found 2 relevant section(s)
```

### Scenario 2: No Matches (Math syllabus + Physics textbook)

```
[SECTION MAPPER] Mapping 6 topics to 716 sections using AI...
  → Mapping: Algebra
    ⚠ No keyword matches found
  → Mapping: Geometry
    → Pre-filtered to 3 candidate sections
    ⚠ No relevant sections found
  [Waiting 2 seconds...]
  → Mapping: Trigonometry
    ⚠ No keyword matches found
```

## Performance Comparison

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Tokens per request | ~21,000 | ~1,500 | **93% reduction** |
| Total tokens (6 topics) | ~126,000 | ~9,000 | **93% reduction** |
| Risk of rate limit | Very High | Low | Much safer |
| Time (6 topics) | ~6 sec | ~16 sec | +10 sec (acceptable) |

## Why This Happens

The Anthropic API has **usage increase rate limits** that prevent sudden spikes in token usage. This is different from the total rate limit:

- **Total Rate Limit:** Maximum tokens per minute (e.g., 100K TPM)
- **Usage Increase Rate:** How fast you can ramp up usage

When you send 126K tokens in 6 seconds, it looks like:
```
0s: 21K tokens
1s: 21K tokens
2s: 21K tokens
...
```

This rapid increase triggers the acceleration limit even if you're under the total TPM.

## Files Modified

1. **app/services/section_mapper.py**
   - Added `_keyword_filter()` method for pre-filtering
   - Added 2-second `asyncio.sleep()` between AI calls
   - Early return when no keyword matches found

## Testing

Run the workflow again - it should work now:

```bash
python test_interactive_workflow.py
```

**With Math syllabus + Physics textbook:**
- Keyword filtering will find 0-3 matches per topic
- No rate limit errors
- Fast execution since AI is rarely called

**With Physics syllabus + Physics textbook:**
- Keyword filtering will find 20-50 matches per topic
- AI refines to 1-3 best matches
- 2-second delays prevent rate limits

## Future Improvements

If still hitting rate limits:
1. Reduce `top_k` from 50 to 30 in keyword filter
2. Increase delay from 2 to 3 seconds
3. Add retry logic with exponential backoff
4. Cache section mappings per (textbook, topic) pair

Ready to test!
