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
