import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.email_service import email_service
from app.core.config import settings

def send_test_email():
    print(f"Connecting to SMTP host: {settings.SMTP_HOST}:{settings.SMTP_PORT}")
    print(f"Sender: {settings.EMAILS_FROM_EMAIL}")
    print(f"Recipient: {settings.EMAILS_FROM_EMAIL}")
    
    res = email_service.send_email(
        recipient_emails=[settings.EMAILS_FROM_EMAIL],
        subject="AI Meeting Intelligence - Live Email Notification Test",
        html_content="""
        <div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px;">
            <h2 style="color: #4f46e5;">AI Meeting Intelligence Notification</h2>
            <p>This is a live test email confirming that SMTP email dispatch is working!</p>
            <p>Timestamp: Automated System Verification</p>
        </div>
        """,
        text_content="AI Meeting Intelligence Notification: Live email test successful."
    )
    
    print("Result Mode:", res.get("mode"))
    print("Success:", res.get("success"))
    print("Message:", res.get("message"))
    if "error" in res:
        print("Error Details:", res["error"])

if __name__ == "__main__":
    send_test_email()
