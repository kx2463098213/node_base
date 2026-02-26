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
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { initializeTransactionalContext } from "typeorm-transactional";
import { MyI18nService } from "./shared/i18n/my.i18n.service";
import { LANGUAGE_TYPE } from "./common/common.dto";
import { INestApplication } from "@nestjs/common";

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

  initSwagger(app);

  await app.listen(port).then(() => {
    const logger = new Logger(AppModule.name);
    if (isLocal) {
      logger.info(`Server Start: http://localhost:${port}`);
      logger.info(`Server Openapi: http://localhost:${port}/openapi.json`);
      logger.info(`Server Docs: http://localhost:${port}/docs`);
    } else {
      logger.info(`Server Start, listen port: ${port}`);
    }
  });
}
bootstrap()

function initSwagger(app: INestApplication): void {
  const options = new DocumentBuilder()
    .setTitle('BaseProject')
    .setDescription('A basic Nodejs project, based on NestJs.')
    .setVersion('0.1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Bearer Token',
      },
      'bearer'
    )
    .build();
  const document = SwaggerModule.createDocument(app, options);

  // 为所有接口自动应用 Bearer Auth
  for (const path in document.paths) {
    for (const method in document.paths[path]) {
      const operation = document.paths[path][method];
      if (!operation.security) {
        operation.security = [];
      }
      operation.security.push({ 'bearer': [] });
    }
  }

  const myI18nService = app.get(MyI18nService);
  SwaggerModule.setup('docs', app, document, {
    patchDocumentOnRequest: (req: any, _res: any, doc: any) => {
      const lang = req.headers?.['accept-language']?.split(',')?.[0] || LANGUAGE_TYPE.Zh_CN;
      return myI18nService.translateSwaggerDocument(doc, lang) as OpenAPIObject;
    },
    swaggerOptions: {
      // 这里的配置会影响 Swagger UI 的行为
      persistAuthorization: true,
    }
  });

  app.getHttpAdapter().get('/openapi.json', (req, res) => {
    const lang = req.headers?.['accept-language'] || LANGUAGE_TYPE.Zh_CN;
    const translatedDoc = myI18nService.translateSwaggerDocument(document, lang);
    res.json(translatedDoc);
  });
}