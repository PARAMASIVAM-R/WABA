import requests
import os
from dotenv import load_dotenv

load_dotenv()

PHONE_NUMBER_ID = os.getenv('WHATSAPP_PHONE_NUMBER_ID')
ACCESS_TOKEN = os.getenv('WHATSAPP_ACCESS_TOKEN')
API_URL = f'https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages'

def send_whatsapp_message(to, message):
    """Send text message via WhatsApp Business API"""
    try:
        response = requests.post(
            API_URL,
            headers={
                'Authorization': f'Bearer {ACCESS_TOKEN}',
                'Content-Type': 'application/json'
            },
            json={
                'messaging_product': 'whatsapp',
                'to': to,
                'type': 'text',
                'text': {'body': message}
            }
        )
        response.raise_for_status()
        print(f"✅ Sent to {to}: {message[:50]}...")
        return True
    except Exception as e:
        print(f"❌ Error sending message: {e}")
        return False
