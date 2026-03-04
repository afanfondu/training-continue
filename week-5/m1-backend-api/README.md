# API Design Document

## Overview

The API is a RESTful service for user management and authentication.
Base URL: `/api/v1`

This document follows the expected API design output format:

- Endpoint URL
- HTTP Method
- Request Format
- Response Format
- Status Codes

## Authentication

The API uses JWT Bearer tokens for authentication.
To access protected endpoints, include the token in the `Authorization` header:
`Authorization: Bearer <access_token>`

Tokens are obtained by logging in via the `POST /api/v1/auth/login` endpoint.

## Response Format

All responses follow a standard envelope structure.

### Success Response

```json
{
  "success": true,
  "data": <payload>
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": <number>,
  "message": "<string>",
  "errors": ["<string>"]
}
```

The `errors` array is only present for validation failures (400 Bad Request).

Example validation error:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ]
}
```

## Endpoints

### 1. Login

`POST /api/v1/auth/login`

Authenticates a user and returns an access token.

- **Purpose**: Authenticate existing user credentials and issue a JWT access token.
- **HTTP Method**: POST

- **Authentication**: Public
- **Request Body**:
  - `email` (string, required, email format)
  - `password` (string, required, non-empty)
- **Success Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbG..."
  }
}
```

- **Error Responses**:
  - 400 Bad Request: Validation failed
  - 401 Unauthorized: Invalid credentials
  - 500 Internal Server Error: Unexpected server-side failure

### 2. Register User

`POST /api/v1/users`

Creates a new user account.

- **Purpose**: Register a new user in the system.
- **HTTP Method**: POST

- **Authentication**: Public
- **Request Body**:
  - `email` (string, required, email format)
  - `password` (string, required, min length 8)
  - `firstName` (string, required, non-empty)
  - `lastName` (string, required, non-empty)
  - `role` (string, optional, "user" | "admin")
- **Success Response**: 201 Created

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "createdAt": "2026-03-03T10:00:00.000Z",
    "updatedAt": "2026-03-03T10:00:00.000Z",
    "deletedAt": null
  }
}
```

- **Error Responses**:
  - 400 Bad Request: Validation failed
  - 409 Conflict: Email already exists
  - 500 Internal Server Error: Unexpected server-side failure

- **Response Headers (201 Created)**:
  - `Location`: `/api/v1/users/{id}`

### 3. List Users

`GET /api/v1/users`

Returns a paginated list of users.

- **Purpose**: Retrieve a paginated list of users with filtering and sorting options.
- **HTTP Method**: GET

- **Authentication**: Admin only
- **Query Parameters**:
  - `page` (integer, min 1, default 1)
  - `limit` (integer, min 1, max 100, default 20)
  - `sortBy` (string, default "createdAt")
  - `sortOrder` (string, "ASC" | "DESC", default "DESC")
  - `search` (string, optional)
  - `role` (string, optional, "user" | "admin")
- **Success Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "user",
        "createdAt": "2026-03-03T10:00:00.000Z",
        "updatedAt": "2026-03-03T10:00:00.000Z",
        "deletedAt": null
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

- **Error Responses**:
  - 401 Unauthorized: Missing or invalid token
  - 403 Forbidden: Insufficient permissions
  - 500 Internal Server Error: Unexpected server-side failure

### 4. Get User

`GET /api/v1/users/:id`

Returns a single user by ID.

- **Purpose**: Retrieve one user's details by unique identifier.
- **HTTP Method**: GET

- **Authentication**: Owner or Admin
- **Path Parameters**:
  - `id` (uuid, required)
- **Success Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "createdAt": "2026-03-03T10:00:00.000Z",
    "updatedAt": "2026-03-03T10:00:00.000Z",
    "deletedAt": null
  }
}
```

- **Error Responses**:
  - 401 Unauthorized: Missing or invalid token
  - 403 Forbidden: Insufficient permissions
  - 404 Not Found: User not found
  - 500 Internal Server Error: Unexpected server-side failure

### 5. Update User

`PATCH /api/v1/users/:id`

Partially updates a user.

- **Purpose**: Update one or more user fields without replacing the whole resource.
- **HTTP Method**: PATCH

- **Authentication**: Owner or Admin
- **Path Parameters**:
  - `id` (uuid, required)
- **Request Body**:
  - `email` (string, optional, email format)
  - `password` (string, optional, min length 8)
  - `firstName` (string, optional, non-empty)
  - `lastName` (string, optional, non-empty)
  - `role` (string, optional, "user" | "admin")
- **Note**: Non-admin users cannot change their role. If a `role` field is sent by a non-admin, it's silently removed before processing.
- **Success Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "updated@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "createdAt": "2026-03-03T10:00:00.000Z",
    "updatedAt": "2026-03-03T10:00:00.000Z",
    "deletedAt": null
  }
}
```

- **Error Responses**:
  - 400 Bad Request: Validation failed
  - 401 Unauthorized: Missing or invalid token
  - 403 Forbidden: Insufficient permissions
  - 404 Not Found: User not found
  - 500 Internal Server Error: Unexpected server-side failure

### 6. Delete User

`DELETE /api/v1/users/:id`

Performs a soft delete on a user.

- **Purpose**: Soft-delete a user record by setting `deletedAt`.
- **HTTP Method**: DELETE

- **Authentication**: Owner or Admin
- **Path Parameters**:
  - `id` (uuid, required)
- **Note**: This endpoint performs a soft delete. The user record isn't permanently removed, but the `deletedAt` field is set to the current timestamp.
- **Success Response**: 204 No Content
- **Error Responses**:
  - 401 Unauthorized: Missing or invalid token
  - 403 Forbidden: Insufficient permissions
  - 404 Not Found: User not found
  - 500 Internal Server Error: Unexpected server-side failure

## Pagination

The list endpoint returns a `meta` object to help with pagination.

### Meta Object

- `page`: Current page number
- `limit`: Number of items per page
- `total`: Total number of items matching the query
- `totalPages`: Total number of pages available

### Query Parameters

- `page`: Default is 1.
- `limit`: Default is 20, maximum is 100.
- `sortBy`: Field to sort by. Default is `createdAt`.
- `sortOrder`: Sort direction. Either `ASC` or `DESC`. Default is `DESC`.
- `search`: Search term to filter users by email, first name, or last name.
- `role`: Filter users by role (`user` or `admin`).

## Error Codes

| Status Code | Description                                                |
| ----------- | ---------------------------------------------------------- |
| 200         | OK - Request succeeded                                     |
| 201         | Created - Resource created successfully                    |
| 204         | No Content - Request succeeded, no response body           |
| 400         | Bad Request - Validation failed or malformed request       |
| 401         | Unauthorized - Authentication failed or missing            |
| 403         | Forbidden - Insufficient permissions to access resource    |
| 404         | Not Found - Resource not found                             |
| 409         | Conflict - Resource already exists (e.g., duplicate email) |
| 500         | Internal Server Error - Unexpected server error            |
