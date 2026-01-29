import { InitTracingWithProvider } from "./trace.service";

// 重要：这个文件必须在所有其他模块之前导入
// OpenTelemetry instrumentation 必须在要追踪的模块导入之前注册
InitTracingWithProvider();
