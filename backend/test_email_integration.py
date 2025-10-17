#!/usr/bin/env python3
"""
Test Email Integration
Quick test to verify email service configuration
"""

import asyncio
from app.services.email_service import get_email_service


async def test_email_service():
    """Test email service connection and sending"""
    print("\n" + "="*70)
    print("EMAIL SERVICE TEST")
    print("="*70 + "\n")

    # Initialize service
    email_service = get_email_service()

    # Test 1: Verify connection
    print("[TEST 1] Testing SMTP connection...")
    connection_ok = email_service.verify_connection()

    if connection_ok:
        print("✓ SMTP connection verified\n")
    else:
        print("✗ SMTP connection failed\n")
        return

    # Test 2: Send test email with sample resources
    print("[TEST 2] Sending test diagnostic results email...")

    sample_resources = {
        "Newton's Laws": {
            'khan_academy_url': 'https://www.khanacademy.org/science/physics/forces-newtons-laws',
            'textbook_pages': '120-145',
            'description': 'Review Newton\'s three laws of motion'
        },
        "Projectile Motion": {
            'khan_academy_url': 'https://www.khanacademy.org/science/physics/two-dimensional-motion',
            'textbook_pages': '85-105',
            'description': 'Study 2D motion and projectile trajectories'
        }
    }

    result = await email_service.send_diagnostic_results(
        student_email="test@example.com",  # Change this to your test email
        student_name="Test Student",
        score_percentage=65.0,
        correct_answers=13,
        total_questions=20,
        weak_topics_resources=sample_resources
    )

    if result['success']:
        print(f"✓ Test email sent successfully to {result['to']}\n")
    else:
        print(f"✗ Failed to send test email: {result.get('error', 'Unknown')}\n")

    print("="*70)
    print("TEST COMPLETE")
    print("="*70 + "\n")


if __name__ == "__main__":
    try:
        asyncio.run(test_email_service())
    except KeyboardInterrupt:
        print("\n\nTest cancelled.")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
