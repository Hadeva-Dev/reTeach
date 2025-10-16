#!/usr/bin/env python3
"""
Test script for full workflow: syllabus -> topics -> questions
Run: python test_full_workflow.py
"""

import asyncio
import json
from datetime import datetime

from app.services.topic_parser import get_topic_parser
from app.services.question_generator import get_question_generator
from app.models.question import Difficulty
from app.models.course import CourseLevel


# Sample syllabus
SAMPLE_SYLLABUS = """
# Introduction to Data Structures - CS201

## Course Overview
This course covers fundamental data structures and their applications in computer science.

## Topics

1. Arrays and Lists
   - Dynamic arrays
   - Linked lists (singly and doubly)
   - Array-based vs pointer-based implementations

2. Stacks and Queues
   - Stack operations (push, pop, peek)
   - Queue operations (enqueue, dequeue)
   - Applications: expression evaluation, BFS

3. Trees
   - Binary trees, binary search trees
   - Tree traversal (inorder, preorder, postorder)
   - AVL trees and balancing

4. Hash Tables
   - Hash functions
   - Collision resolution (chaining, open addressing)
   - Load factor and resizing

5. Graphs
   - Graph representations (adjacency matrix, adjacency list)
   - Graph traversal (DFS, BFS)
   - Shortest path algorithms
"""


async def main():
    print("="*70)
    print(" "*20 + "FULL WORKFLOW TEST")
    print("="*70)
    print(f"\nTimestamp: {datetime.now().isoformat()}")

    # Initialize services
    parser = get_topic_parser()
    generator = get_question_generator()

    # Step 1: Parse topics from syllabus
    print("\n" + "="*70)
    print("STEP 1: Parse topics from syllabus")
    print("="*70)

    topics = await parser.parse_topics(
        syllabus_text=SAMPLE_SYLLABUS,
        course_level=CourseLevel.UNDERGRADUATE
    )

    print(f"\n✓ Extracted {len(topics)} topics:")
    topic_names = []
    for topic in topics:
        topic_names.append(topic.name)
        prereq_str = f" → prereqs: {', '.join(topic.prereqs)}" if topic.prereqs else ""
        print(f"  {topic.id}. {topic.name} (weight: {topic.weight}){prereq_str}")

    # Step 2: Generate questions for all topics
    print("\n" + "="*70)
    print("STEP 2: Generate diagnostic questions")
    print("="*70)

    COUNT_PER_TOPIC = 4

    questions = await generator.generate_questions(
        topics=topic_names,
        count_per_topic=COUNT_PER_TOPIC,
        difficulty=Difficulty.MEDIUM,
        course_level=CourseLevel.UNDERGRADUATE,
    )

    print(f"\n✓ Generated {len(questions)} questions")

    # Group questions by topic
    questions_by_topic = {}
    for q in questions:
        if q.topic not in questions_by_topic:
            questions_by_topic[q.topic] = []
        questions_by_topic[q.topic].append(q)

    print(f"\nQuestions per topic:")
    for topic_name, topic_questions in questions_by_topic.items():
        print(f"  - {topic_name}: {len(topic_questions)} questions")

    # Step 3: Display sample questions
    print("\n" + "="*70)
    print("STEP 3: Sample questions")
    print("="*70)

    # Show first 3 questions
    for q in questions[:3]:
        print("\n" + "-"*70)
        print(f"[{q.id}] {q.topic}")
        print(f"Difficulty: {q.difficulty.value} | Bloom: {q.bloom}")
        print(f"\nQ: {q.stem}")
        for i, opt in enumerate(q.options):
            marker = "✓" if i == q.answerIndex else " "
            print(f"  [{marker}] {opt}")
        print(f"\nAnswer: {q.rationale}")

    # Step 4: Quality validation
    print("\n" + "="*70)
    print("STEP 4: Quality validation")
    print("="*70)

    valid_count = 0
    issues = []
    for q in questions:
        is_valid, error = generator.validate_question_quality(q)
        if is_valid:
            valid_count += 1
        else:
            issues.append(f"{q.id}: {error}")

    print(f"\n✓ {valid_count}/{len(questions)} questions passed validation")
    if issues:
        print(f"\nIssues found:")
        for issue in issues:
            print(f"  - {issue}")

    # Step 5: Export results
    print("\n" + "="*70)
    print("STEP 5: Export results")
    print("="*70)

    # Create output structure
    output = {
        "timestamp": datetime.now().isoformat(),
        "course_level": CourseLevel.UNDERGRADUATE.value,
        "syllabus_preview": SAMPLE_SYLLABUS[:200] + "...",
        "topics": [t.model_dump() for t in topics],
        "questions": [q.model_dump() for q in questions],
        "stats": {
            "total_topics": len(topics),
            "total_questions": len(questions),
            "questions_per_topic": COUNT_PER_TOPIC,
            "valid_questions": valid_count,
        }
    }

    output_file = f"workflow_output_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"✓ Exported full workflow results to {output_file}")

    # Summary
    print("\n" + "="*70)
    print("WORKFLOW COMPLETE - SUMMARY")
    print("="*70)
    print(f"""
Course:          Data Structures (Undergraduate)
Topics:          {len(topics)} extracted
Questions:       {len(questions)} generated ({COUNT_PER_TOPIC} per topic)
Quality:         {valid_count}/{len(questions)} valid ({valid_count/len(questions)*100:.1f}%)
Output:          {output_file}

✓ Ready for form creation and deployment!
""")


if __name__ == "__main__":
    asyncio.run(main())
