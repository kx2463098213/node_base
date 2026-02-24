import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@/common/constants/error-code';

export class BaseException extends HttpException {
  constructor(code: number, message: string, httpCode = HttpStatus.OK) {
    super({code, message: message || "Internal Server Error"}, httpCode);
  }
}

export class CustomException extends HttpException {
  private readonly errCode: ErrorCode;
  private readonly param?: Record<string, any>;

  constructor(code: ErrorCode, param?: Record<string, any>, httpCode = HttpStatus.OK) {
    const codeName = ErrorCode[code];
    const message = codeName ? `ErrorCode.${codeName}` : `Unknown Error, code: ${code}`;
    super({ code, message }, httpCode);
    this.errCode = code;
    this.param = param;
  }

  getErrorCode(): ErrorCode  {
    return this.errCode;
  }

  getExceptionParam(): Record<string, any>|undefined {
    return this.param;
  }
}