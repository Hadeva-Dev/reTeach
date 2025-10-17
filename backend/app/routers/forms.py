"""
Native Forms Router
Endpoints for creating, publishing, and managing shareable diagnostic forms
"""

from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID, uuid4
from datetime import datetime

from app.models.question import Question
from app.database import db
from app.utils.slug_generator import generate_slug

router = APIRouter(prefix="/api/forms", tags=["forms"])


# ============================================================
# REQUEST/RESPONSE MODELS
# ============================================================

class PublishFormRequest(BaseModel):
    """Request to publish a new diagnostic form"""
    title: str = Field(..., min_length=1, max_length=255)
    questions: List[Question] = Field(..., min_length=1)
    course_id: Optional[str] = Field(None, description="Associated course ID")


class PublishFormResponse(BaseModel):
    """Response after publishing a form"""
    form_id: str
    slug: str
    url: str
    total_questions: int


class FormInfoResponse(BaseModel):
    """Public form information for students"""
    form_id: str
    title: str
    total_questions: int
    status: str


class StudentInfo(BaseModel):
    """Student information to start form session"""
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr


class StartSessionResponse(BaseModel):
    """Response after starting a session"""
    session_id: str
    form_title: str
    total_questions: int
    questions: List[dict]


class SubmitAnswer(BaseModel):
    """Single answer submission"""
    question_id: str
    selected_option_index: int


class SubmitFormRequest(BaseModel):
    """Complete form submission"""
    session_id: str
    answers: List[SubmitAnswer]


class SubmitFormResponse(BaseModel):
    """Response after submitting form"""
    session_id: str
    score_percentage: float
    correct_answers: int
    total_questions: int
    message: str


# ============================================================
# ENDPOINTS
# ============================================================

@router.post("/publish", response_model=PublishFormResponse)
async def publish_form(request: PublishFormRequest):
    """
    Publish a diagnostic form and get shareable URL

    Creates a new form with unique slug, stores questions,
    and returns shareable link for students.

    Args:
        request: Form title and questions

    Returns:
        Form ID, slug, and shareable URL
    """
    try:
        # Create or get default course
        course_result = db.client.table("courses")\
            .select("id")\
            .eq("title", "Default Course")\
            .execute()

        if course_result.data:
            course_id = course_result.data[0]["id"]
        else:
            # Create default course
            new_course = db.client.table("courses").insert({
                "title": "Default Course",
                "course_level": "ug"
            }).execute()
            course_id = new_course.data[0]["id"] if new_course.data else None

            if not course_id:
                raise HTTPException(status_code=500, detail="Failed to create course")

        # Generate unique slug
        slug = generate_slug(request.title)

        # Check if slug already exists (unlikely but possible)
        existing = db.client.table("forms").select("id").eq("slug", slug).execute()
        if existing.data:
            # Regenerate with longer suffix
            slug = generate_slug(request.title, length=6)

        # Create form record
        form_data = {
            "form_id": f"form_{slug}",
            "course_id": course_id,
            "title": request.title,
            "slug": slug,
            "status": "published",
            "publish_date": datetime.now().isoformat(),
        }

        form_result = db.client.table("forms").insert(form_data).execute()

        if not form_result.data:
            raise HTTPException(status_code=500, detail="Failed to create form")

        form_record = form_result.data[0]
        form_uuid = form_record["id"]

        # Store each unique topic and create questions in proper tables
        topic_map = {}  # topic name -> topic uuid

        for question in request.questions:
            topic_name = question.topic

            # Get or create topic
            if topic_name not in topic_map:
                topic_result = db.client.table("topics")\
                    .select("id")\
                    .eq("course_id", course_id)\
                    .eq("name", topic_name)\
                    .execute()

                if topic_result.data:
                    topic_uuid = topic_result.data[0]["id"]
                else:
                    # Create new topic
                    new_topic = db.client.table("topics").insert({
                        "course_id": course_id,
                        "topic_id": f"topic_{slug}_{len(topic_map)}",
                        "name": topic_name,
                        "weight": 1.0 / len(set(q.topic for q in request.questions))
                    }).execute()
                    topic_uuid = new_topic.data[0]["id"] if new_topic.data else None

                    if not topic_uuid:
                        raise HTTPException(status_code=500, detail=f"Failed to create topic: {topic_name}")

                topic_map[topic_name] = topic_uuid

        # Store questions in questions table and link to form
        for idx, question in enumerate(request.questions):
            topic_uuid = topic_map[question.topic]

            # Create question in questions table
            question_result = db.client.table("questions").insert({
                "question_id": question.id,
                "topic_id": topic_uuid,
                "stem": question.stem,
                "options": question.options,
                "answer_index": question.answerIndex,
                "rationale": question.rationale,
                "difficulty": question.difficulty,
                "bloom_level": question.bloom
            }).execute()

            if not question_result.data:
                raise HTTPException(status_code=500, detail=f"Failed to create question {idx}")

            question_uuid = question_result.data[0]["id"]

            # Link question to form
            db.client.table("form_questions").insert({
                "form_id": form_uuid,
                "question_id": question_uuid,
                "order_index": idx
            }).execute()

        # Build shareable URL
        base_url = "http://localhost:3000"  # TODO: Get from env
        url = f"{base_url}/form/{slug}"

        return PublishFormResponse(
            form_id=str(form_uuid),
            slug=slug,
            url=url,
            total_questions=len(request.questions)
        )

    except Exception as e:
        print(f"[FORMS] Error publishing form: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{slug}", response_model=FormInfoResponse)
async def get_form_by_slug(slug: str):
    """
    Get public form information by slug

    Students use this to view form before starting.

    Args:
        slug: Form slug from URL

    Returns:
        Form title and metadata (no questions yet)
    """
    try:
        # Query form by slug
        result = db.client.table("forms")\
            .select("id, form_id, title, status")\
            .eq("slug", slug)\
            .eq("status", "published")\
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Form not found")

        form = result.data[0]

        # Count questions
        questions = db.client.table("form_questions")\
            .select("question_id", count="exact")\
            .eq("form_id", form["id"])\
            .execute()

        total_questions = questions.count or 0

        return FormInfoResponse(
            form_id=form["form_id"],
            title=form["title"],
            total_questions=total_questions,
            status=form["status"]
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[FORMS] Error fetching form: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{slug}/start", response_model=StartSessionResponse)
async def start_form_session(slug: str, student_info: StudentInfo, request: Request):
    """
    Start a new form session for a student

    Collects student name/email and creates session.
    Returns questions for student to answer.

    Args:
        slug: Form slug
        student_info: Student name and email
        request: FastAPI request (for IP/user agent)

    Returns:
        Session ID and form questions
    """
    try:
        # Get form
        form_result = db.client.table("forms")\
            .select("id, title")\
            .eq("slug", slug)\
            .eq("status", "published")\
            .execute()

        if not form_result.data:
            raise HTTPException(status_code=404, detail="Form not found")

        form = form_result.data[0]
        form_uuid = form["id"]

        # Check if student exists, create if not
        student_result = db.client.table("students")\
            .select("id")\
            .eq("email", student_info.email.lower())\
            .execute()

        if student_result.data:
            student_uuid = student_result.data[0]["id"]
        else:
            # Create new student
            new_student = db.client.table("students").insert({
                "email": student_info.email.lower(),
                "name": student_info.name
            }).execute()
            student_uuid = new_student.data[0]["id"] if new_student.data else None

        # Create session
        session_data = {
            "form_id": form_uuid,
            "student_name": student_info.name,
            "student_email": student_info.email.lower(),
            "student_id": student_uuid,
            "started_at": datetime.now().isoformat(),
            "ip_address": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent")
        }

        session_result = db.client.table("form_sessions").insert(session_data).execute()

        if not session_result.data:
            raise HTTPException(status_code=500, detail="Failed to create session")

        session_uuid = session_result.data[0]["id"]

        # Get form_questions with question IDs
        form_questions_result = db.client.table("form_questions")\
            .select("question_id, order_index")\
            .eq("form_id", form_uuid)\
            .order("order_index")\
            .execute()

        # Fetch full question details from questions table
        questions = []
        for fq in form_questions_result.data:
            question_result = db.client.table("questions")\
                .select("question_id, topic_id, stem, options, answer_index")\
                .eq("id", fq["question_id"])\
                .execute()

            if question_result.data:
                q = question_result.data[0]

                # Get topic name
                topic_result = db.client.table("topics")\
                    .select("name")\
                    .eq("id", q["topic_id"])\
                    .execute()

                topic_name = topic_result.data[0]["name"] if topic_result.data else "Unknown Topic"

                questions.append({
                    "id": q["question_id"],
                    "topic": topic_name,
                    "stem": q["stem"],
                    "options": q["options"],
                    "answerIndex": q["answer_index"]
                })

        return StartSessionResponse(
            session_id=str(session_uuid),
            form_title=form["title"],
            total_questions=len(questions),
            questions=questions
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[FORMS] Error starting session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{slug}/questions")
async def get_form_questions(slug: str):
    """
    Get questions for a form by slug

    Students can fetch questions after starting a session.

    Args:
        slug: Form slug

    Returns:
        List of questions for the form
    """
    try:
        # Get form by slug
        form_result = db.client.table("forms")\
            .select("id, title")\
            .eq("slug", slug)\
            .eq("status", "published")\
            .execute()

        if not form_result.data:
            raise HTTPException(status_code=404, detail="Form not found")

        form = form_result.data[0]
        form_uuid = form["id"]

        # Get form_questions with question IDs
        form_questions_result = db.client.table("form_questions")\
            .select("question_id, order_index")\
            .eq("form_id", form_uuid)\
            .order("order_index")\
            .execute()

        if not form_questions_result.data:
            return {
                "form_title": form["title"],
                "total_questions": 0,
                "questions": []
            }

        # Fetch full question details from questions table
        questions = []
        for fq in form_questions_result.data:
            question_result = db.client.table("questions")\
                .select("question_id, topic_id, stem, options, answer_index, rationale, difficulty, bloom_level")\
                .eq("id", fq["question_id"])\
                .execute()

            if question_result.data:
                q = question_result.data[0]

                # Get topic name
                topic_result = db.client.table("topics")\
                    .select("name")\
                    .eq("id", q["topic_id"])\
                    .execute()

                topic_name = topic_result.data[0]["name"] if topic_result.data else "Unknown Topic"

                questions.append({
                    "id": q["question_id"],
                    "topic": topic_name,
                    "stem": q["stem"],
                    "options": q["options"],
                    "answerIndex": q["answer_index"],
                    "rationale": q.get("rationale"),
                    "difficulty": q.get("difficulty"),
                    "bloom": q.get("bloom_level")
                })

        return {
            "form_title": form["title"],
            "total_questions": len(questions),
            "questions": questions
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[FORMS] Error fetching questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{slug}/submit", response_model=SubmitFormResponse)
async def submit_form(slug: str, submission: SubmitFormRequest):
    """
    Submit completed form answers

    Stores all responses, calculates score, marks session complete.

    Args:
        slug: Form slug
        submission: Session ID and answers

    Returns:
        Score and completion confirmation
    """
    try:
        # Verify session exists
        session_result = db.client.table("form_sessions")\
            .select("id, form_id")\
            .eq("id", submission.session_id)\
            .execute()

        if not session_result.data:
            raise HTTPException(status_code=404, detail="Session not found")

        session = session_result.data[0]
        session_uuid = session["id"]
        form_uuid = session["form_id"]

        # TODO: Store responses and calculate score
        # For now, return placeholder data

        correct_count = 0
        total_questions = len(submission.answers)
        score = (correct_count / total_questions * 100) if total_questions > 0 else 0

        # Update session as completed
        db.client.table("form_sessions").update({
            "completed_at": datetime.now().isoformat(),
            "total_questions": total_questions,
            "correct_answers": correct_count,
            "score_percentage": score
        }).eq("id", session_uuid).execute()

        return SubmitFormResponse(
            session_id=str(session_uuid),
            score_percentage=score,
            correct_answers=correct_count,
            total_questions=total_questions,
            message="Thank you for completing the diagnostic!"
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[FORMS] Error submitting form: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{form_id}/responses")
async def get_form_responses(form_id: str):
    """
    Get all responses for a form (teacher view)

    Args:
        form_id: Form UUID or form_id

    Returns:
        List of student submissions with scores
    """
    try:
        # Get all sessions for this form
        sessions = db.client.table("form_sessions")\
            .select("*")\
            .eq("form_id", form_id)\
            .order("completed_at", desc=True)\
            .execute()

        return {
            "form_id": form_id,
            "total_submissions": len(sessions.data) if sessions.data else 0,
            "submissions": sessions.data or []
        }

    except Exception as e:
        print(f"[FORMS] Error fetching responses: {e}")
        raise HTTPException(status_code=500, detail=str(e))
