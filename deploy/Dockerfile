# 使用 Node 20.10.0 Alpine 作为基础镜像
FROM swr.cn-south-1.myhuaweicloud.com/lightai-ops/node:20.10.0-alpine AS builder

ARG GFW_PROXY

WORKDIR /app

# 复制 package.json 和 package-lock.json，利用 Docker 层缓存
COPY package.json package-lock.json ./

# 只安装生产依赖
RUN if [ -n "$GFW_PROXY" ]; then \
      npm config set proxy $GFW_PROXY && \
      npm config set https-proxy $GFW_PROXY; \
    fi && \
    npm ci --omit=dev

# 复制源码并编译
COPY . .
RUN npm run build

# ---- 最终运行镜像 ----
FROM swr.cn-south-1.myhuaweicloud.com/lightai-ops/node:20.10.0-alpine

ARG GFW_PROXY

WORKDIR /app

# 替换 Alpine 镜像源并安装必要组件
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk update && \
    apk add --no-cache curl tzdata

# 安装 PM2
RUN if [ -n "$GFW_PROXY" ]; then \
      npm config set proxy $GFW_PROXY && \
      npm config set https-proxy $GFW_PROXY; \
    fi && \
    npm install -g pm2@5.3.0

# 从构建阶段复制产物
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY ./pm2 ./pm2

EXPOSE 9421

ENV PORT=9421

CMD ["pm2-runtime", "start", "pm2/ecosystem.config.js", "--name", "app"]
