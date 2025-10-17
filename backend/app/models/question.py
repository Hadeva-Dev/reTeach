"""Question-related models"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class Difficulty(str, Enum):
    """Question difficulty level"""
    EASY = "easy"
    MEDIUM = "med"
    HARD = "hard"


class Question(BaseModel):
    """
    Multiple-choice question
    Matches API contract exactly
    """
    id: str = Field(..., description="Unique question identifier (e.g., 'q_001')")
    topic: str = Field(..., description="Topic this question tests")
    stem: str = Field(..., min_length=5, description="Question text")
    options: List[str] = Field(..., min_length=2, max_length=6, description="Answer choices")
    answerIndex: int = Field(..., ge=0, description="0-based index of correct answer")
    rationale: str = Field(..., description="Explanation of correct answer")
    difficulty: Difficulty = Field(..., description="Question difficulty level")
    bloom: str = Field(..., description="Bloom's taxonomy level")

    @field_validator("answerIndex")
    @classmethod
    def validate_answer_index(cls, v: int, info) -> int:
        """Ensure answerIndex is within bounds of options array"""
        # Note: 'options' may not be available yet during validation
        # This will be checked again in the service layer
        if v < 0:
            raise ValueError("answerIndex must be non-negative")
        return v

    def validate_answer_bounds(self) -> None:
        """Validate that answerIndex is valid for options"""
        if self.answerIndex >= len(self.options):
            raise ValueError(
                f"answerIndex {self.answerIndex} out of bounds for {len(self.options)} options"
            )


class GenerateQuestionsRequest(BaseModel):
    """POST /api/generate-questions request body"""
    topics: List[str] = Field(..., min_length=1, description="List of topic names")
    count_per_topic: int = Field(..., ge=1, le=20, description="Questions per topic")
    difficulty: Optional[Difficulty] = Field(None, description="Target difficulty")
    textbook_id: Optional[str] = Field(None, description="Textbook ID to generate questions from")
    use_textbook: bool = Field(False, description="Whether to use textbook content for generation")
    total_count: Optional[int] = Field(None, description="Total number of questions desired (backend will limit output)")


class GenerateQuestionsResponse(BaseModel):
    """POST /api/generate-questions response body"""
    questions: List[Question] = Field(..., description="Generated MCQ questions")
