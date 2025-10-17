# Email Integration Testing Checklist

## ✅ Pre-Testing Checklist

### 1. Environment Configuration
- [x] Email credentials added to `backend/.env`
- [x] SMTP settings configured in `app/config.py`
- [x] Virtual environment activated

### 2. Code Files Created/Updated
- [x] `app/services/khan_academy_service.py` - NEW
- [x] `app/services/email_service.py` - NEW
- [x] `app/routers/forms.py` - UPDATED (added email integration)
- [x] `app/config.py` - UPDATED (added SMTP settings)
- [x] `backend/.env` - UPDATED (added email credentials)
- [x] `test_email_integration.py` - NEW (test script)

### 3. Syntax Check
- [x] All Python files compile without errors

---

## 🧪 Testing Steps

### Test 1: Verify Email Service Connection

```bash
cd /home/dennis/Projects/reTeach/backend
source venv/bin/activate
python test_email_integration.py
```

**Expected Output:**
```
======================================================================
EMAIL SERVICE TEST
======================================================================

[TEST 1] Testing SMTP connection...
[EMAIL] Connection verified successfully
✓ SMTP connection verified

[TEST 2] Sending test diagnostic results email...
[EMAIL] Successfully sent to test@example.com
✓ Test email sent successfully to test@example.com

======================================================================
TEST COMPLETE
======================================================================
```

**⚠️ BEFORE RUNNING:** Edit `test_email_integration.py` line 41 to use your actual test email!

---

### Test 2: Start Backend Server

```bash
cd /home/dennis/Projects/reTeach/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

---

### Test 3: Submit a Form (End-to-End Test)

#### Option A: Through Frontend
1. Navigate to a published form in your browser
2. Enter student name and email
3. Answer all questions
4. Submit the form

#### Option B: Using curl/Postman
```bash
# First, start a session
curl -X POST http://localhost:8000/api/forms/{slug}/start \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "Test Student",
    "student_email": "your-email@example.com"
  }'

# Then submit answers (use the session_id from above)
curl -X POST http://localhost:8000/api/forms/{slug}/submit \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID_FROM_START",
    "answers": [
      {"question_id": "q_001", "selected_index": 0},
      {"question_id": "q_002", "selected_index": 1}
    ]
  }'
```

**Expected Backend Logs:**
```
[FORMS] Submitting form: slug_name, session: uuid-here
[FORMS] Received X answers
[FORMS] Session found: form=uuid, student=uuid
[FORMS] Score: X/Y = Z%
[FORMS] Form submission complete
[EMAIL] Preparing results email for student@example.com
[ANALYSIS] Identified 2 weak topics out of 5 total
  • Newton's Laws: 40% (2/5)
  • Projectile Motion: 50% (1/2)
[EMAIL] Finding Khan Academy resources for 2 weak topics
[LLM] Calling Claude API...
[KHAN ACADEMY] Found resources for 2 topics
[EMAIL] Successfully sent results to student@example.com
```

---

### Test 4: Check Email Inbox

1. Check the student's email inbox
2. Look for email with subject: "Your Diagnostic Results & Study Resources"
3. Verify the email contains:
   - Student name
   - Score (correct/total and percentage)
   - List of weak topics (if any)
   - Khan Academy URLs for each weak topic
   - Textbook page ranges
   - Description for each resource

---

## 🔍 Troubleshooting

### Issue: SMTP Connection Failed

**Error:** `[EMAIL ERROR] Connection failed: [Errno 111] Connection refused`

**Solution:**
1. Check SMTP settings in `.env`:
   ```bash
   grep SMTP backend/.env
   ```
2. Verify Gmail App Password (not regular password)
3. Check firewall/network settings

---

### Issue: No Module Named 'tenacity'

**Error:** `ModuleNotFoundError: No module named 'tenacity'`

**Solution:**
```bash
source venv/bin/activate
pip install -r requirements.txt
```

---

### Issue: Email Not Received

**Possible Causes:**
1. Email went to spam folder - CHECK SPAM
2. Invalid student email address - check backend logs
3. Email service failed silently - check for `[EMAIL ERROR]` in logs
4. SMTP credentials wrong - run `test_email_integration.py`

**Debugging:**
```bash
# Check backend logs for email-related messages
grep -i email backend_logs.txt

# Test connection directly
python test_email_integration.py
```

---

### Issue: Generic Khan Academy Links

**Symptom:** All Khan Academy links point to homepage or generic pages

**This is normal!** The AI does its best to find specific resources, but may fall back to general pages if:
- Topic is very niche
- Topic name is ambiguous
- Khan Academy doesn't have specific content

**Improvement:** Edit prompts in `app/services/khan_academy_service.py` lines 45-75

---

### Issue: Form Submission Fails

**Error:** 500 Internal Server Error when submitting form

**Solution:**
1. Check backend logs for stack trace
2. Email sending is wrapped in try/catch, so it shouldn't break submission
3. If it does fail, check:
   ```bash
   # Verify imports work
   cd /home/dennis/Projects/reTeach/backend
   source venv/bin/activate
   python -c "from app.services.email_service import get_email_service; from app.services.khan_academy_service import get_khan_academy_service; print('OK')"
   ```

---

## 📝 Quick Test Script

Save this as `quick_test.sh`:

```bash
#!/bin/bash

echo "=== Email Integration Quick Test ==="
echo ""

cd /home/dennis/Projects/reTeach/backend

echo "1. Activating virtual environment..."
source venv/bin/activate

echo "2. Checking imports..."
python -c "from app.services.email_service import get_email_service; from app.services.khan_academy_service import get_khan_academy_service; print('✓ Imports OK')" || exit 1

echo "3. Checking syntax..."
python -m py_compile app/routers/forms.py && echo "✓ forms.py OK" || exit 1
python -m py_compile app/services/email_service.py && echo "✓ email_service.py OK" || exit 1
python -m py_compile app/services/khan_academy_service.py && echo "✓ khan_academy_service.py OK" || exit 1

echo ""
echo "✓ All checks passed! Ready to test."
echo ""
echo "Next steps:"
echo "  1. Edit test_email_integration.py (change test email on line 41)"
echo "  2. Run: python test_email_integration.py"
echo "  3. Start server: uvicorn app.main:app --reload"
echo "  4. Submit a test form"
```

Make it executable:
```bash
chmod +x quick_test.sh
./quick_test.sh
```

---

## ✅ Success Criteria

The integration is working correctly if:

1. ✅ Backend starts without errors
2. ✅ Form submission returns 200 OK with score
3. ✅ Backend logs show `[EMAIL] Successfully sent results to...`
4. ✅ Student receives email within 1-2 minutes
5. ✅ Email contains personalized resources for weak topics
6. ✅ Khan Academy URLs are clickable and relevant

---

## 🎯 Ready for Production?

### Before deploying to production:

- [ ] Test with real student emails
- [ ] Verify Khan Academy links are appropriate
- [ ] Test with forms that have many topics (10+)
- [ ] Test with students who answer everything correctly (no weak topics)
- [ ] Test with students who answer everything incorrectly (all weak topics)
- [ ] Verify email deliverability (not marked as spam)
- [ ] Consider adding HTML email templates for better formatting
- [ ] Set up monitoring for email failures
- [ ] Document for teachers how the system works

---

**Last Updated:** 2025-10-17
