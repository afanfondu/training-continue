# AGENTS.md

Operational guide for coding agents working in `m1-backend-api`.
Everything below is verified against the current repository.

## 1) Repository snapshot

- Stack: NestJS 11, TypeScript 5, TypeORM 0.3, MySQL 8, Jest 30.
- Package manager: `pnpm` (lockfile `pnpm-lock.yaml`).
- App source root: `src/`.
- Unit tests: `src/**/*.spec.ts`.
- E2E tests: `test/**/*.e2e-spec.ts`.
- Build output: `dist/`.

## 2) Setup and environment

- Copy env template: `cp .env.example .env`.
- Required env keys (`.env.example`):
  - DB: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `DB_ROOT_PASSWORD`
  - Auth/app: `JWT_SECRET`, `JWT_EXPIRATION`, `PORT`
- Local MySQL via Docker: `docker compose up -d`.
- Install dependencies:
  - Preferred: `pnpm install`
  - Alternative: `npm install`

## 3) Build, run, lint, format, test commands

All commands are from `package.json` scripts.

### Run app

- Dev watch mode: `pnpm run start:dev` (or `npm run start:dev`)
- Debug watch mode: `pnpm run start:debug`
- Standard start: `pnpm run start`
- Production run (after build): `pnpm run start:prod`

### Build

- `pnpm run build`

### Lint and format

- Lint (auto-fix enabled): `pnpm run lint`
  - Runs: `eslint "{src,apps,libs,test}/**/*.ts" --fix`
- Format: `pnpm run format`
  - Runs: `prettier --write "src/**/*.ts" "test/**/*.ts"`

### Test suite commands

- All unit tests: `pnpm run test`
- Watch mode: `pnpm run test:watch`
- Coverage: `pnpm run test:cov`
- Debug single-process mode: `pnpm run test:debug`
- E2E suite: `pnpm run test:e2e`

## 4) Single-test execution (important)

Use argument forwarding with script runners.

### Run one test file

- `pnpm run test -- src/users/users.service.spec.ts`
- `npm run test -- src/users/users.service.spec.ts`

### Run one test by name/pattern

- `pnpm run test -- -t "should be defined"`
- `npm run test -- -t "should be defined"`

### Run exact path (avoid regex matching)

- `pnpm run test -- --runTestsByPath src/auth/auth.service.spec.ts`

### Run one e2e test file

- `pnpm run test:e2e -- test/app.e2e-spec.ts`

### Coverage for one target

- `pnpm run test -- --coverage src/users/users.controller.spec.ts`
  Notes:
- Keep `--` before Jest args when using `npm`/`pnpm` scripts.
- `jest <arg>` is regex path matching unless `--runTestsByPath` is used.
- Keep paths repo-relative and use `/` separators.

## 5) Architecture and module boundaries

- Feature modules are separated (for example `src/users`, `src/auth`).
- Nest file roles are standard:
  - `*.module.ts`: imports/providers/controllers wiring
  - `*.controller.ts`: HTTP layer
  - `*.service.ts`: business logic
  - `dto/`: request contracts
  - `entities/`: TypeORM entities
- Cross-cutting behavior lives in `src/common` (filters/interceptors).
- Global guards/interceptors are configured in module/bootstrap.

## 6) Code style rules (explicit + inferred)

### Formatting and linting

- Prettier (`.prettierrc`): `singleQuote: true`, `trailingComma: all`.
- ESLint uses `typescript-eslint` and `eslint-plugin-prettier/recommended`.
- ESLint language option `sourceType` is CommonJS.

### TypeScript settings

- `module` and `moduleResolution`: `nodenext`.
- `target`: `ES2023`.
- `strictNullChecks: true`.
- `noImplicitAny: false` (still prefer explicit types).
- Decorators are enabled (`experimentalDecorators`, `emitDecoratorMetadata`).

### Imports

- Put external imports before internal relative imports.
- Use `import type` for type-only symbols when appropriate.
- Keep paths relative inside feature modules (no alias pattern observed).

### Naming

- Files: kebab-case with Nest suffixes (`users.service.ts`, `create-user.dto.ts`).
- Classes/interfaces/enums: PascalCase.
- Variables/methods/properties: camelCase.
- Constants/decorator metadata keys: UPPER_SNAKE_CASE (`IS_PUBLIC_KEY`, `ROLES_KEY`).

### DTO/entity/validation patterns

- DTOs are classes with `class-validator` decorators.
- Use `class-transformer` for coercion/serialization (for example `@Type(() => Number)`).
- Entities use TypeORM decorators and include timestamps/soft-delete where needed.

### Error handling and response envelope

- Throw Nest exceptions in services/guards (`UnauthorizedException`, `ForbiddenException`, etc.).
- Keep error messages concise and user-facing.
- Error envelope (global exception filter): `{ success: false, statusCode, message, errors? }`.
- Success envelope (transform interceptor): `{ success: true, data }`.

### API/auth conventions

- Global prefix: `api/v1`.
- JWT in `Authorization: Bearer <token>`.
- Authorization combines public decorator + role guard + ownership guard.

### REST behavior conventions (verified in current code)

- Global request validation uses `ValidationPipe` with `transform: true`, `whitelist: true`, and `forbidNonWhitelisted: true`.
- Resource routes follow standard verbs in controllers (`@Post`, `@Get`, `@Patch`, `@Delete`) with explicit status codes where needed (`201 Created` for create, `204 No Content` for delete).
- Pagination for user listing uses `page`/`limit` query params with defaults `page=1`, `limit=20`, and max `limit=100`.
- Paginated list responses include `meta` with `{ page, limit, total, totalPages }`.

## 7) Testing conventions

- Unit tests are colocated with source as `*.spec.ts`.
- E2E tests are in `test/` and use `test/jest-e2e.json`.
- Standard Nest setup: `Test.createTestingModule(...)` with `beforeEach`.
- Prefer small, behavior-focused test names.

## 8) Agent execution checklist

Before changes:

- Read nearby module/service/controller files and match existing patterns.
- Identify whether unit tests, e2e tests, or both are affected.
  After changes:
- Run targeted tests first (single file or `-t` pattern).
- Then broader checks as needed:
  - `pnpm run lint`
  - `pnpm run test`
  - `pnpm run build`

## 9) Cursor/Copilot instructions

Checked paths:

- `.cursor/rules/`
- `.cursorrules`
- `.github/copilot-instructions.md`
  Current status:
- No Cursor or Copilot instruction files were found.
- If added later, treat them as higher-priority instructions and merge with this guide.
