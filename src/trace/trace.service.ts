import { NodeSDK, tracing } from '@opentelemetry/sdk-node';
const { ConsoleSpanExporter, SimpleSpanProcessor } = tracing;
import { Resource } from '@opentelemetry/resources';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import {
  HttpInstrumentation, IgnoreIncomingRequestFunction, IgnoreOutgoingRequestFunction,
} from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import { MySQL2Instrumentation } from '@opentelemetry/instrumentation-mysql2';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { Span, trace } from '@opentelemetry/api';
import _ from 'lodash';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { IncomingMessage, ServerResponse } from 'node:http';
import { config } from '@/config';
import { Logger } from '@/logger/logger';

export interface TraceConfig {
  isTraceOn: number;
  serviceName: string;
  endpoint: string;
  metadata?: Record<string, string>;
  withConsoleExporter?: boolean;
  sampleRatio?: number;
  ignoreIncomingRequestHook?: IgnoreIncomingRequestFunction;
  ignoreOutgoingRequestHook?: IgnoreOutgoingRequestFunction;
}

export function initTracingWithProvider(traceConfig: TraceConfig) {
  const logger = new Logger('trace');
  if (!traceConfig) {
    throw new Error('TraceConfig is required');
  }
  
  if (_.toNumber(traceConfig.isTraceOn) !== 1) {
    logger.debug('不启动调用链追踪');
    return null;
  }
  
  if (!traceConfig.serviceName || !traceConfig.endpoint) {
    throw new Error('serviceName and endpoint are required when tracing is enabled');
  }
  logger.debug('启动调用链追踪');

  const serviceName = traceConfig.serviceName;
  // 配置 HTTP 导出器（统一使用 HTTP，避免 gRPC 依赖问题）
  let exporterUrl = traceConfig.endpoint;
  // 如果是 gRPC 端口，转换为 HTTP 端口
  if (traceConfig.endpoint.includes(':4317')) {
    exporterUrl = traceConfig.endpoint.replace(':4317', ':4318');
  }

  // 配置追踪导出器
  const traceExporter = new OTLPTraceExporter({
    url: exporterUrl,
    headers: traceConfig.metadata || {},
  });
  
  // 配置span处理器
  const spanProcessors = [new SimpleSpanProcessor(traceExporter as any)];
  if (traceConfig.withConsoleExporter) {
    logger.debug('启用控制台追踪导出器');
    spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  }

  // 准备 instrumentations
  const instrumentations = [
    new HttpInstrumentation({
      ignoreIncomingRequestHook: traceConfig.ignoreIncomingRequestHook,
      ignoreOutgoingRequestHook: traceConfig.ignoreOutgoingRequestHook,
      responseHook: (span: Span, response) => {
        // 从上下文中获取 traceId 和 spanId
        const traceId = span.spanContext().traceId;
        const spanId = span.spanContext().spanId;

        // 将 traceId 和 spanId 添加到响应头中
        if (response instanceof ServerResponse) {
          response.setHeader('TraceId', traceId);
          response.setHeader('SpanId', spanId);
        }
        return response;
      },
    }),
    new ExpressInstrumentation(),
    new UndiciInstrumentation(),
    new NestInstrumentation(),
    new MySQL2Instrumentation(),
    new MongoDBInstrumentation(),
  ];

  // 使用 NodeSDK 进行初始化
  const sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: serviceName,
    }),
    spanProcessors,
    instrumentations,
  });

  try {
    // 启动 SDK
    sdk.start();
    logger.debug('OpenTelemetry SDK 启动成功');
    return trace.getTracer(serviceName);
  } catch (error) {
    logger.error('初始化调用链追踪失败:', error);
    throw error;
  }
}

export function addSpanAttributes(span: Span, attributes: Record<string, any>): void {
  if (span && attributes) {
    span.setAttributes(attributes);
  }
}

export function addSpanEvent(span: Span, eventName: string, attributes?: Record<string, any>): void {
  if (span) {
    span.addEvent(eventName, attributes);
  }
}

export const InitTracingWithProvider = () => {
  const traceConf = config().trace
  const traceConfig: TraceConfig = {
    ...traceConf,
    isTraceOn: +traceConf.isTraceOn,
    ignoreIncomingRequestHook: (request: IncomingMessage) => {
      const urls = ["/deploy/ready", "/deploy/live"];
      return urls.includes(request.url ?? "");
    },
  };
  return initTracingWithProvider(traceConfig);
}