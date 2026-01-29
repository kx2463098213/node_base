// 重要：必须在所有其他模块之前导入 OpenTelemetry instrumentation
import './trace/init';
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { NextFunction, Request, Response } from "express";
import compression from "compression";
import helmet from "helmet";
import bodyParser from "body-parser";
import { I18nService, I18nValidationPipe, logger } from 'nestjs-i18n';
import { TransformInterceptor } from "./interceptor/transform.interceptor";
import { Logger } from "./logger/logger";
import InitTracingWithProvider from "./trace";
import { isLocal } from "./config";
import { RequestLog } from "./middleware/req-log-middleware";
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { CustomExceptionFilter } from "./exception/custom-exception.filter";
import { initializeTransactionalContext } from "typeorm-transactional";

async function bootstrap(): Promise<void> {
  initializeTransactionalContext();
  InitTracingWithProvider()
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
  app.use(RequestLog());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new CustomExceptionFilter(app.get(I18nService)));
  app.useGlobalPipes(new I18nValidationPipe());

  process.on('unhandledRejection', error => {
    logger.error('process.on unhandledRejection: %j', error);
  });
  
  process.on('uncaughtException', error => {
    logger.error('Uncaught Exception: %j', error);
  });

  const configService = app.get(ConfigService);
  const port = configService.get("port") || 9421;

  const options = new DocumentBuilder()
    .setTitle('Social-X-Main')
    .setDescription('Social-X-Main  接口文档接口文档')
    .setVersion('1.0')
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
