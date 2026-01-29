import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import {ConfigModule, ConfigService} from "@nestjs/config";
import { DeployModule } from "./modules/deploy/deploy.module";
import { DatabaseModule } from "./database/database.module";
import { GlobalModule } from "./global.module";
import { SfNestTraceModule } from "sf-nest-trace";
import { BaseException } from "./exception/custom.exception";
import { config } from "./config";
import { APP_GUARD } from "@nestjs/core";
import { UCAuthGuard } from "./modules/remote/uc/auth.guard";
import { LabelModule } from "./modules/label/label.module";
import { RequestContextMiddleware } from "./middleware/scope-store.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({ load: [config] }),
    GlobalModule,
    DatabaseModule,
    DeployModule,
    LabelModule,
    SfNestTraceModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (confSvc: ConfigService) => {
        const traceConfig = confSvc.get('trace');
        if (!traceConfig) {
          throw new BaseException(500, 'Trace 配置缺失');
        }
        return traceConfig;
      },
    })
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: UCAuthGuard,
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
