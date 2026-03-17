# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev       # Watch mode (recommended for local dev)
npm run start:debug     # Debug + watch mode

# Build & Production
npm run build           # Compile TypeScript
npm run start:prod      # Run compiled output

# Testing
npm run test            # Run all unit tests
npm run test:watch      # Watch mode
npm run test:cov        # With coverage
npm run test:e2e        # End-to-end tests

# Code Quality
npm run lint            # ESLint with auto-fix
npm run format          # Prettier format
```

To run a single test file:
```bash
npx jest src/modules/label/label.service.spec.ts
```

## Architecture Overview

### Request Lifecycle

Every request flows through:
1. **ScopeStoreMiddleware** → Creates `AsyncLocalStorage` scope with `requestId`
2. **RequestLogMiddleware** → Logs request details
3. **UCAuthGuard** (global) → Validates user via `X-User-Data` header; in local env accepts the header directly, in production it is required
4. **Controller** → Handles routing
5. **TransformInterceptor** → Wraps response as `{ code: 0, data: T, requestId: string }`
6. **CustomExceptionFilter** → Catches `CustomException` and formats error responses

### Request Context (`scopeUtils`)

`src/common/utils/scope-utils.ts` exposes a singleton `scopeUtils` backed by `AsyncLocalStorage`. Use it anywhere in the codebase (services, repositories) to access request-scoped data without passing it through function parameters:

```typescript
scopeUtils.getUserId()     // current user's ID
scopeUtils.getTenantId()   // user's companyId (used for multi-tenancy)
scopeUtils.getRequestId()  // tracing ID
scopeUtils.getUser()       // full user object
```

### Multi-Tenancy

All business entities extend `TenantBaseOrmEntity` (in `src/core/database/mysql/base-orm.entity.ts`). The `tenantId` is automatically populated from `scopeUtils.getTenantId()` (which reads `user.companyId`) in the `@BeforeInsert()` hook. Repository queries must always filter by `tenantId`.

### Entity Inheritance Chain

```
SoftDeletedOrmEntity         (deletedAt, deletedBy)
  └── BusinessBaseOrmEntity  (id [Snowflake], createdAt/updatedAt [unix], createdBy/updatedBy — auto-set via hooks)
        └── TenantBaseOrmEntity  (+ tenantId — auto-set from user context)
```

- `id` uses Snowflake IDs (`GetSnowflakeId()` from `src/common/utils/id-generator.ts`)
- `createdAt`/`updatedAt` are **Unix timestamps** (bigint), not Date objects

### Error Handling

Throw `CustomException` with an `ErrorCode` enum value. The filter translates it to an i18n message automatically:

```typescript
throw new CustomException(ErrorCode.NotLogin);
throw new CustomException(ErrorCode.SomeError, { field: 'value' }); // with interpolation params
```

Error codes live in `src/common/constants/error-code.ts`. i18n message keys follow the pattern `ErrorCode.{EnumName}` in `src/common/i18n/{lang}/message.json`.

### Adding a New Module

Follow the pattern in `src/modules/label/`:
```
src/modules/{feature}/
├── {feature}.module.ts
├── {feature}.controller.ts
├── {feature}.service.ts
├── dto/{feature}.dto.ts
├── entities/{feature}.orm-entity.ts
└── repositories/{feature}.repository.ts
```

- Repository extends `MysqlBaseRepository<E>` (or `MongoBaseRepository` for MongoDB)
- Register the module in `src/app.module.ts`
- Add TypeORM entity to the MySQL provider entity list in `src/core/database/mysql/mysql.provider.ts`

### Response DTOs

Response classes extend `CommonResDto<E>` or `CommonResWithUserDto<E>` from `src/common/common.dto.ts`. These handle converting bigint `id` to string and normalizing timestamps. Always initialize optional fields to `null` (not `undefined`) to avoid V8 hidden class degradation.

### Path Aliases

`@/` maps to `src/`. Use it for all internal imports (e.g. `import { scopeUtils } from '@/common/utils/scope-utils'`).

### Auth Whitelist

Routes bypassing authentication are defined in `UCAuthGuard.whiteList` (`src/core/guards/auth.guard.ts`). Currently whitelisted: `/`, `/deploy/ready`, `/deploy/live`, and any path matching `/admin/`.

### Swagger

API docs are available at `/docs` (Swagger UI) and `/openapi.json` (raw spec). Swagger descriptions support i18n — use dot-notation keys in `@ApiProperty({ description: 'param.common.id' })` that resolve from `src/common/i18n/{lang}/swagger.json`.

### Environment

Key env vars (defaults in `src/core/config/index.ts`):
- `DEPLOY_ENV` — `local` | `prod` | `staging` (controls CORS and auth behavior)
- `PORT` — default `9421`
- `MYSQL_URL`, `MONGO_URL`, `REDIS_URL` / `REDIS_PWD` / `REDIS_DB`
- `UC_ENDPOINT` — User Center service URL
- `LOG_LEVEL` — `debug` | `info` | `warn` | `error`
- `DISABLE_MQ_CONSUMER` — set to `1` to skip Pulsar consumer startup

Copy `.env` for local overrides; use `.env.{ENV}` when `ENV` variable is set.
