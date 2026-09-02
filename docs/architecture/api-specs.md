# Trello Backend REST API Specification

## 1. Overview

This document defines the REST API contract for the Trello-like project management backend.

The API is implemented using Python and FastAPI and follows a resource-oriented REST architecture.

### Base URL

```text
/api/v1
```

### Authentication

Protected endpoints require:

```http
Authorization: Bearer <access_token>
```

Authentication uses JWT Bearer access tokens.

### Content Type

JSON requests use:

```http
Content-Type: application/json
```

File upload endpoints use:

```http
Content-Type: multipart/form-data
```

---

# 2. HTTP Status Codes

| Status Code | Meaning |
|---|---|
| 200 | Successful request |
| 201 | Resource successfully created |
| 204 | Successful request with no response body |
| 400 | Invalid business operation |
| 401 | Missing or invalid authentication |
| 403 | Authenticated but insufficient permissions |
| 404 | Resource not found |
| 409 | Resource conflict |
| 422 | Request validation failed |
| 500 | Internal server error |

---

# 3. Authentication API

## 3.1 Register

```http
POST /api/v1/auth/register
```

### Authentication

None.

### Request

```json
{
    "email": "ahmed@example.com",
    "password": "StrongPassword123!",
    "full_name": "Ahmed Khan"
}
```

### Response — 201 Created

```json
{
    "id": "uuid",
    "email": "ahmed@example.com",
    "full_name": "Ahmed Khan",
    "created_at": "2026-09-02T10:00:00Z",
    "updated_at": "2026-09-02T10:00:00Z"
}
```

### Errors

```text
409 Conflict
```

Email already exists.

```text
422 Unprocessable Entity
```

Invalid email or password does not satisfy validation rules.

### Business Rules

- Email must be unique.
- Password must never be stored in plaintext.
- Password is hashed before persistence.
- `hashed_password` is never returned in API responses.

---

## 3.2 Login

```http
POST /api/v1/auth/login
```

### Authentication

None.

### Request

```json
{
    "email": "ahmed@example.com",
    "password": "StrongPassword123!"
}
```

### Response — 200 OK

```json
{
    "access_token": "jwt-token",
    "token_type": "bearer"
}
```

### Errors

```text
401 Unauthorized
```

Invalid email or password.

### Implementation Note

This API intentionally uses JSON rather than FastAPI's `OAuth2PasswordRequestForm`.

The application should use a Pydantic request schema such as:

```text
LoginRequest
    email
    password
```

`OAuth2PasswordBearer` may still be used for extracting the Bearer token from protected requests.

---

## 3.3 Get Current User

```http
GET /api/v1/auth/me
```

### Authentication

Required.

### Response — 200 OK

```json
{
    "id": "uuid",
    "email": "ahmed@example.com",
    "full_name": "Ahmed Khan",
    "created_at": "2026-09-02T10:00:00Z",
    "updated_at": "2026-09-02T10:00:00Z"
}
```

---

# 4. Workspace API

## 4.1 Create Workspace

```http
POST /api/v1/workspaces
```

### Authentication

Required.

### Request

```json
{
    "name": "My Company",
    "description": "Company project workspace"
}
```

### Response — 201 Created

```json
{
    "id": "uuid",
    "owner_id": "uuid",
    "name": "My Company",
    "description": "Company project workspace",
    "created_at": "2026-09-02T10:00:00Z",
    "updated_at": "2026-09-02T10:00:00Z"
}
```

### Business Rules

The authenticated user automatically becomes:

```text
owner_id = current_user.id
```

and receives:

```text
WORKSPACE_MEMBERS.role = ADMIN
```

Workspace creation and initial membership creation must occur within one database transaction.

---

## 4.2 List My Workspaces

```http
GET /api/v1/workspaces
```

### Authentication

Required.

### Response — 200 OK

```json
[
    {
        "id": "uuid",
        "name": "My Company",
        "role": "ADMIN"
    }
]
```

Only workspaces in which the authenticated user is an active member are returned.

---

## 4.3 Get Workspace

```http
GET /api/v1/workspaces/{workspace_id}
```

### Permission

Workspace member.

### Response — 200 OK

```json
{
    "id": "uuid",
    "owner_id": "uuid",
    "name": "My Company",
    "description": "Company project workspace",
    "created_at": "2026-09-02T10:00:00Z",
    "updated_at": "2026-09-02T10:00:00Z"
}
```

---

## 4.4 Update Workspace

```http
PATCH /api/v1/workspaces/{workspace_id}
```

### Permission

```text
Workspace ADMIN
```

### Request

```json
{
    "name": "Updated Workspace",
    "description": "Updated description"
}
```

Both fields are optional.

### Response — 200 OK

```json
{
    "id": "uuid",
    "owner_id": "uuid",
    "name": "Updated Workspace",
    "description": "Updated description",
    "created_at": "2026-09-02T10:00:00Z",
    "updated_at": "2026-09-02T11:00:00Z"
}
```

---

## 4.5 Delete Workspace

```http
DELETE /api/v1/workspaces/{workspace_id}
```

### Permission

```text
Workspace ADMIN
```

### Response

```text
204 No Content
```

---

# 5. Workspace Members

## 5.1 List Members

```http
GET /api/v1/workspaces/{workspace_id}/members
```

### Permission

```text
Workspace member
```

### Response — 200 OK

```json
[
    {
        "user_id": "uuid",
        "full_name": "Ahmed Khan",
        "email": "ahmed@example.com",
        "role": "ADMIN",
        "joined_at": "2026-09-02T10:00:00Z"
    }
]
```

---

## 5.2 Change Member Role

```http
PATCH /api/v1/workspaces/{workspace_id}/members/{user_id}
```

### Permission

```text
Workspace ADMIN
```

### Request

```json
{
    "role": "MEMBER"
}
```

### Response — 200 OK

```json
{
    "user_id": "uuid",
    "full_name": "Ali Khan",
    "email": "ali@example.com",
    "role": "MEMBER",
    "joined_at": "2026-09-02T10:00:00Z"
}
```

### Business Rules

- Only Workspace ADMIN can change roles.
- Workspace owner cannot be demoted while remaining the owner.
- Workspace must always have an appropriate administrator.

---

## 5.3 Remove Member

```http
DELETE /api/v1/workspaces/{workspace_id}/members/{user_id}
```

### Permission

```text
Workspace ADMIN
```

### Response

```text
204 No Content
```

### Business Rules

Removing a workspace member does not automatically delete the user account.

Board memberships belonging to that user must be handled according to the application's membership policy.

---

# 6. Workspace Invitations

## 6.1 Create Invitation

```http
POST /api/v1/workspaces/{workspace_id}/invitations
```

### Permission

```text
Workspace ADMIN
```

### Request

```json
{
    "email": "ali@example.com",
    "role": "MEMBER"
}
```

### Response — 201 Created

```json
{
    "id": "uuid",
    "email": "ali@example.com",
    "role": "MEMBER",
    "status": "PENDING",
    "expires_at": "2026-09-09T10:00:00Z",
    "created_at": "2026-09-02T10:00:00Z"
}
```

### Business Rules

- Invitation token is generated server-side.
- Invitation status starts as `PENDING`.
- Invitation must have an expiration time.
- A pending invitation for the same workspace and email cannot be duplicated.
- `invited_by` is set to the authenticated user's ID.

---

## 6.2 Accept Invitation

```http
POST /api/v1/invitations/{token}/accept
```

### Authentication

Required.

### Response — 200 OK

```json
{
    "workspace_id": "uuid",
    "user_id": "uuid",
    "role": "MEMBER",
    "status": "ACCEPTED",
    "joined_at": "2026-09-02T11:00:00Z"
}
```

### Business Rules

1. Token must exist.
2. Token must have status `PENDING`.
3. Token must not be expired.
4. Authenticated user's email must match the invitation email.
5. User becomes a workspace member.
6. Invitation status becomes `ACCEPTED`.
7. Membership creation and invitation update occur in one transaction.

### Errors

```text
404 Not Found
```

Invitation does not exist.

```text
400 Bad Request
```

Invitation expired, revoked, or already accepted.

```text
403 Forbidden
```

Authenticated user's email does not match the invitation.

---

## 6.3 Revoke Invitation

```http
DELETE /api/v1/workspaces/{workspace_id}/invitations/{invitation_id}
```

### Permission

```text
Workspace ADMIN
```

### Response

```text
204 No Content
```

### Business Rule

The invitation status becomes:

```text
REVOKED
```

The invitation record is retained.

---

# 7. Board API

## 7.1 Create Board

```http
POST /api/v1/workspaces/{workspace_id}/boards
```

### Permission

```text
Workspace ADMIN
Workspace MEMBER
```

### Request

```json
{
    "title": "Website Development",
    "visibility": "WORKSPACE"
}
```

### Response — 201 Created

```json
{
    "id": "uuid",
    "workspace_id": "uuid",
    "created_by": "uuid",
    "title": "Website Development",
    "visibility": "WORKSPACE",
    "is_archived": false,
    "created_at": "2026-09-02T10:00:00Z",
    "updated_at": "2026-09-02T10:00:00Z"
}
```

### Business Rules

The creator is automatically added to:

```text
BOARD_MEMBERS
role = ADMIN
```

Board creation and initial board membership creation must occur in one transaction.

---

## 7.2 List Workspace Boards

```http
GET /api/v1/workspaces/{workspace_id}/boards
```

### Permission

```text
Workspace member
```

### Response — 200 OK

Returns boards visible to the authenticated user according to board visibility and RBAC rules.

```json
[
    {
        "id": "uuid",
        "title": "Website Development",
        "visibility": "WORKSPACE",
        "is_archived": false
    }
]
```

Archived boards are excluded by default.

Optional query parameter:

```http
GET /api/v1/workspaces/{workspace_id}/boards?include_archived=true
```

---

## 7.3 Get Board

```http
GET /api/v1/boards/{board_id}
```

### Permission

Must satisfy the board visibility rules.

### Default Response — 200 OK

```json
{
    "id": "uuid",
    "workspace_id": "uuid",
    "created_by": "uuid",
    "title": "Website Development",
    "visibility": "WORKSPACE",
    "is_archived": false,
    "created_at": "2026-09-02T10:00:00Z",
    "updated_at": "2026-09-02T10:00:00Z"
}
```

### Board Hydration

The client may request nested lists and cards:

```http
GET /api/v1/boards/{board_id}?include=lists,cards
```

### Hydrated Response

```json
{
    "id": "uuid",
    "workspace_id": "uuid",
    "title": "Website Development",
    "visibility": "WORKSPACE",
    "is_archived": false,
    "lists": [
        {
            "id": "uuid",
            "title": "To Do",
            "position": 1000.0,
            "is_archived": false,
            "cards": [
                {
                    "id": "uuid",
                    "title": "Implement Login",
                    "description": "Create JWT authentication",
                    "position": 1000.0,
                    "is_completed": false,
                    "is_archived": false,
                    "labels": []
                }
            ]
        }
    ]
}
```

This avoids requiring the frontend to perform an HTTP request for every list.

---

## 7.4 Update Board

```http
PATCH /api/v1/boards/{board_id}
```

### Permission

```text
Board ADMIN
Workspace ADMIN
```

### Request

```json
{
    "title": "Website Development V2",
    "visibility": "PRIVATE"
}
```

### Response — 200 OK

```json
{
    "id": "uuid",
    "workspace_id": "uuid",
    "created_by": "uuid",
    "title": "Website Development V2",
    "visibility": "PRIVATE",
    "is_archived": false,
    "created_at": "2026-09-02T10:00:00Z",
    "updated_at": "2026-09-02T11:00:00Z"
}
```

---

## 7.5 Archive Board

```http
POST /api/v1/boards/{board_id}/archive
```

### Permission

```text
Board ADMIN
Workspace ADMIN
```

### Response — 200 OK

```json
{
    "id": "uuid",
    "is_archived": true,
    "updated_at": "2026-09-02T11:00:00Z"
}
```

---

## 7.6 Unarchive Board

```http
POST /api/v1/boards/{board_id}/unarchive
```

### Permission

```text
Board ADMIN
Workspace ADMIN
```

### Response — 200 OK

```json
{
    "id": "uuid",
    "is_archived": false,
    "updated_at": "2026-09-02T11:30:00Z"
}
```

---

## 7.7 Delete Board

```http
DELETE /api/v1/boards/{board_id}
```

### Permission

```text
Board ADMIN
Workspace ADMIN
```

### Response

```text
204 No Content
```

---

# 8. Board Members

## 8.1 List Board Members

```http
GET /api/v1/boards/{board_id}/members
```

### Permission

```text
Board member
Workspace ADMIN
```

### Response — 200 OK

```json
[
    {
        "user_id": "uuid",
        "full_name": "Ahmed Khan",
        "email": "ahmed@example.com",
        "role": "ADMIN",
        "joined_at": "2026-09-02T10:00:00Z"
    }
]
```

---

## 8.2 Add Board Member

```http
POST /api/v1/boards/{board_id}/members
```

### Permission

```text
Board ADMIN
Workspace ADMIN
```

### Request

```json
{
    "user_id": "uuid",
    "role": "MEMBER"
}
```

### Response — 201 Created

```json
{
    "user_id": "uuid",
    "role": "MEMBER",
    "joined_at": "2026-09-02T11:00:00Z"
}
```

### Business Rules

- User must exist.
- User must be a member of the board's parent workspace.
- User cannot be added twice.
- Role must be `ADMIN`, `MEMBER`, or `OBSERVER`.

---

## 8.3 Change Board Member Role

```http
PATCH /api/v1/boards/{board_id}/members/{user_id}
```

### Permission

```text
Board ADMIN
Workspace ADMIN
```

### Request

```json
{
    "role": "OBSERVER"
}
```

### Response — 200 OK

```json
{
    "user_id": "uuid",
    "role": "OBSERVER",
    "joined_at": "2026-09-02T10:00:00Z"
}
```

---

## 8.4 Remove Board Member

```http
DELETE /api/v1/boards/{board_id}/members/{user_id}
```

### Permission

```text
Board ADMIN
Workspace ADMIN
```

### Response

```text
204 No Content
```

---

# 9. List API

## 9.1 Create List

```http
POST /api/v1/boards/{board_id}/lists
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Request

```json
{
    "title": "To Do"
}
```

### Response — 201 Created

```json
{
    "id": "uuid",
    "board_id": "uuid",
    "title": "To Do",
    "position": 1000.0,
    "is_archived": false,
    "created_at": "2026-09-02T10:00:00Z",
    "updated_at": "2026-09-02T10:00:00Z"
}
```

Position is assigned by the backend.

---

## 9.2 List Board Lists

```http
GET /api/v1/boards/{board_id}/lists
```

### Permission

Board visibility rules apply.

### Response — 200 OK

Lists are ordered by:

```text
position ASC
```

Example:

```json
[
    {
        "id": "uuid",
        "board_id": "uuid",
        "title": "To Do",
        "position": 1000.0,
        "is_archived": false
    },
    {
        "id": "uuid",
        "board_id": "uuid",
        "title": "In Progress",
        "position": 2000.0,
        "is_archived": false
    }
]
```

---

## 9.3 Update List

```http
PATCH /api/v1/lists/{list_id}
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Request

```json
{
    "title": "In Progress"
}
```

### Response — 200 OK

```json
{
    "id": "uuid",
    "board_id": "uuid",
    "title": "In Progress",
    "position": 1000.0,
    "is_archived": false,
    "created_at": "2026-09-02T10:00:00Z",
    "updated_at": "2026-09-02T11:00:00Z"
}
```

---

## 9.4 Move List

```http
PATCH /api/v1/lists/{list_id}/move
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Request

```json
{
    "target_position": 2500.0
}
```

### Response — 200 OK

```json
{
    "id": "uuid",
    "board_id": "uuid",
    "title": "In Progress",
    "position": 2500.0,
    "is_archived": false,
    "updated_at": "2026-09-02T11:00:00Z"
}
```

### Business Rules

- List must exist.
- User must have list-edit permission.
- List must not be archived.
- Position must be valid.
- Position update and corresponding activity log should occur atomically.

---

## 9.5 Archive List

```http
POST /api/v1/lists/{list_id}/archive
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Response — 200 OK

```json
{
    "id": "uuid",
    "is_archived": true,
    "updated_at": "2026-09-02T11:00:00Z"
}
```

---

## 9.6 Unarchive List

```http
POST /api/v1/lists/{list_id}/unarchive
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Response — 200 OK

```json
{
    "id": "uuid",
    "is_archived": false,
    "updated_at": "2026-09-02T11:30:00Z"
}
```

---

## 9.7 Delete List

```http
DELETE /api/v1/lists/{list_id}
```

### Permission

```text
Board ADMIN
Workspace ADMIN
```

### Response

```text
204 No Content
```

---

# 10. Card API

## 10.1 Create Card

```http
POST /api/v1/lists/{list_id}/cards
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Request

```json
{
    "title": "Implement Login API",
    "description": "Create JWT authentication endpoints",
    "due_date": "2026-09-10T18:00:00Z"
}
```

### Response — 201 Created

```json
{
    "id": "uuid",
    "list_id": "uuid",
    "created_by": "uuid",
    "title": "Implement Login API",
    "description": "Create JWT authentication endpoints",
    "position": 1000.0,
    "due_date": "2026-09-10T18:00:00Z",
    "is_completed": false,
    "is_archived": false,
    "labels": [],
    "created_at": "2026-09-02T10:00:00Z",
    "updated_at": "2026-09-02T10:00:00Z"
}
```

---

## 10.2 Get Card

```http
GET /api/v1/cards/{card_id}
```

### Permission

Board visibility rules apply.

### Response — 200 OK

```json
{
    "id": "uuid",
    "list_id": "uuid",
    "created_by": "uuid",
    "title": "Implement Login API",
    "description": "Create JWT authentication endpoints",
    "position": 1000.0,
    "due_date": "2026-09-10T18:00:00Z",
    "is_completed": false,
    "is_archived": false,
    "labels": [
        {
            "id": "uuid",
            "name": "Bug",
            "color": "#FF0000"
        }
    ],
    "created_at": "2026-09-02T10:00:00Z",
    "updated_at": "2026-09-02T10:00:00Z"
}
```

---

## 10.3 Update Card

```http
PATCH /api/v1/cards/{card_id}
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Request

```json
{
    "title": "Implement JWT Login",
    "description": "Updated description",
    "due_date": "2026-09-12T18:00:00Z"
}
```

All fields are optional.

### Response — 200 OK

```json
{
    "id": "uuid",
    "list_id": "uuid",
    "created_by": "uuid",
    "title": "Implement JWT Login",
    "description": "Updated description",
    "position": 1000.0,
    "due_date": "2026-09-12T18:00:00Z",
    "is_completed": false,
    "is_archived": false,
    "labels": [],
    "created_at": "2026-09-02T10:00:00Z",
    "updated_at": "2026-09-02T11:00:00Z"
}
```

---

## 10.4 Move Card

```http
PATCH /api/v1/cards/{card_id}/move
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Request

```json
{
    "target_list_id": "uuid",
    "target_position": 1500.0
}
```

### Response — 200 OK

```json
{
    "id": "uuid",
    "list_id": "uuid",
    "position": 1500.0,
    "updated_at": "2026-09-02T11:00:00Z"
}
```

### Business Rules

1. Card must exist.
2. Target list must exist.
3. User must have card-edit permission.
4. Card must not be archived.
5. Target list must not be archived.
6. Source and target lists must belong to the same board.
7. Cross-board movement is prohibited.
8. Card `list_id` is updated.
9. Card `position` is updated.
10. `CARD_MOVED` activity is recorded.
11. Card update and activity-log insertion occur in one database transaction.

---

## 10.5 Archive Card

```http
POST /api/v1/cards/{card_id}/archive
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Response — 200 OK

```json
{
    "id": "uuid",
    "is_archived": true,
    "updated_at": "2026-09-02T11:00:00Z"
}
```

---

## 10.6 Unarchive Card

```http
POST /api/v1/cards/{card_id}/unarchive
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Response — 200 OK

```json
{
    "id": "uuid",
    "is_archived": false,
    "updated_at": "2026-09-02T11:30:00Z"
}
```

---

## 10.7 Delete Card

```http
DELETE /api/v1/cards/{card_id}
```

### Permission

```text
Board ADMIN
Workspace ADMIN
```

### Response

```text
204 No Content
```

---

# 11. Card Members

## 11.1 Assign User

```http
POST /api/v1/cards/{card_id}/members
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Request

```json
{
    "user_id": "uuid"
}
```

### Response — 201 Created

```json
{
    "user_id": "uuid",
    "assigned_at": "2026-09-02T11:00:00Z"
}
```

### Business Rules

- User must exist.
- User must have access to the board.
- Duplicate card membership is prohibited.

---

## 11.2 List Card Members

```http
GET /api/v1/cards/{card_id}/members
```

### Permission

Board visibility rules apply.

### Response — 200 OK

```json
[
    {
        "user_id": "uuid",
        "full_name": "Ali Khan",
        "email": "ali@example.com",
        "assigned_at": "2026-09-02T11:00:00Z"
    }
]
```

---

## 11.3 Remove Card Member

```http
DELETE /api/v1/cards/{card_id}/members/{user_id}
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Response

```text
204 No Content
```

---

# 12. Labels

## 12.1 Create Label

```http
POST /api/v1/boards/{board_id}/labels
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Request

```json
{
    "name": "Bug",
    "color": "#FF0000"
}
```

### Response — 201 Created

```json
{
    "id": "uuid",
    "board_id": "uuid",
    "name": "Bug",
    "color": "#FF0000",
    "created_at": "2026-09-02T10:00:00Z",
    "updated_at": "2026-09-02T10:00:00Z"
}
```

---

## 12.2 List Labels

```http
GET /api/v1/boards/{board_id}/labels
```

### Permission

Board visibility rules apply.

### Response — 200 OK

```json
[
    {
        "id": "uuid",
        "name": "Bug",
        "color": "#FF0000"
    }
]
```

---

## 12.3 Update Label

```http
PATCH /api/v1/labels/{label_id}
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Request

```json
{
    "name": "Critical Bug",
    "color": "#CC0000"
}
```

### Response — 200 OK

```json
{
    "id": "uuid",
    "board_id": "uuid",
    "name": "Critical Bug",
    "color": "#CC0000",
    "created_at": "2026-09-02T10:00:00Z",
    "updated_at": "2026-09-02T11:00:00Z"
}
```

---

## 12.4 Delete Label

```http
DELETE /api/v1/labels/{label_id}
```

### Permission

```text
Board ADMIN
Workspace ADMIN
```

### Response

```text
204 No Content
```

---

## 12.5 Apply Label to Card

```http
POST /api/v1/cards/{card_id}/labels/{label_id}
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Response — 201 Created

```json
{
    "card_id": "uuid",
    "label_id": "uuid"
}
```

### Business Rules

- Card must exist.
- Label must exist.
- Card and label must belong to the same board.
- Duplicate card-label relationships are prohibited.

---

## 12.6 Remove Label from Card

```http
DELETE /api/v1/cards/{card_id}/labels/{label_id}
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Response

```text
204 No Content
```

---

# 13. Checklist API

## 13.1 Create Checklist

```http
POST /api/v1/cards/{card_id}/checklists
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Request

```json
{
    "title": "Authentication Tasks"
}
```

### Response — 201 Created

```json
{
    "id": "uuid",
    "card_id": "uuid",
    "title": "Authentication Tasks",
    "position": 1000.0,
    "created_at": "2026-09-02T10:00:00Z",
    "updated_at": "2026-09-02T10:00:00Z"
}
```

---

## 13.2 List Checklists

```http
GET /api/v1/cards/{card_id}/checklists
```

### Permission

Board visibility rules apply.

### Response — 200 OK

```json
[
    {
        "id": "uuid",
        "card_id": "uuid",
        "title": "Authentication Tasks",
        "position": 1000.0
    }
]
```

---

## 13.3 Update Checklist

```http
PATCH /api/v1/checklists/{checklist_id}
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Request

```json
{
    "title": "Updated Authentication Tasks"
}
```

### Response — 200 OK

```json
{
    "id": "uuid",
    "card_id": "uuid",
    "title": "Updated Authentication Tasks",
    "position": 1000.0,
    "updated_at": "2026-09-02T11:00:00Z"
}
```

---

## 13.4 Delete Checklist

```http
DELETE /api/v1/checklists/{checklist_id}
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Response

```text
204 No Content
```

---

# 14. Checklist Items

## 14.1 Create Item

```http
POST /api/v1/checklists/{checklist_id}/items
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Request

```json
{
    "content": "Create password hashing service"
}
```

### Response — 201 Created

```json
{
    "id": "uuid",
    "checklist_id": "uuid",
    "content": "Create password hashing service",
    "is_completed": false,
    "position": 1000.0,
    "created_at": "2026-09-02T10:00:00Z",
    "updated_at": "2026-09-02T10:00:00Z"
}
```

---

## 14.2 Update Item

```http
PATCH /api/v1/checklist-items/{item_id}
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Request

```json
{
    "content": "Implement bcrypt password hashing",
    "is_completed": true
}
```

### Response — 200 OK

```json
{
    "id": "uuid",
    "checklist_id": "uuid",
    "content": "Implement bcrypt password hashing",
    "is_completed": true,
    "position": 1000.0,
    "updated_at": "2026-09-02T11:00:00Z"
}
```

---

## 14.3 Delete Item

```http
DELETE /api/v1/checklist-items/{item_id}
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Response

```text
204 No Content
```

---

# 15. Comments

## 15.1 Add Comment

```http
POST /api/v1/cards/{card_id}/comments
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Request

```json
{
    "content": "Authentication endpoint is ready for testing."
}
```

### Response — 201 Created

```json
{
    "id": "uuid",
    "card_id": "uuid",
    "user_id": "uuid",
    "content": "Authentication endpoint is ready for testing.",
    "created_at": "2026-09-02T10:00:00Z",
    "updated_at": "2026-09-02T10:00:00Z"
}
```

---

## 15.2 List Comments

```http
GET /api/v1/cards/{card_id}/comments
```

### Permission

Board visibility rules apply.

### Response — 200 OK

```json
[
    {
        "id": "uuid",
        "user_id": "uuid",
        "content": "Authentication endpoint is ready for testing.",
        "created_at": "2026-09-02T10:00:00Z",
        "updated_at": "2026-09-02T10:00:00Z"
    }
]
```

---

## 15.3 Update Comment

```http
PATCH /api/v1/comments/{comment_id}
```

### Permission

```text
Comment author
Board ADMIN
Workspace ADMIN
```

### Request

```json
{
    "content": "Authentication endpoint is ready for review."
}
```

### Response — 200 OK

```json
{
    "id": "uuid",
    "card_id": "uuid",
    "user_id": "uuid",
    "content": "Authentication endpoint is ready for review.",
    "created_at": "2026-09-02T10:00:00Z",
    "updated_at": "2026-09-02T11:00:00Z"
}
```

---

## 15.4 Delete Comment

```http
DELETE /api/v1/comments/{comment_id}
```

### Permission

```text
Comment author
Board ADMIN
Workspace ADMIN
```

### Response

```text
204 No Content
```

---

# 16. Attachments

## 16.1 Upload Attachment

```http
POST /api/v1/cards/{card_id}/attachments
```

### Permission

```text
Board ADMIN
Board MEMBER
Workspace ADMIN
```

### Request

```http
Content-Type: multipart/form-data
```

```text
file=<uploaded-file>
```

### Response — 201 Created

```json
{
    "id": "uuid",
    "card_id": "uuid",
    "uploaded_by": "uuid",
    "file_name": "requirements.pdf",
    "file_url": "https://storage.example.com/...",
    "file_type": "application/pdf",
    "file_size": 245760,
    "created_at": "2026-09-02T10:00:00Z"
}
```

The actual storage provider is outside the scope of this API contract.

---

## 16.2 List Attachments

```http
GET /api/v1/cards/{card_id}/attachments
```

### Permission

Board visibility rules apply.

### Response — 200 OK

```json
[
    {
        "id": "uuid",
        "file_name": "requirements.pdf",
        "file_url": "https://storage.example.com/...",
        "file_type": "application/pdf",
        "file_size": 245760,
        "uploaded_by": "uuid",
        "created_at": "2026-09-02T10:00:00Z"
    }
]
```

---

## 16.3 Delete Attachment

```http
DELETE /api/v1/attachments/{attachment_id}
```

### Permission

```text
Attachment uploader
Board ADMIN
Workspace ADMIN
```

### Response

```text
204 No Content
```

---

# 17. Activity Logs

## 17.1 Board Activity

```http
GET /api/v1/boards/{board_id}/activity
```

### Permission

```text
Board member
Workspace ADMIN
```

Public/workspace board visibility still applies.

### Response — 200 OK

```json
[
    {
        "id": "uuid",
        "user_id": "uuid",
        "entity_type": "CARD",
        "entity_id": "uuid",
        "action_type": "CARD_MOVED",
        "metadata": {
            "source_list_id": "uuid",
            "target_list_id": "uuid",
            "old_position": 1000.0,
            "new_position": 1500.0
        },
        "created_at": "2026-09-02T10:00:00Z"
    }
]
```

`user_id` may be `null` when an action was generated by a system process or when the originating user no longer exists.

---

# 18. Pagination

Collection endpoints should support consistent pagination.

### Query Parameters

```text
page
page_size
```

Example:

```http
GET /api/v1/boards/{board_id}/activity?page=1&page_size=20
```

### Response Format

```json
{
    "items": [],
    "page": 1,
    "page_size": 20,
    "total": 100,
    "total_pages": 5
}
```

Pagination applies especially to:

- Workspace members
- Workspace boards
- Board members
- Card members
- Comments
- Attachments
- Activity logs

Small collections such as labels may initially be returned as plain arrays.

---

# 19. Board Visibility Rules

The API must enforce the following visibility model.

| Visibility | View Permission | Modify Content |
|---|---|---|
| PRIVATE | Explicit board member or Workspace ADMIN | Board MEMBER, Board ADMIN, Workspace ADMIN |
| WORKSPACE | Workspace member | Board MEMBER, Board ADMIN, Workspace ADMIN |
| PUBLIC | Authenticated system user | Board MEMBER, Board ADMIN, Workspace ADMIN |

### Important

Visibility controls **who can view** a board.

Board roles control **what an authorized user can modify**.

A public board does not mean that every authenticated user can edit it.

---

# 20. Resource Authorization Matrix

| Resource | Workspace ADMIN | Board ADMIN | Board MEMBER | OBSERVER |
|---|---:|---:|---:|---:|
| Workspace settings | Full | No | No | No |
| Workspace members | Full | No | No | No |
| Workspace invitations | Full | No | No | No |
| Create board | Full | N/A | N/A | N/A |
| Board settings | Full | Full | No | No |
| Board members | Full | Full | No | No |
| Lists | Full | Full | Create/Edit/Move/Archive | Read |
| Cards | Full | Full | Create/Edit/Move/Archive | Read |
| Card members | Full | Full | Assign/Remove | Read |
| Labels | Full | Full | Create/Edit/Apply | Read |
| Checklists | Full | Full | Full | Read |
| Comments | Full | Full | Create/Edit own/Delete own | Read |
| Attachments | Full | Full | Upload/Delete own | Read |
| Activity logs | Full | Read | Read | Read |

### Authority Inheritance

A Workspace ADMIN has administrative authority over downstream workspace resources:

```text
Workspace ADMIN
       ↓
All Boards in Workspace
       ↓
All Lists and Cards
```

A Board ADMIN has authority only within that board.

A Board MEMBER can modify board content but cannot manage board administration.

An OBSERVER is read-only.

---

# 21. Standard Error Response

All application errors should follow a consistent structure.

Example:

```json
{
    "detail": "You do not have permission to modify this board."
}
```

### Validation Errors

FastAPI's standard validation response may be used.

Example:

```json
{
    "detail": [
        {
            "loc": ["body", "title"],
            "msg": "Field required",
            "type": "missing"
        }
    ]
}
```

---

# 22. Common Authorization Behavior

### 401 Unauthorized

Use when authentication is missing or invalid.

Examples:

```text
Missing JWT
Invalid JWT
Expired JWT
Malformed JWT
```

### 403 Forbidden

Use when the user is authenticated but lacks permission.

Example:

```text
User is authenticated but is an OBSERVER attempting to move a card.
```

### 404 Not Found

Use when the requested resource does not exist.

Example:

```text
GET /api/v1/cards/{unknown_card_id}
```

### 409 Conflict

Use when an operation conflicts with an existing resource/state.

Examples:

```text
Duplicate workspace membership
Duplicate board membership
Duplicate card membership
Duplicate card-label relationship
Duplicate pending invitation
```

### 422 Unprocessable Entity

Use for request validation failures.

---

# 23. Ordering Rules

Lists and cards use decimal positions.

### Lists

Ordered by:

```text
board_id
position ASC
```

### Cards

Ordered by:

```text
list_id
position ASC
```

Example:

```text
1000
2000
3000
```

Moving an item between two existing items can use:

```text
new_position = (previous_position + next_position) / 2
```

### Rebalancing

When the gap becomes too small, positions should be normalized:

```text
1000
2000
3000
4000
...
```

The exact rebalancing threshold and algorithm belong to the service layer.

---

# 24. Transactional Operations

The following operations must use database transactions where multiple records must remain consistent.

### Workspace Creation

```text
BEGIN
    INSERT workspace
    INSERT workspace_member
COMMIT
```

### Board Creation

```text
BEGIN
    INSERT board
    INSERT board_member
COMMIT
```

### Card Movement

```text
BEGIN
    UPDATE card
    INSERT activity_log
COMMIT
```

### Invitation Acceptance

```text
BEGIN
    INSERT workspace_member
    UPDATE invitation
COMMIT
```

If any operation fails:

```text
ROLLBACK
```

---

# 25. API Design Principles

The API follows these principles:

- RESTful resource-oriented URLs.
- HTTP methods represent operations.
- JWT Bearer authentication for protected resources.
- Authorization is enforced server-side.
- Business rules are implemented in the service layer.
- Database transactions protect multi-step operations.
- UUIDs are used as resource identifiers.
- List and card ordering uses the `position` field.
- Archived resources are retained rather than immediately deleted where applicable.
- API versioning begins at `/api/v1`.
- Responses use JSON unless the endpoint explicitly handles file upload/download.
- Update endpoints return the updated resource to avoid unnecessary follow-up GET requests.
- Collection endpoints support pagination where appropriate.
- Board hydration can be requested using `include=lists,cards`.
- Client input must never bypass server-side authorization or business-rule validation.

---

# 26. Endpoint Summary

## Authentication

```text
POST   /auth/register
POST   /auth/login
GET    /auth/me
```

## Workspaces

```text
POST   /workspaces
GET    /workspaces
GET    /workspaces/{workspace_id}
PATCH  /workspaces/{workspace_id}
DELETE /workspaces/{workspace_id}
```

## Workspace Members

```text
GET    /workspaces/{workspace_id}/members
PATCH  /workspaces/{workspace_id}/members/{user_id}
DELETE /workspaces/{workspace_id}/members/{user_id}
```

## Invitations

```text
POST   /workspaces/{workspace_id}/invitations
POST   /invitations/{token}/accept
DELETE /workspaces/{workspace_id}/invitations/{invitation_id}
```

## Boards

```text
POST   /workspaces/{workspace_id}/boards
GET    /workspaces/{workspace_id}/boards
GET    /boards/{board_id}
PATCH  /boards/{board_id}
POST   /boards/{board_id}/archive
POST   /boards/{board_id}/unarchive
DELETE /boards/{board_id}
```

## Board Members

```text
GET    /boards/{board_id}/members
POST   /boards/{board_id}/members
PATCH  /boards/{board_id}/members/{user_id}
DELETE /boards/{board_id}/members/{user_id}
```

## Lists

```text
POST   /boards/{board_id}/lists
GET    /boards/{board_id}/lists
PATCH  /lists/{list_id}
PATCH  /lists/{list_id}/move
POST   /lists/{list_id}/archive
POST   /lists/{list_id}/unarchive
DELETE /lists/{list_id}
```

## Cards

```text
POST   /lists/{list_id}/cards
GET    /cards/{card_id}
PATCH  /cards/{card_id}
PATCH  /cards/{card_id}/move
POST   /cards/{card_id}/archive
POST   /cards/{card_id}/unarchive
DELETE /cards/{card_id}
```

## Card Members

```text
POST   /cards/{card_id}/members
GET    /cards/{card_id}/members
DELETE /cards/{card_id}/members/{user_id}
```

## Labels

```text
POST   /boards/{board_id}/labels
GET    /boards/{board_id}/labels
PATCH  /labels/{label_id}
DELETE /labels/{label_id}
POST   /cards/{card_id}/labels/{label_id}
DELETE /cards/{card_id}/labels/{label_id}
```

## Checklists

```text
POST   /cards/{card_id}/checklists
GET    /cards/{card_id}/checklists
PATCH  /checklists/{checklist_id}
DELETE /checklists/{checklist_id}
```

## Checklist Items

```text
POST   /checklists/{checklist_id}/items
PATCH  /checklist-items/{item_id}
DELETE /checklist-items/{item_id}
```

## Comments

```text
POST   /cards/{card_id}/comments
GET    /cards/{card_id}/comments
PATCH  /comments/{comment_id}
DELETE /comments/{comment_id}
```

## Attachments

```text
POST   /cards/{card_id}/attachments
GET    /cards/{card_id}/attachments
DELETE /attachments/{attachment_id}
```

## Activity

```text
GET    /boards/{board_id}/activity
```

---

# 27. Contract Status

This API specification is intended to be the implementation contract for the MVP backend.

The implementation should preserve the following architecture:

```text
Client
   │
   ▼
FastAPI Routes
   │
   ▼
Authentication / Authorization
   │
   ▼
Service Layer
   │
   ▼
Repository / Database Access
   │
   ▼
SQLAlchemy 2.0
   │
   ▼
PostgreSQL
```

Routes should not contain complex business logic.

Authorization should not be delegated to the frontend.

Business constraints such as same-board card movement, membership validation, duplicate prevention, and transactional consistency must be enforced by the backend.