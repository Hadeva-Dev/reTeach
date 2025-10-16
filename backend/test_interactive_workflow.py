#!/usr/bin/env python3
"""
Interactive Diagnostic Workflow - REAL VERSION
Complete workflow with file upload support
"""

import asyncio
import json
from datetime import datetime
from pathlib import Path

# Import services
from app.services.topic_parser import get_topic_parser
from app.services.question_generator import get_question_generator
from app.services.textbook_parser import get_textbook_parser
from app.services.section_mapper import get_section_mapper
from app.services.llm_service import get_llm_service

from app.models.course import CourseLevel
from app.models.question import Difficulty

# Import utilities
from app.utils.pdf_utils import extract_text_from_pdf, get_pdf_metadata
from app.utils.text_export import export_study_plan_as_text, export_quiz_as_text


print("\n" + "="*70)
print(" "*15 + "INTERACTIVE DIAGNOSTIC LEARNING SYSTEM")
print("="*70 + "\n")


# ============================================================
# USER INFORMATION
# ============================================================

def get_user_info():
    """Get user name and email for personalized exports"""
    print("[USER INFO] Personalization")
    print("─"*70)

    name = input("\nEnter your name: ").strip()
    while not name:
        name = input("Please enter your name: ").strip()

    email = input("Enter your email (optional): ").strip()

    # Create safe filename from name
    safe_name = "".join(c if c.isalnum() else "_" for c in name.lower())

    return {
        'name': name,
        'email': email or "Not provided",
        'safe_name': safe_name
    }


# ============================================================
# STEP 1: SYLLABUS INPUT
# ============================================================

def load_syllabus():
    """Get syllabus from user (PDF or TXT)"""
    print("[STEP 1] Course Syllabus")
    print("─"*70)

    while True:
        file_path = input("\nEnter path to syllabus (PDF or TXT): ").strip()

        if not file_path:
            print("  ⚠ Please enter a file path")
            continue

        file_path = Path(file_path).expanduser()

        if not file_path.exists():
            print(f"  ✗ File not found: {file_path}")
            continue

        # Check file type
        suffix = file_path.suffix.lower()

        if suffix == '.pdf':
            print(f"\n[PDF] Extracting text from PDF...")
            try:
                text = extract_text_from_pdf(str(file_path))
                return text
            except Exception as e:
                print(f"  ✗ Error reading PDF: {e}")
                continue

        elif suffix in ['.txt', '.md']:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    text = f.read()
                print(f"[TXT] ✓ Loaded {len(text)} characters")
                return text
            except Exception as e:
                print(f"  ✗ Error reading file: {e}")
                continue

        else:
            print(f"  ✗ Unsupported file type: {suffix} (use .pdf, .txt, or .md)")
            continue


# ============================================================
# STEP 2: TEXTBOOK INPUT (Optional)
# ============================================================

def load_textbook():
    """Get textbook PDF from user (optional)"""
    print("\n[STEP 2] Textbook (Optional)")
    print("─"*70)

    use_textbook = input("\nDo you have a textbook PDF? [y/n]: ").strip().lower()

    if use_textbook not in ['y', 'yes']:
        return None

    while True:
        file_path = input("\nEnter path to textbook PDF: ").strip()

        if not file_path:
            return None

        file_path = Path(file_path).expanduser()

        if not file_path.exists():
            print(f"  ✗ File not found: {file_path}")
            continue

        if file_path.suffix.lower() != '.pdf':
            print(f"  ✗ Must be a PDF file")
            continue

        return str(file_path)


# ============================================================
# STEP 3: DIAGNOSTIC SURVEY GENERATION
# ============================================================

async def generate_diagnostic_survey(topics):
    """Generate Yes/No questions for each topic"""
    print("\n[STEP 3] Diagnostic Survey Generation")
    print("─"*70)
    print("\nGenerating diagnostic questions...")

    llm = get_llm_service()
    all_questions = []

    for topic in topics:
        print(f"  → {topic.name}")

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
    "text": "Do you understand...",
    "level": "understand"
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
            print(f"  ✗ Error: {e}")

    print(f"\n✓ Generated {len(all_questions)} diagnostic questions")
    return all_questions


# ============================================================
# STEP 4: INTERACTIVE SURVEY
# ============================================================

def collect_survey_responses(questions):
    """Interactively collect Yes/No answers"""
    print("\n[STEP 4] Diagnostic Survey")
    print("="*70)
    print("Answer Yes (y) or No (n) to assess your current knowledge\n")

    responses = []
    current_topic = None

    for q in questions:
        if q['topic_name'] != current_topic:
            current_topic = q['topic_name']
            print(f"\n{'─'*70}")
            print(f"Topic: {current_topic}")
            print(f"{'─'*70}")

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
# STEP 5: GAP ANALYSIS
# ============================================================

def analyze_knowledge_gaps(responses):
    """Analyze responses to identify weak topics"""
    print("\n[STEP 5] Knowledge Gap Analysis")
    print("─"*70)

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

    strong_topics = []
    weak_topics = []

    for topic_id, scores in topic_scores.items():
        percentage = (scores['correct'] / scores['total']) * 100
        scores['percentage'] = percentage

        if percentage >= 60:
            strong_topics.append(scores)
        else:
            weak_topics.append(scores)

    weak_topics.sort(key=lambda x: x['percentage'])

    total_questions = sum(s['total'] for s in topic_scores.values())
    total_correct = sum(s['correct'] for s in topic_scores.values())
    overall = (total_correct / total_questions) * 100 if total_questions > 0 else 0

    # Display results
    print(f"\n{'='*70}")
    print(f"Overall Readiness: {overall:.1f}%")
    print(f"{'='*70}\n")

    if strong_topics:
        print("✓ Strong Topics (≥60%):")
        for t in strong_topics:
            print(f"  • {t['topic_name']}: {t['percentage']:.0f}% ({t['correct']}/{t['total']})")

    if weak_topics:
        print(f"\n⚠ Weak Topics (<60%):")
        for t in weak_topics:
            print(f"  • {t['topic_name']}: {t['percentage']:.0f}% ({t['correct']}/{t['total']}) - NEEDS STUDY")
    else:
        print("\n✓ No weak topics found - you're well prepared!")

    print(f"\n{'='*70}\n")

    return {
        'overall_readiness': overall,
        'strong_topics': strong_topics,
        'weak_topics': weak_topics
    }


# ============================================================
# HELPER: GET KHAN ACADEMY RESOURCES
# ============================================================

async def get_khan_academy_resources(topic_name, llm):
    """Get real Khan Academy links for a topic using web search"""
    from app.utils.web_search import search_khan_academy

    print(f"    → Searching web for Khan Academy resources on '{topic_name}'...")

    try:
        # Search for Khan Academy resources
        resources = await search_khan_academy(topic_name)

        if resources:
            print(f"    ✓ Found {len(resources)} verified Khan Academy resource(s)")
            return resources
        else:
            print(f"    ⚠ No Khan Academy resources found for this topic")
            return []

    except Exception as e:
        print(f"    ✗ Error searching Khan Academy: {e}")
        return []


# ============================================================
# STEP 6: STUDY PLAN GENERATION
# ============================================================

async def generate_study_plan(weak_topics, textbook_data=None, topic_mappings=None):
    """Generate study plan with BOTH textbook pages AND Khan Academy resources"""
    if not weak_topics:
        return None

    print("[STEP 6] Study Plan Generation")
    print("─"*70)
    print(f"\nGenerating personalized study plan for {len(weak_topics)} weak topics...")

    llm = get_llm_service()
    study_plan = {
        'generated_at': datetime.now().isoformat(),
        'weak_topics': weak_topics,
        'steps': []
    }

    for i, topic in enumerate(weak_topics, 1):
        print(f"  → Planning: {topic['topic_name']}")

        # Build resources list
        all_resources = []

        # Check if we have textbook mappings - include if available
        mapped_sections = []
        if topic_mappings and topic['topic_id'] in topic_mappings:
            mapped_sections = topic_mappings[topic['topic_id']]

        # Add textbook sections if available (optional but preferred)
        if mapped_sections and textbook_data:
            print(f"    → Including {len(mapped_sections)} textbook section(s)")
            for section in mapped_sections:
                page_count = section.get('page_end', section['page_start']) - section['page_start'] + 1
                all_resources.append({
                    'type': 'textbook',
                    'source': textbook_data['title'],
                    'section_number': section.get('section_number', ''),
                    'section_title': section['title'],
                    'page_start': section['page_start'],
                    'page_end': section.get('page_end', section['page_start']),
                    'page_count': page_count,
                    'estimated_minutes': 5 * page_count
                })
        else:
            print(f"    → No textbook sections mapped for this topic")

        # Get Khan Academy resources (ALWAYS try to include)
        print(f"    → Searching for Khan Academy resources...")
        khan_resources = await get_khan_academy_resources(topic['topic_name'], llm)

        # Add Khan Academy resources
        if khan_resources:
            print(f"    → Including {len(khan_resources)} Khan Academy resource(s)")
            all_resources.extend(khan_resources)
        else:
            print(f"    → No Khan Academy resources found")

        # Calculate total time
        total_time = sum(r.get('estimated_minutes', 0) for r in all_resources)

        # Create study step
        study_plan['steps'].append({
            'step': len(study_plan['steps']) + 1,
            'topic': topic['topic_name'],
            'priority': 'HIGH' if topic['percentage'] < 40 else 'MEDIUM',
            'current_score': topic['percentage'],
            'resources': all_resources,
            'estimated_minutes': total_time
        })

    total_time = sum(s.get('estimated_minutes', 0) for s in study_plan['steps'])
    study_plan['total_estimated_minutes'] = total_time

    # Display study plan
    print(f"\n{'='*70}")
    print("PERSONALIZED STUDY PLAN")
    print(f"{'='*70}\n")
    print(f"Total Estimated Time: {total_time} minutes (~{total_time//60}h {total_time%60}m)\n")

    for step in study_plan['steps']:
        print(f"\nStep {step['step']}: {step['topic']} [{step['priority']} PRIORITY]")
        print(f"  Current Score: {step['current_score']:.0f}%")
        print(f"\n  📚 Resources:")

        # Display all resources (textbook + Khan Academy)
        for res in step['resources']:
            if res['type'] == 'textbook':
                print(f"\n    📖 TEXTBOOK: {res['source']}")
                if res.get('section_number'):
                    print(f"       Section {res['section_number']}: {res['section_title']}")
                else:
                    print(f"       {res['section_title']}")
                print(f"       Pages: {res['page_start']}-{res['page_end']} ({res['page_count']} pages)")
                print(f"       Time: ~{res['estimated_minutes']} minutes")

            elif res['type'] == 'khan_academy':
                print(f"\n    🌐 KHAN ACADEMY: {res['title']}")
                if res.get('url'):
                    print(f"       URL: {res['url']}")
                print(f"       Time: ~{res['estimated_minutes']} minutes")

        print(f"\n  ⏱  Total Time for Topic: {step.get('estimated_minutes', 0)} minutes")
        print("  " + "─"*68)

    print(f"\n{'='*70}\n")

    return study_plan


# ============================================================
# STEP 7: VERIFICATION QUIZ
# ============================================================

async def generate_verification_quiz(weak_topics):
    """Generate 10-question verification quiz"""
    if not weak_topics:
        return None

    print("[STEP 7] Verification Quiz Generation")
    print("─"*70)
    print("\nGenerating verification quiz...")

    generator = get_question_generator()
    topic_names = [t['topic_name'] for t in weak_topics]

    questions_per_topic = max(1, 10 // len(topic_names))

    questions = await generator.generate_questions(
        topics=topic_names,
        count_per_topic=questions_per_topic,
        difficulty=Difficulty.MEDIUM,
        course_level=CourseLevel.UNDERGRADUATE
    )

    questions = questions[:10]

    quiz = {
        'quiz_id': f"quiz_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        'generated_at': datetime.now().isoformat(),
        'focus_topics': topic_names,
        'question_count': len(questions),
        'questions': [q.model_dump() for q in questions]
    }

    print(f"\n✓ Generated {len(questions)} verification questions")
    print(f"\nSample Questions:\n")

    for i, q_obj in enumerate(questions[:3], 1):
        q = q_obj.model_dump()  # Convert Question object to dict
        print(f"Q{i}. [{q['topic']}] {q['stem']}")
        for j, opt in enumerate(q['options']):
            marker = "✓" if j == q['answerIndex'] else " "
            print(f"    [{marker}] {chr(65+j)}. {opt}")
        print()

    return quiz


# ============================================================
# MAIN WORKFLOW
# ============================================================

async def main():
    # Step 0: Get user info
    user_info = get_user_info()
    print(f"\n✓ Welcome, {user_info['name']}!\n")

    # Step 1: Load syllabus
    syllabus_text = load_syllabus()

    # Step 2: Load textbook (optional)
    textbook_path = load_textbook()

    textbook_data = None
    if textbook_path:
        print("\n[TEXTBOOK] Parsing textbook structure...")
        try:
            parser = get_textbook_parser()
            textbook_data = await parser.register_textbook(textbook_path)
            print(f"\n✓ Registered textbook: {textbook_data['title']}")
            print(f"  Total pages: {textbook_data['total_pages']}")
            print(f"  Sections found: {len(textbook_data['sections'])}")
        except Exception as e:
            print(f"\n✗ Error parsing textbook: {e}")
            textbook_data = None

    # Step 2.5: Parse topics and prerequisites from syllabus
    print("\n[TOPICS] Parsing course syllabus...")
    parser = get_topic_parser()
    topics, prerequisites = await parser.parse_topics(syllabus_text, course_level=CourseLevel.UNDERGRADUATE)

    print(f"\n✓ Extracted {len(topics)} topics:")
    for topic in topics:
        print(f"  • {topic.id}: {topic.name} [weight: {topic.weight}]")

    if prerequisites:
        print(f"\n✓ Prerequisites identified: {', '.join(prerequisites)}")

    # Step 2.6: Map topics to textbook sections using AI (if textbook provided)
    topic_mappings = None
    if textbook_data:
        print("\n[MAPPING] Using AI to map topics to textbook sections...")

        # Prepare topics for mapping
        topic_list = [{'id': t.id, 'name': t.name} for t in topics]

        # Use AI-based section mapper with prerequisites for context
        mapper = get_section_mapper()
        topic_mappings = await mapper.map_topics_to_sections(
            topics=topic_list,
            textbook_sections=textbook_data['sections'],
            textbook_title=textbook_data['title'],
            prerequisites=prerequisites
        )

        print(f"\n✓ AI-based topic mapping complete:")
        for topic in topics:
            mappings = topic_mappings.get(topic.id, [])
            if mappings:
                for m in mappings:
                    confidence = m.get('confidence', 'medium')
                    print(f"  • {topic.name} → [{confidence.upper()}] {m['title']} (pages {m['page_start']}-{m.get('page_end', '?')})")
            else:
                print(f"  • {topic.name} → No relevant sections found")

    # Step 3: Generate survey
    survey_questions = await generate_diagnostic_survey(topics)

    # Step 4: Collect responses
    input("\nPress Enter to start the diagnostic survey...")
    responses = collect_survey_responses(survey_questions)

    # Step 5: Analyze gaps
    analysis = analyze_knowledge_gaps(responses)

    # Step 6: Generate study plan
    if analysis['weak_topics']:
        study_plan = await generate_study_plan(
            analysis['weak_topics'],
            textbook_data,
            topic_mappings
        )

        # Export study plan
        if study_plan:
            # Export as text file
            txt_filename = f"{user_info['safe_name']}_study_plan.txt"
            export_study_plan_as_text(study_plan, user_info, txt_filename)
            print(f"✓ Study plan exported to: {txt_filename}")

            # Also export JSON for reference
            json_filename = f"{user_info['safe_name']}_study_plan.json"
            with open(json_filename, 'w') as f:
                json.dump(study_plan, f, indent=2)
            print(f"✓ Study plan (JSON) exported to: {json_filename}")

        # Step 7: Generate quiz
        quiz = await generate_verification_quiz(analysis['weak_topics'])

        if quiz:
            # Export as text file
            txt_filename = f"{user_info['safe_name']}_quiz.txt"
            export_quiz_as_text(quiz, user_info, txt_filename)
            print(f"✓ Verification quiz exported to: {txt_filename}")

            # Also export JSON for reference
            json_filename = f"{user_info['safe_name']}_quiz.json"
            with open(json_filename, 'w') as f:
                json.dump(quiz, f, indent=2)
            print(f"✓ Verification quiz (JSON) exported to: {json_filename}")

    else:
        print("\n✓ No weak topics - you're well prepared!")

    print(f"\n{'='*70}")
    print("WORKFLOW COMPLETE")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nWorkflow cancelled.")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
