#!/usr/bin/env python
"""Test token verification"""
import sys
sys.path.insert(0, '/app')

from app.services.security import create_access_token, verify_token
from jose import jwt, JWTError
import os
from datetime import datetime, timezone

token = create_access_token({'sub': '123'})
print(f'Token created: {token[:50]}...')

# Try to verify
secret = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
print(f'Secret being used: {secret}')

try:
    # First, decode without verification to see what's in it
    import base64
    parts = token.split('.')
    if len(parts) == 3:
        # Decode payload
        payload_b64 = parts[1]
        # Add padding if necessary
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += '=' * padding
        payload_json = base64.urlsafe_b64decode(payload_b64).decode()
        print(f'Payload (unverified): {payload_json}')
        
        # Now try with jwt library
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        print(f'Decoded successfully: {payload}')
except JWTError as e:
    print(f'JWT Error: {e}')
except Exception as e:
    print(f'Error: {type(e).__name__}: {e}')
    import traceback
    traceback.print_exc()

# Now test verify_token function
print('\nTesting verify_token function:')
result = verify_token(token)
print(f'verify_token result: {result}')
