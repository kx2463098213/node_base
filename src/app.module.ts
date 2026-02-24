import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import {ConfigModule} from "@nestjs/config";
import { DeployModule } from "./modules/deploy/deploy.module";
import { DatabaseModule } from "./core/database/database.module";
import { GlobalModule } from "./global.module";
import { config } from "./core/config";
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { UCAuthGuard } from "./core/guards/auth.guard";
import { LabelModule } from "./modules/label/label.module";
import { ScopeStoreMiddleware } from "./core/middleware/scope-store.middleware";
import { RequestLogMiddleware } from "./core/middleware/req-log-middleware";
import { CustomExceptionFilter } from "./core/filters/custom-exception.filter";
import { TransformInterceptor } from "./core/interceptors/transform.interceptor";
import { I18nValidationPipe } from 'nestjs-i18n';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [config] }),
    GlobalModule,
    DatabaseModule,
    DeployModule,
    LabelModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: UCAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: CustomExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useClass: I18nValidationPipe,
    },
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply(ScopeStoreMiddleware, RequestLogMiddleware)
      .exclude(
        { path: 'deploy/live', method: RequestMethod.ALL },
        { path: 'deploy/ready', method: RequestMethod.ALL },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
