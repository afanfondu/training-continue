# Keycloak Auth Starter (TanStack)

This project is trimmed to an auth-focused frontend scaffold:

- Keycloak login/logout session handling
- Protected API call flow for future NestJS backend
- TanStack Router + TanStack Query for UI and data orchestration

## Run

```bash
pnpm install
pnpm dev
```

Build and test:

```bash
pnpm build
pnpm test
```

## Environment

Set these in `.env.local`:

```bash
VITE_ENABLE_KEYCLOAK="true"
VITE_KEYCLOAK_USE_SILENT_SSO="false"
VITE_KEYCLOAK_URL="http://localhost:8080"
VITE_KEYCLOAK_REALM="<your-realm>"
VITE_KEYCLOAK_CLIENT_ID="<your-frontend-client-id>"
VITE_API_BASE_URL="http://localhost:3001"
```

`VITE_API_BASE_URL` is optional in early stages. If omitted, frontend uses `/api`.

## App Routes

- `/` - auth landing page
- `/demo/keycloak` - current Keycloak state view
- `/demo/protected-api` - protected endpoint call test harness

## Protected API Scaffold

Core files:

- `src/integrations/api/http-client.ts`
- `src/integrations/api/protected.ts`
- `src/integrations/api/hooks/use-protected-session-query.ts`
- `src/routes/demo/protected-api.tsx`

The request flow is:

1. Check authenticated Keycloak session.
2. Refresh token with `updateToken(30)`.
3. Send `Authorization: Bearer <token>`.
4. Map `401/403` to typed auth error handling.

## NestJS Backend Contract (recommended)

- Protect endpoint with Keycloak JWT validation in NestJS guards.
- Frontend endpoint assumption in scaffold: `GET /protected/session`.
- Response shape can be for example:

```json
{
  "message": "ok",
  "subject": "user-id",
  "scopes": ["profile", "email"],
  "at": "2026-03-26T11:00:00.000Z"
}
```

## Important Constraint

`src/integrations/keycloak/root-provider.tsx` is intentionally kept unchanged.

For a flaw-by-flaw hardening guide without editing that file, read:

- `docs/keycloak-provider-fix-guide.md`
