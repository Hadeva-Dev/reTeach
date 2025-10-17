"""
Topic Parsing Router
Endpoints for extracting topics from syllabi
"""

from fastapi import APIRouter, HTTPException
from typing import List

from app.models.topic import Topic, ParseTopicsRequest, ParseTopicsResponse
from app.models.course import CourseLevel
from app.services.topic_parser import get_topic_parser

router = APIRouter(prefix="/api/topics", tags=["topics"])


@router.post("/parse", response_model=ParseTopicsResponse)
async def parse_topics(request: ParseTopicsRequest):
    """
    Parse topics from course syllabus text using AI

    Args:
        request: ParseTopicsRequest with syllabus_text and optional course_level

    Returns:
        ParseTopicsResponse with extracted topics
    """
    try:
        parser = get_topic_parser()

        topics, prerequisites = await parser.parse_topics(
            syllabus_text=request.syllabus_text,
            course_level=request.course_level or CourseLevel.UNDERGRADUATE
        )

        return ParseTopicsResponse(topics=topics)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse topics: {str(e)}"
        )
