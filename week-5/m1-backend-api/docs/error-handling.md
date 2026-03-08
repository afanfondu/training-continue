# Module 3 - API Failure Handling Documentation

## Purpose

This document defines the standardized error-handling contract for the API.
It covers:

- Error response format
- Error code taxonomy
- Status code mapping
- Scenario-based examples
- Client-side handling guidance

## Standard Error Response Format

All API errors must return this envelope:

```json
{
  "success": false,
  "message": "Validation failed",
  "error_code": "VALIDATION_ERROR",
  "timestamp": "2026-03-05T10:30:00.000Z",
  "path": "/api/v1/users",
  "errors": [
    {
      "field": "email",
      "message": "email must be an email"
    }
  ]
}
```

Field rules:

- `success`: Always `false` for errors
- `message`: Human-readable safe message
- `error_code`: Machine-readable code for clients
- `timestamp`: ISO-8601 UTC timestamp
- `path`: Request endpoint path
- `errors`: Optional, validation-only field-level details

## Runtime Implementation Notes

Current implementation is centralized through:

- `src/common/filters/http-exception.filter.ts`
- `src/main.ts` (global `ValidationPipe` custom `exceptionFactory`)

This guarantees consistent formatting for all HTTP exceptions and unexpected crashes.

## Error Code Reference

| HTTP Status | `error_code`        | When to use                                     |
| ----------- | ------------------- | ----------------------------------------------- |
| 400         | `VALIDATION_ERROR`  | Validation failures with field-level details    |
| 401         | `AUTH_401`          | Missing/invalid authentication                  |
| 403         | `AUTH_403`          | Authenticated but not permitted                 |
| 404         | `RESOURCE_404`      | Resource not found                              |
| 409         | `RESOURCE_409`      | Resource conflict (for example duplicate email) |
| 429         | `RATE_LIMIT_429`    | Rate limit exceeded                             |
| 500         | `SERVER_500`        | Unexpected crashes or internal failures         |
| Other       | `HTTP_<statusCode>` | Fallback mapping for other status codes         |

## Error Type Examples

### Validation Error (400)

```json
{
  "success": false,
  "message": "Validation failed",
  "error_code": "VALIDATION_ERROR",
  "timestamp": "2026-03-05T10:30:00.000Z",
  "path": "/api/v1/users",
  "errors": [
    {
      "field": "email",
      "message": "email must be an email"
    },
    {
      "field": "password",
      "message": "password must be longer than or equal to 8 characters"
    }
  ]
}
```

### Resource Not Found (404)

```json
{
  "success": false,
  "message": "User with ID \"999\" not found",
  "error_code": "RESOURCE_404",
  "timestamp": "2026-03-05T10:30:00.000Z",
  "path": "/api/v1/users/999"
}
```

### Unauthorized (401)

```json
{
  "success": false,
  "message": "Invalid credentials",
  "error_code": "AUTH_401",
  "timestamp": "2026-03-05T10:30:00.000Z",
  "path": "/api/v1/auth/login"
}
```

### Forbidden (403)

```json
{
  "success": false,
  "message": "Insufficient permissions",
  "error_code": "AUTH_403",
  "timestamp": "2026-03-05T10:30:00.000Z",
  "path": "/api/v1/users"
}
```

### Conflict (409)

```json
{
  "success": false,
  "message": "Email already exists",
  "error_code": "RESOURCE_409",
  "timestamp": "2026-03-05T10:30:00.000Z",
  "path": "/api/v1/users"
}
```

### Unexpected Crash (500)

```json
{
  "success": false,
  "message": "Service temporarily unavailable",
  "error_code": "SERVER_500",
  "timestamp": "2026-03-05T10:30:00.000Z",
  "path": "/api/v1/users"
}
```

## Activity Scenario Analysis

The following scenarios are mapped to status/error codes for predictable behavior:

| Scenario                                   | HTTP Status | `error_code`     | Message                                           |
| ------------------------------------------ | ----------- | ---------------- | ------------------------------------------------- |
| 1. Create account with existing email      | 409         | `RESOURCE_409`   | `Email already exists`                            |
| 2. Malformed JSON in request body          | 400         | `HTTP_400`       | `Bad Request Exception`                           |
| 3. Database timeout during query           | 500         | `SERVER_500`     | `Service temporarily unavailable`                 |
| 4. Delete another user's resource          | 403         | `AUTH_403`       | `You can only access your own resource`           |
| 5. Rate limit exceeded                     | 429         | `RATE_LIMIT_429` | `Too many requests`                               |
| 6. Missing authentication token            | 401         | `AUTH_401`       | `Missing authentication token`                    |
| 7. Pagination offset exceeds total records | 200         | N/A              | Return empty `users` with valid pagination `meta` |

Notes:

- Scenario 7 is not an API failure in this project. It should return a successful empty page response.
- For scenario 3, detailed database errors must be logged server-side only.

## Security and Logging Rules

- Never return stack traces or infrastructure internals in API responses.
- Keep client messages concise and safe.
- Log full error details for server-side debugging (especially for 5xx).
- Keep error format consistent across all endpoints.

## Client-Side Handling Recommendations

1. Use `error_code` as the primary branch key in client logic.
2. Show `message` to users when it is user-facing.
3. For `VALIDATION_ERROR`, map `errors[]` by `field` to form inputs.
4. Retry logic should be limited to retryable server errors (for example `SERVER_500`).
5. Handle `AUTH_401` by redirecting to login/refresh flow; handle `AUTH_403` with an authorization message.

## When to Use Each Status Code

- `400`: Payload/query/path semantics are invalid
- `401`: Authentication missing/invalid
- `403`: Authenticated but unauthorized for the action
- `404`: Resource does not exist
- `409`: Conflict with current resource state
- `429`: Request rate exceeded
- `500`: Unexpected server-side failure
