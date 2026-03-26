# Dinnerly: Users + Privacy + Event Sharing Implementation

## Summary of Changes

This implementation adds complete authentication, privacy controls, and event sharing functionality to Dinnerly. Users can now register, log in, own recipes and events, and share events with participants.

---

## Backend Changes

### 1. Database Models

#### Created/Updated Files:
- **`backend/app/db/models/user.py`** - User model with email, password_hash, display_name
- **`backend/app/db/models/event_member.py`** - EventMember model for participants (already existed, verified)
- **`backend/app/db/models/recipe.py`** - Added `owner_user_id` FK to users
- **`backend/app/db/models/event.py`** - Added `owner_user_id` FK to users, added `members` relationship
- **`backend/app/db/models/__init__.py`** - Exported User and EventMember

### 2. Authentication & Security

#### Created/Updated Files:
- **`backend/app/services/security.py`** - Password hashing (bcrypt) and JWT token creation/verification
- **`backend/app/schemas/auth.py`** - AuthResponse, RegisterRequest, LoginRequest, UserRead, EventMemberRead schemas
- **`backend/app/crud/users.py`** - User CRUD: create_user, get_user_by_email, get_user_by_id, claim_invites_for_user
- **`backend/app/api/deps.py`** - get_current_user dependency, is_event_owner, is_event_member helpers

### 3. Routes

#### Created/Updated Files:
- **`backend/app/routes/auth.py`** - POST /register, POST /login, GET /me endpoints
- **`backend/app/routes/recipes.py`** - Added auth requirement and owner filtering to all endpoints
- **`backend/app/routes/events.py`** - Added auth, owner filtering, participant management:
  - POST /participants (add participant - owner only)
  - GET /participants (list participants)
  - DELETE /participants/{member_id} (remove participant - owner only)
- **`backend/app/api/router.py`** - Added auth router to main API

### 4. CRUD Operations

#### Updated Files:
- **`backend/app/crud/recipes.py`** - Added owner_user_id parameter to all operations
- **`backend/app/crud/events.py`** - Added owner filtering and participant checking
  - list_events_for_user: events where user is owner OR active participant
  - get_event_for_user: only if owner or active participant
  - create_event: automatically adds owner as EventMember with role="owner"
- **`backend/app/crud/event_members.py`** - Participant management functions

### 5. Main Application

#### Updated Files:
- **`backend/app/main.py`** - Added User and EventMember to model imports for create_all
- **`backend/requirements.txt`** - Added: passlib[bcrypt], python-jose[cryptography], python-multipart

---

## Frontend Changes

### 1. API & HTTP Layer

#### Updated Files:
- **`frontend/src/api/http.ts`** - Added token storage/retrieval (localStorage):
  - getAccessToken(), setAccessToken(), clearAccessToken()
  - Auto-attach Authorization header
  - Handle 401 redirects to /login
- **`frontend/src/api/auth.ts`** - Register/login/me functions with automatic token storage
- **`frontend/src/api/events.ts`** - Added participant functions:
  - listParticipants(), addParticipant(), removeParticipant()

### 2. Types

#### Updated Files:
- **`frontend/src/types/api.ts`** - Added auth types:
  - UserRead, RegisterRequest, LoginRequest, AuthResponse
  - EventMemberRead, ParticipantAddRequest
  - Updated EventRead to include members

### 3. Pages

#### Updated/Created Files:
- **`frontend/src/pages/Login.tsx`** - Login form with theme colors (already existed, enhanced styling)
- **`frontend/src/pages/Register.tsx`** - Register form with validation (already existed, enhanced styling)
- **`frontend/src/pages/EventDetails.tsx`** - Added participants section:
  - Display list of participants with role/status
  - Form to add participants (owner only)
  - Remove button (owner only)

### 4. Routing & Auth

#### Updated Files:
- **`frontend/src/routes/AppRouter.tsx`** - Route protection:
  - /login and /register (public)
  - All other routes protected via ProtectedRoute component
  - Redirect to /login if no token
- **`frontend/src/App.tsx`** - Enhanced AppBar:
  - User email display
  - Logout button (dropdown menu)
  - Conditional visibility (hidden on auth pages)
  - Auto-load current user on app start

---

## Authorization Rules Implemented

### Recipes
- **Create**: Requires auth; sets owner_user_id
- **List**: Filters to current user's recipes only
- **Read/Update/Delete**: Owner only (403 if not owner, 404 if not found)

### Events
- **Create**: Requires auth; sets owner_user_id; auto-adds owner as EventMember
- **List**: Returns events where user is owner OR active participant
- **Read**: Only if owner or active participant
- **Update/Delete**: Owner only
- **Attach Recipe**: Owner or active participant
- **Get Shopping List**: Owner or active participant

### Event Participants
- **Add Participant**: Owner only; stores invite if email not yet registered
- **List Participants**: Owner or any active participant
- **Remove Participant**: Owner only; cannot remove owner

### Invite Claiming
- When user registers with an email, automatically claims all pending invites
- Pending EventMember rows with status="invited" become status="active"

---

## API Changes Summary

### New Endpoints
```
POST   /api/auth/register          # RegisterRequest -> AuthResponse
POST   /api/auth/login             # LoginRequest -> AuthResponse
GET    /api/auth/me                # -> UserRead

POST   /api/events/{id}/participants        # ParticipantAddRequest -> EventMemberRead
GET    /api/events/{id}/participants        # -> EventMemberRead[]
DELETE /api/events/{id}/participants/{mid}  # Remove participant
```

### Modified Endpoints (now require auth)
- `POST /api/recipes` - Now sets owner_user_id
- `GET /api/recipes` - Now filters by owner only
- `GET /api/recipes/{id}` - Owner only
- `PUT /api/recipes/{id}` - Owner only
- `DELETE /api/recipes/{id}` - Owner only
- All `/api/events` endpoints - Auth required with filtering

### JWT Token Format
- Stored in localStorage as "accessToken"
- Sent in header: `Authorization: Bearer <token>`
- Contains: `{"sub": user_id, "exp": timestamp}`
- Expires: 24 hours (configurable via JWT_EXPIRES_MINUTES env var)

---

## Manual Verification Steps

### Backend Testing

1. **Register User A**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123","displayName":"Alice"}'
```
Response: `{user: {...}, accessToken: "..."}`

2. **Login User A**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'
```

3. **Get Current User**
```bash
TOKEN="<accessToken from step 1>"
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

4. **Create Recipe as User A**
```bash
curl -X POST http://localhost:8000/api/recipes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pasta",
    "baseServings": 4,
    "ingredients": [
      {"name": "Pasta", "quantity": 400, "unit": "g", "optional": false}
    ]
  }'
```

5. **Create Event as User A**
```bash
curl -X POST http://localhost:8000/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Dinner Party","targetServings":8}'
```
Event ID will be used as `{event_id}` below.

6. **Add Bob as Participant (Bob not yet registered)**
```bash
curl -X POST http://localhost:8000/api/events/{event_id}/participants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@example.com"}'
```
Response: EventMember with status="invited"

7. **Register User B (Bob) with same email**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@example.com","password":"pass456","displayName":"Bob"}'
```
Bob's invite should automatically become status="active"

8. **Login as Bob**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@example.com","password":"pass456"}'
```
Save this token as BOB_TOKEN.

9. **Bob Lists Events (should include shared event)**
```bash
curl -X GET http://localhost:8000/api/events \
  -H "Authorization: Bearer $BOB_TOKEN"
```

10. **Bob Views Shared Event Details**
```bash
curl -X GET http://localhost:8000/api/events/{event_id} \
  -H "Authorization: Bearer $BOB_TOKEN"
```

11. **Bob Attaches Recipe to Event**
```bash
curl -X POST http://localhost:8000/api/events/{event_id}/recipes \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipeId": 1, "desiredServings": 8}'
```

12. **Bob Gets Shopping List**
```bash
curl -X GET http://localhost:8000/api/events/{event_id}/shopping-list \
  -H "Authorization: Bearer $BOB_TOKEN"
```

13. **Bob Lists Participants**
```bash
curl -X GET http://localhost:8000/api/events/{event_id}/participants \
  -H "Authorization: Bearer $BOB_TOKEN"
```

14. **Bob Tries to Delete Event (should fail 404/access denied)**
```bash
curl -X DELETE http://localhost:8000/api/events/{event_id} \
  -H "Authorization: Bearer $BOB_TOKEN"
```
Expected: 404 or 403 error

15. **Alice Lists Participants and Removes Bob (owner only)**
```bash
curl -X GET http://localhost:8000/api/events/{event_id}/participants \
  -H "Authorization: Bearer $ALICE_TOKEN"

# Get Bob's member ID from response, then:
curl -X DELETE http://localhost:8000/api/events/{event_id}/participants/{bob_member_id} \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

### Frontend Testing

1. **Visit http://localhost:5173**
   - Should redirect to /login (no token)

2. **Click "Register here" or navigate to /register**
   - Register new user
   - Should redirect to home and show user email in AppBar

3. **Click logout**
   - Token cleared, redirected to /login

4. **Login again**
   - Navigate to home, create recipe, create event

5. **Create Event and Add Participant**
   - Open EventDetails
   - Scroll to "Participants" section
   - Enter another user's email (or email for unregistered user)
   - Click "Add"

6. **Test Participant Invite Claim**
   - Register with the invited email
   - Login with new account
   - Go to Home - should see the shared event
   - Open EventDetails - should see participants list

---

## Database Notes

⚠️ **Important**: Because we are NOT using Alembic migrations, the local database may need to be reset when adding new columns or tables.

To reset in development:
```bash
# Docker approach (if using docker-compose)
docker-compose down -v  # Remove volumes
docker-compose up --build

# Or manually drop/recreate database in PostgreSQL
# Then restart backend
```

If schema conflicts occur, you may need to manually:
```sql
ALTER TABLE recipes ADD COLUMN owner_user_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE events ADD COLUMN owner_user_id INTEGER NOT NULL DEFAULT 1;
CREATE TABLE users (...);
CREATE TABLE event_members (...);
```

---

## Files Created/Modified Summary

### Backend Files
| File | Type | Status |
|------|------|--------|
| `backend/requirements.txt` | Modified | Added passlib, python-jose, python-multipart |
| `backend/app/db/models/user.py` | Existing | Verified structure |
| `backend/app/db/models/event_member.py` | Existing | Verified structure |
| `backend/app/db/models/recipe.py` | Modified | Added owner_user_id |
| `backend/app/db/models/event.py` | Modified | Added owner_user_id, members relationship |
| `backend/app/db/models/__init__.py` | Modified | Added User, EventMember exports |
| `backend/app/services/security.py` | Created | Password hashing & JWT |
| `backend/app/schemas/auth.py` | Modified | Auth schemas (already existed) |
| `backend/app/crud/users.py` | Modified | User operations |
| `backend/app/crud/event_members.py` | Modified | Participant functions |
| `backend/app/crud/recipes.py` | Modified | Added owner filtering |
| `backend/app/crud/events.py` | Modified | Added user filtering & ownership |
| `backend/app/api/deps.py` | Modified | Auth dependencies |
| `backend/app/routes/auth.py` | Modified | Auth endpoints (already existed) |
| `backend/app/routes/recipes.py` | Modified | Added auth requirement |
| `backend/app/routes/events.py` | Modified | Added auth & participant routes |
| `backend/app/api/router.py` | Modified | Added auth router |
| `backend/app/main.py` | Modified | Added User/EventMember imports |

### Frontend Files
| File | Type | Status |
|------|------|--------|
| `frontend/src/api/http.ts` | Modified | Token management & auth header |
| `frontend/src/api/auth.ts` | Modified | Auth functions (already existed) |
| `frontend/src/api/events.ts` | Modified | Added participant functions |
| `frontend/src/types/api.ts` | Modified | Added auth & participant types |
| `frontend/src/pages/Login.tsx` | Modified | Theme color enhancement |
| `frontend/src/pages/Register.tsx` | Modified | Theme color enhancement |
| `frontend/src/pages/EventDetails.tsx` | Modified | Added participants section |
| `frontend/src/routes/AppRouter.tsx` | Modified | Route protection logic |
| `frontend/src/App.tsx` | Modified | Auth state, user display, logout |

---

## Configuration

### Environment Variables (Backend)
```bash
JWT_SECRET_KEY=your-secret-key-here  # Default: dev-secret-key-change-in-production
JWT_ALGORITHM=HS256                   # Default: HS256
JWT_EXPIRES_MINUTES=1440              # Default: 1440 (24 hours)
AUTO_CREATE_TABLES=true               # Default: true
```

### Frontend
- Token stored in `localStorage.accessToken`
- No additional config needed

---

## Security Considerations

1. **Passwords**: Hashed with bcrypt (72-byte limit handled by passlib)
2. **JWT Tokens**: 
   - Stored in localStorage (not HttpOnly - app is SPA)
   - No refresh token (MVP simplification)
   - 24-hour expiration default
3. **Authorization**: Role-based (owner/participant) and ownership checks
4. **Email Validation**: Uses Pydantic EmailStr
5. **CORS**: Configure as needed in production

---

## Known Limitations

1. **No email sending** - Invites are stored but no notification sent
2. **No refresh token** - Users must re-login after token expires
3. **localStorage token** - Vulnerable to XSS; use HttpOnly cookies in production
4. **No role hierarchy** - Only "owner" and "participant" roles
5. **No audit logging** - No track of who added/removed participants
6. **Delete recipe from event** - TODO: Add endpoint to remove recipe without deleting it globally

---

## Next Steps (Future Enhancements)

1. Add email notifications for invites
2. Implement refresh token rotation
3. Add HttpOnly cookie support
4. Add user profile page
5. Add recipe sharing (separate from events)
6. Add event comments/notes
7. Add recipe ratings/reviews
8. Add dietary preference filters
9. Add pagination for large lists
10. Add proper error recovery UI

---

**Implementation completed**: March 26, 2026
**Status**: Ready for testing and deployment
