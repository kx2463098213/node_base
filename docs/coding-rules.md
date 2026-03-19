# 编码规范

## 代码风格

- 缩进使用 **2 个空格**，不使用 Tab
- 内部模块引用统一使用 `@/` 路径别名，不使用相对路径 `../../`：
  ```typescript
  // ✓
  import { scopeUtils } from '@/common/utils/scope-utils';
  // ✗
  import { scopeUtils } from '../../common/utils/scope-utils';
  ```

---

## 架构分层

项目采用 Common / Core / Shared / Feature 四层架构，新增文件时按以下顺序判断归属：

1. 有业务域含义 → `modules/`
2. 全局切面（Guard/Filter/Interceptor/Middleware）或基础设施连接（DB/Redis/MQ） → `core/`
3. 无 NestJS DI，纯 TypeScript → `common/`
4. 有 `@Injectable()` 且被多个 Feature Module 复用 → `shared/`

依赖方向：`modules/` → `shared/` → `core/` → `common/`，禁止反向依赖。

| 层 | 典型内容 | 能否有 @Injectable |
|---|---|---|
| `common/` | 工具函数、常量、枚举、基础 DTO、异常类 | 极少（DTO/异常类可有少量装饰器） |
| `core/` | DB 连接、全局 Guard/Filter/Interceptor/Middleware、Config | 是 |
| `shared/` | Storage、MQ、Remote HTTP、I18n Service | 是 |
| `modules/` | 业务 Controller/Service/Repository/Entity | 是 |

---

## 请求上下文

**禁止**在 Service 构造函数中注入 `Request`，会导致 NestJS 将整个依赖链降级为 request scope，每次请求都重新实例化，严重影响性能。

统一通过 `scopeUtils` 获取请求上下文：

```typescript
import { scopeUtils } from '@/common/utils/scope-utils';

scopeUtils.getUserId()      // 当前用户 ID
scopeUtils.getTenantId()    // 租户 ID（即 user.companyId）
scopeUtils.getRequestId()   // 链路追踪 ID
scopeUtils.getUser()        // 完整用户对象
```

`@Req()` 只允许在 Controller 方法参数中使用，且只能以传参方式传给 Service，不能注入到构造函数。

---

## 错误处理

统一抛 `CustomException`，不直接 throw `Error` 或 `HttpException`：

```typescript
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/constants/error-code';

throw new CustomException(ErrorCode.NotLogin);
throw new CustomException(ErrorCode.SomeError, { field: 'value' }); // 带插值参数
```

新增 ErrorCode 必须同步在以下文件中注册，key 格式为 `ErrorCode.{EnumName}`：
- `src/common/constants/error-code.ts`
- `src/common/i18n/zh-CN/message.json`
- `src/common/i18n/en-US/message.json`

---

## 实体规范

### 继承链

```
SoftDeletedOrmEntity         (deletedAt, deletedBy)
  └── BusinessBaseOrmEntity  (id, createdAt, updatedAt, createdBy, updatedBy)
        └── TenantBaseOrmEntity  (+ tenantId)
```

业务实体继承 `TenantBaseOrmEntity`，框架会自动填充 `id`、`tenantId`、`createdBy`、`updatedBy`。

### 注意事项

- `id` 使用 Snowflake，不用数据库自增
- `createdAt` / `updatedAt` 是 **Unix 时间戳（bigint）**，不是 `Date` 对象
- 禁止物理删除业务数据，使用软删除（`deletedAt` / `deletedBy`）
- 领域专属枚举放在对应 Feature 模块目录下，不放 `common/constants/`

---

## 多租户

- 所有业务查询必须带 `tenantId` 过滤条件
- `tenantId` 从 `scopeUtils.getTenantId()` 获取，不通过接口参数传入
- `@BeforeInsert()` 钩子自动填充，无需手动赋值

---

## DTO 规范

### 响应 DTO

继承 `CommonResDto<E>` 或 `CommonResWithUserDto<E>`，自动处理：
- bigint `id` → string 转换
- Unix 时间戳归一化

### 列表查询 DTO

继承 `BaseListDto`，内置分页（page/size）、时间范围（beginTime/endTime）、关键词（word）、排序（orderBy/order）。

### 可选字段初始化

可选字段初始化为 `null`，不用 `undefined`，防止 V8 隐藏类劣化：

```typescript
// ✓
userInfo?: SimpleUserInfo | null = null;

// ✗
userInfo?: SimpleUserInfo;
```

---

## 日志

使用项目自定义 `Logger`，禁止使用 `console.log`：

```typescript
import { Logger } from '@/common/logger/logger';

private readonly logger = new Logger('ModuleName');

this.logger.debug('debug info: %j', data);
this.logger.info('request: %s', path);
this.logger.warn('warning: %s', msg);
this.logger.error('error: %s', err.message);
```

日志级别通过环境变量 `LOG_LEVEL` 控制，默认 prod 为 `info`，local 为 `debug`。

---

## Repository 规范

- MySQL Repository 继承 `MysqlBaseRepository<E>`
- MongoDB Repository 继承 `MongoBaseRepository<E>`
- 查询逻辑封装在 Repository 中，Service 不直接写查询语句
- MySQL 事务使用 `@Transactional()` 装饰器，不手动管理 `EntityManager` 或 `QueryRunner`：

```typescript
import { Transactional } from 'typeorm-transactional';

@Transactional()
async createWithRelation(dto: CreateDto) {
  // 方法内所有 DB 操作自动在同一事务中
}
```

---

## Swagger

`@ApiProperty` 的 `description` 使用 i18n key，不写硬编码文字：

```typescript
// ✓
@ApiProperty({ description: 'param.common.id' })

// ✗
@ApiProperty({ description: '用户ID' })
```

i18n key 在 `src/common/i18n/{lang}/swagger.json` 中注册。

---

## ValidationPipe

全局 `I18nValidationPipe` 配置了 `whitelist: true`，DTO 中未声明的字段会被自动过滤，无需手动处理。字段校验统一使用 `class-validator` 装饰器。

---

## 限流

默认全局限流：60 秒内最多 100 次请求（基于 IP）。特定接口可跳过或覆盖：

```typescript
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@SkipThrottle()                                          // 跳过限流
@Throttle({ default: { ttl: 1000, limit: 5 } })         // 覆盖配置
```

---

## API 版本控制

使用 URI 版本模式，在 Controller 或方法上加 `@Version()`：

```typescript
@Controller({ path: 'label', version: '1' })  // 路由：/v1/label
export class LabelController {}

@Get('list')
@Version('2')                                  // 路由：/v2/label/list
async list() {}
```

不加 `@Version()` 的接口路由保持原样，不受影响。
