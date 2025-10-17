# Email Integration for Diagnostic Forms

## Overview

This document describes the automated email system that sends personalized study resources to students after they complete diagnostic forms.

## What Was Implemented

### 1. **Khan Academy Resource Finder** (`app/services/khan_academy_service.py`)
- Uses Claude AI to find relevant Khan Academy links for topics
- Returns topic-specific resources with URLs, textbook page ranges, and descriptions
- Fallback handling for when resources cannot be found

### 2. **Backend Email Service** (`app/services/email_service.py`)
- Wrapper around SMTP email functionality
- Formats diagnostic results with personalized resources
- Includes weak topics analysis and next steps for students
- Non-blocking error handling (email failures don't break form submission)

### 3. **Configuration Updates**
- **`app/config.py`**: Added SMTP settings (host, port, bot email, password)
- **`backend/.env`**: Added email credentials from `/email/.env`

### 4. **Forms Router Integration** (`app/routers/forms.py`)
- Added email sending to `submit_form` endpoint (lines 812-823)
- Created helper functions:
  - `_send_results_email()`: Orchestrates email sending with resources
  - `_identify_weak_topics()`: Analyzes responses to find topics < 60% correct

## Workflow

```
Student submits form
        ↓
Backend processes answers & calculates score
        ↓
Session marked as completed in database
        ↓
[EMAIL WORKFLOW STARTS - NON-BLOCKING]
        ↓
Identify weak topics (< 60% correct)
        ↓
Find Khan Academy resources for weak topics using AI
        ↓
Send personalized email with:
  - Overall score
  - Khan Academy links for weak topics
  - Textbook page ranges
  - Next steps
        ↓
Return success response to student
```

## Email Format

```
Subject: Your Diagnostic Results & Study Resources

Hello [Student Name],

Thank you for completing your diagnostic assessment!

--- YOUR RESULTS ---
Score: 13/20 (65.0%)

--- RECOMMENDED STUDY RESOURCES ---

Based on your responses, here are some topics you might want to review:

📚 Newton's Laws
   Khan Academy: https://www.khanacademy.org/science/physics/forces-newtons-laws
   Textbook Pages: 120-145
   Review Newton's three laws of motion

📚 Projectile Motion
   Khan Academy: https://www.khanacademy.org/science/physics/two-dimensional-motion
   Textbook Pages: 85-105
   Study 2D motion and projectile trajectories

--- NEXT STEPS ---
1. Review the resources above for topics you found challenging
2. Practice with additional problems in those areas
3. Reach out to your teacher if you need additional support

Keep up the great work!

Best regards,
reTeach Team
```

## Configuration

### Environment Variables (`.env`)

```bash
# Email Service Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
BOT_EMAIL=reteach.service@gmail.com
BOT_PASSWORD=knrdhsvjnslmvvvx
```

### SMTP Settings

The system uses Gmail SMTP by default:
- **Host**: `smtp.gmail.com`
- **Port**: `587` (TLS)
- **Authentication**: Username/password

**Note**: For Gmail, you'll need an "App Password" (not your regular password):
1. Go to Google Account settings
2. Security → 2-Step Verification → App passwords
3. Generate password for "Mail" application

## Testing

### Test Email Service Connection

```bash
cd /home/dennis/Projects/reTeach/backend
source venv/bin/activate
python test_email_integration.py
```

This will:
1. Test SMTP connection
2. Send a sample diagnostic results email

### Test Complete Form Submission

1. Start the backend server:
   ```bash
   cd /home/dennis/Projects/reTeach/backend
   source venv/bin/activate
   uvicorn app.main:app --reload
   ```

2. Submit a form through the frontend or API

3. Check backend logs for:
   - `[EMAIL] Preparing results email...`
   - `[ANALYSIS] Identified X weak topics...`
   - `[KHAN ACADEMY] Finding resources...`
   - `[EMAIL] Successfully sent results to...`

## Key Features

### 1. **Weak Topic Detection**
- Analyzes all responses in a session
- Groups by topic
- Calculates percentage correct per topic
- Identifies topics with < 60% correct rate

### 2. **AI-Powered Resource Finding**
- Uses Claude to search for relevant Khan Academy content
- Returns specific URLs (not just homepage)
- Includes textbook page estimates
- Provides brief descriptions

### 3. **Non-Blocking Email**
- Email sending wrapped in try/catch
- Failures logged but don't break form submission
- Student always receives score confirmation

### 4. **Personalization**
- Uses student's actual name from session
- Only includes resources for weak topics
- Congratulatory message if no weak topics

## File Structure

```
backend/
├── app/
│   ├── config.py                          # Updated with SMTP settings
│   ├── routers/
│   │   └── forms.py                       # Updated submit_form endpoint
│   └── services/
│       ├── email_service.py               # NEW: Email sending logic
│       ├── khan_academy_service.py        # NEW: Resource finder
│       └── llm_service.py                 # Existing: AI service
├── .env                                   # Updated with email credentials
├── test_email_integration.py              # NEW: Test script
└── EMAIL_INTEGRATION_README.md            # This file
```

## Troubleshooting

### Email Not Sending

1. **Check credentials**:
   ```bash
   grep BOT_ backend/.env
   ```

2. **Test connection**:
   ```bash
   python test_email_integration.py
   ```

3. **Check logs** for specific error messages

### Wrong Resources

If Khan Academy links are generic or incorrect:
- The AI may not find specific resources
- Fallback provides general physics page
- Can be improved by refining prompts in `khan_academy_service.py`

### No Email Received

1. Check spam folder
2. Verify student email is valid
3. Check backend logs for "[EMAIL ERROR]"
4. Verify SMTP settings are correct

## Future Enhancements

1. **Textbook Integration**: Map topics to actual textbook sections
2. **Email Templates**: HTML formatting for better visual design
3. **Progress Tracking**: Send follow-up emails after study period
4. **Custom Resources**: Allow teachers to add their own resource links
5. **Resource Caching**: Cache Khan Academy searches to reduce AI calls

## API Reference

### `_send_results_email()`
```python
async def _send_results_email(
    session_uuid: UUID,
    student_email: str,
    score_percentage: float,
    correct_answers: int,
    total_questions: int
)
```

### `_identify_weak_topics()`
```python
async def _identify_weak_topics(session_uuid: UUID) -> List[Dict]
# Returns: [{"topic_name": str, "correct": int, "total": int, "percentage": float}]
```

### `find_resources_for_topics()`
```python
async def find_resources_for_topics(
    topic_names: List[str],
    subject_context: str = "Physics"
) -> Dict[str, Dict[str, any]]
# Returns: {topic: {"khan_academy_url": str, "textbook_pages": str, "description": str}}
```

## Support

For issues or questions:
1. Check backend logs first
2. Run `test_email_integration.py`
3. Verify `.env` configuration
4. Check that all imports work: `python -c "from app.services.email_service import get_email_service"`

---

**Last Updated**: 2025-10-17
**Author**: Claude (Anthropic)
**Version**: 1.0
