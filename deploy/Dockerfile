# 使用 Node 20.10.0 Alpine 作为基础镜像
FROM swr.cn-south-1.myhuaweicloud.com/lightai-ops/node:20.10.0-alpine AS package-builder

ARG GFW_PROXY

# 设置 npm 镜像
RUN npm config set registry https://registry.npmjs.org --global

# 复制 package.json 和 package-lock.json
COPY package.json package-lock.json ./

# 安装依赖
RUN if [ -n "$GFW_PROXY" ]; then \
      npm config set proxy $GFW_PROXY && \
      npm config set https-proxy $GFW_PROXY; \
    fi && \
    npm install

# 复制当前所有代码到工作目录
COPY . .

# 打包应用
RUN npm run build

# 使用基础镜像进行最终构建
FROM swr.cn-south-1.myhuaweicloud.com/lightai-ops/node:20.10.0-alpine

# 设置工作目录
WORKDIR /base-project

# 替换 Alpine 镜像源并安装必要组件
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk update && \
    apk add --no-cache curl tzdata

# 安装 PM2
RUN npm config set registry https://registry.npmjs.org --global && \
    if [ -n "$GFW_PROXY" ]; then \
      npm config set proxy $GFW_PROXY && \
      npm config set https-proxy $GFW_PROXY; \
    fi && \
    npm install -g pm2@5.3.0

# 复制打包后的文件
COPY --from=package-builder /base-project/node_modules /base-project/node_modules
COPY --from=package-builder /base-project/dist /base-project/dist
COPY ./pm2 /base-project/pm2

# 暴露端口
EXPOSE 9421

# 设置环境变量
ENV PORT=9421
ENV ENV_FLAG=${ENV_FLAG}

# 指定容器启动命令
CMD ["pm2-runtime", "start", "pm2/app.js", "--name", "app"]
