"""
LLM Prompt Templates
Centralized prompt definitions for Claude API
"""

from typing import Optional, List


def topic_extraction_prompt(
    syllabus_text: str,
    course_level: Optional[str] = None,
    prerequisites: Optional[List[str]] = None
) -> str:
    """
    Prompt for extracting topics from a syllabus

    Args:
        syllabus_text: The course syllabus text
        course_level: Educational level (hs, ug, grad)
        prerequisites: Explicit or implied prerequisites detected in the syllabus

    Returns:
        Formatted prompt string
    """
    level_context = f"Educational level: {course_level}. " if course_level else ""
    prereq_context = ""
    if prerequisites:
        prereq_items = "\n".join(f"- {item}" for item in prerequisites)
        prereq_context = f"""
Known prerequisites or implied prior knowledge:
{prereq_items}

Treat each prerequisite as an early topic in the list (lower weight ~0.5-0.8) and reference their IDs inside later topics' `prereqs` arrays. If prerequisites are implied but missing, add them as early topics."""

    return f"""Extract 5-8 prerequisite topics from this syllabus. {level_context}
{prereq_context}

Return ONLY a JSON array of objects with this exact structure:
[
  {{
    "id": "t_001",
    "name": "Topic Name",
    "weight": 1.2,
    "prereqs": ["t_000"]
  }}
]

Rules:
- Use sequential IDs like "t_001", "t_002", etc. Prerequisite topics should use the earliest IDs.
- Prefer core concepts and prerequisite skills over minor details
- Weight represents importance (0.5 to 2.0, default 1.0). Prerequisite topics should have lower weight than downstream topics.
- `prereqs` must be an array of prerequisite topic IDs (from the same list). Do not reference IDs that do not exist.
- Every non-prerequisite topic should declare the prerequisite IDs it depends on.
- Avoid duplicates
- Return ONLY the JSON array, no other text

Syllabus text:
{syllabus_text}"""


def question_generation_prompt(
    topic: str,
    count: int,
    course_level: Optional[str] = None,
    difficulty: Optional[str] = None,
    context: Optional[str] = None,
) -> str:
    """
    Prompt for generating MCQ questions for a topic

    Args:
        topic: Topic name
        count: Number of questions to generate
        course_level: Educational level (hs, ug, grad)
        difficulty: Target difficulty (easy, med, hard)
        context: Additional context (e.g., textbook information)

    Returns:
        Formatted prompt string
    """
    level_context = f"Audience: {course_level}. " if course_level else ""
    difficulty_context = f"Target difficulty: {difficulty}. " if difficulty else ""
    context_note = f"\nContext: {context}\n" if context else ""

    return f"""Create {count} multiple-choice diagnostic questions for the topic: "{topic}".

{level_context}{difficulty_context}{context_note}

Return ONLY a JSON array of question objects with this EXACT structure:
[
  {{
    "id": "q_001",
    "topic": "{topic}",
    "stem": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answerIndex": 1,
    "rationale": "Explanation of why option B is correct.",
    "difficulty": "easy",
    "bloom": "remember"
  }}
]

Rules:
- Each question must have exactly 1 correct answer and 3 plausible distractors
- answerIndex is 0-based (0 = first option)
- difficulty must be one of: "easy", "med", "hard"
- bloom level must be one of: "remember", "understand", "apply", "analyze", "evaluate", "create"
- stem must be clear and unambiguous
- options should be concise (1-3 words or short phrases when possible)
- rationale should explain WHY the answer is correct
- Use sequential IDs: q_001, q_002, etc.
- Return ONLY the JSON array, no other text or markdown formatting

Generate {count} high-quality diagnostic questions now:"""


def fallback_topics_from_headings(syllabus_text: str) -> list:
    """
    Fallback: Extract topics from markdown/text headings
    Used when LLM fails

    Args:
        syllabus_text: The syllabus text

    Returns:
        List of topic dictionaries
    """
    import re

    # Try to find headings (markdown # or numbered lists)
    patterns = [
        r'^#{1,3}\s+(.+)$',  # Markdown headings
        r'^\d+\.\s+(.+)$',    # Numbered lists
        r'^[A-Z][^.!?]*:',    # Lines ending with colon
    ]

    topics = []
    seen = set()
    topic_id = 1

    for line in syllabus_text.split('\n'):
        line = line.strip()
        if not line or len(line) < 3:
            continue

        for pattern in patterns:
            match = re.match(pattern, line, re.MULTILINE)
            if match:
                topic_name = match.group(1).strip().rstrip(':')
                # Clean up
                topic_name = re.sub(r'\s+', ' ', topic_name)

                if topic_name and topic_name not in seen and len(topic_name) < 100:
                    seen.add(topic_name)
                    topics.append({
                        "id": f"t_{topic_id:03d}",
                        "name": topic_name,
                        "weight": 1.0,
                        "prereqs": []
                    })
                    topic_id += 1

                    if len(topics) >= 8:
                        return topics
                break

    # If we found nothing, create a generic topic
    if not topics:
        topics = [{
            "id": "t_001",
            "name": "General Concepts",
            "weight": 1.0,
            "prereqs": []
        }]

    return topics
