import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "@/modules/health/health.module";
import { CoreModule } from "@/core/core.module";
import { config } from "./core/config";
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { UCAuthGuard } from "@/core/guards/auth.guard";
import { LabelModule } from "./modules/label/label.module";
import { ScopeStoreMiddleware } from "@/core/middleware/scope-store.middleware";
import { RequestLogMiddleware } from "@/core/middleware/req-log-middleware";
import { CustomExceptionFilter } from "@/core/filters/custom-exception.filter";
import { TransformInterceptor } from "@/core/interceptors/transform.interceptor";
import { I18nValidationPipe } from 'nestjs-i18n';
import { LogModule } from "./modules/log/log.module";
import { StorageModule } from "@/shared/storage/storage.module";
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [config] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    CoreModule,
    HealthModule,
    LabelModule,
    LogModule,
    StorageModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
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
      useFactory: () => {
        return new I18nValidationPipe({
          whitelist: true,
        });
      }
    },
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply(ScopeStoreMiddleware, RequestLogMiddleware)
      .exclude(
        { path: 'health/live', method: RequestMethod.ALL },
        { path: 'health/ready', method: RequestMethod.ALL },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
