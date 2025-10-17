"""
Topic Parser Service
Extracts topics from course syllabi using LLM
"""

from typing import List, Optional
from uuid import UUID, uuid4
import re

from app.models.topic import Topic, ParseTopicsRequest, ParseTopicsResponse
from app.models.course import CourseLevel
from app.services.llm_service import get_llm_service
from app.utils.prompts import topic_extraction_prompt, fallback_topics_from_headings
from app.database import db


class TopicParserService:
    """Service for parsing topics from syllabi"""

    def __init__(self):
        self.llm = get_llm_service()

    async def extract_prerequisites(self, syllabus_text: str) -> List[str]:
        """
        Extract prerequisites mentioned in syllabus using AI

        Args:
            syllabus_text: The course syllabus text

        Returns:
            List of prerequisite topics/skills
        """
        prompt = f"""Extract the prerequisite topics/skills mentioned in this course syllabus.

Syllabus:
{syllabus_text[:3000]}

Task: Identify what prior knowledge or courses students need before taking this course.

Common prerequisites include:
- Math: Algebra, Geometry, Trigonometry, Calculus, Statistics
- Science: Physics, Chemistry, Biology
- Skills: Programming, Lab work, Writing

Return ONLY this JSON (no other text):
{{
  "prerequisites": ["Algebra", "Calculus", "Scientific Notation"]
}}

If no prerequisites are mentioned, return empty array.
"""

        try:
            result = await self.llm.generate_json(prompt, max_tokens=512)
            prerequisites = result.get('prerequisites', [])

            # Deduplicate and standardize
            unique_prereqs = list(set(p.strip().title() for p in prerequisites if p.strip()))
            return unique_prereqs

        except Exception as e:
            print(f"[TOPIC PARSER WARNING] Could not extract prerequisites: {e}")
            return []

    async def parse_topics(
        self,
        syllabus_text: str,
        course_level: Optional[CourseLevel] = None
    ) -> tuple[List[Topic], List[str]]:
        """
        Extract topics and prerequisites from syllabus text using LLM

        Args:
            syllabus_text: The course syllabus text
            course_level: Educational level (hs, ug, grad)

        Returns:
            Tuple of (List of extracted Topic objects, List of prerequisites)

        Raises:
            ValueError: If LLM fails and fallback also fails
        """
        print(f"\n[TOPIC PARSER] Parsing topics from {len(syllabus_text)} chars of text...")

        # Extract prerequisites first (using AI)
        prerequisites = await self.extract_prerequisites(syllabus_text)
        if prerequisites:
            print(f"[TOPIC PARSER] Found prerequisites: {', '.join(prerequisites)}")

        # IMPORTANT: Do NOT use explicit topics from syllabus - those are course content
        # We want to extract PREREQUISITE topics only using AI
        candidate_sections = self._extract_candidate_sections(syllabus_text)

        # Create prompt
        prompt = topic_extraction_prompt(
            syllabus_text=syllabus_text,
            course_level=course_level.value if course_level else None,
            prerequisites=prerequisites,
            candidate_sections=candidate_sections
        )

        try:
            # Call LLM for structured JSON response
            topics_data = await self.llm.generate_json(prompt, max_tokens=2048)

            # Validate and convert to Topic objects
            if not isinstance(topics_data, list):
                raise ValueError("LLM response is not a list")

            topics = []
            for item in topics_data:
                try:
                    topic = Topic(**item)
                    topics.append(topic)
                except Exception as e:
                    print(f"[TOPIC PARSER WARNING] Skipping invalid topic: {e}")
                    continue

            if not topics:
                raise ValueError("No valid topics extracted")

            topics = self._ensure_prerequisite_topics(topics, prerequisites)

            print(f"[TOPIC PARSER] Successfully extracted {len(topics)} topics")
            return topics, prerequisites

        except Exception as e:
            print(f"[TOPIC PARSER ERROR] LLM extraction failed: {e}")
            print(f"[TOPIC PARSER] Falling back to regex-based extraction...")

            # Fallback to regex extraction
            fallback_data = fallback_topics_from_headings(syllabus_text)
            topics = [Topic(**item) for item in fallback_data]
            topics = self._ensure_prerequisite_topics(topics, prerequisites)

            print(f"[TOPIC PARSER] Fallback extracted {len(topics)} topics")
            return topics, prerequisites

    async def save_topics_to_db(
        self,
        course_id: UUID,
        topics: List[Topic]
    ) -> List[dict]:
        """
        Save extracted topics to Supabase

        Args:
            course_id: UUID of the course
            topics: List of Topic objects

        Returns:
            List of inserted topic records
        """
        print(f"\n[TOPIC PARSER] Saving {len(topics)} topics to database...")

        # Prepare topic records
        topic_records = []
        for idx, topic in enumerate(topics):
            topic_records.append({
                "course_id": str(course_id),
                "topic_id": topic.id,
                "name": topic.name,
                "weight": topic.weight,
                "order_index": idx + 1,
            })

        try:
            # Insert topics
            result = db.client.table("topics").insert(topic_records).execute()
            inserted_topics = result.data

            print(f"[TOPIC PARSER] Saved {len(inserted_topics)} topics")

            # Save prerequisites
            if inserted_topics:
                await self._save_prerequisites(topics, inserted_topics)

            return inserted_topics

        except Exception as e:
            print(f"[TOPIC PARSER ERROR] Failed to save topics: {e}")
            raise

    def _generate_topic_id(self, existing_ids: set[str]) -> str:
        """Generate the next available topic id."""
        counter = 1
        while True:
            candidate = f"t_{counter:03d}"
            if candidate not in existing_ids:
                return candidate
            counter += 1

    def _extract_candidate_sections(self, syllabus_text: str) -> List[str]:
        """Extract candidate section headings from the syllabus text."""
        patterns = [
            r"^#{1,3}\s+(.+)$",  # Markdown headings
            r"^\d+\.?\s+(.+)$",  # Numbered list headings
            r"^[A-Z][A-Za-z0-9 ,&\-/]+:$",  # Lines ending with colon
            r"^[A-Z][A-Za-z0-9 ,&\-/]+$"  # All caps or title case single line
        ]

        candidates: list[str] = []
        seen = set()

        for line in syllabus_text.splitlines():
            stripped = line.strip()
            if not stripped or len(stripped) < 3:
                continue

            match = None
            for pattern in patterns:
                match = re.match(pattern, stripped)
                if match:
                    break

            if not match:
                continue

            heading = match.group(1).strip() if match.groups() else stripped
            heading = re.sub(r"\s+", " ", heading).rstrip(':')

            if 3 <= len(heading) <= 120 and heading.lower() not in seen:
                candidates.append(heading)
                seen.add(heading.lower())

            if len(candidates) >= 12:
                break

        return candidates

    def _extract_explicit_topics(self, syllabus_text: str) -> List[str]:
        """Extract explicit topic lists (lettered or numbered) from the syllabus."""
        lines = syllabus_text.splitlines()
        topics: list[str] = []
        capture = False
        last_was_bullet = False

        bullet_patterns = [
            re.compile(r"^\s*[a-z]\)\s+(.+)$", re.IGNORECASE),
            re.compile(r"^\s*\d+\.?\s+(.+)$"),
            re.compile(r"^\s*[-•]\s+(.+)$")
        ]

        for raw_line in lines:
            line = raw_line.strip()

            if not capture and "specific topics include" in line.lower():
                capture = True
                continue

            if capture:
                if not line:
                    if topics and last_was_bullet:
                        break
                    continue

                matched_text = None
                for pattern in bullet_patterns:
                    match = pattern.match(line)
                    if match:
                        matched_text = match.group(1).strip()
                        break

                if matched_text:
                    topics.append(matched_text.rstrip('.'))
                    last_was_bullet = True
                    continue

                if re.match(r"^[A-Z][A-Za-z0-9 ,&\-/]+:?$", line):
                    if topics:
                        break
                    else:
                        capture = False
                        continue

                if topics:
                    topics[-1] += f" {line.rstrip('.')}"
                    last_was_bullet = False

        if len(topics) >= 3:
            return topics
        return []

    def _build_topics_from_list(self, topic_names: List[str]) -> List[Topic]:
        """Build Topic objects from an explicit list with normalized weights."""
        total = len(topic_names)
        if total == 0:
            return []

        weight = round(1 / total, 4)
        topics: list[Topic] = []
        for idx, name in enumerate(topic_names, start=1):
            topics.append(Topic(
                id=f"t_{idx:03d}",
                name=name.strip().rstrip('.'),
                weight=weight,
                prereqs=[]
            ))
        return topics

    def _ensure_prerequisite_topics(
        self,
        topics: List[Topic],
        prerequisites: List[str]
    ) -> List[Topic]:
        """
        Ensure prerequisites are represented in the topic list
        and referenced by downstream topics.
        """
        if not prerequisites:
            return topics

        name_to_topic = {topic.name.lower(): topic for topic in topics}
        existing_ids = {topic.id for topic in topics}
        prereq_ids: list[str] = []

        for prereq in prerequisites:
            key = prereq.strip().lower()
            if not key:
                continue

            if key in name_to_topic:
                prereq_ids.append(name_to_topic[key].id)
                continue

            new_id = self._generate_topic_id(existing_ids)
            new_topic = Topic(
                id=new_id,
                name=prereq.strip().title(),
                weight=0.6,
                prereqs=[]
            )
            topics.insert(0, new_topic)
            name_to_topic[key] = new_topic
            existing_ids.add(new_id)
            prereq_ids.append(new_id)

        valid_ids = {topic.id for topic in topics}
        prereq_ids = [pid for pid in prereq_ids if pid in valid_ids]

        for topic in topics:
            topic.prereqs = [
                pid for pid in topic.prereqs
                if pid in valid_ids and pid != topic.id
            ]
            if prereq_ids and topic.id not in prereq_ids and not topic.prereqs:
                topic.prereqs = prereq_ids[:3]

        return topics

    async def _save_prerequisites(
        self,
        topics: List[Topic],
        inserted_topics: List[dict]
    ) -> None:
        """
        Save topic prerequisite relationships

        Args:
            topics: Original Topic objects with prereqs
            inserted_topics: Inserted topic records from DB
        """
        # Map topic_id to UUID
        topic_id_to_uuid = {
            t["topic_id"]: t["id"]
            for t in inserted_topics
        }

        prereq_records = []
        for topic in topics:
            if not topic.prereqs:
                continue

            topic_uuid = topic_id_to_uuid.get(topic.id)
            if not topic_uuid:
                continue

            for prereq_id in topic.prereqs:
                prereq_uuid = topic_id_to_uuid.get(prereq_id)
                if not prereq_uuid:
                    print(f"[TOPIC PARSER WARNING] Prereq {prereq_id} not found")
                    continue

                prereq_records.append({
                    "topic_id": topic_uuid,
                    "prerequisite_topic_id": prereq_uuid,
                })

        if prereq_records:
            try:
                db.client.table("topic_prerequisites").insert(prereq_records).execute()
                print(f"[TOPIC PARSER] Saved {len(prereq_records)} prerequisites")
            except Exception as e:
                print(f"[TOPIC PARSER WARNING] Failed to save prerequisites: {e}")


# Global instance
_topic_parser: Optional[TopicParserService] = None


def get_topic_parser() -> TopicParserService:
    """Get or create global topic parser instance"""
    global _topic_parser
    if _topic_parser is None:
        _topic_parser = TopicParserService()
    return _topic_parser
