"""
Topic Parser Service
Extracts topics from course syllabi using LLM
"""

from typing import List, Optional
from uuid import UUID, uuid4

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

        # Create prompt
        prompt = topic_extraction_prompt(
            syllabus_text=syllabus_text,
            course_level=course_level.value if course_level else None
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

            print(f"[TOPIC PARSER] Successfully extracted {len(topics)} topics")
            return topics, prerequisites

        except Exception as e:
            print(f"[TOPIC PARSER ERROR] LLM extraction failed: {e}")
            print(f"[TOPIC PARSER] Falling back to regex-based extraction...")

            # Fallback to regex extraction
            fallback_data = fallback_topics_from_headings(syllabus_text)
            topics = [Topic(**item) for item in fallback_data]

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
