"""
Question Generation Router
Endpoints for generating MCQ diagnostic questions
"""

from fastapi import APIRouter, HTTPException
from typing import List

from app.models.question import Question, GenerateQuestionsRequest, GenerateQuestionsResponse, Difficulty
from app.models.course import CourseLevel
from app.services.question_generator import get_question_generator

router = APIRouter(prefix="/api/questions", tags=["questions"])


@router.post("/generate", response_model=GenerateQuestionsResponse)
async def generate_questions(request: GenerateQuestionsRequest):
    """
    Generate MCQ diagnostic questions for given topics

    Supports two modes:
    1. AI web search (default): Questions generated from web search
    2. Textbook-based: Questions generated from uploaded textbook content

    Args:
        request: GenerateQuestionsRequest with topics and count

    Returns:
        GenerateQuestionsResponse with generated questions
    """
    try:
        generator = get_question_generator()

        # Build context for question generation
        context = None
        if request.use_textbook and request.textbook_id:
            # Get textbook content from database
            from app.database import db

            resource_result = db.client.table("resources")\
                .select("file_path, metadata")\
                .eq("id", request.textbook_id)\
                .execute()

            if resource_result.data:
                # In production, we'd extract relevant sections from the PDF
                # For now, we'll just note that we have the textbook
                context = f"Use textbook content from: {resource_result.data[0].get('metadata', {}).get('title', 'textbook')}"

        questions = await generator.generate_questions(
            topics=request.topics,
            count_per_topic=request.count_per_topic,
            difficulty=request.difficulty or Difficulty.MEDIUM,
            course_level=CourseLevel.UNDERGRADUATE,
            context=context  # Pass textbook context if available
        )

        # Limit to total_count if specified
        if request.total_count and len(questions) > request.total_count:
            questions = questions[:request.total_count]

        return GenerateQuestionsResponse(questions=questions)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate questions: {str(e)}"
        )
