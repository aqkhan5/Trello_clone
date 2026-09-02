# Authentication & Identity Workflow

## 1. Overview
The authentication system allows users to:
* Register an account.
* Log in using email and password.
* Receive a JWT access token.
* Use the JWT to access protected API endpoints.

The backend is responsible for validating credentials, hashing passwords, generating tokens, and authenticating protected requests.

---

## 2. Use Case Diagram

```mermaid
flowchart LR
    User([User])

    subgraph Authentication System
        UC1(Register Account)
        UC2(Login)
        UC3(Obtain JWT Access Token)
        UC4(Access Protected Resources)
    end

    User --> UC1
    User --> UC2
    UC2 --> UC3
    User --> UC4
    UC4 -.->|Requires valid JWT| UC3
```

| Use Case | Description |
| :--- | :--- |
| **Register Account** | Create a new user account. |
| **Login** | Authenticate using email and password. |
| **Obtain JWT Access Token** | Receive an access token after successful authentication. |
| **Access Protected Resources** | Use the JWT to access authenticated API endpoints. |

---

## 3. Registration Activity Diagram

```mermaid
flowchart TD
    Start([Registration Request]) --> ValidateInput{Input Valid?}

    ValidateInput -- No --> Err422[Return 422 Validation Error]

    ValidateInput -- Yes --> CheckEmail{Email Already Exists?}

    CheckEmail -- Yes --> Err409[Return 409 Conflict]

    CheckEmail -- No --> HashPassword[Hash Password]

    HashPassword --> CreateUser[Create User Record]

    CreateUser --> Commit[(Commit Transaction)]

    Commit --> Success([Return 201 Created])
```

### Registration Rules
* Email must be valid.
* Password must satisfy the configured password policy.
* Email must be unique.
* Password must never be stored in plaintext.
* The password is hashed before persistence.
* A successful registration returns **201 Created**.

---

## 4. Login Activity Diagram

```mermaid
flowchart TD
    Start([Login Request]) --> ValidateInput{Input Valid?}

    ValidateInput -- No --> Err422[Return 422 Validation Error]

    ValidateInput -- Yes --> FindUser{User Exists?}

    FindUser -- No --> Err401[Return 401 Unauthorized]

    FindUser -- Yes --> VerifyPassword{Password Matches?}

    VerifyPassword -- No --> Err401

    VerifyPassword -- Yes --> GenerateToken[Generate JWT Access Token]

    GenerateToken --> Success([Return 200 OK])
```

### Login Rules
* The user is identified by email.
* The stored password hash is used for password verification.
* Invalid credentials return **401 Unauthorized**.
* The API should not reveal whether the email or password was incorrect.
* A successful login returns a JWT access token.

---

## 5. Protected Request Activity Diagram

```mermaid
flowchart TD
    Start([Protected API Request]) --> ExtractToken[Extract Bearer Token]

    ExtractToken --> TokenExists{Token Present?}

    TokenExists -- No --> Err401[Return 401 Unauthorized]

    TokenExists -- Yes --> DecodeToken[Decode & Validate JWT]

    DecodeToken --> TokenValid{Token Valid?}

    TokenValid -- No --> Err401

    TokenValid -- Yes --> ExtractUser[Extract User ID]

    ExtractUser --> Authorization[Execute Resource Authorization]

    Authorization --> Authorized{Authorized?}

    Authorized -- No --> Err403[Return 403 Forbidden]

    Authorized -- Yes --> Endpoint[Execute Protected Endpoint]

    Endpoint --> Success([Return Response])
```

---

## 6. Sequence Diagram — User Login

```mermaid
sequenceDiagram
    autonumber

    actor Client as Client App
    participant Route as FastAPI Auth Route
    participant UserRepo as User Repository
    participant DB as PostgreSQL
    participant Security as Security Service

    Client->>Route: POST /api/v1/auth/login
    Route->>UserRepo: Find user by email
    UserRepo->>DB: SELECT user WHERE email = :email
    DB-->>UserRepo: User record
    UserRepo-->>Route: User entity

    alt User does not exist
        Route-->>Client: 401 Unauthorized
    else User exists
        Route->>Security: verify_password(password, hash)

        alt Password invalid
            Security-->>Route: False
            Route-->>Client: 401 Unauthorized
        else Password valid
            Security-->>Route: True

            Route->>Security: create_access_token(user_id)
            Security-->>Route: JWT access token

            Route-->>Client: 200 OK {access_token, token_type}
        end
    end
```

---

## 7. Sequence Diagram — Protected API Request

```mermaid
sequenceDiagram
    autonumber

    actor Client as Client App
    participant Route as FastAPI Route
    participant Auth as Authentication Dependency
    participant Security as Security Service
    participant DB as PostgreSQL
    participant Service as Business Service

    Client->>Route: GET /api/v1/workspaces
    Route->>Auth: Authenticate request

    Auth->>Security: Decode JWT

    alt Invalid or expired JWT
        Security-->>Auth: Token invalid
        Auth-->>Route: Authentication failure
        Route-->>Client: 401 Unauthorized
    else Valid JWT
        Security-->>Auth: user_id
        Auth->>DB: Load authenticated user
        DB-->>Auth: User record
        Auth-->>Route: Current user

        Route->>Service: get_user_workspaces(user_id)
        Service->>DB: Query workspace memberships
        DB-->>Service: Workspace records
        Service-->>Route: Workspace list

        Route-->>Client: 200 OK
    end
```

---

## 8. Authentication Error Rules

| Situation | Response |
| :--- | :--- |
| **Invalid request body** | `422 Unprocessable Entity` |
| **Email already exists** | `409 Conflict` |
| **Invalid credentials** | `401 Unauthorized` |
| **Missing JWT** | `401 Unauthorized` |
| **Invalid JWT** | `401 Unauthorized` |
| **Expired JWT** | `401 Unauthorized` |
| **Valid JWT but insufficient resource permission** | `403 Forbidden` |

---

## 9. Authentication Boundary

The authentication flow is divided into two distinct responsibilities:

```text
Authentication
    ↓
"Who are you?"
    ↓
JWT → User Identity

Authorization
    ↓
"What are you allowed to do?"
    ↓
RBAC / Resource Permissions
```

Authentication does not determine whether a user may modify a specific workspace, board, list, or card. That decision belongs to the authorization layer.