import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { NextFunction, Request, Response } from "express";
import compression from "compression";
import helmet from "helmet";
import bodyParser from "body-parser";
import { logger } from 'nestjs-i18n';
import { Logger } from "./common/logger/logger";
import { isLocal } from "./core/config";
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { initializeTransactionalContext } from "typeorm-transactional";

async function bootstrap(): Promise<void> {
  initializeTransactionalContext(); // mysql 的事务，使用方式为用 @Transactional 装饰方法
  const app = await NestFactory.create(AppModule, {});
  app.enableShutdownHooks();
  if (isLocal) {
    app.enableCors(); // tips: 网关开了允许跨域，这里开了会重复两个*，没有网关服务的情况下需要直接允许跨域
  }
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.setTimeout(10 * 60e3);
    next();
  });
  app.use(compression());
  app.use(helmet());
  app.use(bodyParser.json({ limit: "10mb" }));
  app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

  process.on('unhandledRejection', error => {
    logger.error('process.on unhandledRejection: %j', error);
  });
  
  process.on('uncaughtException', error => {
    logger.error('Uncaught Exception: %j', error);
  });

  const configService = app.get(ConfigService);
  const port = configService.get("port") || 9421;

  const options = new DocumentBuilder()
    .setTitle('BaseProject')
    .setDescription('BaseProject  接口文档接口文档')
    .setVersion('0.1')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port).then(() => {
    const logger = new Logger(AppModule.name);
    if (isLocal) {
      logger.info(`Server Start: http://localhost:${port}`);
    } else {
      logger.info(`Server Start, listen port: ${port}`);
    }
  });
}
bootstrap()