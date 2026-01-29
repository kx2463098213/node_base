简介：  
1、在 .npmrc 文件中设置镜像源；  

2、消息队列使用的是 pulsar，如果用不到可以直接把整个 mq 文件夹删除；  

3、环境变量的读取看 src/config/index.ts;  

4、trace 用于做请求最终，用不到也可以把 trace 文件夹及相关引用删除；  

5、src/modules/remote 封装对其他服务的基础请求；  

6、错误信息的 i18n 主要在 src/exception/custom0exception.filter.ts 中实现 => 手动抛 CustomException, 第一个参数传 ErrorCode，ErrorCode 的值要在 src/i18n/文件夹下有注册；  

7、src/scope-store 主要用于通过 ALS 传递请求中的一些信息，禁止在 service 中注入 request，防止污染 service 和 controller 的作用域；  

8、目前基础代码支持对接 mongodb、mysql、redis；  


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
