#!/usr/bin/env python3
"""
Test script for topic parser
Run: python test_topic_parser.py
"""

import asyncio
import json
from uuid import uuid4

from app.services.topic_parser import get_topic_parser
from app.models.course import CourseLevel


# Sample syllabus text
SAMPLE_SYLLABUS = """
# Calculus I - Fall 2024

## Course Description
Introduction to differential and integral calculus

## Topics Covered

### 1. Limits and Continuity
Understanding limits, continuity, and the epsilon-delta definition

### 2. Derivatives
Definition of derivative, differentiation rules, implicit differentiation

### 3. Applications of Derivatives
Related rates, optimization, curve sketching, L'Hôpital's rule

### 4. Integration
Riemann sums, definite and indefinite integrals, Fundamental Theorem of Calculus

### 5. Techniques of Integration
Substitution, integration by parts, partial fractions

### 6. Applications of Integration
Area between curves, volumes of revolution, arc length
"""


async def main():
    print("="*60)
    print("TOPIC PARSER TEST")
    print("="*60)

    # Initialize service
    parser = get_topic_parser()

    # Test 1: Parse topics from syllabus
    print("\n" + "="*60)
    print("TEST 1: Parse topics from sample syllabus")
    print("="*60)

    topics = await parser.parse_topics(
        syllabus_text=SAMPLE_SYLLABUS,
        course_level=CourseLevel.UNDERGRADUATE
    )

    print(f"\n✓ Extracted {len(topics)} topics:")
    for topic in topics:
        prereq_str = f" (prereqs: {', '.join(topic.prereqs)})" if topic.prereqs else ""
        print(f"  - {topic.id}: {topic.name} [weight: {topic.weight}]{prereq_str}")

    # Test 2: Save to database (optional - requires valid Supabase config)
    print("\n" + "="*60)
    print("TEST 2: Save topics to database")
    print("="*60)

    try:
        # Create a test course ID
        course_id = uuid4()
        print(f"\nUsing test course ID: {course_id}")

        # First, we'd need to create the course in the DB
        # For now, just show what would be saved
        print("\nTopics that would be saved:")
        print(json.dumps([t.model_dump() for t in topics], indent=2))

        # Uncomment to actually save:
        # saved_topics = await parser.save_topics_to_db(course_id, topics)
        # print(f"\n✓ Saved {len(saved_topics)} topics to database")

    except Exception as e:
        print(f"\n✗ Database save failed (expected if DB not configured): {e}")

    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())
