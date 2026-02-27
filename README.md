> 需求 node 版本 >= 20

简介：  

1、在 .npmrc 文件中设置镜像源；  

2、消息队列使用的是 pulsar，如果用不到可以直接把整个 mq 文件夹删除；  

3、环境变量的读取看 `src/core/config/index.ts`;  

4、`src/share/remote` 封装对其他服务的基础请求；  

5、错误信息的 i18n 主要在 `src/core/filters/custom-exception.filter.ts` 中实现，使用方式：手动抛 CustomException, 第一个参数传 ErrorCode，ErrorCode 的值要在 `src/common/i18n/` 文件夹下有注册；  

6、src/common/scope-utils 主要用于通过 ALS 传递请求中的一些信息（结合 `ScopeStoreMiddleware` 及 `UCAuthGuard`），禁止在 service 构造中注入 request，防止污染 service 和 controller 的作用域（可以在 controller 的方法中使用 `@Req`，然后再通过传值的方式传给 service，这种不会对作用域有影响）；  

7、目前基础代码支持对接 mongodb、mysql、redis；  

8、支持 pm2 开多进程，如果不需要，改一下 Dockerfile 中的启动命令；  

9、基础架构采用 common、core、shared、feature 拆分的形式；  

 NestJS 架构分层异同对比表

| 维度 | Common (工具层) | Core (核心层) | Shared (共享层) | Modules/Feature (业务层) |
| --- | --- | --- | --- | --- |
| **本质定义** | 纯净的**静态资源** | 应用的**基础设施** | 跨模块的**通用组件** | 具体的**业务领域** |
| **典型内容** | Enum, Interface, DTO, Utils, 常量 | DB/Redis 连接, 全局 Filter, 中间件, Trace | Storage, Mailer, I18n, 二次封装的工具 Service | User, Order, Material, Label (含各自的 Service/Repo) |
| **依赖规则** | **孤岛**：禁止依赖任何其他层 | 仅依赖 Common | 可依赖 Core 和 Common | 依赖 Core, Shared, Common |
| **Nest 耦合度** | **极低**：通常是纯 `.ts`，无装饰器 | **极高**：深度集成 Nest 生命周期和全局切面 | **中/高**：基于 Nest 的 Provider 模式封装 | **高**：核心业务逻辑，使用 Nest 的所有特性 |
| **生命周期** | 随处调用，无实例状态 | **全局单例**，随应用启动加载 | **按需加载/多例**，由业务模块导入 | **局部单例**，内聚在各自模块中 |
| **复用级别** | **跨项目复用**（直接复制即可运行） | **项目内唯一**（通常不可跨项目复用） | **高复用**（可作为私有库或 npm 包） | **低复用**（强耦合具体业务逻辑） |
| **主要职责** | 定义“是什么” (数据结构) | 定义“怎么跑” (运行环境) | 定义“能干什么” (通用能力) | 定义“做业务” (核心价值) |
  
10、如何利用 v8 的隐藏类优化执行性能  

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