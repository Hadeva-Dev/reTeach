#!/usr/bin/env python3
"""
Simple Interactive Diagnostic Workflow - Terminal Test
Tests the complete workflow without needing textbook parsing
"""

import asyncio
import json
from datetime import datetime
from pathlib import Path

# Import existing services
from app.services.topic_parser import get_topic_parser
from app.services.question_generator import get_question_generator
from app.models.course import CourseLevel
from app.models.question import Difficulty


# ============================================================
# SAMPLE DATA
# ============================================================

SAMPLE_SYLLABUS = """
# Data Structures - CS201

## Course Topics

1. **Arrays and Lists**
   - Dynamic arrays, linked lists
   - Array-based vs pointer-based implementations

2. **Stacks and Queues**
   - Stack operations (push, pop, peek)
   - Queue operations (enqueue, dequeue)
   - Applications

3. **Trees**
   - Binary trees, binary search trees
   - Tree traversal algorithms
   - AVL trees and balancing

4. **Hash Tables**
   - Hash functions and collision resolution
   - Load factor and performance

5. **Graphs**
   - Graph representations
   - Traversal algorithms (DFS, BFS)
"""


# ============================================================
# DIAGNOSTIC SURVEY GENERATOR (Simplified)
# ============================================================

async def generate_diagnostic_survey(topics):
    """Generate Yes/No questions for each topic"""
    print("\n[SURVEY GEN] Generating diagnostic questions...")

    from app.services.llm_service import get_llm_service
    llm = get_llm_service()

    all_questions = []

    for topic in topics:
        print(f"  → Generating survey for: {topic.name}")

        # Prompt Claude to generate Yes/No questions
        prompt = f"""Generate 5 simple Yes/No diagnostic questions for the topic: "{topic.name}"

These questions should:
1. Be answerable with just Yes or No
2. Test basic understanding at different levels
3. Be clear and unambiguous
4. Help identify if student knows this topic

Return ONLY a JSON array:
[
  {{
    "id": "sq_001",
    "text": "Do you know what an array is?",
    "level": "remember"
  }}
]
"""

        try:
            questions_data = await llm.generate_json(prompt, max_tokens=1024)

            for i, q in enumerate(questions_data, 1):
                q['id'] = f"sq_{topic.id}_{i:02d}"
                q['topic_id'] = topic.id
                q['topic_name'] = topic.name
                all_questions.append(q)

        except Exception as e:
            print(f"  ✗ Error generating questions for {topic.name}: {e}")

    print(f"[SURVEY GEN] Generated {len(all_questions)} survey questions\n")
    return all_questions


# ============================================================
# INTERACTIVE SURVEY COLLECTOR
# ============================================================

def collect_survey_responses(questions):
    """Interactively collect Yes/No answers"""
    print("\n" + "="*70)
    print("DIAGNOSTIC SURVEY")
    print("="*70)
    print("Answer Yes (y) or No (n) to assess your current knowledge\n")

    responses = []

    current_topic = None
    for q in questions:
        # Print topic header when it changes
        if q['topic_name'] != current_topic:
            current_topic = q['topic_name']
            print(f"\n{'─'*70}")
            print(f"Topic: {current_topic}")
            print(f"{'─'*70}")

        # Ask question
        while True:
            answer = input(f"  {q['text']} [y/n]: ").strip().lower()
            if answer in ['y', 'yes', 'n', 'no']:
                responses.append({
                    'question_id': q['id'],
                    'topic_id': q['topic_id'],
                    'topic_name': q['topic_name'],
                    'question': q['text'],
                    'answer': answer in ['y', 'yes']
                })
                break
            else:
                print("    Please answer 'y' for Yes or 'n' for No")

    return responses


# ============================================================
# GAP ANALYSIS
# ============================================================

def analyze_knowledge_gaps(responses, topics):
    """Analyze responses to identify weak topics"""
    print("\n[GAP ANALYSIS] Analyzing your responses...\n")

    # Group by topic
    topic_scores = {}
    for r in responses:
        topic_id = r['topic_id']
        if topic_id not in topic_scores:
            topic_scores[topic_id] = {
                'topic_id': topic_id,
                'topic_name': r['topic_name'],
                'total': 0,
                'correct': 0
            }
        topic_scores[topic_id]['total'] += 1
        if r['answer']:
            topic_scores[topic_id]['correct'] += 1

    # Calculate percentages and classify
    strong_topics = []
    weak_topics = []

    for topic_id, scores in topic_scores.items():
        percentage = (scores['correct'] / scores['total']) * 100
        scores['percentage'] = percentage

        if percentage >= 60:
            strong_topics.append(scores)
        else:
            weak_topics.append(scores)

    # Sort weak topics by percentage (worst first)
    weak_topics.sort(key=lambda x: x['percentage'])

    # Calculate overall readiness
    total_questions = sum(s['total'] for s in topic_scores.values())
    total_correct = sum(s['correct'] for s in topic_scores.values())
    overall = (total_correct / total_questions) * 100 if total_questions > 0 else 0

    return {
        'overall_readiness': overall,
        'strong_topics': strong_topics,
        'weak_topics': weak_topics,
        'total_topics': len(topic_scores)
    }


def display_gap_analysis(analysis):
    """Display gap analysis results"""
    print("="*70)
    print("KNOWLEDGE GAP ANALYSIS")
    print("="*70)
    print(f"\nOverall Readiness: {analysis['overall_readiness']:.1f}%\n")

    if analysis['strong_topics']:
        print("✓ Strong Topics (≥60%):")
        for topic in analysis['strong_topics']:
            print(f"  • {topic['topic_name']}: {topic['percentage']:.0f}% ({topic['correct']}/{topic['total']})")

    if analysis['weak_topics']:
        print(f"\n⚠ Weak Topics (<60%) - Need Study:")
        for topic in analysis['weak_topics']:
            print(f"  • {topic['topic_name']}: {topic['percentage']:.0f}% ({topic['correct']}/{topic['total']}) - PRIORITY")
    else:
        print("\n✓ No weak topics! You're well prepared.")

    print("\n" + "="*70)


# ============================================================
# STUDY PLAN GENERATOR (Simplified - No Textbook)
# ============================================================

async def generate_study_plan(weak_topics):
    """Generate study plan for weak topics (without textbook for now)"""
    if not weak_topics:
        return None

    print("\n[STUDY PLAN] Generating personalized study plan...\n")

    from app.services.llm_service import get_llm_service
    llm = get_llm_service()

    study_plan = {
        'generated_at': datetime.now().isoformat(),
        'weak_topics': weak_topics,
        'steps': []
    }

    for i, topic in enumerate(weak_topics, 1):
        print(f"  → Planning study for: {topic['topic_name']}")

        # Ask Claude for study recommendations
        prompt = f"""Create a focused study plan for the topic: "{topic['topic_name']}"

The student scored {topic['percentage']:.0f}% on this topic (below 60% threshold).

Provide:
1. Key concepts to review (3-5 items)
2. Recommended resources (online tutorials, Khan Academy, etc.)
3. Estimated study time
4. Practice recommendations

Return ONLY JSON:
{{
  "key_concepts": ["concept1", "concept2"],
  "resources": [
    {{"type": "video", "title": "...", "url": "...", "duration": 15}},
    {{"type": "reading", "title": "...", "url": "...", "time": 20}}
  ],
  "estimated_minutes": 45,
  "practice_tips": ["tip1", "tip2"]
}}
"""

        try:
            plan_data = await llm.generate_json(prompt, max_tokens=1024)

            study_plan['steps'].append({
                'step': i,
                'topic': topic['topic_name'],
                'priority': 'HIGH' if topic['percentage'] < 40 else 'MEDIUM',
                'current_score': topic['percentage'],
                **plan_data
            })

        except Exception as e:
            print(f"  ✗ Error generating plan for {topic['topic_name']}: {e}")

    total_time = sum(step.get('estimated_minutes', 0) for step in study_plan['steps'])
    study_plan['total_estimated_minutes'] = total_time

    return study_plan


def display_study_plan(plan):
    """Display study plan"""
    print("\n" + "="*70)
    print("PERSONALIZED STUDY PLAN")
    print("="*70)
    print(f"\nTotal Estimated Time: {plan['total_estimated_minutes']} minutes (~{plan['total_estimated_minutes']//60}h {plan['total_estimated_minutes']%60}m)\n")

    for step in plan['steps']:
        print(f"\nStep {step['step']}: {step['topic']} [{step['priority']} PRIORITY]")
        print(f"  Current Score: {step['current_score']:.0f}%")

        print(f"\n  Key Concepts to Review:")
        for concept in step.get('key_concepts', []):
            print(f"    • {concept}")

        if step.get('resources'):
            print(f"\n  Recommended Resources:")
            for resource in step['resources']:
                duration_info = f" ({resource.get('duration', resource.get('time', '?'))} min)"
                print(f"    • [{resource['type'].upper()}] {resource['title']}{duration_info}")
                if resource.get('url'):
                    print(f"      {resource['url']}")

        if step.get('practice_tips'):
            print(f"\n  Practice Recommendations:")
            for tip in step['practice_tips']:
                print(f"    • {tip}")

        print(f"\n  Estimated Time: {step.get('estimated_minutes', 0)} minutes")
        print("  " + "─"*68)

    print("\n" + "="*70)


# ============================================================
# VERIFICATION QUIZ GENERATOR
# ============================================================

async def generate_verification_quiz(weak_topics):
    """Generate 10-question quiz focused on weak topics"""
    if not weak_topics:
        return None

    print("\n[QUIZ GEN] Generating verification quiz...\n")

    generator = get_question_generator()

    # Extract topic names
    topic_names = [t['topic_name'] for t in weak_topics]

    # Calculate questions per topic (total 10)
    questions_per_topic = max(1, 10 // len(topic_names))

    # Generate questions
    questions = await generator.generate_questions(
        topics=topic_names,
        count_per_topic=questions_per_topic,
        difficulty=Difficulty.MEDIUM,
        course_level=CourseLevel.UNDERGRADUATE
    )

    # Limit to exactly 10 questions
    questions = questions[:10]

    quiz = {
        'quiz_id': f"quiz_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        'generated_at': datetime.now().isoformat(),
        'focus_topics': topic_names,
        'question_count': len(questions),
        'questions': [q.model_dump() for q in questions]
    }

    print(f"[QUIZ GEN] Generated {len(questions)} verification questions\n")
    return quiz


def display_quiz_sample(quiz):
    """Display sample questions from quiz"""
    print("\n" + "="*70)
    print("VERIFICATION QUIZ (Sample)")
    print("="*70)
    print(f"\nTotal Questions: {quiz['question_count']}")
    print(f"Focus Topics: {', '.join(quiz['focus_topics'])}")
    print(f"\nShowing first 3 questions:\n")

    for i, q in enumerate(quiz['questions'][:3], 1):
        print(f"Question {i}: {q['topic']}")
        print(f"  {q['stem']}")
        print(f"\n  Options:")
        for j, opt in enumerate(q['options']):
            marker = "✓" if j == q['answerIndex'] else " "
            print(f"    [{marker}] {chr(65+j)}. {opt}")
        print(f"\n  Answer: {q['rationale']}")
        print(f"  Difficulty: {q['difficulty']} | Bloom: {q['bloom']}")
        print("\n" + "─"*70)


# ============================================================
# MAIN WORKFLOW
# ============================================================

async def main():
    print("\n" + "="*70)
    print(" "*20 + "DIAGNOSTIC LEARNING SYSTEM")
    print(" "*25 + "Simple Test Workflow")
    print("="*70)

    # Step 1: Parse Syllabus
    print("\n[STEP 1] Parsing course syllabus...")
    parser = get_topic_parser()
    topics = await parser.parse_topics(
        syllabus_text=SAMPLE_SYLLABUS,
        course_level=CourseLevel.UNDERGRADUATE
    )

    print(f"\n✓ Extracted {len(topics)} topics:")
    for topic in topics:
        prereq_str = f" (prereqs: {', '.join(topic.prereqs)})" if topic.prereqs else ""
        print(f"  • {topic.id}: {topic.name} [weight: {topic.weight}]{prereq_str}")

    # Step 2: Generate Diagnostic Survey
    print("\n[STEP 2] Generating diagnostic survey...")
    survey_questions = await generate_diagnostic_survey(topics)

    # Step 3: Collect Responses
    print("\n[STEP 3] Taking diagnostic survey...")
    input("\nPress Enter to start the survey...")
    responses = collect_survey_responses(survey_questions)

    # Step 4: Analyze Gaps
    print("\n[STEP 4] Analyzing knowledge gaps...")
    analysis = analyze_knowledge_gaps(responses, topics)
    display_gap_analysis(analysis)

    # Step 5: Generate Study Plan (if needed)
    if analysis['weak_topics']:
        print("\n[STEP 5] Generating study plan for weak topics...")
        input("\nPress Enter to generate study plan...")
        study_plan = await generate_study_plan(analysis['weak_topics'])

        if study_plan:
            display_study_plan(study_plan)

            # Export study plan
            output_file = f"study_plan_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(output_file, 'w') as f:
                json.dump(study_plan, f, indent=2)
            print(f"\n✓ Study plan exported to: {output_file}")

        # Step 6: Generate Verification Quiz
        print("\n[STEP 6] Generating verification quiz...")
        quiz = await generate_verification_quiz(analysis['weak_topics'])

        if quiz:
            display_quiz_sample(quiz)

            # Export quiz
            quiz_file = f"verification_quiz_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(quiz_file, 'w') as f:
                json.dump(quiz, f, indent=2)
            print(f"\n✓ Verification quiz exported to: {quiz_file}")
    else:
        print("\n[STEP 5] No study plan needed - all topics strong!")

    # Summary
    print("\n" + "="*70)
    print("WORKFLOW COMPLETE")
    print("="*70)
    print(f"""
Summary:
  Topics Tested: {analysis['total_topics']}
  Strong Topics: {len(analysis['strong_topics'])}
  Weak Topics: {len(analysis['weak_topics'])}
  Overall Readiness: {analysis['overall_readiness']:.1f}%

Files Generated:
  • study_plan_*.json (if weak topics found)
  • verification_quiz_*.json (if weak topics found)

Next Steps:
  1. Follow the study plan
  2. Complete readings and practice
  3. Take the verification quiz to confirm mastery
""")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nWorkflow cancelled by user.")
    except Exception as e:
        print(f"\n\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
