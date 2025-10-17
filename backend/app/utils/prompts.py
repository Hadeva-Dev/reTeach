"""
LLM Prompt Templates
Centralized prompt definitions for Claude API
"""

from typing import Optional, List


def topic_extraction_prompt(
    syllabus_text: str,
    course_level: Optional[str] = None,
    prerequisites: Optional[List[str]] = None,
    candidate_sections: Optional[List[str]] = None
) -> str:
    """
    Prompt for extracting topics from a syllabus

    Args:
        syllabus_text: The course syllabus text
        course_level: Educational level (hs, ug, grad)
        prerequisites: Explicit or implied prerequisites detected in the syllabus
        candidate_sections: Headings/sections detected in the syllabus text

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
    headings_context = ""
    if candidate_sections:
        heading_lines = "\n".join(f"- {item}" for item in candidate_sections)
        headings_context = f"""
Key sections/headings detected in the syllabus (use these exact phrases whenever possible):
{heading_lines}
"""

    return f"""IMPORTANT: Extract ONLY the prerequisite knowledge and foundational skills needed BEFORE taking this course. DO NOT extract topics that are taught IN the course itself.

{level_context}
{prereq_context}
{headings_context}

Analyze this syllabus and identify 5-8 prerequisite topics that students must already know before starting this course. Look for:
- Explicit prerequisites mentioned in the syllabus (e.g., "Prerequisites: Algebra, Trigonometry")
- Implied prior knowledge (e.g., if the course uses calculus, then calculus concepts are prerequisites)
- Foundational skills assumed but not taught (e.g., basic algebra for a physics course)

DO NOT include topics that are the main content of this course. Only include what students should know BEFORE day 1.

Return ONLY a JSON array of objects with this exact structure:
[
  {{
    "id": "t_001",
    "name": "Algebra fundamentals",
    "weight": 1.0,
    "prereqs": []
  }},
  {{
    "id": "t_002",
    "name": "Trigonometric functions",
    "weight": 1.2,
    "prereqs": ["t_001"]
  }}
]

Rules:
- CRITICAL: Extract ONLY prerequisites (what students need to know BEFORE the course), NOT course content
- Use sequential IDs like "t_001", "t_002", etc.
- Topic names should be specific prerequisite skills (e.g., "Quadratic equations", "Vector algebra", "Scientific notation")
- Weight represents importance (0.5 to 2.0, default 1.0)
- `prereqs` must be an array of prerequisite topic IDs that should be learned before this topic
- If a prerequisite has its own prerequisites, include those dependencies
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
    Prompt for generating self-assessment survey items for a topic.
    """
    level_context = f"Audience: {course_level}. " if course_level else ""
    context_note = f"\nContext: {context}\n" if context else ""

    return f"""Create {count} brief self-assessment survey items for the topic "{topic}".

{level_context}{context_note}

Each item should be phrased as a learner-facing statement beginning with "I can...", "I know how to...", or "I understand...".
Focus on concrete skills for this topic. Avoid generic phrasing.

Return ONLY a JSON array of question objects with this EXACT structure:
[
  {{
    "id": "q_001",
    "topic": "{topic}",
    "stem": "I can convert between SI base and derived units without help.",
    "options": ["Yes", "Maybe", "No"],
    "answerIndex": 0,
    "rationale": "Self-assessment: choose Yes if you feel confident, Maybe if you need more practice, or No if you need support.",
    "difficulty": "med",
    "bloom": "understand"
  }}
]

Rules:
- Options MUST be exactly ["Yes", "Maybe", "No"] in that order.
- answerIndex MUST be 0 (representing the desired mastery state "Yes").
- difficulty MUST be EXACTLY one of: "easy", "med", "hard" (use "med" NOT "medium")
- bloom level must be one of: "remember", "understand", "apply", "analyze", "evaluate", "create"
- Provide a short, encouraging rationale indicating this is a self-assessment.
- Keep stems specific to the skills within the topic; reuse wording from the syllabus when possible.
- Use sequential IDs: q_001, q_002, etc.
- Return ONLY the JSON array, no other text or markdown formatting.

Generate {count} learner-facing survey statements now:"""


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
