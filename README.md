> 需求 node 版本 >= 20

简介：  

1、在 .npmrc 文件中设置镜像源；  

2、消息队列使用的是 pulsar，如果用不到可以直接把整个 mq 文件夹删除；  

3、环境变量的读取看 `src/core/config/index.ts`;  

4、`src/shared/remote` 封装对其他服务的基础请求；

5、错误信息的 i18n 主要在 `src/core/filters/custom-exception.filter.ts` 中实现，使用方式：手动抛 CustomException, 第一个参数传 ErrorCode，ErrorCode 的值要在 `src/common/i18n/` 文件夹下有注册；i18n Service 封装在 `src/shared/i18n/`；

6、`src/common/utils/scope-utils` 主要用于通过 ALS 传递请求中的一些信息（结合 `ScopeStoreMiddleware` 及 `UCAuthGuard`），禁止在 service 构造中注入 request，防止污染 service 和 controller 的作用域（可以在 controller 的方法中使用 `@Req`，然后再通过传值的方式传给 service，这种不会对作用域有影响）；

7、目前基础代码支持对接 mongodb、mysql、redis；

8、支持 pm2 开多进程，如果不需要，改一下 Dockerfile 中的启动命令；

9、基础架构采用 common、core、shared、feature 拆分的形式；

10、云存储封装在 `src/shared/storage/`，支持 COS、S3、TOS、OBS，通过环境变量 `STORAGE_PROVIDER` 切换，需要的 Feature Module 显式 import `StorageModule`；

11、限流使用 `@nestjs/throttler`，默认配置为 60 秒内最多 100 次请求（基于 IP），可在 `AppModule` 的 `ThrottlerModule.forRoot` 中调整；生产多实例场景建议配置 Redis 存储（`@nestjs/throttler-storage-redis`）；特定接口可用 `@SkipThrottle()` 跳过；

12、API 版本控制使用 URI 模式（`enableVersioning`），在 Controller 或方法上加 `@Version('1')` 即可，路由变为 `/v1/xxx`；不加版本号的接口不受影响；

13、非 local 环境启动时会校验必要环境变量（`MYSQL_URL`、`REDIS_URL`、`UC_ENDPOINT`），缺失则立即报错退出，见 `src/core/config/index.ts` 的 `validateEnv()`；

14、健康检查接口在 `src/modules/health/`，路由为 `/health/ready` 和 `/health/live`，对应 K8s 的 readinessProbe 和 livenessProbe；  

15、NestJS 架构分层异同对比表

| 维度 | Common (工具层) | Core (核心层) | Shared (共享层) | Modules/Feature (业务层) |
| --- | --- | --- | --- | --- |
| **本质定义** | 纯净的**静态资源** | 应用的**基础设施** | 跨模块的**通用组件** | 具体的**业务领域** |
| **典型内容** | 纯工具函数、常量、枚举、基础 DTO、异常类 | DB/Redis 连接, 全局 Filter/Guard/Interceptor/Middleware, Config | Storage, MQ, Remote(HTTP), I18n Service | User, Order, Material, Label (含各自的 Service/Repo) |
| **依赖规则** | **孤岛**：禁止依赖任何其他层 | 依赖 Common；可依赖 Shared（如 Guard 需要调用 UserService） | 依赖 Core 和 Common | 依赖 Core, Shared, Common |
| **Nest 耦合度** | **极低**：纯 `.ts` 为主，DTO/异常类可有少量装饰器 | **极高**：深度集成 Nest 生命周期和全局切面 | **中/高**：基于 Nest 的 Provider 模式封装 | **高**：核心业务逻辑，使用 Nest 的所有特性 |
| **生命周期** | 随处调用，无实例状态 | **全局单例**，随应用启动加载（通过 `@Global()` CoreModule 统一注册） | **全局或按需**：经由 CoreModule 全局导出的为全局单例；未纳入 CoreModule 的由 Feature 显式 import | **局部单例**，内聚在各自模块中 |
| **复用级别** | **跨项目复用**（直接复制即可运行） | **项目内唯一**（通常不可跨项目复用） | **高复用**（可作为私有库或 npm 包） | **低复用**（强耦合具体业务逻辑） |
| **主要职责** | 定义”是什么” (数据结构) | 定义”怎么跑” (运行环境) | 定义”能干什么” (通用能力) | 定义”做业务” (核心价值) |

**层级归属判断规则（遇到新文件时的决策流程）：**

1. 它有没有业务含义？有 → `modules/`；没有 → 继续往下
2. 它是不是全局切面（Guard/Filter/Interceptor/Middleware）或基础设施连接（DB/Redis/MQ 连接层）？是 → `core/`；否 → 继续往下
3. 它有没有 `@Injectable()` 或 NestJS 模块依赖？没有 → `common/`；有 → 继续往下
4. 它会被多个 Feature Module 复用吗？会 → `shared/`；只用一次 → 放对应的 `modules/` 里

> **注意**：`core/` 中的 Guard/Filter 等全局切面可以依赖 `shared/` 的服务（如 `UCAuthGuard` 依赖 `UserService`），这是合理的单向依赖，不违反分层原则。`common/` 中的装饰器（如 `Locked`）若依赖运行时服务（Redis），严格来说应移入 `shared/decorators/`，当前放在 `common/` 是为了使用便利性的妥协。
  
16、如何利用 v8 的隐藏类优化执行性能  

* **不要在构造函数之外动态添加属性**：避免使用 `delete` 或动态赋值；  
* **总是初始化属性**：即便初始值是 `undefined` 或 `null`，也要在类成员声明处赋值（见 CommonResWithUserDto）；  
* **保持属性赋值顺序一致**：虽然类属性声明通常锁定了顺序，但在处理普通字面量对象（Object Literals）时要格外小心；  

> 如果你的 DTO 结构极其复杂且多变，V8 可能会创建数以千计的隐藏类，导致 **“隐藏类污染”**。通过显式声明和初始化，你不仅加快了速度，还优化了内存占用，因为 V8 可以复用相同的隐藏类元数据。  

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```