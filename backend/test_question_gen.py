#!/usr/bin/env python3
"""
Test script for question generator
Run: python test_question_gen.py
"""

import asyncio
import json

from app.services.question_generator import get_question_generator
from app.models.question import Difficulty
from app.models.course import CourseLevel


# Sample topics to generate questions for
SAMPLE_TOPICS = [
    "Limits and Continuity",
    "Derivatives",
]


async def main():
    print("="*60)
    print("QUESTION GENERATOR TEST")
    print("="*60)

    # Initialize service
    generator = get_question_generator()

    # Test: Generate questions for topics
    print("\n" + "="*60)
    print(f"TEST: Generate questions for {len(SAMPLE_TOPICS)} topics")
    print("="*60)

    questions = await generator.generate_questions(
        topics=SAMPLE_TOPICS,
        count_per_topic=3,  # Generate 3 questions per topic
        difficulty=Difficulty.MEDIUM,
        course_level=CourseLevel.UNDERGRADUATE,
    )

    print(f"\n✓ Generated {len(questions)} total questions")

    # Display questions
    for q in questions:
        print("\n" + "-"*60)
        print(f"ID: {q.id}")
        print(f"Topic: {q.topic}")
        print(f"Difficulty: {q.difficulty.value} | Bloom: {q.bloom}")
        print(f"\nQ: {q.stem}")
        print(f"\nOptions:")
        for i, opt in enumerate(q.options):
            marker = "✓" if i == q.answerIndex else " "
            print(f"  [{marker}] {i}. {opt}")
        print(f"\nRationale: {q.rationale}")

    # Validate quality
    print("\n" + "="*60)
    print("QUESTION QUALITY CHECK")
    print("="*60)

    valid_count = 0
    for q in questions:
        is_valid, error = generator.validate_question_quality(q)
        if is_valid:
            valid_count += 1
        else:
            print(f"✗ Question {q.id} failed validation: {error}")

    print(f"\n✓ {valid_count}/{len(questions)} questions passed quality check")

    # Export to JSON
    print("\n" + "="*60)
    print("EXPORT TO JSON")
    print("="*60)

    output_file = "generated_questions.json"
    with open(output_file, 'w') as f:
        json.dump(
            [q.model_dump() for q in questions],
            f,
            indent=2
        )
    print(f"✓ Exported questions to {output_file}")

    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())
